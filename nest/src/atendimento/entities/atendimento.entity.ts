import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('atendimentos')
export class Atendimento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  remoteJid: string; // ID do WhatsApp

  @Column()
  nome: string;

  @Column({ default: 'AGUARDANDO' }) // AGUARDANDO, EM_ATENDIMENTO, FINALIZADO
  status: string;

  @CreateDateColumn()
  dataCriacao: Date;
}