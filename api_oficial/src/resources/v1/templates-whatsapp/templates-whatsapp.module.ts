import { Module } from '@nestjs/common';
import { TemplatesWhatsappService } from './templates-whatsapp.service';
import { TemplatesWhatsappController } from './templates-whatsapp.controller';
import { MetaService } from 'src/@core/infra/meta/meta.service';
import { WhatsappOficialService } from '../whatsapp-oficial/whatsapp-oficial.service';
import { RabbitMQService } from 'src/@core/infra/rabbitmq/RabbitMq.service';

@Module({
  controllers: [TemplatesWhatsappController],
  providers: [
    TemplatesWhatsappService,
    WhatsappOficialService,
    MetaService,
    RabbitMQService,
  ],
})
export class TemplatesWhatsappModule {}
