import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mensagens')
export class Mensagem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  atendimentoId: number | null;

  @Column({ type: 'varchar' })
  remoteJid: string;

  @Column({ type: 'boolean', default: false })
  fromMe: boolean;

  @Column({ type: 'text' })
  conteudo: string;

  @Column({ type: 'varchar', default: 'text' })
  tipo: string;

  @Column({ type: 'varchar', nullable: true })
  remetente: string | null;

  @Column({ type: 'timestamp' })
  dataEnvio: Date;
}
