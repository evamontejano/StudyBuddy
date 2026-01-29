import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCw, Check, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { lessonApi } from '../../../lib/api';
import { lessonCache } from '../../../lib/lesson-cache';

interface Flashcard {
  question: string;
  answer: string;
}

export function StudyMode() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<number>>(new Set());
  const [startTime] = useState(Date.now());
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch flashcards on mount
  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!lessonId) return;

      try {
        setIsLoading(true);
        const lessonIdNum = parseInt(lessonId);

        // Check cache first
        const cached = lessonCache.get(lessonIdNum);
        if (cached) {
          const flashcardsCard = cached.aiCards.find(c => c.type === 'QA_FLASHCARDS');
          if (flashcardsCard) {
            const parsed = typeof flashcardsCard.content === 'string' 
              ? JSON.parse(flashcardsCard.content) 
              : flashcardsCard.content;
            setFlashcards(Array.isArray(parsed) ? parsed : []);
            setIsLoading(false);
            return;
          }
        }

        // Fetch AI cards
        const cardsData = await lessonApi.getAICards(leIndex]));
    reviewCards.delete(currentIndex);
    setReviewCards(new Set(reviewCards));
    toast.success('Card marked as mastered!');
    handleNext();
  };

  const handleReview = () => {
    setReviewCards(new Set([...reviewCards, currentIndex]));
    masteredCards.delete(currentIndexund for this lesson');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching flashcards:', error);
        toast.error('Failed to load flashcards');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashcards();
  }, [lessonId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <Card className="p-12 text-center">
          <h3 className="mb-2">No Flashcards Available</h3>
          <p className="text-muted-foreground mb-4">
            This lesson doesn't have any flashcards yet.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;
  const progressPercent = ((currentIndex + 1) / totalCards) * 100;

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    } else {
      // Session complete
      const duration = Math.round((Date.now() - startTime) / 60000);
      toast.success('Study session complete!', {
        description: `Reviewed ${totalCards} cards in ${duration} minutes. ${masteredCards.size} mastered.`
      });
      navigate('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const handleMastered = () => {
    setMasteredCards(new Set([...masteredCards, currentCard.id]));
    reviewCards.delete(currentCard.id);
    setReviewCards(new Set(reviewCards));
    toast.success('Card marked as mastered!');
    handleNext();
  };

  const handleReview = () => {
    setReviewCards(new Set([...reviewCards, currentCard.id]));
    masteredCards.delete(currentCard.id);
    setMasteredCards(new Set(masteredCards));
    toast('Marked for review');
    handleNext();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl">Study Session</h1>
            <p className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {totalCards}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Mastered</p>
            <p className="text-lg font-semibold">{masteredCards.size}/{totalCards}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="flex items-center justify-center py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <Card
              className="p-8 md:p-12 cursor-pointer hover:shadow-lg transition-shadow min-h-[400px] flex items-center justify-center"
              onClick={() => setFlipped(!flipped)}
            >
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="mb-4">
                  {flipped ? 'Answer' : 'Question'}
                </Badge>
                <AnimatePresence mode="wait">
                  {flipped ? (
                    <motion.div
                      key="answer"
                      initial={{ opacity: 0, rotateY: 90 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: -90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                        {currentCard.answer}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="question"
                      initial={{ opacity: 0, rotateY: 90 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: -90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-2xl md:text-3xl font-semibold leading-relaxed">
                        {currentCard.question}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <p className="text-sm text-muted-foreground pt-8">
                  Click card to flip
                </p>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Previous
        </Button>

        {flipped ? (
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={handleReview}
              className="flex-1"
            >
              <RotateCw className="h-5 w-5 mr-2" />
              Review Again
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleMastered}
              className="flex-1"
            >
              <Check className="h-5 w-5 mr-2" />
              Mastered
            </Button>
          </>
        ) : (
          <Button
            variant="default"
            size="lg"
            onClick={() => setFlipped(true)}
            className="flex-1"
          >
            Reveal Answer
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          onClick={handleNext}
          className="flex-1"
        >
          Next
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-green-600">{masteredCards.size}</p>
          <p className="text-sm text-muted-foreground">Mastered</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-blue-600">{reviewCards.size}</p>
          <p className="text-sm text-muted-foreground">Review</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold">{totalCards - masteredCards.size - reviewCards.size}</p>
          <p className="text-sm text-muted-foreground">Remaining</p>
        </Card>
      </div>
    </div>
  );
}
