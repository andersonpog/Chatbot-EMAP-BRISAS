import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookModule } from './webhook/webhook.module';
import { EvolutionModule } from './evolution/evolution.module';

@Module({
  imports: [WebhookModule, EvolutionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
