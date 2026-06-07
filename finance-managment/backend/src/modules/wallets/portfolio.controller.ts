import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('wallets/:walletId/portfolios')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  async create(@Param('walletId') walletId: string, @Body() dto: { name: string; strategy?: string }) {
    return this.portfolioService.create(walletId, dto);
  }

  @Get()
  async findAll(@Param('walletId') walletId: string) {
    return this.portfolioService.findAll(walletId);
  }

  @Get(':id')
  async findOne(@Param('walletId') walletId: string, @Param('id') id: string) {
    return this.portfolioService.findOne(walletId, id);
  }

  @Patch(':id')
  async update(@Param('walletId') walletId: string, @Param('id') id: string, @Body() dto: { name?: string; strategy?: string }) {
    return this.portfolioService.update(walletId, id, dto);
  }

  @Delete(':id')
  async remove(@Param('walletId') walletId: string, @Param('id') id: string) {
    return this.portfolioService.remove(walletId, id);
  }
}
