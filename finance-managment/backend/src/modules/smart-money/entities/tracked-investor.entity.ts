import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum FundType {
  HEDGE_FUND = 'hedge_fund',
  MUTUAL_FUND = 'mutual_fund',
  FAMILY_OFFICE = 'family_office',
  PENSION_FUND = 'pension_fund',
  ASSET_MANAGER = 'asset_manager',
  HOLDING_COMPANY = 'holding_company',
}

@Entity('tracked_investors')
export class TrackedInvestor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'enum', enum: FundType })
  fundType: FundType;

  @Column({ nullable: true })
  cik: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  knownStrategy: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  historicalAccuracy: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
