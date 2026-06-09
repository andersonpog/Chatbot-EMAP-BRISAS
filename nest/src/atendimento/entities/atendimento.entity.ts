import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('atendimentos')
export class Atendimento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  remoteJid!: string;

  @Column()
  nome!: string;

  @Column({ default: 'BOT' })
  status!: string;

  @Column({ nullable: true })
  atendenteId!: string;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  ultimaMensagemEm: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  dataCriacao!: Date;
}
