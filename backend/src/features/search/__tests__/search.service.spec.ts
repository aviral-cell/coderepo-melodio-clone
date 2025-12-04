import { Test, TestingModule } from '@nestjs/testing';

import { SearchService } from '../search.service';
import { TracksService } from '../../tracks/tracks.service';
import { ArtistsService } from '../../artists/artists.service';
import { AlbumsService } from '../../albums/albums.service';

describe('SearchService', () => {
  let service: SearchService;

  const mockTracksService = {
    search: jest.fn(),
  };

  const mockArtistsService = {
    search: jest.fn(),
  };

  const mockAlbumsService = {
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: TracksService, useValue: mockTracksService },
        { provide: ArtistsService, useValue: mockArtistsService },
        { provide: AlbumsService, useValue: mockAlbumsService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return combined results from tracks, artists, and albums', async () => {
      const query = 'rock';

      const mockTracks = [
        { _id: 'track1', title: 'Rock Song' },
        { _id: 'track2', title: 'Rock Anthem' },
      ];

      const mockArtists = [
        { _id: 'artist1', name: 'Rock Band' },
      ];

      const mockAlbums = [
        { _id: 'album1', title: 'Rock Album' },
      ];

      mockTracksService.search.mockResolvedValue(mockTracks);
      mockArtistsService.search.mockResolvedValue(mockArtists);
      mockAlbumsService.search.mockResolvedValue(mockAlbums);

      const result = await service.search(query);

      expect(result).toEqual({
        tracks: mockTracks,
        artists: mockArtists,
        albums: mockAlbums,
      });
      expect(mockTracksService.search).toHaveBeenCalledWith(query, 5);
      expect(mockArtistsService.search).toHaveBeenCalledWith(query, 5);
      expect(mockAlbumsService.search).toHaveBeenCalledWith(query, 5);
    });
  });
});
