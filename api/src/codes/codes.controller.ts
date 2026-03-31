import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { CodesService } from './codes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsArray, IsString } from 'class-validator';

class BulkLoadDto {
  @IsArray()
  @IsString({ each: true })
  codes: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('codes')
export class CodesController {
  constructor(private readonly service: CodesService) {}

  @Post('scratch/bulk')
  loadScratch(@Body() dto: BulkLoadDto) {
    return this.service.bulkLoadScratch(dto.codes);
  }

  @Post('dgo/bulk')
  loadDgo(@Body() dto: BulkLoadDto) {
    return this.service.bulkLoadDgo(dto.codes);
  }

  @Get('scratch/stock')
  scratchStock() {
    return this.service.getScratchStock();
  }

  @Get('dgo/stock')
  dgoStock() {
    return this.service.getDgoStock();
  }
}
