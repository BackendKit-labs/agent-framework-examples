import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum SignalType {
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH',
  NEUTRAL = 'NEUTRAL',
}

export enum SignalSource {
  FORM_4 = 'FORM_4',
  WHALE = 'WHALE',
  ETF_FLOW = 'ETF_FLOW',
}

@Entity('smart_money_signals')
export class SmartMoneySignal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  symbol: string;

  @Column({ type: 'enum', enum: SignalType })
  signalType: SignalType;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  conviction: number;

  @Column({ type: 'enum', enum: SignalSource })
  source: SignalSource;

  @Column({ type: 'jsonb' })
  backingInvestors: Array<{
    name: string;
    fundType: string;
    positionChange: number;
    currentValue: number;
    conviction: number;
  }>;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  netFlow: number;

  @Column({ type: 'int', default: 0 })
  investorCount: number;

  @Column({ type: 'jsonb', nullable: true })
  coInvestmentCluster: any;

  @Column()
  filingPeriod: string;

  @Column({ type: 'timestamp' })
  detectedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
