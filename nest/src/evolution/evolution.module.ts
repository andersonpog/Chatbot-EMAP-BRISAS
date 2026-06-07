import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { EvolutionService } from './evolution.service';
import { EvolutionController } from './evolution.controller';
import { EvolutionGateway } from './evolution.gateway';
import { InatividadeService } from './inatividade.service';
import { Atendimento } from '../atendimento/entities/atendimento.entity';
import { Mensagem } from '../atendimento/entities/mensagem.entity';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Atendimento, Mensagem]),
    HttpModule,
    ScheduleModule.forRoot(),
    ConfiguracoesModule,
  ],
  providers: [EvolutionService, EvolutionGateway, InatividadeService],
  controllers: [EvolutionController],
  exports: [EvolutionService, EvolutionGateway],
})
export class EvolutionModule {}
