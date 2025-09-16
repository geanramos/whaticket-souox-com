import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappOficialController } from '../whatsapp-oficial.controller';
import { WhatsappOficialService } from '../whatsapp-oficial.service';

describe('WhatsappOficialController', () => {
  let controller: WhatsappOficialController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappOficialController],
      providers: [WhatsappOficialService],
    }).compile();

    controller = module.get<WhatsappOficialController>(
      WhatsappOficialController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
