import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Funcionario } from './auth/entities/funcionario.entity';

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
  ],
})
export class AppModule {}