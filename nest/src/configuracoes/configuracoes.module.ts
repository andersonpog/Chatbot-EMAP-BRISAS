import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracoesService } from './configuracoes.service';
import { ConfiguracoesController } from './configuracoes.controller';
import { Configuracao } from './entities/configuracoe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Configuracao])], // Conecta a tabela
  controllers: [ConfiguracoesController],
  providers: [ConfiguracoesService],
  exports: [ConfiguracoesService], // Exporta para o Webhook usar
})
export class ConfiguracoesModule {}
