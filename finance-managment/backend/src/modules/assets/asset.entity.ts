import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AssetType {
  STOCK = 'stock',
  CRYPTO = 'crypto',
  ETF = 'etf',
  BOND = 'bond',
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AssetType })
  type: AssetType;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  currentPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  dailyChange: number;

  @Column({ type: 'timestamp', nullable: true })
  lastPriceUpdate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
