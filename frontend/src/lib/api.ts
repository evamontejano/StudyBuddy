// API Base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Types
export interface AICard {
  id: number;
  lessonId: number;
  type: 'SUMMARY' | 'KEY_NOTES' | 'QA_FLASHCARDS';
  content: string;
  createdAt: string;
}

export interface Lesson {
  id: number;
  userId: number;
  title: string;
  filePath?: string;
  extractedContent: string | null;
  uploadedAt: string;
  status?: string;
  progress?: number;
  lastReviewed?: string | null;
}

export interface FlashcardQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  questionIndex: number;
}

export interface GenerateResponse {
  message: string;
  aiCards?: AICard[];
}

export interface ChatSession {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  userId: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  sessionId: number;
  messages: ChatMessage[];
}

export interface ProgressSummary {
  userId: number;
  totalLessons: number;
  masteredLessons: number;
  averageMastery: number;
  streakDays: number;
}

export interface LessonProgress {
  id: number;
  userId: number;
  lessonId: number;
  progress: number;
  lastReviewed: string;
}

// API Functions
export const lessonApi = {
  // Generate AI cards for a lesson
  async generateAICards(lessonId: number): Promise<GenerateResponse> {
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/generate`, {
      method: 'POST',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Lesson not found');
      } else if (response.status === 503) {
        throw new Error('AI service unavailable');
      }
      throw new Error('Failed to generate AI content');
    }

    return response.json();
  },

  // Get lesson details
  async getLesson(lessonId: number): Promise<Lesson> {
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Lesson not found');
      }
      throw new Error('Failed to fetch lesson');
    }

    return response.json();
  },

  // Get AI cards for a lesson
  async getAICards(lessonId: number): Promise<AICard[]> {
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/cards`);

    if (!response.ok) {
      throw new Error('Failed to fetch AI cards');
    }

    return response.json();
  },

  // Get lessons for a user
  async getLessons(userId: number): Promise<Lesson[]> {
    const response = await fetch(`${API_BASE_URL}/lessons?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch lessons');
    }

    return response.json();
  },

  // Delete a lesson
  async deleteLesson(lessonId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete lesson');
    }
  },

  // Chat with AI
  async sendChatMessage(userId: number, message: string, sessionId?: number, lessonId?: number): Promise<{ response: string; aiModel?: string; sessionId?: number }> {
    const body: any = { userId, message };
    if (sessionId) body.sessionId = sessionId;
    if (lessonId) body.lessonId = lessonId;

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to send chat message');
    }

    const aiModel = response.headers.get('X-AI-Model');
    const responseText = await response.text();
    
    // Parse response to extract sessionId if present
    let parsedResponse: any;
    let sessionIdFromResponse: number | undefined;
    try {
      parsedResponse = JSON.parse(responseText);
      if (parsedResponse.sessionId) {
        sessionIdFromResponse = parsedResponse.sessionId;
      }
    } catch (e) {
      // If not JSON, use as-is
    }
    
    return {
      response: responseText,
      aiModel: aiModel || undefined,
      sessionId: sessionIdFromResponse
    };
  },

  // Create a new chat session
  async createChatSession(userId: number, title: string): Promise<ChatSession> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, title }),
    });

    if (!response.ok) {
      throw new Error('Failed to create chat session');
    }

    return response.json();
  },

  // Get all chat sessions for a user
  async getChatSessions(userId: number): Promise<ChatSession[]> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch chat sessions');
    }

    return response.json();
  },

  // Get chat message history for a session
  async getChatHistory(sessionId: number): Promise<ChatHistoryResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/history`);

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    return response.json();
  },

  // Delete a chat session
  async deleteChatSession(sessionId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete chat session');
    }
  },

  // Update study progress for a lesson
  async updateStudyProgress(lessonId: number, userId: number, progress: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/study/${lessonId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, progress }),
    });

    if (!response.ok) {
      throw new Error('Failed to update study progress');
    }
  },

  // Get user progress summary
  async getProgressSummary(userId: number): Promise<ProgressSummary> {
    const response = await fetch(`${API_BASE_URL}/study/progress?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch progress summary');
    }

    return response.json();
  },
};

// Helper to parse flashcard content
export function parseFlashcards(content: string): FlashcardQuestion[] {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse flashcards:', error);
    return [];
  }
}
