import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

class UpsertUserDto {
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @Matches(/^\d{6,12}$/) cedula: string;
}

// Sin autenticación — llamado internamente por el bot
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get(':phone')
  findByPhone(@Param('phone') phone: string) {
    return this.service.findByPhone(phone);
  }

  @Post()
  upsert(@Body() dto: UpsertUserDto) {
    return this.service.upsert(dto.phone, dto.name, dto.cedula);
  }
}
