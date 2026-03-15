import { Controller, Post, Body } from '@nestjs/common';
import { EvolutionService } from './evolution.service';

// Objeto simples para controlar o estado (em memória)
const estadosUsuarios = {}; 

@Controller('webhook')
export class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {}



@Post('evolution*path')
async receberEvento(@Body() payload: any) {
  const { event, data, instance } = payload;

  if (event === 'messages.upsert') {
    const fromMe = data.key.fromMe;
    const remoteJid = data.key.remoteJid;
    const nome = data.pushName || 'Usuário';

    const textoRecebido = data.message?.conversation || 
                          data.message?.extendedTextMessage?.text;

    if (!textoRecebido || fromMe) return { status: 200 };

    // Recupera ou define o estado inicial do usuário
    const estadoAtual = estadosUsuarios[remoteJid] || 'INICIO';

    try {
      if (estadoAtual === 'INICIO') {
        // Primeira interação: Envia o menu
        await this.evolutionService.enviarMensagem(
          instance, 
          remoteJid, 
          `Olá ${nome}! Digite o número da opção desejada:\n1. Suporte Técnico\n2. Financeiro`
        );
        estadosUsuarios[remoteJid] = 'AGUARDANDO_OPCAO'; // Muda o estado
      } 
      else if (estadoAtual === 'AGUARDANDO_OPCAO') {
        // Segunda interação: Processa a escolha
        if (textoRecebido === '1') {
          await this.evolutionService.enviarMensagem(instance, remoteJid, "Você escolheu Suporte. Um técnico falará com você em breve.");
          estadosUsuarios[remoteJid] = 'INICIO'; // Reseta o fluxo
        } else if (textoRecebido === '2') {
          await this.evolutionService.enviarMensagem(instance, remoteJid, "Você escolheu Financeiro. Aguarde um instante.");
          estadosUsuarios[remoteJid] = 'INICIO';
        } else {
          await this.evolutionService.enviarMensagem(instance, remoteJid, "Opção inválida. Digite 1 ou 2.");
        }
      }
    } catch (error) {
      console.error('Erro no fluxo:', error.message);
    }
  }
  return { status: 200 };
}

//   @Post('evolution*path')
//   async receberEvento(@Body() payload: any) {
//     const event = payload.event;
//     const data = payload.data;
//     const instancia = payload.instance;

//     // Filtro para evitar processar o mesmo evento várias vezes ou logs vazios
//     if (event === 'messages.upsert') {
//         console.log(data)
//       const fromMe = data.key.fromMe;
//       const remoteJid = data.key.remoteJid;

//       // 1. Extração robusta do texto (evita o 'undefined')
//       const textoRecebido = data.message?.conversation || 
//                             data.message?.extendedTextMessage?.text || 
//                             data.message?.imageMessage?.caption;

//       // Se não houver texto (ex: apenas um log de sistema), encerra aqui
//       if (!textoRecebido) return { status: 200 };

//       // 2. Bloqueio de auto-resposta (evita loop infinito)
//       if (fromMe) return { status: 200 };

//       console.log(`Mensagem de ${remoteJid}: ${textoRecebido}`);

//       const nome = data.pushName;

//       try {
//         // 3. Resposta Automática usando a instância dinâmica
//         await this.evolutionService.enviarMensagem(
//           instancia, 
//           remoteJid, 
//           `Ola "${nome}" vc escreveu: "${textoRecebido}"`
//         );
//       } catch (error) {
//         console.error('Falha ao responder:', error.message);
//       }
//     }

//     return { status: 200 };
//   }
}

// import { Controller, Post, Body } from '@nestjs/common';
// import { EvolutionService } from './evolution.service';

// @Controller('webhook')
// export class EvolutionController {
//   constructor(private readonly evolutionService: EvolutionService) {}

//   @Post('evolution*path')
  
// // async receberEvento(@Body() payload: any) {
// //   const event = payload.event;
// //   const data = payload.data;
// //   const instancia = payload.instance;

// //   // 1. Log de Auditoria
// //   if (event === 'messages.upsert') {
// //     // Busca o texto em todas as chaves possíveis da v2.2.3+
// //     const texto = data.message?.conversation || 
// //                   data.message?.extendedTextMessage?.text || 
// //                   data.message?.imageMessage?.caption || 
// //                   "";

// //     const remoteJid = data.key.remoteJid;

// //     // Se o texto ainda for vazio, ignore para não imprimir 'undefined'
// //     if (!texto) return { status: 200 };

// //     console.log(`Mensagem de ${remoteJid}: ${texto}`);

// //     // 2. Filtro de Segurança: Não responder a si mesmo ou grupos
// //     if (data.key.fromMe || remoteJid.includes('@g.us')) {
// //       return { status: 200 };
// //     }

// //     try {
// //       // 3. Resposta Automática
// //       await this.evolutionService.enviarMensagem(
// //         instancia,
// //         remoteJid,
// //         `Bot recebido: "${texto}"`
// //       );
// //     } catch (error) {
// //       console.error('Erro no envio:', error.message);
// //     }
// //   }

// //   return { status: 200 };
// // }
// //   async receberEvento(@Body() payload: any) {
// //     const event = payload.event;
// //     const data = payload.data;
// //     const instanciaAtiva = payload.instance; // Pega 'evol' ou 'caderno' automaticamente

// //     console.log(`--- NOVO WEBHOOK RECEBIDO: ${event} ---`);

// //     if (event === 'presence.update') {
// //       const remoteJid = data.id || Object.keys(data.presences || {})[0];
// //       if (remoteJid && data.presences[remoteJid]?.lastKnownPresence === 'composing') {
// //         console.log(`Contato ${remoteJid} está digitando...`);
// //         console.log(data)
// //       }
// //     }

// //     if (event === 'messages.upsert') {
// //       const fromMe = data.key.fromMe;
// //       const remoteJid = data.key.remoteJid;

// //       // Ignora grupos e mensagens próprias
// //       if (fromMe || remoteJid.includes('@g.us')) return { status: 200 };

// //       // Extração de texto para a v2.2.3
// //       const textoRecebido = data.message?.conversation || 
// //                             data.message?.extendedTextMessage?.text || 
// //                             "";

// //       console.log(`Mensagem de ${remoteJid}: ${textoRecebido}`);
// //       console.log(data)

// //       try {
// //         // Usa a instância que disparou o webhook
// //         await this.evolutionService.enviarMensagem(
// //           instanciaAtiva, 
// //           remoteJid, 
// //           `Olá! Você disse: "${textoRecebido}". Agora o bot está autenticado!`
// //         );
// //       } catch (error) {
// //         console.error('Falha ao processar resposta automática:', error.response?.data || error.message);
// //       }
// //     }

// //     return { status: 200 };
// //   }
// }