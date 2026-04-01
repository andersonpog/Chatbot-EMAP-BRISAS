import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('Funcionarios') // Nome exato da tabela no Postgres
export class Funcionario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  senha: string;

  @Column()
  nome: string;

  @Column({ default: 'ATENDENTE' })
  role: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}