import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Atendimento } from '../atendimento/entities/atendimento.entity';
import { EvolutionService } from './evolution.service';
import { EvolutionGateway } from './evolution.gateway';
import { BotMessages } from '../../messages';

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

@Injectable()
export class InatividadeService {
  private readonly logger = new Logger(InatividadeService.name);

  constructor(
    @InjectRepository(Atendimento)
    private readonly atendimentoRepo: Repository<Atendimento>,
    private readonly evolutionService: EvolutionService,
    private readonly evolutionGateway: EvolutionGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async verificarInatividade() {
    const INSTANCE = process.env.EVOLUTION_INSTANCE || 'botevolution';
    const limite = new Date(Date.now() - TIMEOUT_MS);

    const inativos = await this.atendimentoRepo.find({
      where: [
        { status: 'BOT',           ultimaMensagemEm: LessThan(limite) },
        { status: 'AGUARDANDO',    ultimaMensagemEm: LessThan(limite) },
        { status: 'EM_ATENDIMENTO', ultimaMensagemEm: LessThan(limite) },
      ],
    });

    for (const ticket of inativos) {
      try {
        await this.evolutionService.enviarMensagem(
          INSTANCE,
          ticket.remoteJid,
          BotMessages.INATIVIDADE,
        );
        await this.atendimentoRepo.update(ticket.id, { status: 'FINALIZADO' });
        this.evolutionGateway.emitirNovaMensagem();
        this.logger.log(`Ticket #${ticket.id} (${ticket.nome}) finalizado por inatividade.`);
      } catch (err) {
        this.logger.error(`Erro ao finalizar ticket #${ticket.id} por inatividade: ${err.message}`);
      }
    }
  }
}
