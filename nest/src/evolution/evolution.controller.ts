import { Controller, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EvolutionService } from './evolution.service';
import { Atendimento } from '../atendimento/entities/atendimento.entity';

// Controle de estado simples em memória
const estadosUsuarios = {}; 

@Controller('webhook')
export class EvolutionController {
  constructor(
    private readonly evolutionService: EvolutionService,
    @InjectRepository(Atendimento)
    private readonly atendimentoRepo: Repository<Atendimento>,
  ) {}

  @Post()
  async receberEvento(@Body() payload: any) {
    const { event, data, instance } = payload;

    if (event === 'messages.upsert') {

      const remoteJid = data.key.remoteJid;
      if (data.key.fromMe || remoteJid.includes('@g.us')) return { status: 200 };

      const fromMe = data.key.fromMe;
      const nome = data.pushName || 'Usuário';

      const textoRecebido = (data.message?.conversation || 
                            data.message?.extendedTextMessage?.text || "").trim();

      if (!textoRecebido || fromMe) return { status: 200 };

      let atendimentoAtivo = await this.atendimentoRepo.findOne({
      where: { remoteJid, status: In(['AGUARDANDO', 'EM_ATENDIMENTO']) }
    });

    if (atendimentoAtivo) {
      console.log(`🟡 Usuário ${nome} está com humano. Robô em silêncio.`);
      return { status: 200 }; // Sai sem responder nada
    }

      // Recupera ou define o estado inicial
      let estadoAtual = estadosUsuarios[remoteJid] || 'INICIO';

      try {
        // --- FLUXO INICIAL ---
        if (estadoAtual === 'INICIO') {
          await this.evolutionService.enviarMensagem(
            instance, 
            remoteJid, 
            `Olá ${nome}! Digite a opção desejada:\n\n1 - Horários de saída do Ferry Boat\n2 - Falar com atendente\n0 - Encerrar atendimento`
          );
          estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
        } 

        // --- PROCESSANDO MENU PRINCIPAL ---
        else if (estadoAtual === 'MENU_PRINCIPAL') {
          if (textoRecebido === '1') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              "🚢 *Horários de Saída:*\n- 08:00h\n- 18:00h\n\nDigite:\n1 - Retornar ao menu inicial\n0 - Encerrar atendimento"
            );
            estadosUsuarios[remoteJid] = 'AGUARDANDO_SUB_OPCAO';
          } 
          else if (textoRecebido === '2') {
            // Criar entrada na fila de espera
              await this.atendimentoRepo.save({
                remoteJid,
                nome,
                status: 'AGUARDANDO'
              });

              await this.evolutionService.enviarMensagem(instance, remoteJid, "✅ Você foi colocado na fila de espera. Um atendente da EMAP entrará em contato em breve.");
              estadosUsuarios[remoteJid] = 'INICIO';
            // await this.evolutionService.enviarMensagem(instance, remoteJid, "Encaminhando você para um atendente humano... Por favor, aguarde.");
            // estadosUsuarios[remoteJid] = 'INICIO'; // Reseta para a próxima vez que ele chamar
          } 
          else if (textoRecebido === '0') {
            await this.evolutionService.enviarMensagem(instance, remoteJid, "Atendimento encerrado. Tenha um ótimo dia!");
            estadosUsuarios[remoteJid] = 'INICIO';
          } 
          else {
            await this.evolutionService.enviarMensagem(instance, remoteJid, "Opção inválida. Digite 1, 2 ou 0.");
          }
        }

        // --- PROCESSANDO SUB-MENU (DENTRO DA OPÇÃO 1) ---
        else if (estadoAtual === 'AGUARDANDO_SUB_OPCAO') {
          if (textoRecebido === '1') {
            // Volta para o menu inicial forçando o envio da mensagem
            estadosUsuarios[remoteJid] = 'INICIO';
            // Recursão simples ou apenas aguarda a próxima msg (aqui vamos resetar para ele mandar o menu de novo)
            await this.receberEvento(payload); 
          } 
          else if (textoRecebido === '0') {
            await this.evolutionService.enviarMensagem(instance, remoteJid, "Atendimento encerrado. Boa viagem!");
            estadosUsuarios[remoteJid] = 'INICIO';
          } 
          else {
            await this.evolutionService.enviarMensagem(instance, remoteJid, "Opção inválida. Digite 1 para voltar ou 0 para encerrar.");
          }
        }

      } catch (error) {
        console.error('Erro no fluxo de atendimento:', error.message);
      }
    }
    return { status: 200 };
  }
}