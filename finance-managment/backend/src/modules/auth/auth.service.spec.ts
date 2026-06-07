import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Partial<Record<keyof Repository<User>, jest.Mock>>;
  let refreshTokenRepo: Partial<Record<keyof Repository<RefreshToken>, jest.Mock>>;

  const mockUser = {
    id: 'test-id',
    email: 'test@test.com',
    name: 'Test User',
    passwordHash: '',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userRepo = {
      findOneBy: jest.fn(),
      create: jest.fn().mockReturnValue(mockUser),
      save: jest.fn().mockResolvedValue(mockUser),
    };

    refreshTokenRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokenRepo },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-access-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      // bcrypt.hash se llama realmente (no mockeamos) porque el test es de integración ligera
      // El hash real es lento pero correcto

      const result = await service.register({ email: 'new@test.com', password: 'Test1234', name: 'New User' });

      expect(result.user.email).toBe('test@test.com');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser as User);

      await expect(
        service.register({ email: 'test@test.com', password: 'Test1234', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('Test1234', 12);
      userRepo.findOneBy.mockResolvedValue({ ...mockUser, passwordHash } as User);

      const result = await service.login({ email: 'test@test.com', password: 'Test1234' });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const passwordHash = await bcrypt.hash('Test1234', 12);
      userRepo.findOneBy.mockResolvedValue({ ...mockUser, passwordHash } as User);

      await expect(
        service.login({ email: 'test@test.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@test.com', password: 'Test1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate refresh token successfully', async () => {
      const mockStoredToken = {
        token: 'old-refresh-token',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      };
      refreshTokenRepo.findOne.mockResolvedValue(mockStoredToken);

      const result = await service.refresh('old-refresh-token');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException if token is revoked', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null); // findOne busca isRevoked: false

      await expect(service.refresh('revoked-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      refreshTokenRepo.findOne.mockResolvedValue({
        token: 'expired-token',
        isRevoked: false,
        expiresAt: new Date(Date.now() - 86400000),
        user: mockUser,
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke refresh token on logout', async () => {
      const mockToken = { token: 'valid-token', isRevoked: false };
      refreshTokenRepo.findOneBy.mockResolvedValue(mockToken);

      await service.logout('valid-token');
      expect(mockToken.isRevoked).toBe(true);
    });
  });
});
