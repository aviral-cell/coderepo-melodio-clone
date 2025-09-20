# Hackify API - Music Service

A robust, scalable music service built with NestJS, Prisma ORM, and MongoDB, featuring song search, playlist management, and clean architecture patterns.

## 🚀 Features

- **Song Search**: Search songs by title, artist, or album
- **Playlist Management**: Like/unlike songs, manage user playlists
- **User Management**: Create and manage user profiles
- **Advanced Filtering**: Case-insensitive search with pagination
- **MongoDB Integration**: Full-text search with Prisma ORM
- **Cursor-based Pagination**: Efficient pagination for large datasets
- **Type Safety**: Full TypeScript support with Prisma
- **Clean Architecture**: Well-structured, maintainable code
- **Docker Support**: Easy local development with Docker Compose
- **Validation**: Input validation with class-validator

## 🏗️ Architecture

```
src/
├── search/                    # Search functionality
│   ├── controllers/
│   │   └── search.controller.ts    # @Controller('search')
│   ├── services/
│   │   └── search.service.ts       # Search business logic
│   ├── dto/
│   │   └── search-songs.dto.ts     # Search validation
│   ├── interfaces/
│   │   └── search.interface.ts     # Search types
│   └── search.module.ts            # Search module
│
├── liked-songs/               # Playlist functionality
│   ├── controllers/
│   │   └── liked-songs.controller.ts # @Controller('liked')
│   ├── services/
│   │   └── liked-songs.service.ts   # Playlist business logic
│   ├── dto/
│   │   ├── like-song.dto.ts         # Like validation
│   │   ├── remove-liked-song.dto.ts # Remove validation
│   │   └── get-liked-songs.dto.ts   # Get validation
│   ├── interfaces/
│   │   └── liked-songs.interface.ts # Playlist types
│   └── liked-songs.module.ts        # Liked songs module
│
├── users/                     # User management
│   ├── controllers/
│   │   └── users.controller.ts      # @Controller('users')
│   ├── services/
│   │   └── users.service.ts         # User business logic
│   ├── interfaces/
│   │   └── users.interface.ts       # User types
│   └── users.module.ts              # Users module
│
├── prisma/                    # Database service
├── config/                    # Configuration
└── app.module.ts              # Main app module
```

## 🛠️ Local Development Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Quick Start (Recommended)

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd backend
   ```

2. **Create environment file:**

   ```bash
   # Create .env.development file
   echo "DATABASE_URL=mongodb://mongodb:27017/hackify_db" > .env.development
   echo "PORT=3000" >> .env.development
   echo "APP_URL=http://localhost:3000" >> .env.development
   ```

3. **Start with Docker (Easiest):**

   ```bash
   # Start MongoDB and API with Docker Compose
   npm run docker:up

   # In another terminal, seed the database
   npm run docker:db:seed
   ```

4. **Test the API:**

   ```bash
   # Test search endpoint
   curl "http://localhost:3000/search?q=rock"

   # Test user endpoint
   curl "http://localhost:3000/users/user_001"
   ```

### Manual Setup (Alternative)

If you prefer to run without Docker:

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up MongoDB locally:**

   ```bash
   # Install MongoDB locally or use MongoDB Atlas
   # Update DATABASE_URL in .env.development
   ```

3. **Generate Prisma client:**

   ```bash
   npm run prisma:generate
   ```

4. **Seed the database:**

   ```bash
   npm run prisma:db:seed
   ```

5. **Start development server:**
   ```bash
   npm run start:dev
   ```

## 🐳 Docker Commands

### Available Scripts

```bash
# Development
npm run docker:up              # Start all services
npm run docker:down            # Stop all services
npm run docker:build           # Build Docker images
npm run docker:logs            # View logs

# Database
npm run docker:db:seed         # Seed the database
npm run docker:db:migrate      # Run migrations
npm run docker:postgres        # Connect to MongoDB shell

# Cleanup
npm run docker:clean           # Remove all containers and volumes
```

### Troubleshooting

**MongoDB Replica Set Issues:**

```bash
# If you see replica set errors, restart with clean volumes
npm run docker:clean
npm run docker:up
```

**Port Conflicts:**

```bash
# If port 3000 is in use, update docker-compose.yml
# Change "3000:3000" to "3001:3000" for port 3001
```

**Database Connection Issues:**

```bash
# Check if MongoDB is running
npm run docker:logs

# Verify environment variables
cat .env.development
```
