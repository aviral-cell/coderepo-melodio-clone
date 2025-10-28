import { plainToInstance, Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  validateSync,
  IsEnum,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  POSTGRES_HOST: string = 'localhost';

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  POSTGRES_PORT: number = 5432;

  @IsString()
  @IsOptional()
  POSTGRES_DB: string = 'hackify_db';

  @IsString()
  @IsOptional()
  POSTGRES_USER: string = 'hackify_user';

  @IsString()
  @IsOptional()
  POSTGRES_PASSWORD: string = 'hackify_password';

  @IsString()
  @IsOptional()
  APP_URL: string = 'http://localhost:5173';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
