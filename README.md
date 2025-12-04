# Hackify - Spotify Clone

A full-stack music streaming application inspired by Spotify, built with the MNN Stack (MongoDB + Next.js + NestJS).

## Overview

Hackify is a Spotify-like music streaming platform for HackerRank debugging challenges featuring:

- **Frontend**: Next.js 15+ with App Router, Tailwind CSS, Shadcn UI
- **Backend**: NestJS with MongoDB/Mongoose
- **Features**: Music player, playlists, search, discover weekly, analytics, trending

## Architecture

```
spotify-mern-app/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── shared/          # Config, guards, pipes, interceptors
│   │   ├── features/        # Feature modules (auth, tracks, playlists, etc.)
│   │   └── seed/            # Database seeding
│   └── package.json
│
├── frontend/                # Next.js App
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   └── shared/          # Components, contexts, hooks, services
│   └── package.json
│
├── docs/                    # Documentation
│   ├── spotify-clone-prd.md
│   ├── spotify-clone-features-summary.md
│   └── implementation-plan.md
│
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- npm or pnpm

### Development Setup

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd spotify-mern-app
   ```

2. **Start the backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run start:dev
   ```

3. **Start the frontend:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Swagger Docs: http://localhost:5000/api/docs

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15+ | React framework with App Router |
| React 19 | UI library |
| Tailwind CSS | Styling |
| Shadcn UI | Component library |
| Zod | Form validation |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| NestJS | Node.js framework |
| MongoDB | Database |
| Mongoose | ODM (NOT Prisma) |
| Passport JWT | Authentication |
| class-validator | DTO validation |
| node-cache | In-memory caching |

### Forbidden Technologies
- Prisma, TypeORM (use Mongoose)
- Axios (use native Fetch)
- Zustand, Redux (use React Context)

## Key Features

| Feature | Description |
|---------|-------------|
| Music Player | Simulated playback with queue management |
| Playlists | Create, edit, reorder tracks |
| Search | Autocomplete across tracks, albums, artists |
| Discover Weekly | Personalized recommendations |
| Analytics | Listening stats and streaks |
| Trending | Time-weighted leaderboard |
| Library | Like tracks/albums, follow artists |

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Current user

### Catalog
- `GET /api/v1/tracks` - List tracks
- `GET /api/v1/artists` - List artists
- `GET /api/v1/albums` - List albums
- `GET /api/v1/search?q=` - Unified search

### Playlists
- `GET /api/v1/playlists` - User playlists
- `POST /api/v1/playlists` - Create playlist
- `POST /api/v1/playlists/:id/tracks` - Add track

### Advanced
- `GET /api/v1/discover-weekly` - Recommendations
- `GET /api/v1/analytics/stats` - User stats
- `GET /api/v1/trending` - Trending tracks

## Development Scripts

**Backend:**
```bash
npm run start:dev      # Development server
npm run build          # Production build
npm run seed           # Seed database
npm run test           # Run tests
```

**Frontend:**
```bash
npm run dev            # Development server
npm run build          # Production build
npm run lint           # ESLint
npm run test           # Jest tests
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
APP_PORT=5000
MONGODB_URI=mongodb://root:Root123@localhost:27017/spotify_clone?authSource=admin
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Documentation

- [PRD](./docs/spotify-clone-prd.md) - Product requirements
- [Features](./docs/spotify-clone-features-summary.md) - Feature summary
- [Implementation Plan](./docs/implementation-plan.md) - Development phases

---

Built for HackerRank debugging challenge.
