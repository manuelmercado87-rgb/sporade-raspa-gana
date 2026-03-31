import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScratchCode } from '../database/entities/scratch-code.entity';
import { DgoCode } from '../database/entities/dgo-code.entity';

@Injectable()
export class CodesService {
  constructor(
    @InjectRepository(ScratchCode)
    private readonly scratchRepo: Repository<ScratchCode>,
    @InjectRepository(DgoCode)
    private readonly dgoRepo: Repository<DgoCode>,
  ) {}

  async bulkLoadScratch(codes: string[]): Promise<{ loaded: number; duplicates: number }> {
    const normalized = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))];
    let loaded = 0;
    let duplicates = 0;

    for (const code of normalized) {
      const exists = await this.scratchRepo.findOne({ where: { code } });
      if (exists) {
        duplicates++;
        continue;
      }
      await this.scratchRepo.save(this.scratchRepo.create({ code }));
      loaded++;
    }

    return { loaded, duplicates };
  }

  async bulkLoadDgo(codes: string[]): Promise<{ loaded: number; duplicates: number }> {
    const normalized = [...new Set(codes.map((c) => c.trim()).filter(Boolean))];
    let loaded = 0;
    let duplicates = 0;

    for (const code of normalized) {
      const exists = await this.dgoRepo.findOne({ where: { code } });
      if (exists) {
        duplicates++;
        continue;
      }
      await this.dgoRepo.save(this.dgoRepo.create({ code }));
      loaded++;
    }

    return { loaded, duplicates };
  }

  async getScratchStock() {
    const total = await this.scratchRepo.count();
    const used = await this.scratchRepo.count({ where: { used: true } });
    return { total, used, available: total - used };
  }

  async getDgoStock() {
    const total = await this.dgoRepo.count();
    const delivered = await this.dgoRepo.count({ where: { delivered: true } });
    return { total, delivered, available: total - delivered };
  }
}
