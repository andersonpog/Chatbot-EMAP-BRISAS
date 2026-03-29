import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Chatbot EMAP-BRISAS API')
    .setDescription('Documentação das rotas de autenticação e integração com Evolution API')
    .setVersion('1.0')
    .addBearerAuth() // Isso permite colocar o Token JWT na interface do Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // A rota será http://localhost:3000/api

  await app.listen(3000);

  console.log(`🚀 Servidor rodando em: http://localhost:3000`);
  console.log(`📖 Documentação disponível em: http://localhost:3000/api`);
}
bootstrap();
