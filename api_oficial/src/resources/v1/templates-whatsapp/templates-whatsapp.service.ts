import { Injectable, Logger } from '@nestjs/common';
import { MetaService } from 'src/@core/infra/meta/meta.service';
import { WhatsappOficialService } from '../whatsapp-oficial/whatsapp-oficial.service';
import { AppError } from 'src/@core/infra/errors/app.error';

@Injectable()
export class TemplatesWhatsappService {
  logger = new Logger(`${TemplatesWhatsappService}`);

  constructor(
    private readonly whatsappOficial: WhatsappOficialService,
    private readonly metaService: MetaService,
  ) {}

  async findAll(token: string) {
    try {
      const conexao =
        await this.whatsappOficial.prisma.whatsappOficial.findUnique({
          where: {
            token_mult100: token,
            deleted_at: null,
          },
        });

      if (!conexao) {
        this.logger.error(`Nenhuma conexão existente com este token ${token}`);
        throw new Error(`Nenhuma conexão existente com este token ${token}`);
      }

      return await this.metaService.getListTemplates(
        conexao.business_id,
        conexao.send_token,
      );
    } catch (error: any) {
      this.logger.error(`findAll - ${error.message}`);
      throw new AppError(error.message);
    }
  }
}
