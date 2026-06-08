import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RebalancingService } from './rebalancing.service';

@Controller('wallets/:walletId/portfolios/:portfolioId/rebalancing')
@UseGuards(AuthGuard('jwt'))
export class RebalancingController {
  constructor(private readonly service: RebalancingService) {}

  @Get()
  analyze(@Param('walletId') walletId: string, @Param('portfolioId') portfolioId: string) {
    return this.service.analyzePortfolio(walletId, portfolioId);
  }

  @Post('target')
  setTarget(
    @Param('walletId') walletId: string,
    @Param('portfolioId') portfolioId: string,
    @Body() body: { allocations: Record<string, number>; tolerance?: number },
  ) {
    return this.service.setTargetAllocation(walletId, portfolioId, body.allocations, body.tolerance);
  }
}
