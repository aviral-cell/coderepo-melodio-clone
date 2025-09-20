# Hackify - Spotify Clone

A production-ready Spotify clone built with React, TypeScript, and CSS Modules, featuring a "Liked Songs" playlist interface.

## Features

- 🎵 **Liked Songs Playlist** - Browse and play your favorite songs
- 🎨 **Spotify-like UI** - Dark theme with authentic Spotify design
- 🎮 **Music Player** - Full-featured player with controls
- 📱 **Responsive Design** - Works on desktop and mobile
- 🛡️ **Error Handling** - Error boundaries and loading states
- 🎯 **TypeScript** - Full type safety
- 🎨 **CSS Modules** - Scoped styling for maintainability

## Tech Stack

- **React 19** - Latest React with hooks
- **TypeScript** - Type safety and better DX
- **CSS Modules** - Scoped styling
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **Vite** - Fast build tool

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Sidebar/        # Navigation sidebar
│   ├── Header/         # Top navigation bar
│   ├── Player/         # Music player controls
│   ├── ErrorBoundary/  # Error handling
│   └── Loading/        # Loading states
├── pages/              # Page components
│   └── LikedSongs/     # Main liked songs page
├── hooks/              # Custom React hooks
│   └── useMusicPlayer/ # Music player logic
├── types/              # TypeScript type definitions
├── services/           # Data services and utilities
└── utils/              # Helper functions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Sidebar Navigation
- Spotify logo and branding
- Home, Search, and Library navigation
- Create Playlist button
- Liked Songs (highlighted)
- Your Episodes

### Header
- Navigation arrows
- Search bar with placeholder
- User actions (Premium, Install App)
- Notifications and friends activity
- User profile

### Liked Songs Page
- Large playlist header with gradient background
- Play and download buttons
- Song list with album art, title, artist, album, date, and duration
- Currently playing song highlighting
- Hover effects and interactions

### Music Player
- Current song information
- Play/pause, skip, shuffle, repeat controls
- Progress bar with time display
- Volume control
- Additional controls (lyrics, queue, connect, fullscreen)

## Customization

### Colors
All colors are defined as CSS custom properties in `src/index.css`:
- `--spotify-green`: Primary brand color
- `--spotify-black`: Main background
- `--spotify-gray`: Secondary backgrounds
- `--spotify-text-primary`: Primary text color
- `--spotify-text-secondary`: Secondary text color
