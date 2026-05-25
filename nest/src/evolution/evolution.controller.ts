import { Controller, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EvolutionService } from './evolution.service';
import { Atendimento } from '../atendimento/entities/atendimento.entity';
import { BotMessages } from '../../messages';
import { EvolutionGateway } from './evolution.gateway';
import { ConfiguracoesService } from '../configuracoes/configuracoes.service';


// Controle de estado simples em memória
const estadosUsuarios = {}; 
const estadoRetorno = {};

@Controller('webhook')
export class EvolutionController {
  constructor(
    private readonly evolutionService: EvolutionService,
    @InjectRepository(Atendimento)
    private readonly atendimentoRepo: Repository<Atendimento>,
    private readonly evolutionGateway: EvolutionGateway,
    private readonly configuracoesService: ConfiguracoesService,
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

      // Aguarda 1,5 segundos (1500 ms) antes do bot processar a resposta
      await new Promise(resolve => setTimeout(resolve, 1500));

      let atendimentoAtivo = await this.atendimentoRepo.findOne({
        where: { remoteJid, status: In(['AGUARDANDO', 'EM_ATENDIMENTO']) },
        order: { dataCriacao: 'DESC' }
      });

      // Se existe ticket na fila (AGUARDANDO) ou sendo atendido por um humano (EM_ATENDIMENTO sem ser o bot)
      if (atendimentoAtivo && atendimentoAtivo.atendenteId !== 'bot') {
        console.log(`🟡 Usuário ${nome} está com humano ou na fila. Robô em silêncio.`);
        return { status: 200 }; // Sai sem responder nada
      }

      let ticketBot = atendimentoAtivo && atendimentoAtivo.atendenteId === 'bot' ? atendimentoAtivo : null;

      if (!ticketBot) {
        // Tenta achar um ticket antigo com status legado 'BOT' para compatibilidade
        ticketBot = await this.atendimentoRepo.findOne({
          where: { remoteJid, status: 'BOT' },
          order: { dataCriacao: 'DESC' }
        });

        if (!ticketBot) {
          ticketBot = await this.atendimentoRepo.save({
            remoteJid,
            nome,
            status: 'EM_ATENDIMENTO',
            atendenteId: 'bot'
          });
        }
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
            BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.SAUDACAO_INICIAL
          );
          estadosUsuarios[remoteJid] = 'SAUDACAO_INICIAL';
        } 
        else if (estadoAtual === 'SAUDACAO_INICIAL') {
          await this.evolutionService.enviarMensagem(
            instance, 
            remoteJid, 
            BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.MENU_PRINCIPAL
          );
          estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
        }

        // --- PROCESSANDO MENU PRINCIPAL ---
        else if (estadoAtual === 'MENU_PRINCIPAL') {
          if (textoRecebido === '1') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.SUBMENU_VISITAS_PORTO
            );
            estadosUsuarios[remoteJid] = 'SUBMENU_VISITAS_PORTO';
            estadoRetorno[remoteJid] = 'SUBMENU_VISITAS_PORTO'
          } 
          else if (textoRecebido === '2') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.SUBMENU_TRABALHE_CONOSCO
            );
            estadosUsuarios[remoteJid] = 'SUBMENU_TRABALHE_CONOSCO';
            estadoRetorno[remoteJid] = 'SUBMENU_TRABALHE_CONOSCO';
          } 
          else if (textoRecebido === '3') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.RESPOSTA_COMERCIAL
            );
            estadosUsuarios[remoteJid] = 'AGUARDANDO_SUB_OPCAO';
            estadoRetorno[remoteJid] = 'MENU_PRINCIPAL'
          }
          else if (textoRecebido === '4') {
            // ====================================================================
            // VERIFICAÇÃO DE HORÁRIO ANTES DE ENCAMINHAR
            // ====================================================================
            const config = await this.configuracoesService.getConfig();
            
            const dataBrasil = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const diaAtual = dataBrasil.getDay();
            const horaAtual = dataBrasil.getHours();
            const minutoAtual = dataBrasil.getMinutes();

            const horarioHoje = config.horarios ? config.horarios.find((h: any) => h.dia === diaAtual) : null;
            let foraDoHorario = true;

            if (horarioHoje && horarioHoje.ativo) {
              const [horaInicio, minInicio] = horarioHoje.inicio.split(':').map(Number);
              const [horaFim, minFim] = horarioHoje.fim.split(':').map(Number);
              const minutosAtuais = horaAtual * 60 + minutoAtual;
              const minutosInicio = horaInicio * 60 + minInicio;
              const minutosFim = horaFim * 60 + minFim;
              if (minutosAtuais >= minutosInicio && minutosAtuais < minutosFim) foraDoHorario = false;
            }

            if (foraDoHorario) {
              await this.evolutionService.enviarMensagem(
                instance,
                remoteJid,
                config.mensagemForaHorario
              );
              // Reenvia o menu principal para o usuário continuar navegando
              await this.evolutionService.enviarMensagem(
                instance,
                remoteJid,
                BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.MENU_PRINCIPAL
              );
            } else {
              // Finaliza o atendimento do bot e cria um novo ticket para o Humano
              if (ticketBot) {
                await this.atendimentoRepo.update(ticketBot.id, { status: 'FINALIZADO' });
              }
              await this.atendimentoRepo.save({
               remoteJid,
               nome,
              status: 'AGUARDANDO',
            });

             await this.evolutionService.enviarMensagem(
               instance, 
               remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.ANALISTA_OUVIDORIA)
              ;
             estadosUsuarios[remoteJid] = 'AGUARDANDO_ANALISTA';
            }
          }
          else if (textoRecebido === '0') {
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.DESPEDIDA
            );
            delete estadosUsuarios[remoteJid];

            if (ticketBot) await this.atendimentoRepo.update(ticketBot.id, { status: 'FINALIZADO' });
          } 
          else {
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages[estadoAtual]
            );
          }
        }

        // --- SUBMENU VISITAS AO PORTO ---
        else if (estadoAtual === 'SUBMENU_VISITAS_PORTO') {
          if (textoRecebido === '1') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.MENU_PRINCIPAL
            );
            estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
          } 
          else if (textoRecebido === '2') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.AGENDAR_VISITA_PORTO
            );
            estadosUsuarios[remoteJid] = 'AGENDAR_VISITA';
          }
          else if (textoRecebido === '3') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.CANCELAR_VISITA_PORTO
            );
            estadosUsuarios[remoteJid] = 'REAGENDAR_CANCELAR_VISITA';
          }
          else {
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages[estadoAtual]
            );
          }
        }

        // --- SUBMENU TRABALHE CONOSCO ---
        else if (estadoAtual === 'SUBMENU_TRABALHE_CONOSCO') {
          if (textoRecebido === '1') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.MENU_PRINCIPAL
            );
            estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
          } 
          else if (textoRecebido === '2') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.TRABALHE_CONOSCO
            );
            estadosUsuarios[remoteJid] = 'TRABALHE_CONOSCO_OPCAO';
          }
          else if (textoRecebido === '3') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.ESTAGIO_PORTO
            );
            estadosUsuarios[remoteJid] = 'ESTAGIO_OPCAO';
          }
          else if (textoRecebido === '4') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.JOVEM_APRENDIZ_PORTO
            );
            estadosUsuarios[remoteJid] = 'JOVEM_APRENDIZ_OPCAO';
          }
          else if (textoRecebido === '0') {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.DESPEDIDA
            );
            delete estadosUsuarios[remoteJid];
          }
          else {
            await this.evolutionService.enviarMensagem(
              instance, 
              remoteJid, 
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages[estadoAtual]
            );
          }
        }

        // --- OPÇÕES FINAIS (RETORNAR AO MENU INICIAL OU ENCERRAR) ---
        else if (['TRABALHE_CONOSCO_OPCAO', 'ESTAGIO_OPCAO', 'JOVEM_APRENDIZ_OPCAO', 'AGENDAR_VISITA', 'REAGENDAR_CANCELAR_VISITA'].includes(estadoAtual)) {
          if (textoRecebido === '1') {
            const retorno = estadoRetorno[remoteJid] || 'MENU_PRINCIPAL';
            estadosUsuarios[remoteJid] = retorno;
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages[retorno]
            );
          } else if (textoRecebido === '0') {
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.DESPEDIDA
            );
            delete estadosUsuarios[remoteJid];
            delete estadoRetorno[remoteJid];

            if (ticketBot) await this.atendimentoRepo.update(ticketBot.id, { status: 'FINALIZADO' });
          } else {
            await this.evolutionService.enviarMensagem(
              instance,
              remoteJid,
              BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.OPCAO_INVALIDA
            );
          }
        }

        // OPÇÃO COMERCIAL 
else if (estadoAtual === 'AGUARDANDO_SUB_OPCAO') {
  if (textoRecebido === '1') {
    estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
    await this.evolutionService.enviarMensagem(instance, remoteJid, BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.MENU_PRINCIPAL);
  } else if (textoRecebido === '0') {
    await this.evolutionService.enviarMensagem(instance, remoteJid, BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.DESPEDIDA);
    delete estadosUsuarios[remoteJid];
    delete estadoRetorno[remoteJid];
    if (ticketBot) await this.atendimentoRepo.update(ticketBot.id, { status: 'FINALIZADO' });
  } else {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      BotMessages.BOT_MENSAGEM + '\n\n' + BotMessages.OPCAO_INVALIDA
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