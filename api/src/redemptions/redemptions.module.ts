import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedemptionsController } from './redemptions.controller';
import { RedemptionsService } from './redemptions.service';
import { Redemption } from '../database/entities/redemption.entity';
import { ScratchCode } from '../database/entities/scratch-code.entity';
import { DgoCode } from '../database/entities/dgo-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Redemption, ScratchCode, DgoCode])],
  controllers: [RedemptionsController],
  providers: [RedemptionsService],
  exports: [RedemptionsService],
})
export class RedemptionsModule {}
