import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Play, Download, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { lessonApi, type AICard, type Lesson } from '../../../lib/api';
import { Skeleton } from '../ui/skeleton';
import { lessonCache } from '../../../lib/lesson-cache';

export function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [aiCards, setAICards] = useState<AICard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Fetch lesson and AI cards on mount
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        const lessonId = parseInt(id);

        // Check cache first
        const cached = lessonCache.get(lessonId);
        if (cached) {
          setLesson(cached.lesson);
          setAICards(cached.aiCards);
          setIsLoading(false);
          return;
        }

        // Fetch lesson details
        const lessonData = await lessonApi.getLesson(lessonId);
        setLesson(lessonData);

        // Fetch AI cards
        const cardsData = await lessonApi.getAICards(lessonId);
        setAICards(cardsData);

        // Cache the data
        lessonCache.set(lessonId, lessonData, cardsData);
      } catch (err) {
        console.error('Error fetching lesson data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
        toast.error('Failed to load lesson', {
          description: 'Please try again',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonData();
  }, [id]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !lesson) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <Card className="p-12 text-center border-destructive/50">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="mb-2 text-destructive">Error Loading Lesson</h3>
          <p className="text-muted-foreground mb-4">{error || 'Lesson not found'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const summary = aiCards.find(c => c.type === 'SUMMARY');
  const keyNotes = aiCards.find(c => c.type === 'KEY_NOTES');
  const flashcardsCard = aiCards.find(c => c.type === 'QA_FLASHCARDS');
  
  // Parse flashcards - handle both old format (question/answer) and new format (MCQ)
  let flashcards: any[] = [];
  if (flashcardsCard) {
    try {
      const parsed = typeof flashcardsCard.content === 'string' 
        ? JSON.parse(flashcardsCard.content) 
        : flashcardsCard.content;
      flashcards = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse flashcards:', e);
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatKeyNotes = (text: string) => {
    // Split by lines
    const lines = text.split('\n');
    const formatted: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      
      // Replace **text** with bold
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      const formattedLine = parts.map((part, i) => 
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      );
      
      // Check if line starts with bullet indicators
      const bulletMatch = line.match(/^[•\+\-]\s*/);
      
      if (bulletMatch) {
        // It's a bullet point
        const content = line.substring(bulletMatch[0].length);
        const contentParts = content.split(/\*\*([^*]+)\*\*/g);
        const formattedContent = contentParts.map((part, i) => 
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        );
        
        formatted.push(
          <li key={index} className="ml-4">
            {formattedContent}
          </li>
        );
      } else {
        // Regular line
        formatted.push(
          <p key={index}>
            {formattedLine}
          </p>
        );
      }
    });
    
    return <div className="space-y-1">{formatted}</div>;
  };

  const handleGenerateCards = async () => {
    if (!id) return;

    setIsRegenerating(true);
    try {
      const lessonId = parseInt(id);
      
      await lessonApi.generateAICards(lessonId);
      
      // Refetch AI cards after regeneration
      const cardsData = await lessonApi.getAICards(lessonId);
      setAICards(cardsData);
      
      // Update cache
      if (lesson) {
        lessonCache.set(lessonId, lesson, cardsData);
      }
      
      toast.success('AI cards regenerated successfully');
    } catch (error) {
      console.error('Failed to regenerate AI cards:', error);
      toast.error('Failed to regenerate AI cards', {
        description: 'Please try again',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl mb-1">{lesson.title}</h1>
          <p className="text-muted-foreground">
            Uploaded {new Date(lesson.uploadedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleGenerateCards}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Re-generate AI Cards
              </>
            )}
          </Button>
          <Button onClick={() => navigate(`/quiz/${lesson.id}`)}>
            <Play className="h-4 w-4 mr-2" />
            Start Study Session
          </Button>
        </div>
      </div>

      {/* AI Cards */}
      <Card className="p-6">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="notes">Key Notes</TabsTrigger>
            <TabsTrigger value="flashcards">
              Q&A Flashcards
              {flashcards.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {flashcards.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {summary ? (
              <>
                <div className="flex items-center justify-between">
                  <h3>AI-Generated Summary</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(summary.content)}
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {summary.content}
                </p>
              </>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="mb-2">No Summary Generated</h3>
                <p className="text-muted-foreground mb-4">
                  Click the button above to generate AI cards
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            {keyNotes ? (
              <>
                <div className="flex items-center justify-between">
                  <h3>Key Points to Remember</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(typeof keyNotes.content === 'string' ? keyNotes.content : (keyNotes.content as string[]).join('\n'))}
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copied' : 'Copy All'}
                  </Button>
                </div>
                {typeof keyNotes.content === 'string' ? (
                  <div className="text-muted-foreground leading-relaxed">
                    {formatKeyNotes(keyNotes.content)}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {(keyNotes.content as string[]).map((note, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <span className="flex-1 leading-relaxed">{note}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="mb-2">No Key Notes Generated</h3>
                <p className="text-muted-foreground mb-4">
                  Click the button above to generate AI cards
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="flashcards" className="space-y-4">
            {flashcards.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3>Questions</h3>
                </div>
                <div className="grid gap-4">
                  {flashcards.map((card: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Question</p>
                            <p className="font-medium">{card.question}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="mb-2">No Flashcards Generated</h3>
                <p className="text-muted-foreground mb-4">
                  Click the button above to generate AI cards
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Extracted Content */}
      <Card className="p-6">
        <h3 className="mb-4">Extracted Content</h3>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {lesson.extractedContent || 'No content extracted'}
          </p>
        </div>
      </Card>
    </div>
  );
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    </div>
  );
}
