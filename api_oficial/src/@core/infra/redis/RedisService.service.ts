import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

export class RedisService {
  private client: Redis;
  private logger: Logger = new Logger('RedisServer');

  constructor() {
    this.logger.log('🔄 Iniciando conexão com Redis...');
    try {
      this.client = new Redis(process.env.REDIS_URI);
      this.logger.log(`📡 Conexão com Redis estabelecida com sucesso`);
    } catch (error) {
      this.logger.error(`❌ Erro ao conectar com Redis: ${error}`);
    }
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async quit(): Promise<void> {
    try {
      await this.client.quit();
      this.logger.log('👋 Conexão com Redis encerrada com sucesso');
    } catch (error) {
      this.logger.error(`❌ Erro ao encerrar conexão com Redis: ${error}`);
    }
  }
}
