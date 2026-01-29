import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, Bot, User as UserIcon, X, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
import { toast } from 'sonner';
import { lessonsListCache, type APILesson } from '../../../lib/lessons-cache';
import { lessonApi, type ChatSession, type ChatMessage, type ChatHistoryResponse } from '../../../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  typing?: boolean;
}

// Function to parse markdown bold (**text**) and convert to HTML
function parseMarkdownBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    // Odd indices are the content between **
    if (index % 2 === 1) {
      return <strong key={index}>{part}</strong>;
    }
    return part;
  });
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [contextMode, setContextMode] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lessons, setLessons] = useState<APILesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clear selected lessons when context mode is turned off
  useEffect(() => {
    if (!contextMode) {
      setSelectedLessons([]);
    }
  }, [contextMode]);

  const suggestions = [
    'Summarize this lesson',
    'Explain like I\'m 12',
    'Create flashcards',
    'What are the key concepts?'
  ];

  // Fetch sessions on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoadingSessions(true);
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast.error('Please sign in to access chat');
          setLoadingSessions(false);
          return;
        }

        const sessionsData = await lessonApi.getChatSessions(parseInt(userId));
        setSessions(sessionsData);
        
        // If there are sessions, select the most recent one
        if (sessionsData.length > 0) {
          await loadSession(sessionsData[0]);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Failed to load chat sessions');
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoadingLessons(true);
        
        // Try to get from cache first
        const cached = lessonsListCache.get();
        if (cached) {
          setLessons(cached);
          setLoadingLessons(false);
          return;
        }
        
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if (!userId || !token) {
          toast.error('Please sign in to access lessons');
          setLoadingLessons(false);
          return;
        }

        const response = await fetch(`http://localhost:8080/api/lessons?userId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch lessons');
        }

        const data = await response.json();
        lessonsListCache.set(data);
        setLessons(data);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        toast.error('Failed to load lessons');
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchLessons();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewSession = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('Please sign in to create a session');
        return;
      }

      const timestamp = new Date().toLocaleString();
      const newSession = await lessonApi.createChatSession(parseInt(userId), `Chat Session - ${timestamp}`);
      setSessions([newSession, ...sessions]);
      await loadSession(newSession);
      toast.success('New chat session created');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create new session');
    }
  };

  const loadSession = async (session: ChatSession) => {
    try {
      setCurrentSession(session);
      const history = await lessonApi.getChatHistory(session.id);
      
      // Validate that history has messages array
      if (!history || !Array.isArray(history.messages)) {
        console.warn('History does not contain messages array:', history);
        setMessages([]);
        return;
      }
      
      // Convert ChatMessage[] to Message[]
      const convertedMessages: Message[] = history.messages.map((msg) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
      
      setMessages(convertedMessages);
    } catch (error) {
      console.error('Error loading session history:', error);
      toast.error('Failed to load session history');
      setMessages([]);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      setIsDeleting(true);
      await lessonApi.deleteChatSession(sessionToDelete);
      
      // Remove from list
      const updatedSessions = sessions.filter(s => s.id !== sessionToDelete);
      setSessions(updatedSessions);
      
      // If we deleted the current session, clear or load another
      if (currentSession?.id === sessionToDelete) {
        if (updatedSessions.length > 0) {
          await loadSession(updatedSessions[0]);
        } else {
          setCurrentSession(null);
          setMessages([]);
        }
      }
      
      toast.success('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('Please sign in to chat');
        setIsTyping(false);
        return;
      }

      // Determine if we should include lessonId
      let lessonId: number | undefined;
      if (contextMode && selectedLessons.length > 0) {
        lessonId = parseInt(selectedLessons[0]);
      }

      // Call the chat API with optional sessionId (backend will create if not provided)
      const { response, sessionId: newSessionId } = await lessonApi.sendChatMessage(
        parseInt(userId),
        currentInput,
        currentSession?.id,
        lessonId
      );

      // Parse the JSON response and extract the reply field
      let messageContent = response;
      try {
        const parsedResponse = JSON.parse(response);
        if (parsedResponse.reply) {
          messageContent = parsedResponse.reply;
        }
      } catch (e) {
        // If it's not JSON, use the response as-is
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: messageContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // If a new sessionId was returned, refresh the sessions list
      if (newSessionId && !currentSession) {
        try {
          const sessionsData = await lessonApi.getChatSessions(parseInt(userId));
          setSessions(sessionsData);
          
          // Set the new session as current
          const newSession = sessionsData.find(s => s.id === newSessionId);
          if (newSession) {
            setCurrentSession(newSession);
          }
        } catch (error) {
          console.error('Error refreshing sessions:', error);
        }
      }
      
      // Optional: Expose AI model in UI if needed in the future
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Remove the user message if the API call failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <Card className="lg:w-80 p-4 space-y-4 overflow-auto flex-shrink-0">
        {/* Sessions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Chat Sessions</h3>
            <Button size="sm" onClick={createNewSession} disabled={loadingSessions}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {loadingSessions ? (
              <p className="text-sm text-muted-foreground">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions yet. Create one to start chatting!</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-muted border border-transparent'
                  }`}
                  onClick={() => loadSession(session)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{session.title}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-4">Context Mode</h3>
          <div className="flex items-center space-x-2">
            <Switch
              id="context-mode"
              checked={contextMode}
              onCheckedChange={setContextMode}
            />
            <Label htmlFor="context-mode">
              Use lesson context
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            When enabled, AI will reference selected lessons
          </p>
        </div>

        {contextMode && (
          <div>
            <Label className="mb-2 block">Select Lessons</Label>
            <div className="flex gap-2">
              <Select value={selectedLessons[0] || ""} onValueChange={(value) => setSelectedLessons([value])} disabled={loadingLessons}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={loadingLessons ? "Loading lessons..." : "Choose a lesson"} />
                </SelectTrigger>
                <SelectContent>
                  {lessons.map(lesson => (
                    <SelectItem key={lesson.id} value={String(lesson.id)}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLessons.length > 0 && selectedLessons[0] && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedLessons([])}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        <div>
          <Label className="mb-2 block">Quick Prompts</Label>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left"
                onClick={() => setInput(suggestion)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {selectedLessons.length > 0 && (
          <div>
            <Label className="mb-2 block">Active Context</Label>
            <div className="space-y-2">
              {selectedLessons.map(lessonId => {
                const lesson = lessons.find(l => String(l.id) === lessonId);
                return lesson ? (
                  <div key={lesson.id} className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="truncate">{lesson.title}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                    {message.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                  <div
                    className={`inline-block rounded-lg px-4 py-2 max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {parseMarkdownBold(message.content)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="min-h-[60px] max-h-[200px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat session? This will permanently delete all messages in this session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-primary-foreground"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
