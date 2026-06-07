import { Controller, Get, Param, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    if (search) {
      return this.assetsService.searchSymbols(search);
    }
    return this.assetsService.findAll();
  }

  @Get('validate/:symbol')
  async validateSymbol(@Param('symbol') symbol: string) {
    return this.assetsService.validateSymbol(symbol);
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.assetsService.searchSymbols(query);
  }

  @Get(':symbol')
  async findBySymbol(@Param('symbol') symbol: string) {
    return this.assetsService.validateSymbol(symbol);
  }
}
