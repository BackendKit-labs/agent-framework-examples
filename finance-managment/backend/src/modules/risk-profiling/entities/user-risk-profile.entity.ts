import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum RiskProfileLevel {
  CONSERVADOR = 'CONSERVADOR',
  MODERADO = 'MODERADO',
  DINAMICO = 'DINAMICO',
  AGRESIVO = 'AGRESIVO',
}

@Entity('user_risk_profiles')
export class UserRiskProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  answers: Record<string, string>;

  @Column({ nullable: true })
  score: number;

  @Column({ type: 'enum', enum: RiskProfileLevel, nullable: true })
  profile: RiskProfileLevel;

  @Column({ type: 'jsonb', nullable: true })
  targetAllocation: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
