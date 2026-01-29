import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Award, RotateCw, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { lessonApi } from '../../../lib/api';
import { lessonCache } from '../../../lib/lesson-cache';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  questionIndex: number;
}

export function QuizMode() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [correctAnswers, setCorrectAnswers] = useState<Set<number>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]); // Store all original questions
  const [incorrectIndices, setIncorrectIndices] = useState<number[]>([]); // Track incorrect question indices
  const [isLoading, setIsLoading] = useState(true);

  // Fetch quiz questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
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
            const questionsData = Array.isArray(parsed) ? parsed : [];
            setQuestions(questionsData);
            setAllQuestions(questionsData);
            setIsLoading(false);
            return;
          }
        }

        // Fetch AI cards
        const cardsData = await lessonApi.getAICards(lessonIdNum);
        const flashcardsCard = cardsData.find(c => c.type === 'QA_FLASHCARDS');
        
        if (flashcardsCard) {
          const parsed = typeof flashcardsCard.content === 'string' 
            ? JSON.parse(flashcardsCard.content) 
            : flashcardsCard.content;
          const questionsData = Array.isArray(parsed) ? parsed : [];
          setQuestions(questionsData);
          setAllQuestions(questionsData);
        } else {
          toast.error('No quiz questions found for this lesson');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching quiz questions:', error);
        toast.error('Failed to load quiz questions');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [lessonId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
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
          <h3 className="mb-2">No Quiz Questions Available</h3>
          <p className="text-muted-foreground mb-4">
            This lesson doesn't have any quiz questions yet.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const isAnswered = answeredQuestions.has(currentIndex);
  const isCorrect = selectedAnswer === currentQuestion.correctIndex;

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    setAnsweredQuestions(new Set([...answeredQuestions, currentIndex]));
    
    if (index === currentQuestion.correctIndex) {
      setCorrectAnswers(new Set([...correctAnswers, currentIndex]));
    } else {
      // Track incorrect answer - store the original question index
      const originalIndex = allQuestions.findIndex(q => 
        q.question === currentQuestion.question && 
        q.correctIndex === currentQuestion.correctIndex
      );
      if (originalIndex !== -1 && !incorrectIndices.includes(originalIndex)) {
        setIncorrectIndices([...incorrectIndices, originalIndex]);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz is complete, calculate accuracy and send to backend
      const finalAccuracy = totalQuestions > 0 ? Math.round((correctAnswers.size / totalQuestions) * 100) : 0;
      
      // Send progress update to backend
      const userId = localStorage.getItem('userId');
      if (userId && lessonId) {
        lessonApi.updateStudyProgress(parseInt(lessonId), parseInt(userId), finalAccuracy)
          .then(async () => {
            // Refetch progress summary to update dashboard stats
            try {
              await lessonApi.getProgressSummary(parseInt(userId));
            } catch (error) {
              console.error('Failed to refetch progress summary:', error);
            }
          })
          .catch(error => {
            console.error('Failed to update progress:', error);
          });
      }
      
      setQuizComplete(true);
    }
  };

  const handleRetry = () => {
    setQuestions(allQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnsweredQuestions(new Set());
    setCorrectAnswers(new Set());
    setIncorrectIndices([]);
    setQuizComplete(false);
  };

  const handleRetryIncorrect = () => {
    if (incorrectIndices.length > 0) {
      // Filter questions to only show incorrect ones
      const incorrectQuestions = incorrectIndices.map(idx => allQuestions[idx]).filter(Boolean);
      setQuestions(incorrectQuestions);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnsweredQuestions(new Set());
      setCorrectAnswers(new Set());
      setQuizComplete(false);
      toast.info(`Retrying ${incorrectIndices.length} incorrect question${incorrectIndices.length > 1 ? 's' : ''}`);
    }
  };

  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers.size / totalQuestions) * 100) : 0;
  const duration = Math.round((Date.now() - startTime) / 60000);

  if (quizComplete) {
    return (
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Success Animation */}
          <Card className="p-12 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex p-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20"
            >
              <Award className="h-16 w-16 text-primary" />
            </motion.div>
            
            <div>
              <h1 className="text-3xl mb-2">Quiz Complete!</h1>
              <p className="text-lg text-muted-foreground">
                Great job on completing this quiz
              </p>
            </div>

            {/* Results */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-6 rounded-lg bg-muted/50">
                <div className="text-4xl font-bold text-primary mb-1">
                  {correctAnswers.size}/{totalQuestions}
                </div>
                <div className="text-sm text-muted-foreground">Correct Answers</div>
              </div>
              
              <div className="p-6 rounded-lg bg-muted/50">
                <div className="text-4xl font-bold text-accent mb-1">
                  {accuracy}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              
              <div className="p-6 rounded-lg bg-muted/50">
                <div className="text-4xl font-bold text-secondary mb-1">
                  {duration}m
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
            </div>

            {/* Mastery Progress */}
            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mastery Level</span>
                <span className="font-medium">{accuracy}%</span>
              </div>
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${accuracy}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                  className={`h-full ${
                    accuracy >= 80 ? 'bg-success' :
                    accuracy >= 60 ? 'bg-accent' :
                    'bg-warning'
                  }`}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {/* {accuracy < 100 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRetryIncorrect}
                  className="flex-1"
                >
                  <RotateCw className="h-5 w-5 mr-2" />
                  Retry Incorrect
                </Button>
              )} */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleRetry}
                className="flex-1"
              >
                <RotateCw className="h-5 w-5 mr-2" />
                Retake Quiz
              </Button>
              <Button
                size="lg"
                onClick={() => navigate(`/lesson/${lessonId}`)}
                className="flex-1"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Back to Lesson
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/lesson/${lessonId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl">Quiz Mode</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {totalQuestions}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-lg font-semibold text-primary">
            {correctAnswers.size}/{answeredQuestions.size}
          </p>
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

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 space-y-6">
            {/* Question */}
            <div>
              <Badge variant="secondary" className="mb-4">
                Question {currentIndex + 1}
              </Badge>
              <h2 className="text-2xl">{currentQuestion.question}</h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectOption = index === currentQuestion.correctIndex;
                const showCorrect = showResult && isCorrectOption;
                const showIncorrect = showResult && isSelected && !isCorrectOption;

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={isAnswered}
                    whileHover={!isAnswered ? { scale: 1.02 } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      showCorrect
                        ? 'border-success bg-success/10 text-success-dark'
                        : showIncorrect
                        ? 'border-error bg-error/10 text-error-dark'
                        : isSelected && !showResult
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    } ${isAnswered && !showCorrect && !showIncorrect ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          showCorrect
                            ? 'border-success bg-success text-white'
                            : showIncorrect
                            ? 'border-error bg-error text-white'
                            : isSelected && !showResult
                            ? 'border-primary bg-primary text-white'
                            : 'border-current'
                        }`}>
                          {showCorrect || showIncorrect ? (
                            showCorrect ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )
                          ) : (
                            <span className="text-xs font-medium">{String.fromCharCode(65 + index)}</span>
                          )}
                        </div>
                        <span className="font-medium">{option}</span>
                      </div>
                      {showCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      )}
                      {showIncorrect && (
                        <XCircle className="h-5 w-5 text-error" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!isAnswered}
          className="min-w-[140px]"
        >
          {currentIndex < totalQuestions - 1 ? (
            <>
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </>
          ) : (
            <>
              Finish Quiz
              <Award className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
