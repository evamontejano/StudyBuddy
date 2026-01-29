// Global cache for lessons list to avoid redundant API calls
interface CachedLessons {
  data: APILesson[];
  timestamp: number;
}

export interface APILesson {
  id: number;
  userId: number;
  title: string;
  filePath?: string;
  extractedContent: string | null;
  uploadedAt: string;
  progress?: number;
  lastReviewed?: string | null;
}

class LessonsListCache {
  private cache: CachedLessons | null = null;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(): APILesson[] | null {
    if (!this.cache) return null;
    
    const now = Date.now();
    if (now - this.cache.timestamp > this.TTL) {
      this.cache = null;
      return null;
    }
    
    return this.cache.data;
  }

  set(data: APILesson[]): void {
    this.cache = {
      data,
      timestamp: Date.now()
    };
  }

  clear(): void {
    this.cache = null;
  }

  invalidate(): void {
    this.clear();
  }
}

export const lessonsListCache = new LessonsListCache();
