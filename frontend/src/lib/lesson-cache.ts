// Simple in-memory cache for lesson data
import { Lesson, AICard } from './api';

interface CachedLesson {
  lesson: Lesson;
  aiCards: AICard[];
  timestamp: number;
}

class LessonCache {
  private cache: Map<number, CachedLesson> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  set(lessonId: number, lesson: Lesson, aiCards: AICard[]) {
    this.cache.set(lessonId, {
      lesson,
      aiCards,
      timestamp: Date.now(),
    });
  }

  get(lessonId: number): { lesson: Lesson; aiCards: AICard[] } | null {
    const cached = this.cache.get(lessonId);
    
    if (!cached) return null;
    
    // Check if cache is still valid
    const isValid = Date.now() - cached.timestamp < this.CACHE_DURATION;
    
    if (!isValid) {
      this.cache.delete(lessonId);
      return null;
    }
    
    return {
      lesson: cached.lesson,
      aiCards: cached.aiCards,
    };
  }

  clear(lessonId?: number) {
    if (lessonId) {
      this.cache.delete(lessonId);
    } else {
      this.cache.clear();
    }
  }

  invalidate(lessonId: number) {
    this.cache.delete(lessonId);
  }
}

export const lessonCache = new LessonCache();
