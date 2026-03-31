import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('whatsapp_users')
export class WhatsappUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  cedula: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
