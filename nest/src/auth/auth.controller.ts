import { Controller, Post, Body, HttpCode, HttpStatus, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard'; // Verifique se o caminho do arquivo está certo

@Controller('auth') // Isso define o prefixo /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; senha: string }) {
    return this.authService.login(body?.email, body?.senha);
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

  @UseGuards(JwtAuthGuard)
  @Get('funcionarios')
  async listar() {
    return this.authService.listar();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('funcionarios/:id')
  async atualizar(@Param('id') id: string, @Body() body: { nome?: string; role?: string; active?: boolean }) {
    return this.authService.atualizar(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('heartbeat')
  async heartbeat(@Request() req) {
    await this.authService.heartbeat(req.user.userId);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('uptime')
  getUptime() {
    return this.authService.getUptime();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('perfil')
  async getProfile(@Request() req) {
    const user = await this.authService.buscarPorId(req.user.userId);
    return { usuarioLogado: { ...req.user, nome: user?.nome } };
  }
}