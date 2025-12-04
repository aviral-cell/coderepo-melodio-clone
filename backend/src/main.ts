import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';

function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Spotify Clone API')
    .setDescription('REST API for Spotify Clone application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Tracks', 'Track management endpoints')
    .addTag('Artists', 'Artist management endpoints')
    .addTag('Albums', 'Album management endpoints')
    .addTag('Playlists', 'Playlist management endpoints')
    .addTag('Search', 'Search endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}

function enableShutdownHooks(app: INestApplication): void {
  const gracefulShutdown = (signal: string): void => {
    console.log(`Received ${signal}. Graceful shutdown started`);
    void (async () => {
      try {
        await app.close();
        console.log('Server successfully shut down');
        process.exit(0);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`Error during shutdown: ${msg}`);
        process.exit(1);
      }
    })();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create(AppModule);

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global filters and interceptors
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    // Body parsers
    app.use(json({ limit: '10mb' }));
    app.use(urlencoded({ extended: true, limit: '10mb' }));

    // API versioning
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });

    // Swagger
    setupSwagger(app);

    // CORS
    app.enableCors({
      origin: process.env.NODE_ENV === 'production' ? false : '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Shutdown hooks
    enableShutdownHooks(app);

    const port = process.env.APP_PORT || 5000;
    await app.listen(port);
    console.log(`Server running at: http://localhost:${port}/api`);
    console.log(`Swagger docs at: http://localhost:${port}/api/docs`);
  } catch (error) {
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

void bootstrap();
