import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

import { UsersService } from '../users.service';
import { User } from '../schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;

  const createMockUserModel = () => {
    const MockModel: any = jest.fn().mockImplementation((userData) => ({
      ...userData,
      save: jest.fn().mockResolvedValue({
        _id: 'newuser123',
        ...userData,
      }),
    }));

    MockModel.findById = jest.fn();
    MockModel.findOne = jest.fn();
    MockModel.findByIdAndUpdate = jest.fn();

    return MockModel;
  };

  beforeEach(async () => {
    mockUserModel = createMockUserModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user by id without passwordHash', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
      };

      const mockExec = jest.fn().mockResolvedValue(mockUser);
      const mockSelect = jest.fn().mockReturnValue({ exec: mockExec });
      mockUserModel.findById.mockReturnValue({ select: mockSelect });

      const result = await service.findById('user123');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
      expect(mockSelect).toHaveBeenCalledWith('-passwordHash');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockSelect = jest.fn().mockReturnValue({ exec: mockExec });
      mockUserModel.findById.mockReturnValue({ select: mockSelect });

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('nonexistent')).rejects.toThrow(
        'User with ID nonexistent not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
      };

      const mockExec = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findOne.mockReturnValue({ exec: mockExec });

      const result = await service.findByEmail('TEST@EXAMPLE.COM');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return null when user does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      mockUserModel.findOne.mockReturnValue({ exec: mockExec });

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should convert email to lowercase', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      mockUserModel.findOne.mockReturnValue({ exec: mockExec });

      await service.findByEmail('Test@EXAMPLE.COM');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('findByUsername', () => {
    it('should return a user by username', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
      };

      const mockExec = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findOne.mockReturnValue({ exec: mockExec });

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    });

    it('should return null when user does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      mockUserModel.findOne.mockReturnValue({ exec: mockExec });

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'new@example.com',
        username: 'newuser',
        passwordHash: 'hashedpassword',
        displayName: 'New User',
      };

      const result = await service.create(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe('new@example.com');
      expect(mockUserModel).toHaveBeenCalledWith(userData);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Updated Name',
      };

      const mockExec = jest.fn().mockResolvedValue(mockUser);
      const mockSelect = jest.fn().mockReturnValue({ exec: mockExec });
      mockUserModel.findByIdAndUpdate.mockReturnValue({ select: mockSelect });

      const result = await service.update('user123', { displayName: 'Updated Name' });

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { displayName: 'Updated Name' },
        { new: true },
      );
      expect(mockSelect).toHaveBeenCalledWith('-passwordHash');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockSelect = jest.fn().mockReturnValue({ exec: mockExec });
      mockUserModel.findByIdAndUpdate.mockReturnValue({ select: mockSelect });

      await expect(service.update('nonexistent', { displayName: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('nonexistent', { displayName: 'Test' })).rejects.toThrow(
        'User with ID nonexistent not found',
      );
    });

    it('should update avatar URL', async () => {
      const mockUser = {
        _id: 'user123',
        avatarUrl: 'http://example.com/new-avatar.jpg',
      };

      const mockExec = jest.fn().mockResolvedValue(mockUser);
      const mockSelect = jest.fn().mockReturnValue({ exec: mockExec });
      mockUserModel.findByIdAndUpdate.mockReturnValue({ select: mockSelect });

      const result = await service.update('user123', {
        avatarUrl: 'http://example.com/new-avatar.jpg',
      });

      expect(result.avatarUrl).toBe('http://example.com/new-avatar.jpg');
    });
  });
});
