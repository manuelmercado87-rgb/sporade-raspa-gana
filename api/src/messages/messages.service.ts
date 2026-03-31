import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../database/entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly repo: Repository<Message>,
  ) {}

  async log(phone: string, direction: 'in' | 'out', text: string): Promise<void> {
    await this.repo.save(this.repo.create({ phone, direction, text }));
  }

  async getConversations(page = 1, limit = 50) {
    // Un registro por usuario con su último mensaje y total de mensajes
    const result = await this.repo
      .createQueryBuilder('m')
      .select('m.phone', 'phone')
      .addSelect('MAX(m.timestamp)', 'lastMessage')
      .addSelect('COUNT(m.id)', 'total')
      .groupBy('m.phone')
      .orderBy('MAX(m.timestamp)', 'DESC')
      .limit(limit)
      .offset((page - 1) * limit)
      .getRawMany();

    const count = await this.repo
      .createQueryBuilder('m')
      .select('COUNT(DISTINCT m.phone)', 'count')
      .getRawOne();

    return { items: result, total: parseInt(count.count), page, limit };
  }

  async getThread(phone: string) {
    return this.repo.find({
      where: { phone },
      order: { timestamp: 'ASC' },
    });
  }
}
