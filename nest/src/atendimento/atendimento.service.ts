import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Atendimento } from './entities/atendimento.entity';
import { Funcionario } from '../auth/entities/funcionario.entity'; // ajuste o caminho conforme sua estrutura
import { Funcionario } from '../auth/entities/funcionario.entity';

@Injectable()
export class AtendimentoService {
  constructor(
    @InjectRepository(Atendimento)
    private readonly atendimentoRepo: Repository<Atendimento>,

    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,
    @InjectRepository(Funcionario)
    private readonly funcionarioRepo: Repository<Funcionario>,
  ) {}

  // Lista fila ativa + finalizados de hoje (para o front saber mover para "Resolvidos")
  async listarFilaAtiva(user: any) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const query = this.atendimentoRepo.createQueryBuilder('a');
    const userId = user.sub || user.id || user.userId;

    if (user.role === 'ADMIN' || user.role === 'OBSERVADOR') {
      query.where('a.status IN (:...ativos)', { ativos: ['BOT', 'AGUARDANDO', 'EM_ATENDIMENTO'] })
           .orWhere('a.status = :fin AND a.dataCriacao >= :hoje', { fin: 'FINALIZADO', hoje });
    } else {
      query.where('a.status IN (:aguardando, :bot)', { aguardando: 'AGUARDANDO', bot: 'BOT' })
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
// Encaminhar e Lista de atendentes online
  async listarAtendentesOnline() {
  const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);

  const atendentes = await this.funcionarioRepository.find({
    where: {
      active: true,
      role: 'ATENDENTE', // só atendentes
    },
    select: ['id', 'nome', 'email', 'role', 'lastSeen'],
  });

  return atendentes.map(a => ({
  ...a,
  online: !!a.lastSeen && a.lastSeen > cincoMinutosAtras
}));

}



  async encaminharAtendimento(atendimentoId: number, atendenteId: string, userId: string) {
  const atendimento = await this.atendimentoRepo.findOne({ where: { id: atendimentoId } });
  if (!atendimento) {
    throw new Error(`Atendimento ${atendimentoId} não encontrado`); // erro real
  }

  const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
  const atendente = await this.funcionarioRepository.findOne({
    where: { id: atendenteId, active: true, lastSeen: MoreThan(cincoMinutosAtras) },
  });

  if (!atendente) {
    // não encaminhar
    return {
      sucesso: false,
      mensagem: "Esse atendente está offline, não é possível encaminhar.",
    };
  }

  atendimento.atendenteId = atendenteId;
  atendimento.status = "EM_ATENDIMENTO";
  await this.atendimentoRepo.save(atendimento);

  return {
    sucesso: true,
    mensagem: `Atendimento ${atendimentoId} encaminhado para atendente ${atendente.nome} por usuário ${userId}`,
  };
}


}



  // Admin/Observador encaminha ticket para um atendente específico
  async encaminharAtendimento(id: number, atendenteId: string) {
    return this.atendimentoRepo.update(id, { status: 'EM_ATENDIMENTO', atendenteId });
  }

  // Lista atendentes ativos para seleção no encaminhamento
  async listarAtendentes() {
    return this.funcionarioRepo.find({
      where: { role: 'ATENDENTE', active: true },
      select: ['id', 'nome'],
      order: { nome: 'ASC' },
    });
  }
}
