import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { WhatsappOficialService } from '../whatsapp-oficial/whatsapp-oficial.service';
import { RabbitMQService } from 'src/@core/infra/rabbitmq/RabbitMq.service';
import { RedisService } from 'src/@core/infra/redis/RedisService.service';
import { SocketService } from 'src/@core/infra/socket/socket.service';
import { CompaniesService } from '../companies/companies.service';
import { MetaService } from 'src/@core/infra/meta/meta.service';

@Module({
  controllers: [WebhookController],
  providers: [
    WebhookService,
    WhatsappOficialService,
    RabbitMQService,
    RedisService,
    SocketService,
    MetaService,
  ],
  exports: [WebhookService],
})
export class WebhookModule {}
