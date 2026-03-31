import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Redemption } from '../database/entities/redemption.entity';
import { ScratchCode } from '../database/entities/scratch-code.entity';
import { DgoCode } from '../database/entities/dgo-code.entity';
import { RedeemDto, ValidateCodeDto } from './dto/redeem.dto';

@Injectable()
export class RedemptionsService {
  constructor(
    @InjectRepository(Redemption)
    private readonly redemptionRepo: Repository<Redemption>,
    @InjectRepository(ScratchCode)
    private readonly scratchCodeRepo: Repository<ScratchCode>,
    @InjectRepository(DgoCode)
    private readonly dgoCodeRepo: Repository<DgoCode>,
    private readonly dataSource: DataSource,
  ) {}

  async validateCode(dto: ValidateCodeDto): Promise<{ valid: boolean; reason?: string }> {
    const code = await this.scratchCodeRepo.findOne({
      where: { code: dto.code.toUpperCase() },
    });

    if (!code) return { valid: false, reason: 'not_found' };
    if (code.used) return { valid: false, reason: 'already_used' };

    return { valid: true };
  }

  async redeem(dto: RedeemDto): Promise<{ dgoCode: string }> {
    // Transacción atómica: marcar código raspadito + asignar código DGo + crear redención
    return this.dataSource.transaction(async (manager) => {
      // 1. Verificar y bloquear código raspadito
      const scratch = await manager.findOne(ScratchCode, {
        where: { code: dto.scratchCode.toUpperCase() },
        lock: { mode: 'pessimistic_write' },
      });

      if (!scratch) throw new NotFoundException('Código raspadito no encontrado');
      if (scratch.used) throw new BadRequestException('El código ya fue utilizado');

      // 2. Obtener un código DGo disponible
      const dgo = await manager
        .createQueryBuilder(DgoCode, 'dgo')
        .where('dgo.delivered = false')
        .setLock('pessimistic_write')
        .getOne();

      if (!dgo) throw new BadRequestException('No hay códigos DGo disponibles. Contacta al administrador.');

      // 3. Marcar ambos códigos como usados
      scratch.used = true;
      dgo.delivered = true;
      await manager.save(scratch);
      await manager.save(dgo);

      // 4. Registrar la redención
      const redemption = manager.create(Redemption, {
        phone: dto.phone,
        name: dto.name,
        cedula: dto.cedula,
        scratchCode: scratch.code,
        dgoCode: dgo.code,
        status: 'completed',
      });
      await manager.save(redemption);

      return { dgoCode: dgo.code };
    });
  }

  async findAll(page = 1, limit = 50) {
    const [items, total] = await this.redemptionRepo.findAndCount({
      order: { redeemedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async getStats() {
    const totalRedemptions = await this.redemptionRepo.count();
    const totalScratch = await this.scratchCodeRepo.count();
    const usedScratch = await this.scratchCodeRepo.count({ where: { used: true } });
    const totalDgo = await this.dgoCodeRepo.count();
    const deliveredDgo = await this.dgoCodeRepo.count({ where: { delivered: true } });

    return {
      redemptions: totalRedemptions,
      scratchCodes: { total: totalScratch, used: usedScratch, available: totalScratch - usedScratch },
      dgoCodes: { total: totalDgo, delivered: deliveredDgo, available: totalDgo - deliveredDgo },
    };
  }
}
