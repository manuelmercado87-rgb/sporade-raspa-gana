import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappUser } from '../database/entities/whatsapp-user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(WhatsappUser)
    private readonly repo: Repository<WhatsappUser>,
  ) {}

  async findByPhone(phone: string): Promise<WhatsappUser | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async upsert(phone: string, name: string, cedula: string): Promise<WhatsappUser> {
    let user = await this.repo.findOne({ where: { phone } });
    if (user) {
      user.name = name;
      user.cedula = cedula;
    } else {
      user = this.repo.create({ phone, name, cedula });
    }
    return this.repo.save(user);
  }
}
