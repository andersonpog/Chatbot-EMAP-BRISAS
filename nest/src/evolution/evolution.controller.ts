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
    `Olá! Bem-vindo ao atendimento Ouvidoria-EMAP. 
Para que possamos dar continuidade ao atendimento, me informe o seu nome e email`
  );
  estadosUsuarios[remoteJid] = 'SAUDACAO_INICIAL';
} 
else if (estadoAtual === 'SAUDACAO_INICIAL') {
  await this.evolutionService.enviarMensagem(
    instance, 
    remoteJid, 
    `Para garantir a nossa comunicação, é importante que saiba que a cada interação, 
você tem o tempo de 1 hora para responder ou o chat será finalizado automaticamente.

Por favor, escolha uma das opções abaixo digitando o número:

1 - Visitas ao Porto
2 - Trabalhe conosco
3 - Oferta Comercial
4 - Falar com Analista da Ouvidoria
0 - Encerrar atendimento`
  );
  estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
}


 // --- MENU PRINCIPAL ---
else if (estadoAtual === 'MENU_PRINCIPAL') {
  if (textoRecebido === '1') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `O que você deseja Fazer?

1 - Voltar ao menu anterior
2 - Agendar visita ao porto
3 - Reagendar/Cancelar visita`
    );
    estadosUsuarios[remoteJid] = 'SUBMENU_VISITAS_PORTO';
  } 
  else if (textoRecebido === '2') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Informe o seu interesse:

1 - Voltar ao menu anterior
2 - Trabalhar conosco
3 - Estágio
4 - Jovem Aprendiz`
    );
    estadosUsuarios[remoteJid] = 'SUBMENU_TRABALHE_CONOSCO';
  }
  else if (textoRecebido === '3') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Agradecemos o interesse na EMAP. Por sermos uma empresa pública, nossas contratações ocorrem exclusivamente via licitação. Veja como acompanhar e participar:

📑 Editais: Acompanhe no nosso site:
https://www.portodoitaqui.com/transparencia/licitacoes
E também no programa PDF/FIEMA.

💻 Sistema: Nossos pregões ocorrem no portal Licitações-e do Banco do Brasil. É necessário se cadastrar:
https://www.licitacoes-e.com.br/

📝 Cadastro de Fornecedores (CRC): Não é obrigatório para participar, mas facilita a entrega de documentos. Você pode fazer no site:
https://www.portodoitaqui.com/emap/cadastro-de-fornecedores

Estamos à disposição!

Digite:
1 - Retornar ao menu inicial
0 - Encerrar atendimento`
    );
    estadosUsuarios[remoteJid] = 'AGUARDANDO_SUB_OPCAO';
  }
  else if (textoRecebido === '4') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Um atendente da EMAP entrará em contato em breve.`
    );
    estadosUsuarios[remoteJid] = 'AGUARDANDO_ANALISTA';
  }
  else if (textoRecebido === '0') {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Atendimento encerrado. A Ouvidoria - EMAP agradece o seu contato! Até logo! 👋`
    );
    delete estadosUsuarios[remoteJid];
  }
  else {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Ops! Não entendi. Por favor, digite apenas o número da opção desejada.`
    );
  }
}


  // --- SUBMENU VISITAS AO PORTO ---
else if (estadoAtual === 'SUBMENU_VISITAS_PORTO') {
  if (textoRecebido === '1') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Para garantir a nossa comunicação, é importante que saiba que a cada interação, 
você tem o tempo de 1 hora para responder ou o chat será finalizado automaticamente.

Por favor, escolha uma das opções abaixo digitando o número:

1 - Visitas ao Porto
2 - Trabalhe conosco
3 - Oferta Comercial
4 - Falar com Analista da Ouvidoria
0 - Encerrar atendimento`
    );
    estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
  } 
  else if (textoRecebido === '2') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Agradecemos o interesse pela EMAP - Porto do Itaqui!

📅 O agendamento de visitas é feito diretamente pelo nosso site:
https://www.portodoitaqui.com/porto-do-itaqui/agende-uma-visita

⚠️ Problemas no sistema? Caso o link apresente falha, fale com a nossa Gerência de Comunicação:
📞 Tel: (98) 3216-6020
✉️ E-mail: comunicacao@emap.ma.gov.br

Atenciosamente,
Ouvidoria EMAP.

Digite:
1 - Retornar ao menu inicial
0 - Encerrar atendimento`
    );
    estadosUsuarios[remoteJid] = 'AGENDAR_VISITA';
  }
  else if (textoRecebido === '3') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Com objetivo maior de atender a sua manifestação, seguem abaixo os contatos para melhores e maiores esclarecimentos sobre a solicitação:

📌 Gerência de Comunicação – GECOM
📞 Tel.: (98) 3216–6020
✉️ E-mail: comunicacao@emap.ma.gov.br

Estamos à disposição!

Digite:
1 - Retornar ao menu inicial
0 - Encerrar atendimento`
    );
    estadosUsuarios[remoteJid] = 'REAGENDAR_CANCELAR_VISITA';
  }
  else {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Ops! Não entendi. Por favor, digite apenas o número da opção desejada.`
    );
  }
}


// --- SUBMENU TRABALHE CONOSCO ---
else if (estadoAtual === 'SUBMENU_TRABALHE_CONOSCO') {
  if (textoRecebido === '1') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Voltando ao menu principal...

1 - Visitas ao Porto
2 - Trabalhe conosco
3 - Oferta Comercial
4 - Falar com Analista da Ouvidoria
0 - Encerrar atendimento`
    );
    estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
  } 
  else if (textoRecebido === '2') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Primeiramente, gostaríamos de agradecer o seu contato e o interesse pela EMAP-Porto do Itaqui!

A fim de atender a sua manifestação, informamos que a EMAP é uma empresa pública, administradora do Porto do Itaqui, e suas contratações são feitas por meio de concurso público.

Contudo, caso esteja em busca de oportunidades, existem várias outras empresas privadas que atuam na área do Porto:
http://www.portodoitaqui.ma.gov.br/porto-do-itaqui/comunidade-portuaria

Para acompanhar informações sobre concursos, sugerimos que fique atento(a) ao site do Porto do Itaqui:
https://www.portodoitaqui.com/emap/a-emap

Atenciosamente,
Ouvidoria EMAP.

Digite:
1 - Voltar ao menu anterior
0 - Encerrar atendimento`
    );
    estadosUsuarios[remoteJid] = 'TRABALHE_CONOSCO_OPCAO';
  }
  else if (textoRecebido === '3') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Primeiramente, gostaríamos de agradecer o seu contato e o interesse pela EMAP-Porto do Itaqui!

A fim de atender a sua manifestação, informamos que, no caso de estágio na EMAP, os interessados devem se cadastrar no site do IEL - Instituto Euvaldo Lodi:
http://sne.iel.org.br/ma

Quando surgem vagas, o recrutamento é feito por essa instituição, contratada pela EMAP como agente de integração.

Como seu foco é a área portuária, sugerimos que acesse:
http://www.portodoitaqui.ma.gov.br/porto-do-itaqui/comunidade-portuaria

Atenciosamente,
Ouvidoria EMAP.

Digite:
1 - Voltar ao menu anterior
0 - Encerrar atendimento`
    );
    estadosUsuarios[remoteJid] = 'ESTAGIO_OPCAO';
  }
  else if (textoRecebido === '4') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Primeiramente, gostaríamos de agradecer o seu contato e o interesse pela EMAP-Porto do Itaqui!

A fim de atender a sua manifestação, informamos que a empresa contrata jovens de 18 a 24 anos (que tenham concluído o ensino médio) por meio do Programa Jovem Aprendiz.

Para se candidatar a esse programa, você deve estar cadastrado na instituição formadora contratada pela empresa. Atualmente é o ISBET - Instituto Brasileiro Pró-Educação, Trabalho e Desenvolvimento:
http://www.isbet.org.br

Atenciosamente,
Ouvidoria EMAP.

Digite:
1 - Voltar ao menu anterior
0 - Encerrar atendimento`
    );
    estadosUsuarios[remoteJid] = 'JOVEM_APRENDIZ_OPCAO';
  }
  else if (textoRecebido === '0') {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Atendimento encerrado. Obrigado por entrar em contato!`
    );
    delete estadosUsuarios[remoteJid];
  }
  else {
    await this.evolutionService.enviarMensagem(
      instance, 
      remoteJid, 
      `Ops! Não entendi. Digite uma das opções válidas.`
    );
  }
}

// --- TRABALHE CONOSCO OPÇÃO ---
else if (estadoAtual === 'TRABALHE_CONOSCO_OPCAO') {
  if (textoRecebido === '1') {
    estadosUsuarios[remoteJid] = 'SUBMENU_TRABALHE_CONOSCO';
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Voltando ao submenu Trabalhe Conosco...

1 - Voltar ao menu anterior
2 - Trabalhar conosco
3 - Estágio
4 - Jovem Aprendiz
0 - Encerrar atendimento`
    );
  } else if (textoRecebido === '0') {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Atendimento encerrado. Obrigado por entrar em contato!`
    );
    delete estadosUsuarios[remoteJid];
  } else {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Ops! Digite 1 para voltar ao submenu ou 0 para encerrar.`
    );
  }
}

// --- ESTÁGIO OPÇÃO ---
else if (estadoAtual === 'ESTAGIO_OPCAO') {
  if (textoRecebido === '1') {
    estadosUsuarios[remoteJid] = 'SUBMENU_TRABALHE_CONOSCO';
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Voltando ao submenu Trabalhe Conosco...

1 - Voltar ao menu anterior
2 - Trabalhar conosco
3 - Estágio
4 - Jovem Aprendiz
0 - Encerrar atendimento`
    );
  } else if (textoRecebido === '0') {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Atendimento encerrado. Obrigado por entrar em contato!`
    );
    delete estadosUsuarios[remoteJid];
  } else {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Ops! Digite 1 para voltar ao submenu ou 0 para encerrar.`
    );
  }
}

// --- JOVEM APRENDIZ OPÇÃO ---
else if (estadoAtual === 'JOVEM_APRENDIZ_OPCAO') {
  if (textoRecebido === '1') {
    estadosUsuarios[remoteJid] = 'SUBMENU_TRABALHE_CONOSCO';
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Voltando ao submenu Trabalhe Conosco...

1 - Voltar ao menu anterior
2 - Trabalhar conosco
3 - Estágio
4 - Jovem Aprendiz
0 - Encerrar atendimento`
    );
  } else if (textoRecebido === '0') {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Atendimento encerrado. Obrigado por entrar em contato!`
    );
    delete estadosUsuarios[remoteJid];
  } else {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Ops! Digite 1 para voltar ao submenu ou 0 para encerrar.`
    );
  }
}




// --- AGENDAR VISITA ---
else if (estadoAtual === 'AGENDAR_VISITA') {
  if (textoRecebido === '1') {
    estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Voltando ao menu principal...

1 - Visitas ao Porto
2 - Trabalhe conosco
3 - Oferta Comercial
4 - Falar com Analista da Ouvidoria
0 - Encerrar atendimento`
    );
  } else if (textoRecebido === '0') {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Atendimento encerrado. Obrigado por entrar em contato!`
    );
    delete estadosUsuarios[remoteJid];
  } else {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Ops! Digite 1 para voltar ao menu ou 0 para encerrar.`
    );
  }
}

// --- REAGENDAR/CANCELAR VISITA ---
else if (estadoAtual === 'REAGENDAR_CANCELAR_VISITA') {
  if (textoRecebido === '1') {
    estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Voltando ao menu principal...

1 - Visitas ao Porto
2 - Trabalhe conosco
3 - Oferta Comercial
4 - Falar com Analista da Ouvidoria
0 - Encerrar atendimento`
    );
  } else if (textoRecebido === '0') {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Atendimento encerrado. Obrigado por entrar em contato!`
    );
    delete estadosUsuarios[remoteJid];
  } else {
    await this.evolutionService.enviarMensagem(
      instance,
      remoteJid,
      `Ops! Digite 1 para voltar ao menu ou 0 para encerrar.`
    );
  }
}



  // --- PROCESSANDO SUB-MENU GENÉRICO (Oferta Comercial) ---
  else if (estadoAtual === 'AGUARDANDO_SUB_OPCAO') {
    if (textoRecebido === '1') {
      estadosUsuarios[remoteJid] = 'MENU_PRINCIPAL';
      await this.evolutionService.enviarMensagem(
        instance, 
        remoteJid, 
        `Para garantir a nossa comunicação, é importante que saiba que a cada interação, você tem o tempo de 1 hora para responder ou o chat será finalizado automaticamente.
Por favor, escolha uma das opções abaixo digitando o número:
1 - Visitas ao Porto
2 - Trabalhe conosco
3 - Oferta Comercial
4 - Falar com Analista da Ouvidoria
0 - Encerrar atendimento`
      );
    } 
    else if (textoRecebido === '0') {
      await this.evolutionService.enviarMensagem(
        instance, 
        remoteJid, 
        "Atendimento encerrado. Obrigado por entrar em contato!"
      );
      estadosUsuarios[remoteJid] = 'INICIO';
    } 
    else {
      await this.evolutionService.enviarMensagem(
        instance, 
        remoteJid, 
        "Ops! Não entendi. Digite 1 para voltar ou 0 para encerrar."
      );
    }
  }

} catch (error) {
  console.error('Erro no fluxo de atendimento:', error.message);
}
return { status: 200 };
    }
  }
}