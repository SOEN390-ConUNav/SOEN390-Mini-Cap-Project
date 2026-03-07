import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheEnvelope<T> {
  value: T;
  expiresAt: number | null;
}

class CacheService {
  private static instance: CacheService | null = null;
  private readonly memory = new Map<string, CacheEnvelope<unknown>>();

  private constructor() {}

  static getInstance(): CacheService {
    CacheService.instance ??= new CacheService();
    return CacheService.instance;
  }

  private makeKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  private isExpired(expiresAt: number | null): boolean {
    return expiresAt !== null && Date.now() > expiresAt;
  }

  getMemory<T>(namespace: string, key: string): T | null {
    const cacheKey = this.makeKey(namespace, key);
    const cached = this.memory.get(cacheKey);
    if (!cached) return null;

    if (this.isExpired(cached.expiresAt)) {
      this.memory.delete(cacheKey);
      return null;
    }

    return cached.value as T;
  }

  setMemory<T>(namespace: string, key: string, value: T, ttlMs?: number): void {
    const cacheKey = this.makeKey(namespace, key);
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this.memory.set(cacheKey, { value, expiresAt });
  }

  clearMemoryNamespace(namespace: string): void {
    const prefix = `${namespace}:`;
    for (const key of this.memory.keys()) {
      if (key.startsWith(prefix)) {
        this.memory.delete(key);
      }
    }
  }

  async getPersistent<T>(namespace: string, key: string): Promise<T | null> {
    const cacheKey = this.makeKey(namespace, key);
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (this.isExpired(envelope.expiresAt)) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    this.memory.set(cacheKey, envelope as CacheEnvelope<unknown>);
    return envelope.value;
  }

  async setPersistent<T>(
    namespace: string,
    key: string,
    value: T,
    ttlMs?: number,
  ): Promise<void> {
    const cacheKey = this.makeKey(namespace, key);
    const envelope: CacheEnvelope<T> = {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    };

    this.memory.set(cacheKey, envelope as CacheEnvelope<unknown>);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(envelope));
  }

  async getPersistentRaw<T>(namespace: string, key: string): Promise<T | null> {
    const cacheKey = this.makeKey(namespace, key);
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as T;
    this.memory.set(cacheKey, { value: parsed, expiresAt: null });
    return parsed;
  }

  async setPersistentRaw<T>(
    namespace: string,
    key: string,
    value: T,
  ): Promise<void> {
    const cacheKey = this.makeKey(namespace, key);
    this.memory.set(cacheKey, { value, expiresAt: null });
    await AsyncStorage.setItem(cacheKey, JSON.stringify(value));
  }
}

const cacheService = CacheService.getInstance();

export default cacheService;
