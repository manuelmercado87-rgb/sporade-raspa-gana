import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  phone: string;

  @Column({ type: 'varchar' })
  direction: 'in' | 'out';

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn()
  timestamp: Date;
}
