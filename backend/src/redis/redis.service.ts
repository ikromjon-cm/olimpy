import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get('REDIS_HOST') || 'localhost';
    const port = parseInt(this.configService.get('REDIS_PORT') || '6379', 10);
    const password = this.configService.get('REDIS_PASSWORD');

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      retryStrategy: (times) => {
        if (times > 10) {
          this.logger.error('Redis max retries reached');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis Client Ready');
    });

    try {
      await this.client.connect();
    } catch (error) {
      this.logger.warn('Redis connection failed - proceeding without Redis cache');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis Client Disconnected');
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const current = await this.incr(key);

    if (current === 1) {
      await this.expire(key, windowSeconds);
    }

    const ttl = await this.ttl(key);

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime: Date.now() + ttl * 1000,
    };
  }

  async setOTP(phone: string, code: string, ttlMinutes = 5): Promise<void> {
    await this.set(`otp:${phone}`, code, ttlMinutes * 60);
  }

  async getOTP(phone: string): Promise<string | null> {
    return this.get(`otp:${phone}`);
  }

  async verifyOTP(phone: string, code: string): Promise<boolean> {
    const stored = await this.getOTP(phone);
    if (stored && stored === code) {
      await this.del(`otp:${phone}`);
      return true;
    }
    return false;
  }

  async setSession(userId: string, data: Record<string, any>, ttlSeconds = 86400 * 7): Promise<void> {
    await this.set(`session:${userId}`, JSON.stringify(data), ttlSeconds);
  }

  async getSession(userId: string): Promise<Record<string, any> | null> {
    const data = await this.get(`session:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  async setCache(key: string, data: any, ttlSeconds = 300): Promise<void> {
    await this.set(`cache:${key}`, JSON.stringify(data), ttlSeconds);
  }

  async getCache<T>(key: string): Promise<T | null> {
    const data = await this.get(`cache:${key}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteCache(key: string): Promise<void> {
    await this.del(`cache:${key}`);
  }

  async deleteCachePattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: `cache:${pattern}*` });
    const pipeline = this.client.pipeline();

    stream.on('data', (keys: string[]) => {
      if (keys.length > 0) {
        pipeline.del(keys);
      }
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('end', () => {
        pipeline.exec().catch(() => {});
        resolve();
      });
      stream.on('error', reject);
    });
  }
}
