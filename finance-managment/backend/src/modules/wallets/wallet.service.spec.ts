import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WalletService } from './wallet.service';
import { Wallet } from './entities/wallet.entity';

describe('WalletService', () => {
  let service: WalletService;
  let repo: jest.Mocked<Partial<Repository<Wallet>>>;

  const mockWallet: any = {
    id: 'wallet-id',
    name: 'Test Wallet',
    description: null,
    totalValue: '0.00',
    totalReturn: '0.00',
    userId: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    portfolios: [],
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([mockWallet]),
      findOne: jest.fn().mockResolvedValue(mockWallet),
      create: jest.fn().mockReturnValue(mockWallet),
      save: jest.fn().mockResolvedValue(mockWallet),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(Wallet), useValue: repo },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('findAll should return all wallets', async () => {
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('findOne should return a wallet by id', async () => {
    const result = await service.findOne('wallet-id');
    expect(result.id).toBe('wallet-id');
  });

  it('findOne should throw NotFoundException if not found', async () => {
    repo.findOne!.mockResolvedValue(null);
    await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('create should create a wallet', async () => {
    const result = await service.create({ name: 'New Wallet' });
    expect(result).toBeDefined();
  });

  it('update should update a wallet', async () => {
    repo.findOne!.mockResolvedValue(mockWallet);
    const result = await service.update('wallet-id', { name: 'Updated' });
    expect(result).toBeDefined();
  });

  it('remove should remove a wallet', async () => {
    repo.findOne!.mockResolvedValue(mockWallet);
    await expect(service.remove('wallet-id')).resolves.toBeUndefined();
  });
});
