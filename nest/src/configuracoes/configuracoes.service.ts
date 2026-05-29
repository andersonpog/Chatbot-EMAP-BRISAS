import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracao } from './entities/configuracoe.entity';

@Injectable()
export class ConfiguracoesService {
  constructor(
    @InjectRepository(Configuracao)
    private configRepo: Repository<Configuracao>,
  ) {}

  async getConfig(): Promise<Configuracao> {
    // Busca a configuração no banco
    let config = await this.configRepo.createQueryBuilder().orderBy('id', 'ASC').getOne();
    
    if (!config) {
      // Cria uma padrão caso ainda não exista nenhuma
      config = this.configRepo.create({
        horarios: [
          { dia: 0, nome: 'Domingo', ativo: false, inicio: '08:00', fim: '18:00' },
          { dia: 1, nome: 'Segunda-feira', ativo: true, inicio: '08:00', fim: '18:00' },
          { dia: 2, nome: 'Terça-feira', ativo: true, inicio: '08:00', fim: '18:00' },
          { dia: 3, nome: 'Quarta-feira', ativo: true, inicio: '08:00', fim: '18:00' },
          { dia: 4, nome: 'Quinta-feira', ativo: true, inicio: '08:00', fim: '18:00' },
          { dia: 5, nome: 'Sexta-feira', ativo: true, inicio: '08:00', fim: '18:00' },
          { dia: 6, nome: 'Sábado', ativo: false, inicio: '08:00', fim: '18:00' }
        ],
        mensagemForaHorario: 'Nosso atendimento humano funciona de segunda a sexta, das 08h às 18h. Deixe sua dúvida e retornaremos em breve!',
      });
      await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(data: Partial<Configuracao>): Promise<Configuracao> {
    let config = await this.getConfig(); // Garante que a linha existe
    Object.assign(config, data); // Atualiza com os dados recebidos do frontend
    return this.configRepo.save(config);
  }
}
