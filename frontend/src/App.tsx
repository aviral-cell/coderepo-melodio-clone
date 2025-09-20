import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Player from './components/Player/Player';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import LikedSongs from './pages/LikedSongs/LikedSongs';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Sidebar />
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LikedSongs />} />
              <Route path="/liked-songs" element={<LikedSongs />} />
            </Routes>
          </main>
          <Player />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
