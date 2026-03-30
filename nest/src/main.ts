import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Chatbot EMAP-BRISAS API')
    .setDescription('Documentação das rotas de autenticação e integração com Evolution API')
    .setVersion('1.0')
    .addBearerAuth() // Isso permite colocar o Token JWT na interface do Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // A rota será http://localhost:3000/api

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Servidor rodando em: http://localhost:${port}`);
  console.log(`📖 Documentação disponível em: http://localhost:${port}/api`);
}
bootstrap();
