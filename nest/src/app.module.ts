import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Funcionario } from './auth/entities/funcionario.entity';
import { EvolutionModule } from './evolution/evolution.module';
import { AtendimentoController } from './atendimento/atendimento.controller';
import { AtendimentoModule } from './atendimento/atendimento.module';
import { Atendimento } from './atendimento/entities/atendimento.entity';
import { Configuracao } from './configuracoes/entities/configuracoe.entity';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module';
import { Mensagem } from './atendimento/entities/mensagem.entity';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // CARREGA O .ENV PRIMEIRO
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Funcionario, Atendimento, Configuracao, Mensagem],
      synchronize: false,
    }),
    AuthModule,
    EvolutionModule,
    AtendimentoModule,
    ConfiguracoesModule,
  ],
  controllers: [AtendimentoController],
})
export class AppModule {}