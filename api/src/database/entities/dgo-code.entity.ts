import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn
} from 'typeorm';

@Entity('dgo_codes')
export class DgoCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // código DGo pre-cargado (CSV del cliente)

  @Column({ default: false })
  delivered: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
