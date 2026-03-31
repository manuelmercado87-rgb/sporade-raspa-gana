import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { IsString, IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class LogMessageDto {
  @IsString() phone: string;
  @IsIn(['in', 'out']) direction: 'in' | 'out';
  @IsString() text: string;
}

@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  // Llamado internamente por el bot — sin auth
  @Post('log')
  log(@Body() dto: LogMessageDto) {
    return this.service.log(dto.phone, dto.direction, dto.text);
  }

  // Dashboard
  @UseGuards(JwtAuthGuard)
  @Get()
  getConversations(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.service.getConversations(+page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':phone')
  getThread(@Param('phone') phone: string) {
    return this.service.getThread(phone);
  }
}
