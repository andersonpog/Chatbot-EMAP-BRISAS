import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard'; // Verifique se o caminho do arquivo está certo

@Controller('auth') // Isso define o prefixo /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // Isso define a rota /auth/login (TEM QUE SER POST)
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    // Aqui pegamos o email e senha do Postman
    return this.authService.login(body.email, body.senha);
  }

 @Post('registrar')
@UseGuards(JwtAuthGuard) // <--- Só quem tem Token pode criar usuários
async registrar(@Body() body: any) {
  return this.authService.registrar(
    body.nome,
    body.email,
    body.senha,
    body.role
  );
}

  @UseGuards(AuthGuard('jwt')) // <-- O SEGURANÇA ESTÁ NA PORTA!
  @Get('perfil')
  getProfile(@Request() req) {
    return {
      message: 'Você acessou uma rota protegida!',
      usuarioLogado: req.user,
    };
  }
}