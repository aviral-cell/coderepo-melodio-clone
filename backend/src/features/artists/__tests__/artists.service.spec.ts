import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

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

  // TODO: Add tests for findAll, findById, search
});
