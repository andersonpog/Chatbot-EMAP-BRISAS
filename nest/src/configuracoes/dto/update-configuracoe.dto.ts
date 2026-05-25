import { PartialType } from '@nestjs/swagger';
import { CreateConfiguracoeDto } from './create-configuracoe.dto';

export class UpdateConfiguracoeDto extends PartialType(CreateConfiguracoeDto) {}
