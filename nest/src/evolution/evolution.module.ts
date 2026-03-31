import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EvolutionService } from './evolution.service';
import { EvolutionController } from './evolution.controller';
import { Atendimento } from '../atendimento/entities/atendimento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Atendimento]), HttpModule],
  providers: [EvolutionService],
  controllers: [EvolutionController],
  exports: [EvolutionService], // Exporta se quiser usar em outros módulos
})
export class EvolutionModule {}