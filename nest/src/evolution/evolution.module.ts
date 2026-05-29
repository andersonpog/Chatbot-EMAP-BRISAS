import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EvolutionService } from './evolution.service';
import { EvolutionController } from './evolution.controller';
import { Atendimento } from '../atendimento/entities/atendimento.entity';
import { EvolutionGateway } from './evolution.gateway';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Atendimento]), HttpModule, ConfiguracoesModule],
  providers: [EvolutionService, EvolutionGateway],
  controllers: [EvolutionController],
  exports: [EvolutionService, EvolutionGateway], // Exporta se quiser usar em outros módulos
})
export class EvolutionModule {}