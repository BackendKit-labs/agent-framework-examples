import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async findAll() {
    return this.alertsService.findAll();
  }

  @Post()
  async create(@Body() dto: {
    name: string;
    type: string;
    assetId?: string;
    portfolioId?: string;
    conditions: Record<string, any>;
    actions?: Record<string, any>;
  }) {
    return this.alertsService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<{ name: string; isActive: boolean; conditions: Record<string, any> }>) {
    return this.alertsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.alertsService.remove(id);
  }
}
