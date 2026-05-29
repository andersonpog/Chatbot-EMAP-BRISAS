import { Controller, Get, Post, Body } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import { Configuracao } from './entities/configuracoe.entity';

@Controller('configuracoes')
export class ConfiguracoesController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get()
  getConfig() {
    return this.configuracoesService.getConfig();
  }

  @Post()
  updateConfig(@Body() body: Partial<Configuracao>) {
    return this.configuracoesService.updateConfig(body);
  }
}
