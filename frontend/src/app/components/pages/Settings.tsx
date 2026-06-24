import { useState, useEffect } from 'react';
import { User, Lock, Palette, Bell, Download, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { toast } from 'sonner';
import { useTheme } from '../../../lib/theme-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL, lessonApi, type ProgressSummary } from '../../../lib/api';
import { type APILesson } from '../../../lib/lessons-cache';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [userInitials, setUserInitials] = useState('U');
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    // Get user data from localStorage
    const name = localStorage.getItem('userName') || '';
    const email = localStorage.getItem('userEmail') || '';
    
    setProfile({ name, email });

    // Generate initials from name
    if (name) {
      const words = name.trim().split(/\s+/);
      if (words.length === 1) {
        setUserInitials(words[0].charAt(0).toUpperCase());
      } else {
        setUserInitials(
          words.map(word => word.charAt(0).toUpperCase()).join('')
        );
      }
    }
  }, []);

  const [preferences, setPreferences] = useState({
    textSize: 'medium',
    reducedMotion: false,
    sessionLength: '15',
    notifications: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: passwordData.newPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(passwordData.newPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(passwordData.newPassword) },
    { label: 'Contains number', met: /\d/.test(passwordData.newPassword) }
  ];

  const passwordStrength = passwordRequirements.filter(r => r.met).length;
  const passwordsMatch = passwordData.newPassword && passwordData.newPassword === passwordData.confirmNewPassword;
  const isPasswordFormValid = 
    passwordData.currentPassword.length > 0 &&
    passwordStrength === 4 &&
    passwordsMatch;

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  const handleChangePassword = async () => {
    if (!isPasswordFormValid) return;

    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('User not logged in');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmNewPassword: passwordData.confirmNewPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      toast.success('Password changed successfully!', {
        description: 'Your password has been updated',
        duration: 2000
      });

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (error) {
      toast.error('Failed to change password', {
        description: error instanceof Error ? error.message : 'Please try again',
        duration: 3000
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User not logged in');
        return;
      }

      toast.loading('Generating PDF export...');

      // Fetch all data
      const [lessonsResponse, progressSummary] = await Promise.all([
        fetch(`${API_BASE_URL}/lessons?userId=${userId}`),
        lessonApi.getProgressSummary(parseInt(userId))
      ]);

      if (!lessonsResponse.ok) {
        throw new Error('Failed to fetch lessons');
      }

      const lessons: APILesson[] = await lessonsResponse.json();

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('StudyBuddy - Data Export', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
      doc.text(`User: ${profile.name} (${profile.email})`, pageWidth / 2, 34, { align: 'center' });

      // Progress Summary Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Progress Summary', 14, 45);
      
      const summaryData = [
        ['Total Lessons', progressSummary.totalLessons.toString()],
        ['Mastered Lessons', progressSummary.masteredLessons.toString()],
        ['Average Mastery', `${progressSummary.averageMastery}%`],
        ['Study Streak', `${progressSummary.streakDays || 0} days`]
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 }
      });

      // Lessons Section
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      
      if (finalY > pageHeight - 40) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Lessons Overview', 14, finalY);
      
      const lessonsData = lessons.map(lesson => {
        let status = 'Not Started';
        const progress = lesson.progress || 0;
        
        if (progress === 100) {
          status = 'Mastered';
        } else if (progress > 0 && progress < 100) {
          status = 'In Progress';
        }
        
        return [
          lesson.title,
          lesson.progress ? `${lesson.progress}%` : '0%',
          lesson.lastReviewed ? new Date(lesson.lastReviewed).toLocaleDateString() : 'Never',
          status
        ];
      });

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Title', 'Progress', 'Last Reviewed', 'Status']],
        body: lessonsData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 }
      });

      // Save PDF
      doc.save(`StudyBuddy-Export-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.dismiss();
      toast.success('Data exported successfully!', {
        description: 'Your PDF has been downloaded'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.dismiss();
      toast.error('Failed to export data', {
        description: 'Please try again'
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Password is required');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('User not logged in');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          password: deletePassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      // Clear all local storage
      localStorage.clear();

      toast.success('Account deleted successfully', {
        description: 'Your account and all data have been permanently deleted',
        duration: 2000
      });

      // Redirect to home page after toast
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 2100);
    } catch (error) {
      toast.error('Failed to delete account', {
        description: error instanceof Error ? error.message : 'Please check your password and try again',
        duration: 3000
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="account">
            <Lock className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-6">Profile Information</h3>

            {/* <div className="flex items-center gap-6 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">Change Avatar</Button>
                <p className="text-sm text-muted-foreground mt-2">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div> */}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>

              {/* <Button onClick={handleSaveProfile}>Save Changes</Button> */}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">Change Password</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <div className="relative">
                  <Input 
                    id="current" 
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`absolute right-0 top-0 h-full hover:bg-accent hover:text-accent-foreground ${!passwordData.currentPassword ? 'invisible' : ''}`}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <div className="relative">
                  <Input 
                    id="new" 
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`absolute right-0 top-0 h-full hover:bg-accent hover:text-accent-foreground ${!passwordData.newPassword ? 'invisible' : ''}`}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordData.newPassword && (
                  <div className="space-y-2 mt-3">
                    <p className="text-sm text-muted-foreground">Password must contain:</p>
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {req.met ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-sm ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <div className="relative">
                  <Input 
                    id="confirm" 
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmNewPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`absolute right-0 top-0 h-full hover:bg-accent hover:text-accent-foreground ${!passwordData.confirmNewPassword ? 'invisible' : ''}`}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordData.confirmNewPassword && (
                  <div className="flex items-center gap-2 mt-2">
                    {passwordsMatch ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleChangePassword}
                disabled={!isPasswordFormValid || isChangingPassword}
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-6">Appearance</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme === 'system' ? 'light' : theme} onValueChange={(value: any) => setTheme(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" disabled={theme === 'light'}>Light</SelectItem>
                    <SelectItem value="dark" disabled={theme === 'dark'}>Dark</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>

              <Separator />

 <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive study reminders and updates
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notifications: checked })
                  }
                />
              </div>
              {/* <div className="space-y-2">
                <Label>Text Size</Label>
                <Select
                  value={preferences.textSize}
                  onValueChange={(value) => setPreferences({ ...preferences, textSize: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              <Separator />

              {/* <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  checked={preferences.reducedMotion}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, reducedMotion: checked })
                  }
                />
              </div> */}
            </div>
          </Card>

          {/* <Card className="p-6">
            <h3 className="mb-6">Study Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default Session Length</Label>
                <Select
                  value={preferences.sessionLength}
                  onValueChange={(value) => setPreferences({ ...preferences, sessionLength: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive study reminders and updates
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notifications: checked })
                  }
                />
              </div>
            </div>
          </Card> */}
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">Data & Privacy</h3>
            <div className="space-y-4">
              <div>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Download a copy of your lessons, flashcards, and progress data
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-rose-200 dark:border-destructive">
            <h3 className="mb-4 dark:text-destructive">Danger Zone</h3>
            <div className="space-y-4">
              <div>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="bg-rose-600 hover:bg-rose-700 dark:bg-destructive dark:hover:bg-destructive/90"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Account Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data including lessons, flashcards, and progress from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-4">
                      <Label htmlFor="delete-password">Enter your password to confirm</Label>
                      <Input
                        id="delete-password"
                        type="password"
                        placeholder="Enter your password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        disabled={isDeleting}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel 
                        disabled={isDeleting}
                        onClick={() => {
                          setDeletePassword('');
                        }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount} 
                        disabled={!deletePassword || isDeleting}
                        className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-sm text-muted-foreground mt-2">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
