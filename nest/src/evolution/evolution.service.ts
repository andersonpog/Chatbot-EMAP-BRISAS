import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);
  private readonly baseURL = 'http://host.docker.internal:8080'; // Ajustado para o Docker acessar o Windows
  private readonly apiKey = 'chaveiruda'; // Sua chave extraída dos logs

  constructor(private readonly httpService: HttpService) {}

  /**
   * Envia uma mensagem de texto simples.
   * Compatível com Evolution API v2.1.1 até v2.2.3+
   */
//   async enviarMensagem(instancia: string, numero: string, texto: string) {
//   const endpoint = `${this.baseURL}/message/sendText/${instancia}`;
  
//   const corpo = {
//     number: numero, // O ID '268865019879549@lid'
//     text: texto,
//     delay: 1200,
//     linkPreview: false,
//     // Opções essenciais para IDs do tipo @lid na v2.2.3
//     options: {
//       presence: "composing",
//       checkContact: false, // Desativa a verificação 'exists'
//       forceSend: true      // Força o envio mesmo que o check falhe
//     }
//   };

//   const config = {
//     headers: { 
//       'apikey': this.apiKey,
//       'Content-Type': 'application/json' 
//     }
//   };

//   try {
//     const observable = this.httpService.post(endpoint, corpo, config);
//     const resposta = await lastValueFrom(observable);
//     return resposta.data;
//   } catch (error) {
//     console.error('Erro detalhado:', JSON.stringify(error.response?.data, null, 2));
//     throw error;
//   }
// }

// evolution.service.ts
// async enviarMensagem(instancia: string, numero: string, texto: string) {
//   const endpoint = `${this.baseURL}/message/sendText/${instancia}`;
  
//   const corpo = {
//     number: numero, // O ID '268865019879549@lid'
//     text: texto,
//     delay: 1200,
//     linkPreview: false,
//     // ESSA SEÇÃO RESOLVE O ERRO 400 COM @LID
//     options: {
//       presence: "composing",
//       checkContact: false, // OBRIGATÓRIO: Ignora a validação "exists"
//       forceSend: true      // OBRIGATÓRIO: Força o envio para identificadores especiais
//     }
//   };

//   const config = {
//     headers: { 
//       'apikey': this.apiKey, // Certifique-se de que esta é a nova Key
//       'Content-Type': 'application/json' 
//     }
//   };

//   try {
//     const observable = this.httpService.post(endpoint, corpo, config);
//     const resposta = await lastValueFrom(observable);
//     return resposta.data;
//   } catch (error) {
//     console.error('Erro detalhado:', JSON.stringify(error.response?.data, null, 2));
//     throw error;
//   }
// }

// evolution.service.ts
async enviarMensagem(instancia: string, numero: string, texto: string) {
  const endpoint = `${this.baseURL}/message/sendText/${instancia}`;
  
  const corpo = {
    number: numero, // Aqui vai o '268865019879549@lid'
    text: texto,
    delay: 1200,
    linkPreview: false,
    // ESTA É A PARTE QUE CORRIGE O ERRO 400
    options: {
      presence: "composing",
      checkContact: false, // OBRIGATÓRIO: Impede que a API valide o @lid como número
      forceSend: true      // OBRIGATÓRIO: Força a entrega para IDs vinculados
    }
  };

  const config = {
    headers: { 
      'apikey': this.apiKey, // Use a chave nova que você obteve
      'Content-Type': 'application/json' 
    }
  };

  try {
    const observable = this.httpService.post(endpoint, corpo, config);
    const resposta = await lastValueFrom(observable);
    return resposta.data;
  } catch (error) {
    // Log detalhado para capturar se a API retornar algo diferente agora
    console.error('Erro detalhado:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

}