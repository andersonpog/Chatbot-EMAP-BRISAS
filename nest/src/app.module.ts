import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Funcionario } from './auth/entities/funcionario.entity';
import { EvolutionModule } from './evolution/evolution.module';
import { AtendimentoController } from './atendimento/atendimento.controller';
import { AtendimentoModule } from './atendimento/atendimento.module';
import { Atendimento } from './atendimento/entities/atendimento.entity';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // CARREGA O .ENV PRIMEIRO
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Funcionario, Atendimento],
      synchronize: false,
    }),
    AuthModule,
    EvolutionModule,
    AtendimentoModule,
  ],
  controllers: [AtendimentoController],
})
export class AppModule {}