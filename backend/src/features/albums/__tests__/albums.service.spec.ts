import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

import { AlbumsService } from '../albums.service';
import { Album } from '../schemas/album.schema';

describe('AlbumsService', () => {
  let service: AlbumsService;

  const mockAlbumModel = {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlbumsService,
        {
          provide: getModelToken(Album.name),
          useValue: mockAlbumModel,
        },
      ],
    }).compile();

    service = module.get<AlbumsService>(AlbumsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated albums with default pagination', async () => {
      const mockAlbums = [
        { _id: 'album1', title: 'Album 1', artistId: { name: 'Artist 1' } },
        { _id: 'album2', title: 'Album 2', artistId: { name: 'Artist 2' } },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockAlbums);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate = jest.fn().mockReturnValue({ skip: mockSkip });
      mockAlbumModel.find.mockReturnValue({ populate: mockPopulate });
      mockAlbumModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(2) });

      const result = await service.findAll({});

      expect(result).toEqual({
        items: mockAlbums,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
      expect(mockAlbumModel.find).toHaveBeenCalledWith({});
    });

    it('should return paginated albums with custom pagination', async () => {
      const mockAlbums = [{ _id: 'album3', title: 'Album 3' }];

      const mockExec = jest.fn().mockResolvedValue(mockAlbums);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate = jest.fn().mockReturnValue({ skip: mockSkip });
      mockAlbumModel.find.mockReturnValue({ populate: mockPopulate });
      mockAlbumModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(25) });

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
      expect(mockSkip).toHaveBeenCalledWith(10);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should filter albums by artistId when provided', async () => {
      const mockAlbums = [{ _id: 'album1', title: 'Album 1' }];

      const mockExec = jest.fn().mockResolvedValue(mockAlbums);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate = jest.fn().mockReturnValue({ skip: mockSkip });
      mockAlbumModel.find.mockReturnValue({ populate: mockPopulate });
      mockAlbumModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      await service.findAll({ artistId: 'artist123' });

      expect(mockAlbumModel.find).toHaveBeenCalledWith({ artistId: 'artist123' });
    });

    it('should return empty items when no albums exist', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate = jest.fn().mockReturnValue({ skip: mockSkip });
      mockAlbumModel.find.mockReturnValue({ populate: mockPopulate });
      mockAlbumModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      const result = await service.findAll({});

      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return an album by id', async () => {
      const mockAlbum = {
        _id: 'album123',
        title: 'Test Album',
        artistId: { name: 'Artist', imageUrl: 'http://example.com/image.jpg' },
      };

      const mockExec = jest.fn().mockResolvedValue(mockAlbum);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      mockAlbumModel.findById.mockReturnValue({ populate: mockPopulate });

      const result = await service.findById('album123');

      expect(result).toEqual(mockAlbum);
      expect(mockAlbumModel.findById).toHaveBeenCalledWith('album123');
    });

    it('should throw NotFoundException when album does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      mockAlbumModel.findById.mockReturnValue({ populate: mockPopulate });

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('nonexistent')).rejects.toThrow(
        'Album with ID nonexistent not found',
      );
    });
  });

  describe('search', () => {
    it('should return matching albums for a search query', async () => {
      const mockAlbums = [
        { _id: 'album1', title: 'Rock Album' },
        { _id: 'album2', title: 'Rock Songs' },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockAlbums);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate = jest.fn().mockReturnValue({ limit: mockLimit });
      mockAlbumModel.find.mockReturnValue({ populate: mockPopulate });

      const result = await service.search('rock');

      expect(result).toEqual(mockAlbums);
      expect(mockAlbumModel.find).toHaveBeenCalledWith({ $text: { $search: 'rock' } });
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('should return empty array for empty query', async () => {
      const result = await service.search('');

      expect(result).toEqual([]);
      expect(mockAlbumModel.find).not.toHaveBeenCalled();
    });

    it('should use custom limit when provided', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate = jest.fn().mockReturnValue({ limit: mockLimit });
      mockAlbumModel.find.mockReturnValue({ populate: mockPopulate });

      await service.search('jazz', 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  describe('findByArtistId', () => {
    it('should return albums by artist id', async () => {
      const mockAlbums = [
        { _id: 'album1', title: 'Album 1', artistId: 'artist123' },
        { _id: 'album2', title: 'Album 2', artistId: 'artist123' },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockAlbums);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockAlbumModel.find.mockReturnValue({ sort: mockSort });

      const result = await service.findByArtistId('artist123');

      expect(result).toEqual(mockAlbums);
      expect(mockAlbumModel.find).toHaveBeenCalledWith({ artistId: 'artist123' });
      expect(mockSort).toHaveBeenCalledWith({ releaseDate: -1 });
    });

    it('should return empty array when artist has no albums', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockAlbumModel.find.mockReturnValue({ sort: mockSort });

      const result = await service.findByArtistId('artist-no-albums');

      expect(result).toEqual([]);
    });
  });
});
