import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('configuracoes')
export class Configuracao {
  @PrimaryGeneratedColumn()
  id!: number;

  // Usamos JSONB para conseguir salvar um array de objetos (os dias e as horas independentes)
  @Column({ type: 'jsonb', nullable: true })
  horarios!: any;

  @Column({ default: 'Nosso atendimento humano funciona de segunda a sexta, das 08h às 18h. Deixe sua dúvida e retornaremos em breve!' })
  mensagemForaHorario!: string;
}


