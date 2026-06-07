import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async findAll() {
    return this.walletService.findAll();
  }

  @Post()
  async create(@Body() dto: { name: string; description?: string }) {
    return this.walletService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.walletService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: { name?: string; description?: string }) {
    return this.walletService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.walletService.remove(id);
  }
}
