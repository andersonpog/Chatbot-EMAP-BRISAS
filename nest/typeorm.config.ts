import { DataSource } from 'typeorm';
import { Funcionario } from './src/auth/entities/funcionario.entity';
import * as dotenv from 'dotenv';

// Carrega as variáveis do .env (DATABASE_URL)
dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Funcionario],
  migrations: ['./src/database/migrations/*.ts'], // Onde as migrações serão salvas
  synchronize: false, // Deixe false para usar migrações com segurança
});