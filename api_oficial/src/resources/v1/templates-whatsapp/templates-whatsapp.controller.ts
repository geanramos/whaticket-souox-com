import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TemplatesWhatsappService } from './templates-whatsapp.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('v1/templates-whatsapp')
@ApiBearerAuth()
@ApiTags('Templates WhatsApp')
export class TemplatesWhatsappController {
  constructor(private readonly service: TemplatesWhatsappService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Retorna registros do templates' })
  @ApiResponse({
    status: 400,
    description: 'Erro ao encontrar os templates com o Whatsapp Oficial',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna os registros de templates do Whatsapp Oficial',
  })
  findAll(@Param('token') token: string) {
    return this.service.findAll(token);
  }
}
