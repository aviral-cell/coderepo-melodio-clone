import { render, screen } from '@testing-library/react';

import { TrackCard } from '../TrackCard';
import { TrackWithPopulated } from '../../../types/track.types';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));

// Mock PlayerContext
const mockPlayTrack = jest.fn();
const mockTogglePlayPause = jest.fn();
const mockAddToQueue = jest.fn();

jest.mock('@/shared/contexts/PlayerContext', () => ({
  usePlayer: () => ({
    state: {
      currentTrack: null,
      isPlaying: false,
      queue: [],
      queueIndex: 0,
      elapsedSeconds: 0,
      shuffleEnabled: false,
      repeatMode: 'off',
      volume: 80,
      isQueueOpen: false,
    },
    playTrack: mockPlayTrack,
    togglePlayPause: mockTogglePlayPause,
    addToQueue: mockAddToQueue,
  }),
}));

const mockTrack: TrackWithPopulated = {
  _id: 'track-1',
  title: 'Bohemian Rhapsody',
  artistId: { _id: 'artist-1', name: 'Queen', imageUrl: '' },
  albumId: {
    _id: 'album-1',
    title: 'A Night at the Opera',
    coverImageUrl: 'https://example.com/cover.jpg',
  },
  durationInSeconds: 354,
  trackNumber: 11,
  genre: 'rock',
  playCount: 1000000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('TrackCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render track title', () => {
    render(<TrackCard track={mockTrack} />);

    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
  });

  it('should render artist name', () => {
    render(<TrackCard track={mockTrack} />);

    expect(screen.getByText('Queen')).toBeInTheDocument();
  });
});
