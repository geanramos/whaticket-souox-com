import { Module } from '@nestjs/common';
import { WhatsappOficialService } from './whatsapp-oficial.service';
import { WhatsappOficialController } from './whatsapp-oficial.controller';
import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from 'src/@core/infra/rabbitmq/RabbitMq.service';
import * as dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

// Carrega e expande variáveis do arquivo .env
const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

@Module({
  controllers: [WhatsappOficialController],
  providers: [WhatsappOficialService, PrismaClient, RabbitMQService],
  exports: [WhatsappOficialService],
})
export class WhatsappOficialModule {}
