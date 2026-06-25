import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { messageContentTransformer } from '../../common/crypto/message-content.transformer';

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

  @Column({ type: 'text', transformer: messageContentTransformer })
  conteudo: string;

  @Column({ type: 'varchar', default: 'text' })
  tipo: string;

  @Column({ type: 'varchar', nullable: true })
  remetente: string | null;

  @Column({ type: 'timestamptz' })
  dataEnvio: Date;
}
