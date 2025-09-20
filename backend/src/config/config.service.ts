import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>('port') || 3000;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('nodeEnv') || 'development';
  }

  get databaseUrl(): string {
    return this.configService.get<string>('database.url') || '';
  }

  get appUrl(): string {
    return this.configService.get<string>('appUrl') || 'http://localhost:5173';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}
