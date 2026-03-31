import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atendimento } from './entities/atendimento.entity';
import { AtendimentoService } from './atendimento.service';
import { AtendimentoController } from './atendimento.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Atendimento])],
  controllers: [AtendimentoController],
  providers: [AtendimentoService],
  exports: [AtendimentoService], // Exporta se o Webhook precisar usar
})
export class AtendimentoModule {}