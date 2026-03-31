import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Funcionario } from './auth/entities/funcionario.entity';
import { EvolutionModule } from './evolution/evolution.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // CARREGA O .ENV PRIMEIRO
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Funcionario],
      synchronize: false,
    }),
    AuthModule,
    EvolutionModule,
  ],
})
export class AppModule {}