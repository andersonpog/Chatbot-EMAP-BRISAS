import { Controller, Get, Patch, Param, UseGuards, ParseIntPipe, Request, Post, Body } from '@nestjs/common';
import { AtendimentoService } from './atendimento.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvolutionGateway } from '../evolution/evolution.gateway';

@ApiTags('atendimento') // Organiza no Swagger
@ApiBearerAuth() // Ativa o cadeado do Token no Swagger
@UseGuards(JwtAuthGuard)
@Controller('atendimento')
export class AtendimentoController {
  constructor(
    private readonly atendimentoService: AtendimentoService,
    private readonly evolutionGateway: EvolutionGateway
  ) {}

  @Get('fila')
  @ApiOperation({ summary: 'Lista passageiros aguardando atendimento humano' })
  async getFila(@Request() req: any) {
    return this.atendimentoService.listarFilaAtiva(req.user);
  }

  @Patch('assumir/:id')
  @ApiOperation({ summary: 'Muda status para EM_ATENDIMENTO' })
  async assumir(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user.sub || req.user.id || req.user.userId;
    const resultado = await this.atendimentoService.assumirAtendimento(id, userId); // Envia o ID correto do funcionário
    this.evolutionGateway.emitirNovaMensagem();
    return resultado;
  }

  @Patch('finalizar/:id')
  @ApiOperation({ summary: 'Finaliza o ticket e libera o robô para este usuário' })
  async finalizar(@Param('id', ParseIntPipe) id: number) {
    const resultado = await this.atendimentoService.finalizarAtendimento(id);
    this.evolutionGateway.emitirNovaMensagem();
    return resultado;
  }

  @Get('atendentes/online')
@ApiOperation({ summary: 'Lista atendentes disponíveis para assumir atendimento' })
async listarAtendentesOnline() {
  return this.atendimentoService.listarAtendentesOnline();
}


 @Post('encaminhar')
@ApiOperation({ summary: 'Encaminha atendimento para um atendente específico' })
async encaminhar(
  @Body() dados: { atendimentoId: number; atendenteId: string },
  @Request() req: any,
) {
  const userId = req.user.sub || req.user.id || req.user.userId;
    const resultado = await this.atendimentoService.encaminharAtendimento(dados.atendimentoId, dados.atendenteId, userId);
    this.evolutionGateway.emitirNovaMensagem();
    return resultado;
}

}
