import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Atendimento } from './entities/atendimento.entity';

@Injectable()
export class AtendimentoService {
  constructor(
    @InjectRepository(Atendimento)
    private readonly atendimentoRepo: Repository<Atendimento>,
  ) {}

  // Lista fila ativa + finalizados de hoje (para o front saber mover para "Resolvidos")
  async listarFilaAtiva(user: any) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const query = this.atendimentoRepo.createQueryBuilder('a');

    const userId = user.sub || user.id || user.userId;

    // Admin e Observador veem tudo (Bot, Aguardando, Em Atendimento e Finalizados)
    if (user.role === 'ADMIN' || user.role === 'OBSERVADOR') {
      query.where('a.status IN (:...ativos)', { ativos: ['BOT', 'AGUARDANDO', 'EM_ATENDIMENTO'] })
           .orWhere('a.status = :fin AND a.dataCriacao >= :hoje', { fin: 'FINALIZADO', hoje });
    } else {
      // Atendente comum vê Pendentes (Aguardando) e APENAS os seus Em Atendimento e Finalizados
      query.where('a.status = :aguardando', { aguardando: 'AGUARDANDO' })
           .orWhere('(a.status = :emAtendimento AND (a.atendenteId = :userId OR a.atendenteId IS NULL))', { emAtendimento: 'EM_ATENDIMENTO', userId })
           .orWhere('(a.status = :fin AND (a.atendenteId = :userId OR a.atendenteId IS NULL) AND a.dataCriacao >= :hoje)', { fin: 'FINALIZADO', userId, hoje });
    }

    return query.orderBy('a.dataCriacao', 'ASC').getMany();
  }

  // Muda o status para o robô saber que pode voltar a responder esse JID
  async finalizarAtendimento(id: number) {
    return this.atendimentoRepo.update(id, { status: 'FINALIZADO' });
  }

  // Para o atendente "assumir" o ticket no Front-end
  async assumirAtendimento(id: number, atendenteId: string) {
    return this.atendimentoRepo.update(id, { status: 'EM_ATENDIMENTO', atendenteId });
  }
}