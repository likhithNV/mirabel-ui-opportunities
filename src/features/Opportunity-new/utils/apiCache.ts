// Global API cache to prevent duplicate calls across hooks
interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);

    // Return cached data if still valid
    if (entry && (now - entry.timestamp) < this.CACHE_DURATION) {
      return entry.data;
    }

    // Return existing promise if already fetching
    if (entry?.promise) {
      return entry.promise;
    }

    // Create new fetch promise
    const promise = fetcher().then(data => {
      // Store the result in cache
      this.cache.set(key, {
        data,
        timestamp: now,
        promise: undefined
      });
      return data;
    }).catch(error => {
      // Remove failed promise from cache
      this.cache.delete(key);
      throw error;
    });

    // Store the promise to prevent duplicate calls
    this.cache.set(key, {
      data: null,
      timestamp: now,
      promise
    });

    return promise;
  }

  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    return (now - entry.timestamp) < this.CACHE_DURATION;
  }
}

export const apiCache = new ApiCache();