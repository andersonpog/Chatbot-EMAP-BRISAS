import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('webhook')
export class WebhookController {
  @Post('evolution')
  @HttpCode(HttpStatus.OK)
  handleEvolutionEvent(@Body() payload: any) {
    // A Evolution API envia o tipo de evento no campo "event"
    const eventType = payload.event;
    
    console.log(`Evento recebido: ${eventType}`);

    if (eventType === 'messages.upsert') {
      const msg = payload.data.message;
      const sender = payload.data.key.remoteJid;
      console.log(`Mensagem de ${sender}: ${payload.data.content}`);
    }

    return { received: true };
  }
}
