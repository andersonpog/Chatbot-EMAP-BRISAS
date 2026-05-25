import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfiguracoesService } from '../configuracoes/configuracoes.service';
import { EvolutionService } from '../evolution/evolution.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Atendimento } from '../atendimento/entities/atendimento.entity';
import { BotMessages } from '../../messages';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly configuracoesService: ConfiguracoesService,
    private readonly evolutionService: EvolutionService,
    @InjectRepository(Atendimento)
    private readonly atendimentoRepo: Repository<Atendimento>
  ) {}

  @Post('evolution')
  @HttpCode(HttpStatus.OK)
  async handleEvolutionEvent(@Body() payload: any) {
    const eventType = payload.event;
    const instance = payload.instance; // <-- Adicionamos a extração da instância aqui

    if (eventType === 'messages.upsert') {
      const msg = payload.data.message;
      const sender = payload.data.key.remoteJid;
      const text = payload.data.content?.trim();
      
      // Ignora mensagens enviadas pelo próprio robô ou mensagens vazias
      if (!text || payload.data.key.fromMe) {
        return { received: true };
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 1. Busca se o usuário já tem um atendimento aberto no banco
      let atendimento = await this.atendimentoRepo.findOne({
        where: [
          { remoteJid: sender, status: 'BOT' },
          { remoteJid: sender, status: 'AGUARDANDO' },
          { remoteJid: sender, status: 'EM_ATENDIMENTO' }
        ],
        order: { id: 'DESC' }
      });

      // 2. Se já estiver na fila ou com humano, o robô cala a boca
      if (atendimento && (atendimento.status === 'AGUARDANDO' || atendimento.status === 'EM_ATENDIMENTO')) {
        return { received: true };
      }

      // 3. Se for uma conversa NOVA
      if (!atendimento) {
        atendimento = this.atendimentoRepo.create({
          remoteJid: sender,
          nome: payload.data.pushName || sender.split('@')[0],
          status: 'BOT'
        });
        await this.atendimentoRepo.save(atendimento);

        // Envia Saudação e o Menu Principal
        await this.evolutionService.enviarMensagem(instance, sender, BotMessages.SAUDACAO_INICIAL + "\n\n" + BotMessages.MENU_PRINCIPAL);
        return { received: true };
      }

      // 4. Se o usuário já está no BOT, avalia a opção escolhida:
      if (text === '1') {
        await this.evolutionService.enviarMensagem(instance, sender, BotMessages.SUBMENU_VISITAS_PORTO);
      } 
      else if (text === '2') {
        await this.evolutionService.enviarMensagem(instance, sender, BotMessages.SUBMENU_TRABALHE_CONOSCO);
      } 
      else if (text === '3') {
        await this.evolutionService.enviarMensagem(instance, sender, BotMessages.RESPOSTA_COMERCIAL);
      } 
      else if (text === '0') {
        atendimento.status = 'FINALIZADO';
        await this.atendimentoRepo.save(atendimento);
        await this.evolutionService.enviarMensagem(instance, sender, BotMessages.DESPEDIDA);
      } 
      else if (text === '4') {
        // ====================================================================
        // O USUÁRIO PEDIU PARA FALAR COM ATENDENTE
        // VERIFICAMOS O HORÁRIO ANTES DE MANDAR PRA FILA
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
          await this.evolutionService.enviarMensagem(instance, sender, config.mensagemForaHorario);
        } else {
          atendimento.status = 'AGUARDANDO';
          await this.atendimentoRepo.save(atendimento);
          await this.evolutionService.enviarMensagem(instance, sender, BotMessages.ANALISTA_OUVIDORIA);
        }
      } 
      else {
        await this.evolutionService.enviarMensagem(instance, sender, BotMessages.OPCAO_INVALIDA);
      }
    }

    return { received: true };
  }
}
