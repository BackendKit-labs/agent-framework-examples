import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';

@Entity('portfolio_snapshots')
export class PortfolioSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Portfolio, portfolio => portfolio.snapshots)
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;

  @Column()
  portfolioId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  dailyReturn: number;

  @Column({ type: 'jsonb' })
  holdingsSnapshot: Record<string, { symbol: string; name: string; quantity: number; price: number; value: number; allocation: number }>;

  @Column({ type: 'timestamp' })
  snapshotDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
