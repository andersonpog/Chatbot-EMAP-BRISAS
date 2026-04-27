import { Controller, Get, Patch, Param, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { AtendimentoService } from './atendimento.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('atendimento') // Organiza no Swagger
@ApiBearerAuth() // Ativa o cadeado do Token no Swagger
@UseGuards(JwtAuthGuard)
@Controller('atendimento')
export class AtendimentoController {
  constructor(private readonly atendimentoService: AtendimentoService) {}

  @Get('fila')
  @ApiOperation({ summary: 'Lista passageiros aguardando atendimento humano' })
  async getFila(@Request() req: any) {
    return this.atendimentoService.listarFilaAtiva(req.user);
  }

  @Patch('assumir/:id')
  @ApiOperation({ summary: 'Muda status para EM_ATENDIMENTO' })
  async assumir(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user.sub || req.user.id || req.user.userId;
    return this.atendimentoService.assumirAtendimento(id, userId); // Envia o ID correto do funcionário
  }

  @Patch('finalizar/:id')
  @ApiOperation({ summary: 'Finaliza o ticket e libera o robô para este usuário' })
  async finalizar(@Param('id', ParseIntPipe) id: number) {
    return this.atendimentoService.finalizarAtendimento(id);
  }
}