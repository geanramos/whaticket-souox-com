import {
  Controller,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { SendMessageWhatsappService } from './send-message-whatsapp.service';
import { CreateSendMessageWhatsappDto } from './dto/create-send-message-whatsapp.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { IRequest } from 'src/@core/global-interfaces/iRequest.interface';
import { Public } from '../../../@core/guard/auth.decorator';

@Controller('v1/send-message-whatsapp')
export class SendMessageWhatsappController {
  constructor(private readonly service: SendMessageWhatsappService) {}

  @Post(':token')
  @Public()
  @ApiOperation({ summary: 'Enviar Mensagem com o Whatsapp Oficial' })
  @ApiResponse({
    status: 400,
    description: 'Erro ao salvar a mensagem para enviar',
  })
  @ApiResponse({
    status: 200,
    description:
      'Retorna o registro salvo no banco para enviar a mensagem do whats',
  })
  @UseInterceptors(FileInterceptor('file'))
  sendMessage(
    @Param('token') token: string,
    @Body('data') data: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.createMessage(token, data, file);
  }

  @Post('read-message/:token/:messageId')
  @Public()
  @ApiOperation({ summary: 'Enviar Mensagem com o Whatsapp Oficial' })
  @ApiResponse({
    status: 400,
    description: 'Erro ao salvar a mensagem para enviar',
  })
  @ApiResponse({
    status: 200,
    description:
      'Retorna o registro salvo no banco para enviar a mensagem do whats',
  })
  @UseInterceptors(FileInterceptor('file'))
  readMessage(
    @Param('token') token: string,
    @Param('messageId') messageId: string,
  ) {
    return this.service.readMessage(token, messageId);
  }
}
