// 简单的内存缓存实现
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // 生存时间（毫秒）
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 默认5分钟
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // 清除过期项
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const memoryCache = new MemoryCache()

// 自动清理过期缓存
setInterval(() => {
  memoryCache.cleanup()
}, 60 * 1000) // 每分钟清理一次