import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Player from './components/Player/Player';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { UserErrorBoundary } from './components/UserErrorBoundary';
import { UserProvider } from './providers/UserProvider';
import LikedSongs from './pages/Playlist/Playlist';
import Home from './pages/Home/Home';
import './App.css';

const TEST_USER_ID = 'user_001';

function App() {
  return (
    <ErrorBoundary>
      <UserErrorBoundary>
        <UserProvider userId={TEST_USER_ID}>
          <Router>
            <div className="app">
              <Sidebar />
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/liked-songs" element={<LikedSongs />} />
                  <Route path="/playlist/:playlistName" element={<LikedSongs />} />
                </Routes>
              </main>
              <Player />
            </div>
          </Router>
        </UserProvider>
      </UserErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
