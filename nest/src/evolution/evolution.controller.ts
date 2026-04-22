import { Controller, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EvolutionService } from './evolution.service';
import { Atendimento } from '../atendimento/entities/atendimento.entity';
import { BotMessages } from '../../messages';
import { EvolutionGateway } from './evolution.gateway';

// Controle de estado simples em memória
const estadosUsuarios = {}; 

@Controller('webhook')
export class EvolutionController {
  constructor(
    private readonly evolutionService: EvolutionService,
    @InjectRepository(Atendimento)
    private readonly atendimentoRepo: Repository<Atendimento>,
    private readonly evolutionGateway: EvolutionGateway,
  ) {}

  @Post()
  async receberEvento(@Body() payload: any) {
    const { event, data, instance } = payload;

    if (event === 'messages.upsert') {

      // Emite o evento em tempo real para o frontend atualizar a tela sem piscar
      this.evolutionGateway.emitirNovaMensagem();

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

      // Se o usuário estava com o analista, mas o atendimento no banco não está mais ativo (foi finalizado),
      // nós resetamos o estado do robô para ele voltar a responder desde o início.
      if (estadoAtual === 'AGUARDANDO_ANALISTA') {
        estadoAtual = 'INICIO';
      }

      try {
        // --- FLUXO INICIAL ---
        if (estadoAtual === 'INICIO') {
          await this.evolutionService.enviarMensagem(
            instance, 
            remoteJid, 
            BotMessages.SAUDACAO_INICIAL
          );
          estadosUsuarios[remoteJid] = 'SAUDACAO_INICIAL';
        } 
        else if (estadoAtual === 'SAUDACAO_INICIAL') {
          await this.evolutionService.enviarMensagem(
            instance, 
            remoteJid, 
            BotMessages.MENU_PRINCIPAL
          );
          estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
        }

        // --- PROCESSANDO MENU PRINCIPAL ---
        else if (estadoAtual === 'MENU_PRINCIPAL') {
          if (textoRecebido === '1') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.SUBMENU_VISITAS_PORTO
            );
            estadosUsuarios[remoteJid] = 'SUBMENU_VISITAS_PORTO';
          } 
          else if (textoRecebido === '2') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.SUBMENU_TRABALHE_CONOSCO
            );
            estadosUsuarios[remoteJid] = 'SUBMENU_TRABALHE_CONOSCO';
          } 
          else if (textoRecebido === '3') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.RESPOSTA_COMERCIAL
            );
            estadosUsuarios[remoteJid] = 'AGUARDANDO_SUB_OPCAO';
          }
          else if (textoRecebido === '4') {
            // Criar entrada na fila de espera
            await this.atendimentoRepo.save({
              remoteJid,
              nome,
              status: 'AGUARDANDO'
            });

            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.ANALISTA_OUVIDORIA
            );
            estadosUsuarios[remoteJid] = 'AGUARDANDO_ANALISTA';
          }
          else if (textoRecebido === '0') {
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.DESPEDIDA
            );
            delete estadosUsuarios[remoteJid];
          } 
          else {
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.OPCAO_INVALIDA
            );
          }
        }

        // --- SUBMENU VISITAS AO PORTO ---
        else if (estadoAtual === 'SUBMENU_VISITAS_PORTO') {
          if (textoRecebido === '1') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.MENU_PRINCIPAL
            );
            estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
          } 
          else if (textoRecebido === '2') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.AGENDAR_VISITA_PORTO
            );
            estadosUsuarios[remoteJid] = 'AGENDAR_VISITA';
          }
          else if (textoRecebido === '3') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.CANCELAR_VISITA_PORTO
            );
            estadosUsuarios[remoteJid] = 'REAGENDAR_CANCELAR_VISITA';
          }
          else {
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.OPCAO_INVALIDA
            );
          }
        }

        // --- SUBMENU TRABALHE CONOSCO ---
        else if (estadoAtual === 'SUBMENU_TRABALHE_CONOSCO') {
          if (textoRecebido === '1') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.MENU_PRINCIPAL
            );
            estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
          } 
          else if (textoRecebido === '2') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.TRABALHE_CONOSCO
            );
            estadosUsuarios[remoteJid] = 'TRABALHE_CONOSCO_OPCAO';
          }
          else if (textoRecebido === '3') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.ESTAGIO_PORTO
            );
            estadosUsuarios[remoteJid] = 'ESTAGIO_OPCAO';
          }
          else if (textoRecebido === '4') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.JOVEM_APRENDIZ_PORTO
            );
            estadosUsuarios[remoteJid] = 'JOVEM_APRENDIZ_OPCAO';
          }
          else if (textoRecebido === '0') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.DESPEDIDA
            );
            delete estadosUsuarios[remoteJid];
          }
          else {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.OPCAO_INVALIDA
            );
          }
        }

        // --- OPÇÕES FINAIS (RETORNAR AO MENU INICIAL OU ENCERRAR) ---
        else if (['TRABALHE_CONOSCO_OPCAO', 'ESTAGIO_OPCAO', 'JOVEM_APRENDIZ_OPCAO', 'AGENDAR_VISITA', 'REAGENDAR_CANCELAR_VISITA', 'AGUARDANDO_SUB_OPCAO'].includes(estadoAtual)) {
          if (textoRecebido === '1') {
            estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.MENU_PRINCIPAL
            );
          } else if (textoRecebido === '0') {
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.DESPEDIDA
            );
            delete estadosUsuarios[remoteJid];
          } else {
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.OPCAO_INVALIDA
            );
          }
        }

      } catch (error) {
        console.error('Erro no fluxo de atendimento:', error.message);
      }

      // Dispara o WebSocket novamente para atualizar a tela com a resposta automática que o bot acabou de enviar
      this.evolutionGateway.emitirNovaMensagem();
    }
    return { status: 200 };
  }
}