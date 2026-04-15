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
  async listarFilaAtiva() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return this.atendimentoRepo
      .createQueryBuilder('a')
      .where('a.status IN (:...ativos)', { ativos: ['AGUARDANDO', 'EM_ATENDIMENTO'] })
      .orWhere('a.status = :fin AND a.dataCriacao >= :hoje', { fin: 'FINALIZADO', hoje })
      .orderBy('a.dataCriacao', 'ASC')
      .getMany();
  }

  // Muda o status para o robô saber que pode voltar a responder esse JID
  async finalizarAtendimento(id: number) {
    return this.atendimentoRepo.update(id, { status: 'FINALIZADO' });
  }

  // Para o atendente "assumir" o ticket no Front-end
  async assumirAtendimento(id: number) {
    return this.atendimentoRepo.update(id, { status: 'EM_ATENDIMENTO' });
  }
}