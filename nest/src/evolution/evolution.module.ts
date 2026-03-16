import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EvolutionService } from './evolution.service';
import { EvolutionController } from './evolution.controller';

@Module({
  imports: [HttpModule],
  providers: [EvolutionService],
  controllers: [EvolutionController],
  exports: [EvolutionService], // Exporta se quiser usar em outros módulos
})
export class EvolutionModule {}