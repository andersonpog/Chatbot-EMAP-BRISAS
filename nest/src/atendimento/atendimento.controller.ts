import { Controller, Get, Patch, Post, Param, Body, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { AtendimentoService } from './atendimento.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('atendimento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('atendimento')
export class AtendimentoController {
  constructor(private readonly atendimentoService: AtendimentoService) {}

  @Get('fila')
  @ApiOperation({ summary: 'Lista passageiros aguardando atendimento humano' })
  async getFila(@Request() req: any) {
    return this.atendimentoService.listarFilaAtiva(req.user);
  }

  @Get('atendentes')
  @ApiOperation({ summary: 'Lista atendentes ativos para encaminhamento' })
  async getAtendentes() {
    return this.atendimentoService.listarAtendentes();
  }

  @Get('atendentes/online')
  @ApiOperation({ summary: 'Lista atendentes com status online' })
  async getAtendentesOnline() {
    return this.atendimentoService.listarAtendentesOnline();
  }

  @Patch('assumir/:id')
  @ApiOperation({ summary: 'Muda status para EM_ATENDIMENTO' })
  async assumir(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user.sub || req.user.id || req.user.userId;
    return this.atendimentoService.assumirAtendimento(id, userId);
  }

  @Patch('encaminhar/:id')
  @ApiOperation({ summary: 'Admin/Observador encaminha ticket para atendente específico' })
  async encaminharPorId(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { atendenteId: string },
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id || req.user.userId;
    return this.atendimentoService.encaminharAtendimento(id, body.atendenteId, userId);
  }

  @Post('encaminhar')
  @ApiOperation({ summary: 'Encaminha atendimento para um atendente específico (corpo JSON)' })
  async encaminharPost(
    @Body() dados: { atendimentoId: number; atendenteId: string },
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id || req.user.userId;
    return this.atendimentoService.encaminharAtendimento(dados.atendimentoId, dados.atendenteId, userId);
  }

  @Patch('finalizar/:id')
  @ApiOperation({ summary: 'Finaliza o ticket e libera o robô para este usuário' })
  async finalizar(@Param('id', ParseIntPipe) id: number) {
    return this.atendimentoService.finalizarAtendimento(id);
  }
}
