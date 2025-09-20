# Hackify - Full Stack Music Application

A modern, full-stack music streaming application inspired by Spotify, built with React, TypeScript, NestJS, and MongoDB.

## 🎵 Overview

Hackify is a complete music streaming platform featuring:

- **Frontend**: React-based Spotify clone with modern UI/UX
- **Backend**: Robust NestJS API with MongoDB integration
- **Features**: Song search, playlist management, user profiles, and music playback

## 🏗️ Architecture

```
hackify-repo/
├── frontend/          # React + TypeScript client
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # API services
│   └── README.md          # Frontend documentation
│
├── backend/           # NestJS + MongoDB API
│   ├── src/
│   │   ├── search/        # Song search functionality
│   │   ├── liked-songs/   # Playlist management
│   │   ├── users/         # User management
│   │   └── prisma/        # Database service
│   └── README.md          # Backend documentation
│
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (recommended)
- npm or yarn

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd spotify-mern-app
   ```

2. **Start the backend:**
   ```bash
   cd backend
   npm install
   npm run docker:up
   npm run docker:db:seed
   ```

3. **Start the frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 📚 Documentation

For detailed setup instructions, API documentation, and development guides, please refer to:

- **[Frontend Documentation](./frontend/README.md)** - React app setup, components, and features
- **[Backend Documentation](./backend/README.md)** - API setup, endpoints, and database configuration

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with hooks
- **TypeScript** - Type safety and better DX
- **CSS Modules** - Scoped styling
- **Vite** - Fast build tool
- **Lucide React** - Beautiful icons

### Backend
- **NestJS** - Scalable Node.js framework
- **MongoDB** - NoSQL database
- **Prisma** - Type-safe database ORM
- **Docker** - Containerization
- **TypeScript** - Full type safety

## 🎯 Key Features

- **Song Search**: Advanced search with filtering and pagination
- **Playlist Management**: Like/unlike songs, manage user playlists
- **User Profiles**: Create and manage user accounts
- **Music Player**: Full-featured player with controls
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live playlist updates
- **Error Handling**: Comprehensive error boundaries and validation

## 🔧 Development

### Available Scripts

**Backend:**
```bash
npm run docker:up          # Start all services
npm run docker:down        # Stop all services
npm run start:dev          # Development server
npm run prisma:studio      # Database GUI
```

**Frontend:**
```bash
npm run dev                # Development server
npm run build              # Production build
npm run preview            # Preview build
npm run lint               # Run linter
```

## 📝 API Endpoints

- `GET /search` - Search songs
- `GET /users/:id` - Get user profile
- `POST /liked` - Like a song
- `DELETE /liked` - Remove liked song
- `GET /liked/:userId` - Get user's liked songs

---

For detailed documentation and setup instructions, please refer to the individual README files in the `frontend/` and `backend/` directories.
