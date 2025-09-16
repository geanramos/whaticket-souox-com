import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesWhatsappService } from '../templates-whatsapp.service';

describe('TemplatesWhatsappService', () => {
  let service: TemplatesWhatsappService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplatesWhatsappService],
    }).compile();

    service = module.get<TemplatesWhatsappService>(TemplatesWhatsappService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
