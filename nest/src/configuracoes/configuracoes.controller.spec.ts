import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracoesController } from './configuracoes.controller';
import { ConfiguracoesService } from './configuracoes.service';

describe('ConfiguracoesController', () => {
  let controller: ConfiguracoesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfiguracoesController],
      providers: [ConfiguracoesService],
    }).compile();

    controller = module.get<ConfiguracoesController>(ConfiguracoesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
