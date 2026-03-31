import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index
} from 'typeorm';

export type RedemptionStatus = 'completed' | 'failed';

@Entity('redemptions')
export class Redemption {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  phone: string;

  @Column()
  name: string;

  @Column()
  cedula: string;

  @Column()
  scratchCode: string;

  @Column({ nullable: true })
  dgoCode: string;

  @Column({ type: 'varchar', default: 'completed' })
  status: RedemptionStatus;

  @CreateDateColumn()
  redeemedAt: Date;
}
