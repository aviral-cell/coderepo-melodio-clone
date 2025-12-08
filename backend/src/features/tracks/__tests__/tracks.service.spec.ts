import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

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
    it('should return paginated tracks with default pagination', async () => {
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

    it('should return paginated tracks with custom pagination', async () => {
      const mockTracks = [{ _id: 'track3', title: 'Track 3' }];

      const mockExec = jest.fn().mockResolvedValue(mockTracks);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate2 = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

      mockTrackModel.find.mockReturnValue({ populate: mockPopulate1 });
      mockTrackModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(50) });

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(mockSkip).toHaveBeenCalledWith(20);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should filter by genre when provided', async () => {
      const mockTracks = [{ _id: 'track1', title: 'Rock Song', genre: 'rock' }];

      const mockExec = jest.fn().mockResolvedValue(mockTracks);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate2 = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

      mockTrackModel.find.mockReturnValue({ populate: mockPopulate1 });
      mockTrackModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      await service.findAll({ genre: 'ROCK' });

      expect(mockTrackModel.find).toHaveBeenCalledWith(expect.objectContaining({ genre: 'rock' }));
    });

    it('should filter by artistId when provided', async () => {
      const artistId = '507f1f77bcf86cd799439011';
      const mockTracks = [{ _id: 'track1', title: 'Track 1', artistId }];

      const mockExec = jest.fn().mockResolvedValue(mockTracks);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate2 = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

      mockTrackModel.find.mockReturnValue({ populate: mockPopulate1 });
      mockTrackModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      await service.findAll({ artistId });

      expect(mockTrackModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ artistId: new Types.ObjectId(artistId) }),
      );
    });

    it('should filter by albumId when provided', async () => {
      const albumId = '507f1f77bcf86cd799439012';
      const mockTracks = [{ _id: 'track1', title: 'Track 1', albumId }];

      const mockExec = jest.fn().mockResolvedValue(mockTracks);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate2 = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

      mockTrackModel.find.mockReturnValue({ populate: mockPopulate1 });
      mockTrackModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      await service.findAll({ albumId });

      expect(mockTrackModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ albumId: new Types.ObjectId(albumId) }),
      );
    });

    it('should return empty items when no tracks exist', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate2 = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

      mockTrackModel.find.mockReturnValue({ populate: mockPopulate1 });
      mockTrackModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      const result = await service.findAll({});

      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
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

    it('should throw NotFoundException when track does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockPopulate2 = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

      mockTrackModel.findById.mockReturnValue({ populate: mockPopulate1 });

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('nonexistent')).rejects.toThrow(
        'Track with ID nonexistent not found',
      );
    });
  });

  describe('search', () => {
    it('should return tracks matching title prefix', async () => {
      const mockTracks = [
        { _id: 'track1', title: 'Storm Chaser' },
        { _id: 'track2', title: 'Street Dreams' },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockTracks);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate2 = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      mockTrackModel.find.mockReturnValue({ populate: mockPopulate1 });

      const result = await service.search('st');

      expect(result).toEqual(mockTracks);
      expect(mockTrackModel.find).toHaveBeenCalledWith({
        $or: [
          { title: { $regex: '^st', $options: 'i' } },
          { genre: 'st' },
        ],
      });
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('should return empty array for empty query', async () => {
      const result = await service.search('');

      expect(result).toEqual([]);
      expect(mockTrackModel.find).not.toHaveBeenCalled();
    });

    it('should use custom limit when provided', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate2 = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      mockTrackModel.find.mockReturnValue({ populate: mockPopulate1 });

      await service.search('rock', 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should escape special regex characters in query', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate2 = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      mockTrackModel.find.mockReturnValue({ populate: mockPopulate1 });

      await service.search('test.*query');

      expect(mockTrackModel.find).toHaveBeenCalledWith({
        $or: [
          { title: { $regex: '^test\\.\\*query', $options: 'i' } },
          { genre: 'test.*query' },
        ],
      });
    });
  });

  describe('incrementPlayCount', () => {
    it('should increment play count', async () => {
      const mockTrack = {
        _id: 'track123',
        title: 'Test Track',
        playCount: 101,
      };

      const mockExec = jest.fn().mockResolvedValue(mockTrack);
      mockTrackModel.findByIdAndUpdate.mockReturnValue({ exec: mockExec });

      const result = await service.incrementPlayCount('track123');

      expect(result).toEqual(mockTrack);
      expect(mockTrackModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'track123',
        { $inc: { playCount: 1 } },
        { new: true },
      );
    });

    it('should throw NotFoundException when track does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      mockTrackModel.findByIdAndUpdate.mockReturnValue({ exec: mockExec });

      await expect(service.incrementPlayCount('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.incrementPlayCount('nonexistent')).rejects.toThrow(
        'Track with ID nonexistent not found',
      );
    });
  });
});
