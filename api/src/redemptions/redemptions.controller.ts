import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';
import { RedeemDto, ValidateCodeDto } from './dto/redeem.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('redemptions')
export class RedemptionsController {
  constructor(private readonly service: RedemptionsService) {}

  // Llamado por el bot — sin autenticación
  @Post('validate-code')
  validateCode(@Body() dto: ValidateCodeDto) {
    return this.service.validateCode(dto);
  }

  // Llamado por el bot — sin autenticación
  @Post('redeem')
  redeem(@Body() dto: RedeemDto) {
    return this.service.redeem(dto);
  }

  // Dashboard — requiere JWT
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.service.findAll(+page, +limit);
  }

  // Dashboard — requiere JWT
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  getStats() {
    return this.service.getStats();
  }
}
