import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { PlaylistsService } from '../playlists.service';
import { Playlist } from '../schemas/playlist.schema';

describe('PlaylistsService', () => {
  let service: PlaylistsService;
  let mockPlaylistModel: any;

  const createMockPlaylistModel = () => {
    const MockModel: any = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: 'playlist123',
        ...dto,
        ownerId: dto.ownerId,
      }),
    }));

    MockModel.find = jest.fn();
    MockModel.findById = jest.fn();
    MockModel.findByIdAndDelete = jest.fn();
    MockModel.countDocuments = jest.fn();

    return MockModel;
  };

  beforeEach(async () => {
    mockPlaylistModel = createMockPlaylistModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        {
          provide: getModelToken(Playlist.name),
          useValue: mockPlaylistModel,
        },
      ],
    }).compile();

    service = module.get<PlaylistsService>(PlaylistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a playlist successfully', async () => {
      const createPlaylistDto = {
        name: 'My Playlist',
        description: 'A test playlist',
        isPublic: true,
      };
      const ownerId = '507f1f77bcf86cd799439011';

      const result = await service.create(createPlaylistDto, ownerId);

      expect(result).toBeDefined();
      expect(result.name).toBe('My Playlist');
      expect(result.description).toBe('A test playlist');
      expect(mockPlaylistModel).toHaveBeenCalled();
    });
  });

  describe('findByOwnerId', () => {
    it('should return playlists for a given owner', async () => {
      const ownerId = '507f1f77bcf86cd799439011';
      const mockPlaylists = [
        { _id: 'playlist1', name: 'Playlist 1', ownerId },
        { _id: 'playlist2', name: 'Playlist 2', ownerId },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockPlaylists);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockPlaylistModel.find.mockReturnValue({ sort: mockSort });

      const result = await service.findByOwnerId(ownerId);

      expect(result).toEqual(mockPlaylists);
      expect(mockPlaylistModel.find).toHaveBeenCalledWith({ ownerId: new Types.ObjectId(ownerId) });
    });
  });

  describe('addTrack', () => {
    it('should add a track to a playlist', async () => {
      const playlistId = 'playlist123';
      const trackId = '507f1f77bcf86cd799439012';
      const userId = 'user123';

      const mockPlaylist = {
        _id: playlistId,
        ownerId: { toString: () => userId },
        trackIds: [],
        save: jest.fn().mockResolvedValue({
          _id: playlistId,
          ownerId: { toString: () => userId },
          trackIds: [new Types.ObjectId(trackId)],
        }),
      };

      const mockExec = jest.fn().mockResolvedValue(mockPlaylist);
      mockPlaylistModel.findById.mockReturnValue({ exec: mockExec });

      const result = await service.addTrack(playlistId, trackId, userId);

      expect(result).toBeDefined();
      expect(mockPlaylist.save).toHaveBeenCalled();
    });
  });
});
