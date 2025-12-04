import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

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

  // TODO: Add tests for findAll, findById, search
});
