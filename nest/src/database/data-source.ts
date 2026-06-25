import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { Funcionario } from '../auth/entities/funcionario.entity';
import { Atendimento } from '../atendimento/entities/atendimento.entity';
import { Mensagem } from '../atendimento/entities/mensagem.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Funcionario, Atendimento, Mensagem],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
