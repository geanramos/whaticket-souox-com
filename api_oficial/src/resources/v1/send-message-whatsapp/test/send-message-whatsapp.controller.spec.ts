import { Test, TestingModule } from '@nestjs/testing';
import { SendMessageWhatsappController } from '../send-message-whatsapp.controller';
import { SendMessageWhatsappService } from '../send-message-whatsapp.service';

describe('SendMessageWhatsappController', () => {
  let controller: SendMessageWhatsappController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SendMessageWhatsappController],
      providers: [SendMessageWhatsappService],
    }).compile();

    controller = module.get<SendMessageWhatsappController>(
      SendMessageWhatsappController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
