import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

import { ArtistsService } from '../artists.service';
import { Artist } from '../schemas/artist.schema';

describe('ArtistsService', () => {
  let service: ArtistsService;

  const mockArtistModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtistsService,
        {
          provide: getModelToken(Artist.name),
          useValue: mockArtistModel,
        },
      ],
    }).compile();

    service = module.get<ArtistsService>(ArtistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated artists with default pagination', async () => {
      const mockArtists = [
        { _id: 'artist1', name: 'Artist 1', followerCount: 1000 },
        { _id: 'artist2', name: 'Artist 2', followerCount: 500 },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockArtists);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      mockArtistModel.find.mockReturnValue({ skip: mockSkip });
      mockArtistModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(2) });

      const result = await service.findAll({});

      expect(result).toEqual({
        items: mockArtists,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
      expect(mockArtistModel.find).toHaveBeenCalled();
      expect(mockSort).toHaveBeenCalledWith({ followerCount: -1 });
    });

    it('should return paginated artists with custom pagination', async () => {
      const mockArtists = [{ _id: 'artist3', name: 'Artist 3' }];

      const mockExec = jest.fn().mockResolvedValue(mockArtists);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      mockArtistModel.find.mockReturnValue({ skip: mockSkip });
      mockArtistModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(30) });

      const result = await service.findAll({ page: 3, limit: 5 });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 5,
        total: 30,
        totalPages: 6,
      });
      expect(mockSkip).toHaveBeenCalledWith(10);
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('should return empty items when no artists exist', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      mockArtistModel.find.mockReturnValue({ skip: mockSkip });
      mockArtistModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      const result = await service.findAll({});

      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return an artist by id', async () => {
      const mockArtist = {
        _id: 'artist123',
        name: 'Test Artist',
        imageUrl: 'http://example.com/image.jpg',
        followerCount: 1000,
      };

      const mockExec = jest.fn().mockResolvedValue(mockArtist);
      mockArtistModel.findById.mockReturnValue({ exec: mockExec });

      const result = await service.findById('artist123');

      expect(result).toEqual(mockArtist);
      expect(mockArtistModel.findById).toHaveBeenCalledWith('artist123');
    });

    it('should throw NotFoundException when artist does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      mockArtistModel.findById.mockReturnValue({ exec: mockExec });

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('nonexistent')).rejects.toThrow(
        'Artist with ID nonexistent not found',
      );
    });
  });

  describe('search', () => {
    it('should return matching artists for a search query', async () => {
      const mockArtists = [
        { _id: 'artist1', name: 'Rock Band' },
        { _id: 'artist2', name: 'Rock Star' },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockArtists);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      mockArtistModel.find.mockReturnValue({ limit: mockLimit });

      const result = await service.search('rock');

      expect(result).toEqual(mockArtists);
      expect(mockArtistModel.find).toHaveBeenCalledWith({ $text: { $search: 'rock' } });
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('should return empty array for empty query', async () => {
      const result = await service.search('');

      expect(result).toEqual([]);
      expect(mockArtistModel.find).not.toHaveBeenCalled();
    });

    it('should use custom limit when provided', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      mockArtistModel.find.mockReturnValue({ limit: mockLimit });

      await service.search('jazz', 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  describe('incrementFollowerCount', () => {
    it('should increment follower count', async () => {
      const mockArtist = {
        _id: 'artist123',
        name: 'Test Artist',
        followerCount: 101,
      };

      const mockExec = jest.fn().mockResolvedValue(mockArtist);
      mockArtistModel.findByIdAndUpdate.mockReturnValue({ exec: mockExec });

      const result = await service.incrementFollowerCount('artist123');

      expect(result).toEqual(mockArtist);
      expect(mockArtistModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'artist123',
        { $inc: { followerCount: 1 } },
        { new: true },
      );
    });

    it('should throw NotFoundException when artist does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      mockArtistModel.findByIdAndUpdate.mockReturnValue({ exec: mockExec });

      await expect(service.incrementFollowerCount('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.incrementFollowerCount('nonexistent')).rejects.toThrow(
        'Artist with ID nonexistent not found',
      );
    });
  });

  describe('decrementFollowerCount', () => {
    it('should decrement follower count', async () => {
      const mockArtist = {
        _id: 'artist123',
        name: 'Test Artist',
        followerCount: 99,
      };

      const mockExec = jest.fn().mockResolvedValue(mockArtist);
      mockArtistModel.findByIdAndUpdate.mockReturnValue({ exec: mockExec });

      const result = await service.decrementFollowerCount('artist123');

      expect(result).toEqual(mockArtist);
      expect(mockArtistModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'artist123',
        { $inc: { followerCount: -1 } },
        { new: true },
      );
    });

    it('should throw NotFoundException when artist does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      mockArtistModel.findByIdAndUpdate.mockReturnValue({ exec: mockExec });

      await expect(service.decrementFollowerCount('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.decrementFollowerCount('nonexistent')).rejects.toThrow(
        'Artist with ID nonexistent not found',
      );
    });
  });
});
