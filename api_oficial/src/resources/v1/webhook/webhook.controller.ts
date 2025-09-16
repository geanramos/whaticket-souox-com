import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../@core/guard/auth.decorator';
import { IWebhookWhatsApp } from './interfaces/IWebhookWhatsApp.inteface';

@Controller('v1/webhook')
@ApiTags('Webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Public()
  @Post(':companyId/:conexaoId')
  @ApiOperation({ summary: 'Webhook para evento de empresa e conexão' })
  @ApiResponse({
    status: 400,
    description: 'Retorna o erro para quem esta chamando',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna somente um true caso tenha sucesso',
  })
  async webhookCompanyConexao(
    @Param('companyId') companyId: number,
    @Param('conexaoId') conexaoId: number,
    @Body() data: IWebhookWhatsApp,
  ) {
    return await this.webhookService.webhookCompanyConexao(
      companyId,
      conexaoId,
      data,
    );
  }

  @Public()
  @Get(':companyId/:conexaoId')
  @ApiOperation({ summary: 'Webhook para evento de empresa' })
  @ApiResponse({
    status: 400,
    description: 'Retorna o erro para quem esta chamando',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna somente um true caso tenha sucesso',
  })
  async webhookCompany(
    @Param('companyId') companyId: number,
    @Param('conexaoId') conexaoId: number,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verify_token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return await this.webhookService.webhookCompany(
      companyId,
      conexaoId,
      mode,
      verify_token,
      challenge,
    );
  }
}
