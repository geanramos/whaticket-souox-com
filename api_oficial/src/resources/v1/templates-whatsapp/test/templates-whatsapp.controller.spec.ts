import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesWhatsappController } from '../templates-whatsapp.controller';
import { TemplatesWhatsappService } from '../templates-whatsapp.service';

describe('TemplatesWhatsappController', () => {
  let controller: TemplatesWhatsappController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesWhatsappController],
      providers: [TemplatesWhatsappService],
    }).compile();

    controller = module.get<TemplatesWhatsappController>(
      TemplatesWhatsappController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
