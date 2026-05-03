import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('webhook')
export class WebhookController {
  @Post('evolution')
  @HttpCode(HttpStatus.OK)
  async handleEvolutionEvent(@Body() payload: any) {
    // A Evolution API envia o tipo de evento no campo "event"
    const eventType = payload.event;
    
    console.log(`Evento recebido: ${eventType}`);

    if (eventType === 'messages.upsert') {
      const msg = payload.data.message;
      const sender = payload.data.key.remoteJid;
      console.log(`Mensagem de ${sender}: ${payload.data.content}`);
      
      // Aguarda 1,5 segundos (1500 ms) antes do bot processar a resposta
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Adicione a chamada para o envio da mensagem do bot daqui em diante!
    }

    return { received: true };
  }
}
