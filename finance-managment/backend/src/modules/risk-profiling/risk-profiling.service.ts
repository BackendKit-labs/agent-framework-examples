import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRiskProfile, RiskProfileLevel } from './entities/user-risk-profile.entity';

export interface Question {
  id: string;
  text: string;
  options: Array<{ id: string; label: string; score: number }>;
}

const QUESTIONNAIRE: Question[] = [
  {
    id: 'horizonte',
    text: '¿Durante cuánto tiempo planeas mantener esta inversión sin necesitar el dinero?',
    options: [
      { id: 'h1', label: 'Menos de 3 años', score: 1 },
      { id: 'h2', label: 'Entre 3 y 7 años', score: 3 },
      { id: 'h3', label: 'Más de 7 años', score: 5 },
    ],
  },
  {
    id: 'tolerancia',
    text: 'Si tu cartera cayera un 20% en un año, ¿qué harías?',
    options: [
      { id: 't1', label: 'Vendería todo para evitar más pérdidas', score: 1 },
      { id: 't2', label: 'Vendería una parte para reducir el riesgo', score: 2 },
      { id: 't3', label: 'No haría nada y esperaría la recuperación', score: 4 },
      { id: 't4', label: 'Aprovecharía para invertir más', score: 5 },
    ],
  },
  {
    id: 'objetivo',
    text: '¿Cuál es tu objetivo principal con esta inversión?',
    options: [
      { id: 'o1', label: 'Preservar el capital con mínimo riesgo', score: 1 },
      { id: 'o2', label: 'Crecimiento moderado y estable', score: 3 },
      { id: 'o3', label: 'Maximizar el crecimiento a largo plazo', score: 5 },
    ],
  },
  {
    id: 'experiencia',
    text: '¿Qué experiencia tienes invirtiendo?',
    options: [
      { id: 'e1', label: 'Ninguna, es mi primera vez', score: 1 },
      { id: 'e2', label: 'Algo de experiencia con fondos o ETFs', score: 3 },
      { id: 'e3', label: 'Experiencia amplia con distintos activos', score: 5 },
    ],
  },
  {
    id: 'liquidez',
    text: '¿Cuánto de tu patrimonio total representa esta inversión?',
    options: [
      { id: 'l1', label: 'Más del 50% — es dinero que podría necesitar', score: 1 },
      { id: 'l2', label: 'Entre 20% y 50% — tengo algo de colchón', score: 3 },
      { id: 'l3', label: 'Menos del 20% — es dinero que no necesito a corto plazo', score: 5 },
    ],
  },
];

// Score thresholds: [11, 16, 21]
// <11 → CONSERVADOR, 11-15 → MODERADO, 16-20 → DINAMICO, >=21 → AGRESIVO
const THRESHOLDS = [11, 16, 21];

// Target allocations by asset type (stock | bond | etf | crypto), sum = 100
const MODEL_PORTFOLIOS: Record<RiskProfileLevel, Record<string, number>> = {
  [RiskProfileLevel.CONSERVADOR]: { bond: 60, stock: 20, etf: 15, crypto: 5 },
  [RiskProfileLevel.MODERADO]:    { bond: 40, stock: 35, etf: 20, crypto: 5 },
  [RiskProfileLevel.DINAMICO]:    { bond: 25, stock: 45, etf: 20, crypto: 10 },
  [RiskProfileLevel.AGRESIVO]:    { bond: 5,  stock: 40, etf: 20, crypto: 35 },
};

const PROFILE_DESCRIPTIONS: Record<RiskProfileLevel, string> = {
  [RiskProfileLevel.CONSERVADOR]: 'Priorizas preservar el capital. Tu cartera se enfoca en renta fija con baja volatilidad.',
  [RiskProfileLevel.MODERADO]: 'Buscas un equilibrio entre crecimiento y estabilidad con exposición controlada a renta variable.',
  [RiskProfileLevel.DINAMICO]: 'Aceptas mayor volatilidad para obtener retornos superiores a largo plazo.',
  [RiskProfileLevel.AGRESIVO]: 'Maximizas el potencial de crecimiento con alta tolerancia al riesgo y la volatilidad.',
};

@Injectable()
export class RiskProfilingService {
  constructor(
    @InjectRepository(UserRiskProfile)
    private profileRepo: Repository<UserRiskProfile>,
  ) {}

  getQuestionnaire(): Question[] {
    return QUESTIONNAIRE;
  }

  getModelPortfolios(): Record<RiskProfileLevel, Record<string, number>> {
    return MODEL_PORTFOLIOS;
  }

  private computeScore(answers: Record<string, string>): number {
    let total = 0;
    for (const q of QUESTIONNAIRE) {
      const optionId = answers[q.id];
      if (!optionId) continue;
      const opt = q.options.find(o => o.id === optionId);
      if (opt) total += opt.score;
    }
    return total;
  }

  private scoreToProfile(score: number): RiskProfileLevel {
    if (score < THRESHOLDS[0]) return RiskProfileLevel.CONSERVADOR;
    if (score < THRESHOLDS[1]) return RiskProfileLevel.MODERADO;
    if (score < THRESHOLDS[2]) return RiskProfileLevel.DINAMICO;
    return RiskProfileLevel.AGRESIVO;
  }

  async assess(userId: string, answers: Record<string, string>): Promise<{
    score: number;
    profile: RiskProfileLevel;
    targetAllocation: Record<string, number>;
    description: string;
  }> {
    const score = this.computeScore(answers);
    const profile = this.scoreToProfile(score);
    const targetAllocation = MODEL_PORTFOLIOS[profile];

    let existing = await this.profileRepo.findOneBy({ userId });
    if (existing) {
      existing.answers = answers;
      existing.score = score;
      existing.profile = profile;
      existing.targetAllocation = targetAllocation;
      await this.profileRepo.save(existing);
    } else {
      await this.profileRepo.save(
        this.profileRepo.create({ userId, answers, score, profile, targetAllocation }),
      );
    }

    return { score, profile, targetAllocation, description: PROFILE_DESCRIPTIONS[profile] };
  }

  async getUserProfile(userId: string): Promise<(UserRiskProfile & { description: string }) | null> {
    const profile = await this.profileRepo.findOneBy({ userId });
    if (!profile) return null;
    return { ...profile, description: profile.profile ? PROFILE_DESCRIPTIONS[profile.profile] : '' };
  }

  async updateCustomAllocation(userId: string, allocation: Record<string, number>): Promise<UserRiskProfile> {
    const total = Object.values(allocation).reduce((s, v) => s + v, 0);
    if (Math.abs(total - 100) > 0.01) throw new Error('Las asignaciones deben sumar 100%');

    let profile = await this.profileRepo.findOneBy({ userId });
    if (!profile) {
      profile = this.profileRepo.create({ userId, targetAllocation: allocation });
    } else {
      profile.targetAllocation = allocation;
    }
    return this.profileRepo.save(profile);
  }
}
