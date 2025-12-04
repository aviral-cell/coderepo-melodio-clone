import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { TracksService } from '../tracks.service';
import { Track } from '../schemas/track.schema';

describe('TracksService', () => {
  let service: TracksService;

  const mockTrackModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracksService,
        {
          provide: getModelToken(Track.name),
          useValue: mockTrackModel,
        },
      ],
    }).compile();

    service = module.get<TracksService>(TracksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated tracks', async () => {
      const mockTracks = [
        { _id: 'track1', title: 'Track 1' },
        { _id: 'track2', title: 'Track 2' },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockTracks);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate2 = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

      mockTrackModel.find.mockReturnValue({ populate: mockPopulate1 });
      mockTrackModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(2) });

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual({
        items: mockTracks,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
      expect(mockTrackModel.find).toHaveBeenCalled();
      expect(mockTrackModel.countDocuments).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a track by id', async () => {
      const mockTrack = {
        _id: 'track123',
        title: 'Test Track',
        artistId: { name: 'Artist', imageUrl: 'http://example.com/image.jpg' },
        albumId: { title: 'Album', coverImageUrl: 'http://example.com/cover.jpg' },
      };

      const mockExec = jest.fn().mockResolvedValue(mockTrack);
      const mockPopulate2 = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

      mockTrackModel.findById.mockReturnValue({ populate: mockPopulate1 });

      const result = await service.findById('track123');

      expect(result).toEqual(mockTrack);
      expect(mockTrackModel.findById).toHaveBeenCalledWith('track123');
    });
  });
});
