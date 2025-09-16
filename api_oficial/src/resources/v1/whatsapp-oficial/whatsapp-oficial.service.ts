import { Injectable, Logger } from '@nestjs/common';
import { CreateWhatsappOficialDto } from './dto/create-whatsapp-oficial.dto';
import { UpdateWhatsappOficialDto } from './dto/update-whatsapp-oficial.dto';
import { BaseService } from 'src/@core/base/base.service';
import { WhatsAppOficial } from 'src/@core/domain/entities/whatsappOficial.model';
import { AppError } from 'src/@core/infra/errors/app.error';

@Injectable()
export class WhatsappOficialService extends BaseService<WhatsAppOficial> {
  logger: Logger = new Logger(`${WhatsappOficialService.name}`);

  constructor() {
    super('whatsappOficial', WhatsappOficialService.name);
  }

  async oneWhatAppOficial(id: number) {
    try {
      const whats = await this.prisma.whatsappOficial.findUnique({
        where: { id, deleted_at: null },
      });

      if (!whats) throw new Error('Configuração do whats não encontrada');

      return whats;
    } catch (error: any) {
      this.logger.error(`createWhatsAppOficial - ${error.message}`);
      throw new AppError(error.message);
    }
  }

  async allWhatsAppOficial() {
    try {
      const company = await this.prisma.company.findFirst({
        where: { deleted_at: null },
      });

      if (!company) throw new Error('Empresa não encontrada');

      return await this.prisma.whatsappOficial.findMany({
        where: { companyId: company.id, deleted_at: null },
      });
    } catch (error: any) {
      this.logger.error(`createWhatsAppOficial - ${error.message}`);
      throw new AppError(error.message);
    }
  }

  async createWhatsAppOficial(
    data: CreateWhatsappOficialDto,
  ): Promise<WhatsAppOficial> {
    try {
      const company = await this.prisma.company.findFirst({
        where: {
          idEmpresaMult100: data.idEmpresaMult100,
          deleted_at: null,
        },
      });

      if (!company) throw new Error('Empresa não encontrada');

      const exist = await this.prisma.whatsappOficial.findUnique({
        where: { token_mult100: data.token_mult100 },
      });

      if (!!exist) throw new Error('Já existe esse token cadastrado');

      delete data.idEmpresaMult100;

      const whats: WhatsAppOficial = {
        ...data,
        companyId: company.id,
        token_mult100: data.token_mult100,
      };

      return await this.prisma.whatsappOficial.create({ data: whats });
    } catch (error: any) {
      this.logger.error(`createWhatsAppOficial - ${error.message}`);
      throw new AppError(error.message);
    }
  }

  async updateWhatsAppOficial(
    id: number,
    data: UpdateWhatsappOficialDto,
  ): Promise<WhatsAppOficial> {
    try {
      const whats = await this.prisma.whatsappOficial.findUnique({
        where: { id, deleted_at: null },
      });

      if (!whats) throw new Error('Configuração do whats não encontrada');

      const company = await this.prisma.company.findFirst({
        where: { deleted_at: null },
      });

      if (!company) throw new Error('Empresa não encontrada');

      return await this.prisma.whatsappOficial.update({
        where: { id },
        data: data,
      });
    } catch (error: any) {
      this.logger.error(`updateWhatsAppOficial - ${error.message}`);
      throw new AppError(error.message);
    }
  }

  async deleteWhatsAppOficial(id: number): Promise<WhatsAppOficial> {
    try {
      const whats = await this.prisma.whatsappOficial.findUnique({
        where: { id, deleted_at: null },
      });

      if (!whats) throw new Error('Configuração do whats não encontrada');

      const company = await this.prisma.company.findFirst({
        where: { deleted_at: null },
      });

      if (!company) throw new Error('Empresa não encontrada');

      return await this.prisma.whatsappOficial.update({
        where: { id },
        data: { deleted_at: new Date() },
      });
    } catch (error: any) {
      this.logger.error(`deleteWhatsAppOficial - ${error.message}`);
      throw new AppError(error.message);
    }
  }
}
