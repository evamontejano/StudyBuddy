// Mock data for Study Buddy application

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Lesson {
  id: string;
  userId: string;
  title: string;
  filePath?: string;
  extractedContent: string;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'error';
  progress: number; // 0-100, percentage of mastered flashcards
}

export interface AICard {
  id: string;
  lessonId: string;
  type: 'SUMMARY' | 'KEY_NOTES' | 'QA_FLASHCARDS';
  content: any;
  generatedAt: string;
}

export interface Flashcard {
  id: string;
  lessonId: string;
  question: string;
  answer: string;
  mastered: boolean;
}

export interface StudySession {
  id: string;
  userId: string;
  lessonId: string;
  cardsReviewed: number;
  cardsMastered: number;
  duration: number; // in minutes
  completedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  lessonContext?: string[];
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Current user
export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatar: 'AJ'
};

// Mock lessons
export const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    userId: 'user-1',
    title: 'Introduction to React Hooks',
    filePath: 'react-hooks.pdf',
    extractedContent: 'React Hooks are functions that let you use state and other React features without writing a class. The most commonly used hooks are useState and useEffect...',
    uploadedAt: '2026-01-08T10:30:00Z',
    status: 'ready',
    progress: 65
  },
  {
    id: 'lesson-2',
    userId: 'user-1',
    title: 'Data Structures: Binary Trees',
    filePath: 'binary-trees.pdf',
    extractedContent: 'A binary tree is a hierarchical data structure where each node has at most two children, referred to as left child and right child...',
    uploadedAt: '2026-01-07T14:20:00Z',
    status: 'ready',
    progress: 80
  },
  {
    id: 'lesson-3',
    userId: 'user-1',
    title: 'World War II Timeline',
    filePath: 'wwii-timeline.pdf',
    extractedContent: 'World War II (1939-1945) was a global conflict involving most of the world\'s nations. Key events include the invasion of Poland, Battle of Britain, Pearl Harbor...',
    uploadedAt: '2026-01-06T09:15:00Z',
    status: 'ready',
    progress: 40
  },
  {
    id: 'lesson-4',
    userId: 'user-1',
    title: 'Photosynthesis Process',
    filePath: 'photosynthesis.pdf',
    extractedContent: 'Photosynthesis is the process by which green plants and certain other organisms transform light energy into chemical energy...',
    uploadedAt: '2026-01-05T16:45:00Z',
    status: 'processing',
    progress: 0
  },
  {
    id: 'lesson-5',
    userId: 'user-1',
    title: 'Python Basics',
    filePath: 'python-basics.pdf',
    extractedContent: 'Python is a high-level, interpreted programming language known for its simplicity and readability...',
    uploadedAt: '2026-01-04T11:00:00Z',
    status: 'ready',
    progress: 95
  }
];

// Mock AI Cards
export const mockAICards: AICard[] = [
  {
    id: 'card-1',
    lessonId: 'lesson-1',
    type: 'SUMMARY',
    content: 'React Hooks revolutionized how we write React components by allowing functional components to use state and lifecycle features. The two most fundamental hooks are useState for managing component state and useEffect for handling side effects. Hooks follow specific rules: they must be called at the top level and only within React functions.',
    generatedAt: '2026-01-08T10:35:00Z'
  },
  {
    id: 'card-2',
    lessonId: 'lesson-1',
    type: 'KEY_NOTES',
    content: [
      'useState hook allows functional components to maintain state',
      'useEffect replaces componentDidMount, componentDidUpdate, and componentWillUnmount',
      'Custom hooks enable reusable stateful logic',
      'Hooks must be called at the top level of components',
      'useContext provides access to React context without nesting',
      'useReducer is an alternative to useState for complex state logic',
      'useCallback and useMemo optimize performance',
      'useRef creates mutable references that persist across renders'
    ],
    generatedAt: '2026-01-08T10:35:00Z'
  },
  {
    id: 'card-3',
    lessonId: 'lesson-1',
    type: 'QA_FLASHCARDS',
    content: [
      { question: 'What is the purpose of the useState hook?', answer: 'useState allows functional components to maintain and update state without using class components.' },
      { question: 'When does useEffect run by default?', answer: 'useEffect runs after every render by default, but can be controlled with dependency arrays.' },
      { question: 'What are the rules of hooks?', answer: 'Hooks must be called at the top level and only within React function components or custom hooks.' },
      { question: 'How do you create a custom hook?', answer: 'Create a function that starts with "use" and can call other hooks inside it.' },
      { question: 'What does useContext do?', answer: 'useContext provides access to React context values without using Consumer components.' }
    ],
    generatedAt: '2026-01-08T10:35:00Z'
  }
];

// Mock flashcards
export const mockFlashcards: Flashcard[] = [
  { id: 'fc-1', lessonId: 'lesson-1', question: 'What is the purpose of the useState hook?', answer: 'useState allows functional components to maintain and update state without using class components.', mastered: true },
  { id: 'fc-2', lessonId: 'lesson-1', question: 'When does useEffect run by default?', answer: 'useEffect runs after every render by default, but can be controlled with dependency arrays.', mastered: true },
  { id: 'fc-3', lessonId: 'lesson-1', question: 'What are the rules of hooks?', answer: 'Hooks must be called at the top level and only within React function components or custom hooks.', mastered: false },
  { id: 'fc-4', lessonId: 'lesson-1', question: 'How do you create a custom hook?', answer: 'Create a function that starts with "use" and can call other hooks inside it.', mastered: true },
  { id: 'fc-5', lessonId: 'lesson-1', question: 'What does useContext do?', answer: 'useContext provides access to React context values without using Consumer components.', mastered: false }
];

// Mock study sessions
export const mockStudySessions: StudySession[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    cardsReviewed: 10,
    cardsMastered: 8,
    duration: 15,
    completedAt: '2026-01-09T14:30:00Z'
  },
  {
    id: 'session-2',
    userId: 'user-1',
    lessonId: 'lesson-2',
    cardsReviewed: 12,
    cardsMastered: 10,
    duration: 20,
    completedAt: '2026-01-08T16:45:00Z'
  },
  {
    id: 'session-3',
    userId: 'user-1',
    lessonId: 'lesson-1',
    cardsReviewed: 8,
    cardsMastered: 6,
    duration: 12,
    completedAt: '2026-01-07T10:15:00Z'
  }
];

// Mock conversations
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    userId: 'user-1',
    title: 'React Hooks Questions',
    messages: [
      {
        id: 'msg-1',
        userId: 'user-1',
        role: 'user',
        content: 'Can you explain the difference between useState and useReducer?',
        timestamp: '2026-01-09T15:00:00Z'
      },
      {
        id: 'msg-2',
        userId: 'user-1',
        role: 'assistant',
        content: 'Both useState and useReducer are hooks for managing state in React, but they serve different purposes:\n\nuseState is best for simple state values and straightforward updates. It returns a state value and a setter function.\n\nuseReducer is better for complex state logic involving multiple sub-values or when the next state depends on the previous one. It uses a reducer function similar to Redux, making state transitions more predictable and easier to test.\n\nChoose useReducer when you have complex state logic or multiple related state updates.',
        timestamp: '2026-01-09T15:00:15Z',
        lessonContext: ['lesson-1']
      }
    ],
    createdAt: '2026-01-09T15:00:00Z',
    updatedAt: '2026-01-09T15:00:15Z'
  }
];

// Analytics data
export interface ProgressData {
  date: string;
  cardsStudied: number;
  cardsMastered: number;
}

export const mockProgressData: ProgressData[] = [
  { date: '2026-01-04', cardsStudied: 8, cardsMastered: 6 },
  { date: '2026-01-05', cardsStudied: 12, cardsMastered: 9 },
  { date: '2026-01-06', cardsStudied: 15, cardsMastered: 12 },
  { date: '2026-01-07', cardsStudied: 10, cardsMastered: 8 },
  { date: '2026-01-08', cardsStudied: 18, cardsMastered: 15 },
  { date: '2026-01-09', cardsStudied: 14, cardsMastered: 11 },
  { date: '2026-01-10', cardsStudied: 20, cardsMastered: 16 }
];
