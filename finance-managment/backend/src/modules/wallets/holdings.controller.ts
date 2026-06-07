import { Controller, Delete, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holding } from './entities/holding.entity';

@Controller('holdings')
export class HoldingsController {
  constructor(
    @InjectRepository(Holding) private holdingRepo: Repository<Holding>,
  ) {}

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const holding = await this.holdingRepo.findOneBy({ id });
    if (!holding) throw new NotFoundException('Holding not found');
    await this.holdingRepo.remove(holding);
    return { status: 'deleted' };
  }
}
