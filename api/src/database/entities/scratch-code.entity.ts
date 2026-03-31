import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne
} from 'typeorm';

@Entity('scratch_codes')
export class ScratchCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // código del raspadito (ej: SPRD-XXXX)

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
