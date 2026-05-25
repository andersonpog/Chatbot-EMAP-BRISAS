import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module'; // <--- ADICIONE ESTA LINHA
import { EvolutionModule } from '../evolution/evolution.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atendimento } from '../atendimento/entities/atendimento.entity';

@Module({
  imports: [ConfiguracoesModule, EvolutionModule, TypeOrmModule.forFeature([Atendimento])],
  controllers: [WebhookController],
})
export class WebhookModule {}
