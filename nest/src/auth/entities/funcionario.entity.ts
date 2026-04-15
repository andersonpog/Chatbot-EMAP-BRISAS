import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('Funcionarios')
export class Funcionario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  senha!: string;

  @Column()
  nome!: string;

  @Column({ default: 'ATENDENTE' })
  role!: string; // ADMIN | ATENDENTE | OBSERVADOR

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'timestamp', nullable: true, default: null })
  lastSeen!: Date | null; // Atualizado via heartbeat para rastrear usuários online

  @CreateDateColumn()
  createdAt!: Date;
}
