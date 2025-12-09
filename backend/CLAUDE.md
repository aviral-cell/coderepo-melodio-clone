# Backend - NestJS API

## Overview

NestJS backend API for the Hackify music streaming application. Uses MongoDB with Mongoose ODM and follows feature-based architecture.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.x | Node.js framework |
| MongoDB | - | Database |
| Mongoose | 8.x | ODM (Object Document Mapper) |
| Passport JWT | - | Authentication |
| class-validator | - | DTO validation |
| class-transformer | - | DTO transformation |
| node-cache | - | In-memory caching |
| bcryptjs | - | Password hashing |

## Directory Structure

```
backend/
├── src/
│   ├── app.module.ts         # Root module
│   ├── main.ts               # Application entry point
│   ├── features/             # Feature modules
│   │   ├── auth/             # Authentication (register, login, JWT)
│   │   ├── users/            # User management
│   │   ├── tracks/           # Music tracks
│   │   ├── artists/          # Artist profiles
│   │   ├── albums/           # Album management
│   │   ├── playlists/        # User playlists
│   │   └── search/           # Unified search
│   ├── shared/               # Shared utilities
│   │   ├── database/         # MongoDB connection
│   │   ├── decorators/       # Custom decorators (@CurrentUser)
│   │   ├── filters/          # Exception filters
│   │   ├── guards/           # Auth guards (JwtAuthGuard)
│   │   ├── interceptors/     # Response transformers
│   │   ├── pipes/            # Validation pipes
│   │   └── types/            # Shared TypeScript types
│   └── scripts/              # Database seeding
└── test/                     # E2E tests
```

## Feature Module Pattern

Each feature follows this structure:
```
feature/
├── feature.module.ts         # Module definition
├── feature.controller.ts     # HTTP endpoints
├── feature.service.ts        # Business logic
├── dto/                      # Data Transfer Objects
│   └── create-feature.dto.ts
├── schemas/                  # Mongoose schemas
│   └── feature.schema.ts
└── __tests__/                # Unit tests
    └── feature.service.spec.ts
```

## Code Style

### Imports
```typescript
// 1. NestJS imports
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// 2. Third-party imports
import { Model, Types } from 'mongoose';

// 3. Local imports (relative)
import { CreateTrackDto } from './dto/create-track.dto';
import { Track } from './schemas/track.schema';
```

### Naming Conventions
- **Files**: `kebab-case.suffix.ts` (e.g., `track-query.dto.ts`)
- **Classes**: `PascalCase` (e.g., `TracksService`)
- **Methods**: `camelCase` (e.g., `findByGenre`)
- **DTOs**: `{Action}{Entity}Dto` (e.g., `CreatePlaylistDto`)
- **Schemas**: Singular `PascalCase` (e.g., `Track`, `Playlist`)

### Error Handling
```typescript
// Use NestJS exceptions
throw new NotFoundException('Track not found');
throw new UnauthorizedException('Invalid credentials');
throw new BadRequestException('Invalid playlist ID');
```

### MongoDB ObjectId Validation
```typescript
// Use ParseObjectIdPipe for route params
@Get(':id')
findOne(@Param('id', ParseObjectIdPipe) id: string) {
  return this.service.findById(id);
}
```

## Commands

```bash
# Development
npm run dev              # Start with watch mode
npm run start:dev        # Alternative dev command

# Build
npm run build            # Production build

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
npm run test:e2e         # End-to-end tests

# Run single test file
npx jest src/features/auth/__tests__/auth.service.spec.ts

# Database
npm run seed             # Seed database with sample data
```

## API Structure

All endpoints are prefixed with `/api/v1/`

### Public Endpoints
- `POST /auth/register` - Create account
- `POST /auth/login` - Login and get JWT

### Protected Endpoints (require Bearer token)
- `GET /auth/me` - Current user profile
- `GET /tracks` - List tracks (with pagination)
- `GET /albums` - List albums
- `GET /artists` - List artists
- `GET /search?q=term` - Unified search
- `GET /playlists` - User's playlists
- `POST /playlists` - Create playlist
- `POST /playlists/:id/tracks` - Add track to playlist

## Environment Variables

```env
NODE_ENV=development
APP_PORT=5000
MONGODB_URI=mongodb://root:Root123@localhost:27017/hackify_clone?authSource=admin
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
```

## Testing Patterns

```typescript
// Service test structure
describe('FeatureService', () => {
  let service: FeatureService;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = createMockModel();
    const module = await Test.createTestingModule({
      providers: [
        FeatureService,
        { provide: getModelToken(Feature.name), useValue: mockModel },
      ],
    }).compile();
    service = module.get<FeatureService>(FeatureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## Key Dependencies

- **Authentication**: `@nestjs/passport`, `passport-jwt`, `@nestjs/jwt`
- **Validation**: `class-validator`, `class-transformer`
- **Database**: `@nestjs/mongoose`, `mongoose`
- **Documentation**: `@nestjs/swagger`
