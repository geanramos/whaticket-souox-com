import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappOficialService } from '../whatsapp-oficial.service';

describe('WhatsappOficialService', () => {
  let service: WhatsappOficialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsappOficialService],
    }).compile();

    service = module.get<WhatsappOficialService>(WhatsappOficialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
