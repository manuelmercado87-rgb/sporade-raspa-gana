import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { WhatsappUser } from '../database/entities/whatsapp-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsappUser])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
