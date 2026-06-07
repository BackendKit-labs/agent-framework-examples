import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Wallet } from './wallet.entity';
import { Holding } from './holding.entity';
import { PortfolioSnapshot } from './portfolio-snapshot.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  strategy: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'jsonb', nullable: true })
  targetAllocations: Record<string, number>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.05 })
  rebalanceTolerance: number;

  @ManyToOne(() => Wallet, wallet => wallet.portfolios)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column()
  walletId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Holding, holding => holding.portfolio)
  holdings: Holding[];

  @OneToMany(() => PortfolioSnapshot, snapshot => snapshot.portfolio)
  snapshots: PortfolioSnapshot[];
}
