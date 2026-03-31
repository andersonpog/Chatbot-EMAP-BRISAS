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

  // Lista apenas quem está esperando ou conversando com humano
  async listarFilaAtiva() {
    return this.atendimentoRepo.find({
      where: { 
        status: In(['AGUARDANDO', 'EM_ATENDIMENTO']) 
      },
      order: { dataCriacao: 'ASC' }, // Primeiro a chegar, primeiro a ser atendido
    });
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