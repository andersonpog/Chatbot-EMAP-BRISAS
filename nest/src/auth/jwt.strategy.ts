import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') { // O 'jwt' aqui é a chave!
  constructor(configService: ConfigService){
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')|| 'secretKeyDefaultChatbot',
    });
  }

  async validate(payload: any) {
    // O que retornar aqui vai para o req.user
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}