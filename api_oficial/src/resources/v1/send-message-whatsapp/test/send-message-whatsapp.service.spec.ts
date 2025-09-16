import { Test, TestingModule } from '@nestjs/testing';
import { SendMessageWhatsappService } from '../send-message-whatsapp.service';

describe('SendMessageWhatsappService', () => {
  let service: SendMessageWhatsappService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendMessageWhatsappService],
    }).compile();

    service = module.get<SendMessageWhatsappService>(
      SendMessageWhatsappService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
