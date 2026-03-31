import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodesController } from './codes.controller';
import { CodesService } from './codes.service';
import { ScratchCode } from '../database/entities/scratch-code.entity';
import { DgoCode } from '../database/entities/dgo-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScratchCode, DgoCode])],
  controllers: [CodesController],
  providers: [CodesService],
})
export class CodesModule {}
