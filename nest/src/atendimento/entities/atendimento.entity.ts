import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('atendimentos')
export class Atendimento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  remoteJid: string; // ID do WhatsApp

  @Column()
  nome: string;

  @Column({ default: 'BOT' }) // BOT, AGUARDANDO, EM_ATENDIMENTO, FINALIZADO
  status: string;

  @Column({ nullable: true })
  atendenteId: string; // ID do funcionário (UUID) que assumiu a conversa

  @CreateDateColumn()
  dataCriacao: Date;
}