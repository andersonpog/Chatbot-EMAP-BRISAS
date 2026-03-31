import { Test, TestingModule } from '@nestjs/testing';
import { AtendimentoController } from './atendimento.controller';

describe('AtendimentoController', () => {
  let controller: AtendimentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AtendimentoController],
    }).compile();

    controller = module.get<AtendimentoController>(AtendimentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
