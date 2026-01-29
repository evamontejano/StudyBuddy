import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, MessageSquare, Search, Filter, BookOpen, Clock, CheckCircle2, AlertCircle, Play, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { mockLessons, type Lesson } from '../../../lib/mock-data';
import { UploadLesson } from '../upload/UploadLesson';
import { toast } from 'sonner';
import { lessonApi, type ProgressSummary } from '../../../lib/api';
import { lessonsListCache, type APILesson } from '../../../lib/lessons-cache';

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'processing'>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [lessons, setLessons] = useState<APILesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [userName, setUserName] = useState<string>('');

  // Fetch lessons from API
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        // Always fetch fresh data (don't use cache) to ensure progress is up to date
        const userId = localStorage.getItem('userId');
        const storedName = localStorage.getItem('userName') || 'User';
        setUserName(storedName);
        
        if (!userId) {
          setError('User not logged in');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8080/api/lessons?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch lessons');
        }

        const data = await response.json();
        lessonsListCache.set(data);
        setLessons(data);
        setError(null);

        // Fetch progress summary
        try {
          const summary = await lessonApi.getProgressSummary(parseInt(userId));
          setProgressSummary(summary);
        } catch (summaryError) {
          console.error('Error fetching progress summary:', summaryError);
        }
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lessons');
        toast.error('Failed to load lessons', {
          description: 'Please try refreshing the page'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const handleDeleteClick = (lessonId: number) => {
    setLessonToDelete(lessonId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!lessonToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:8080/api/lessons/${lessonToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Success - remove lesson from state and invalidate cache
        setLessons(prevLessons => prevLessons.filter(l => l.id !== lessonToDelete));
        lessonsListCache.invalidate();
        
        toast.success('Lesson deleted successfully', {
          description: 'The lesson has been removed from your library',
          duration: 2000,
        });
        
        setDeleteDialogOpen(false);
        setLessonToDelete(null);
      } else {
        throw new Error('Failed to delete lesson');
      }
    } catch (err) {
      console.error('Error deleting lesson:', err);
      toast.error('Failed to delete this lesson', {
        description: 'Please try again',
        duration: 2000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
    // Determine lesson status: if extractedContent exists, it's ready, otherwise processing
    const lessonStatus = lesson.extractedContent ? 'ready' : 'processing';
    const matchesFilter = filter === 'all' || lessonStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: lessons.length,
    ready: lessons.filter(l => l.extractedContent).length,
    processing: lessons.filter(l => !l.extractedContent).length,
    avgProgress: progressSummary?.averageMastery || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Hello, {userName}!</h1>
        <p className="text-muted-foreground">Continue your learning journey</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-br from-primary to-primary-dark bg-clip-text text-transparent">{stats.total}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Lessons</p>
        </Card>

        <Card className="p-6 border-success/20 hover:border-success/40 transition-all hover:shadow-lg hover:shadow-success/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-success/10 to-success/5">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-br from-success to-success-dark bg-clip-text text-transparent">{stats.ready}</span>
          </div>
          <p className="text-sm text-muted-foreground">Ready to Study</p>
        </Card>

        <Card className="p-6 border-info/20 hover:border-info/40 transition-all hover:shadow-lg hover:shadow-info/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-info/10 to-info/5">
              <Clock className="h-6 w-6 text-info" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-br from-info to-info-dark bg-clip-text text-transparent">{stats.processing}</span>
          </div>
          <p className="text-sm text-muted-foreground">Processing</p>
        </Card>

        <Card className="p-6 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg hover:shadow-accent/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
              <Play className="h-6 w-6 text-accent" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-br from-accent to-accent-dark bg-clip-text text-transparent">{stats.avgProgress}%</span>
          </div>
          <p className="text-sm text-muted-foreground">Avg. Progress</p>
        </Card>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" className="gap-2" onClick={() => setUploadOpen(true)}>
          <Upload className="h-5 w-5" />
          Upload Lesson
        </Button>
        <Link to="/chat">
          <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
            <MessageSquare className="h-5 w-5" />
            Chat with AI Tutor
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'ready' ? 'default' : 'outline'}
            onClick={() => setFilter('ready')}
          >
            Ready
          </Button>
          <Button
            variant={filter === 'processing' ? 'default' : 'outline'}
            onClick={() => setFilter('processing')}
          >
            Processing
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-12 text-center border-destructive/50">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="mb-2 text-destructive">Error Loading Lessons</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      ) : filteredLessons.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {filter === 'processing' ? (
            <h3 className="mb-2">No lessons are in process right now.</h3>
          ) : (
            <>
              <h3 className="mb-2">No lessons found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Upload your first lesson to get started'}
              </p>
              <Button onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Lesson
              </Button>
            </>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <LessonCard 
              key={lesson.id} 
              lesson={lesson} 
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}
      {/* Upload Modal */}
      <UploadLesson 
        open={uploadOpen} 
        onOpenChange={setUploadOpen}
        onSuccess={async () => {
          // Refresh lessons after successful upload
          const userId = localStorage.getItem('userId');
          if (userId) {
            try {
              const response = await fetch(`http://localhost:8080/api/lessons?userId=${userId}`);
              if (response.ok) {
                const data = await response.json();
                setLessons(data);
              }
            } catch (err) {
              console.error('Error refreshing lessons:', err);
            }
          }
        }}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-primary-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LessonCard({ lesson, onDelete }: { lesson: APILesson; onDelete: (id: number) => void }) {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const statusConfig = {
    ready: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Ready' },
    mastered: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Mastered' },
    processing: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: 'Processing' },
    error: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Error' }
  };

  // Determine status based on extractedContent and progress
  let lessonStatus: 'ready' | 'mastered' | 'processing' = lesson.extractedContent ? 'ready' : 'processing';
  if (lesson.extractedContent && lesson.progress === 100) {
    lessonStatus = 'mastered';
  }
  const config = statusConfig[lessonStatus];
  const StatusIcon = config.icon;
  const date = new Date(lesson.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const handleOpenLesson = async () => {
    setIsGenerating(true);
    try {
      // First, check if AI cards already exist
      const existingCards = await lessonApi.getAICards(lesson.id);
      
      if (existingCards && existingCards.length > 0) {
        // Cards already exist, navigate directly
        navigate(`/lesson/${lesson.id}`);
      } else {
        // No cards exist, generate them first
        await lessonApi.generateAICards(lesson.id);
        
        // On success, show toast and navigate
        toast.success('✅ AI content generated for this lesson.');
        navigate(`/lesson/${lesson.id}`);
      }
    } catch (error) {
      // On error, show error toast and don't navigate
      console.error('Failed to load or generate AI content:', error);
      toast.error('❌ Failed to generate AI content. Please try again later.', {
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow relative">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <BookOpen className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={lessonStatus === 'ready' ? 'default' : lessonStatus === 'processing' ? 'secondary' : 'destructive'}
            className={lessonStatus === 'mastered' ? 'bg-green-600 text-white dark:text-green-950 hover:bg-green-700 border-transparent' : ''}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:shadow-md transition-all"
            onClick={() => onDelete(lesson.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h3 className="mb-2 line-clamp-2 font-semibold">{lesson.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {lesson.extractedContent 
          ? (lesson.extractedContent.length > 150 
              ? lesson.extractedContent.substring(0, 150) + '...' 
              : lesson.extractedContent)
          : 'Content is being processed...'}
      </p>

      <div className="space-y-3">

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Uploaded {date}</span>
        </div>

        <div className="flex gap-2 pt-2">
          {lessonStatus === 'ready' || lessonStatus === 'mastered' ? (
            <>
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={handleOpenLesson}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Open'
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/quiz/${lesson.id}`)}
              >
                <Play className="h-4 w-4" />
              </Button>
            </>
          ) : lessonStatus === 'processing' ? (
            <Button variant="outline" size="sm" className="w-full" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full">
              Retry
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}