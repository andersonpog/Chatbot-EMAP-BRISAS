import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThan, In, Brackets } from 'typeorm';
import { Atendimento } from './entities/atendimento.entity';
import { Funcionario } from '../auth/entities/funcionario.entity';
import { Mensagem } from './entities/mensagem.entity';

@Injectable()
export class AtendimentoService {
  constructor(
    @InjectRepository(Atendimento)
    private readonly atendimentoRepo: Repository<Atendimento>,

    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,

    private readonly dataSource: DataSource,
  ) {}

  // Lista fila ativa + finalizados de hoje (para o front saber mover para "Resolvidos")
  async listarFilaAtiva(user: any) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const query = this.atendimentoRepo.createQueryBuilder('a');
    const userId = user.sub || user.id || user.userId;

    if (user.role === 'ADMIN' || user.role === 'OBSERVADOR') {
      query.where(new Brackets(qb => {
        qb.where('a.status IN (:...ativos)', { ativos: ['BOT', 'AGUARDANDO', 'EM_ATENDIMENTO'] })
          .orWhere('a.status = :fin AND a.dataCriacao >= :hoje', { fin: 'FINALIZADO', hoje });
      }));
    } else {
      query.where(new Brackets(qb => {
        qb.where('a.status = :aguardando', { aguardando: 'AGUARDANDO' })
          .orWhere('(a.status = :emAtendimento AND a.atendenteId = :userId)', { emAtendimento: 'EM_ATENDIMENTO', userId })
          .orWhere('(a.status = :fin AND a.atendenteId = :userId AND a.dataCriacao >= :hoje)', { fin: 'FINALIZADO', userId, hoje });
      }));
    }

    query.andWhere(`NOT EXISTS (
      SELECT 1
      FROM atendimentos newer
      WHERE newer."remoteJid" = a."remoteJid"
        AND (
          newer."dataCriacao" > a."dataCriacao"
          OR (newer."dataCriacao" = a."dataCriacao" AND newer.id > a.id)
        )
    )`);

    // Busca ordenado por data DESC para que o front pegue sempre o ticket mais recente para o contato
    const fila = await query.orderBy('a.dataCriacao', 'DESC').getMany();

    const atendentesIds = fila.map(f => f.atendenteId).filter(id => id && id !== 'bot');
    let funcionarios: Funcionario[] = [];
    if (atendentesIds.length > 0) {
      funcionarios = await this.funcionarioRepository.find({ where: { id: In(atendentesIds) } });
    }

    return fila.map(f => {
      const func = funcionarios.find(fn => String(fn.id) === String(f.atendenteId));
      return { ...f, atendenteNome: func ? func.nome : (f.atendenteId === 'bot' ? 'Bot' : null) };
    });
  }

  // Muda o status para o robô saber que pode voltar a responder esse JID
  async finalizarAtendimento(id: number) {
    return this.atendimentoRepo.update(id, { status: 'FINALIZADO' });
  }

  // Para o atendente "assumir" o ticket no Front-end
  async assumirAtendimento(id: number, atendenteId: string) {
    const resultado = await this.atendimentoRepo.update(
      { id, status: 'AGUARDANDO' },
      { status: 'EM_ATENDIMENTO', atendenteId },
    );

    if (!resultado.affected) {
      return {
        sucesso: false,
        mensagem: 'Esse atendimento já foi assumido por outro atendente.',
      };
    }

     const atendente = await this.funcionarioRepository.findOne({
    where: { id: atendenteId },
  });

  return {
    sucesso: true,
    nome: atendente?.nome,
  };
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
    remoteJid: atendimento.remoteJid,
    nomeAtendente: atendente.nome,
    mensagem: `Atendimento ${atendimentoId} encaminhado para atendente ${atendente.nome} por usuário ${userId}`,
  };
}

  async gerarRelatorio(filtros: {
    dataInicio: string;
    dataFim: string;
    numero?: string;
    atendenteId?: string;
  }) {
    try {
      const inicio = new Date(filtros.dataInicio + 'T00:00:00');
      const fim    = new Date(filtros.dataFim    + 'T23:59:59');

      const query = this.atendimentoRepo
        .createQueryBuilder('a')
        .where('a.dataCriacao >= :inicio AND a.dataCriacao <= :fim', { inicio, fim });

      if (filtros.numero) {
        query.andWhere('a.remoteJid LIKE :numero', { numero: `%${filtros.numero.replace(/\D/g, '')}%` });
      }
      if (filtros.atendenteId) {
        query.andWhere('a.atendenteId = :atendenteId', { atendenteId: filtros.atendenteId });
      }

      const atendimentos = await query.orderBy('a.dataCriacao', 'DESC').getMany();

      const atendentesIds = [...new Set(
        atendimentos.map(a => a.atendenteId).filter(id => id && id !== 'bot')
      )];
      let funcionarios: Funcionario[] = [];
      if (atendentesIds.length > 0) {
        funcionarios = await this.funcionarioRepository.find({ where: { id: In(atendentesIds) } });
      }

      const ids = atendimentos.map(a => a.id).filter(Boolean);
      let todasMensagens: any[] = [];
      if (ids.length > 0) {
        todasMensagens = await this.dataSource.getRepository(Mensagem).find({
          where: { atendimentoId: In(ids) },
          order: { dataEnvio: 'ASC' },
        });
      }

      return atendimentos.map(a => {
        const func = funcionarios.find(fn => String(fn.id) === String(a.atendenteId));
        const mensagens = todasMensagens.filter(m => m.atendimentoId === a.id);
        return {
          ...a,
          atendenteNome: func?.nome ?? (a.atendenteId === 'bot' ? 'Bot Ouvidoria' : null),
          mensagens,
        };
      });
    } catch (err) {
      console.error('[RELATORIO ERRO]', err?.message ?? err);
      throw err;
    }
  }
}