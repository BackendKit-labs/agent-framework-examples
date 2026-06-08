import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RiskProfilingService } from './risk-profiling.service';

@Controller('risk-profile')
@UseGuards(AuthGuard('jwt'))
export class RiskProfilingController {
  constructor(private readonly service: RiskProfilingService) {}

  @Get('questionnaire')
  getQuestionnaire() {
    return this.service.getQuestionnaire();
  }

  @Get('model-portfolios')
  getModelPortfolios() {
    return this.service.getModelPortfolios();
  }

  @Post('assess')
  assess(@Body() body: { answers: Record<string, string> }, @Request() req: any) {
    return this.service.assess(req.user.sub, body.answers);
  }

  @Get()
  getProfile(@Request() req: any) {
    return this.service.getUserProfile(req.user.sub);
  }

  @Patch('allocation')
  updateAllocation(@Body() body: { allocation: Record<string, number> }, @Request() req: any) {
    return this.service.updateCustomAllocation(req.user.sub, body.allocation);
  }
}
