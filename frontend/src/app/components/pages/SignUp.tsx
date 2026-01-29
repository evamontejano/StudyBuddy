import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff, Check, X, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';

export function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'Contains number', met: /\d/.test(formData.password) }
  ];

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const passwordStrength = passwordRequirements.filter(r => r.met).length;
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;
  const emailValid = isValidEmail(formData.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordStrength !== 4 || !passwordsMatch || !formData.agreeToTerms) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Registration failed. Please try again.';
        
        // Show error toast
        toast.error(errorMessage, {
          duration: 2000,
        });
        
        // If email already registered, redirect to sign in after toast dismisses
        if (response.status === 400) {
          setTimeout(() => {
            navigate('/signin');
          }, 2100);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Store authentication data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId.toString());
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userEmail', data.email);

      // Show success toast
      toast.success('The account has been successfully registered.', {
        duration: 2000,
      });

      // Navigate to dashboard after toast dismisses
      setTimeout(() => {
        navigate('/dashboard');
      }, 2100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4 relative">
      <Link to="/" className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" className="h-12 w-12 p-2">
          <ArrowLeft className="h-full w-full" />
        </Button>
      </Link>
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <span className="font-semibold text-2xl">Study Buddy</span>
          </Link>
          <h1 className="text-2xl mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">Start your learning journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {formData.email && (
              <div className="flex items-center gap-2 text-xs">
                {emailValid ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={emailValid ? 'text-green-600' : 'text-muted-foreground'}>
                  {emailValid ? 'Valid email format' : 'Invalid email format'}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`absolute right-0 top-0 h-full hover:bg-accent hover:text-accent-foreground ${!formData.password ? 'invisible' : ''}`}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {formData.password && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <Progress value={(passwordStrength / 4) * 100} className="h-1.5" />
                  <span className="text-xs text-muted-foreground">{passwordStrength}/4</span>
                </div>
                <div className="space-y-1">
                  {passwordRequirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-2 text-xs">
                      {req.met ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`absolute right-0 top-0 h-full hover:bg-accent hover:text-accent-foreground ${!formData.confirmPassword ? 'invisible' : ''}`}
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {formData.confirmPassword && (
              <p className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-destructive'}`}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
            />
            <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
              I agree to the{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!emailValid || passwordStrength < 4 || !passwordsMatch || !formData.agreeToTerms || !formData.name || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
