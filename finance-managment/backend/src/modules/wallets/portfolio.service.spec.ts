import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PortfolioService } from './portfolio.service';
import { Portfolio } from './entities/portfolio.entity';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let repo: jest.Mocked<Partial<Repository<Portfolio>>>;

  const mockPortfolio: any = {
    id: 'portfolio-id',
    name: 'Growth',
    strategy: 'growth',
    totalValue: '0.00',
    targetAllocations: null,
    rebalanceTolerance: '0.05',
    walletId: 'wallet-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    holdings: [],
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([mockPortfolio]),
      findOne: jest.fn().mockResolvedValue(mockPortfolio),
      create: jest.fn().mockReturnValue(mockPortfolio),
      save: jest.fn().mockResolvedValue(mockPortfolio),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: getRepositoryToken(Portfolio), useValue: repo },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  it('create should create a portfolio', async () => {
    const result = await service.create('wallet-id', { name: 'Growth', strategy: 'growth' });
    expect(result.name).toBe('Growth');
    expect(repo.create).toHaveBeenCalledWith({ name: 'Growth', strategy: 'growth', walletId: 'wallet-id' });
  });

  it('findAll should return all portfolios for a wallet', async () => {
    const result = await service.findAll('wallet-id');
    expect(result).toHaveLength(1);
    expect(repo.find).toHaveBeenCalledWith({
      where: { walletId: 'wallet-id' },
      relations: ['holdings', 'holdings.asset'],
    });
  });

  it('findOne should return a portfolio by id', async () => {
    const result = await service.findOne('wallet-id', 'portfolio-id');
    expect(result.id).toBe('portfolio-id');
  });

  it('findOne should throw NotFoundException if not found', async () => {
    repo.findOne!.mockResolvedValue(null);
    await expect(service.findOne('wallet-id', 'nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('update should update a portfolio', async () => {
    repo.findOne!.mockResolvedValue(mockPortfolio);
    const result = await service.update('wallet-id', 'portfolio-id', { name: 'Updated' });
    expect(result).toBeDefined();
  });

  it('remove should remove a portfolio', async () => {
    repo.findOne!.mockResolvedValue(mockPortfolio);
    await expect(service.remove('wallet-id', 'portfolio-id')).resolves.toBeUndefined();
  });
});
