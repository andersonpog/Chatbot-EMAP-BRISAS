import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atendimento } from './entities/atendimento.entity';
import { Funcionario } from '../auth/entities/funcionario.entity';
import { AtendimentoService } from './atendimento.service';
import { AtendimentoController } from './atendimento.controller';
import { EvolutionModule } from '../evolution/evolution.module';

@Module({
  imports: [TypeOrmModule.forFeature([Atendimento, Funcionario]), EvolutionModule],
  controllers: [AtendimentoController],
  providers: [AtendimentoService],
  exports: [AtendimentoService],
})
export class AtendimentoModule {}
