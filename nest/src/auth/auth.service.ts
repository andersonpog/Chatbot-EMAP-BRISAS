import { Injectable, UnauthorizedException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Funcionario } from './entities/funcionario.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Funcionario)
    private funcionarioRepository: Repository<Funcionario>,
    private jwtService: JwtService,
  ) {}

  // Este método roda toda vez que o servidor liga
async onModuleInit() {
    // ...deve ser usado com 'this' aqui embaixo:
    const temAlgumAdmin = await this.funcionarioRepository.findOne({ 
    where: { role: 'ADMIN' } 
  });

    if (!temAlgumAdmin) {
      console.log('🌱 Seed: Criando Admin Inicial na tabela Funcionarios...');
      
      const senhaHasheada = await bcrypt.hash('123456', 10);
      
      const novoAdmin = this.funcionarioRepository.create({
        nome: 'Admin Inicial',
        email: 'admin@admin.com',
        senha: senhaHasheada,
        role: 'ADMIN',
      });

      await this.funcionarioRepository.save(novoAdmin);
      console.log('✅ Admin Inicial criado com sucesso!');
    } else {
      console.log('✔ Admin já existe na tabela Funcionarios.');
    }
  }

  /**
   * Registra um novo funcionarioistrador criptografando a senha antes de salvar.
   */
async registrar(nome: string, email: string, senha: string, role: string) {
  const usuarioExiste = await this.funcionarioRepository.findOne({ where: { email } });
  if (usuarioExiste) throw new ConflictException('E-mail já cadastrado');

  const salt = await bcrypt.genSalt(10);
  const senhaHasheada = await bcrypt.hash(senha, salt);

  const novoUsuario = this.funcionarioRepository.create({
    nome,
    email,
    senha: senhaHasheada,
    role: role || 'ATENDENTE', // Se não enviar, vira atendente por padrão
  });

  const salvo = await this.funcionarioRepository.save(novoUsuario);
  const { senha: _, ...usuarioSemSenha } = salvo;
  return usuarioSemSenha;
}

  /**
   * Valida as credenciais comparando a senha digitada com o Hash do banco.
   */
async login(email: string, senha: string) {
  const funcionario = await this.funcionarioRepository.findOne({ where: { email } });

  if (!funcionario || !(await bcrypt.compare(senha, funcionario.senha))) {
    throw new UnauthorizedException('Credenciais inválidas.');
  }

  // O que vai dentro do token (Payload)
  const payload = { sub: funcionario.id, email: funcionario.email, role: funcionario.role };

  return {
    access_token: await this.jwtService.signAsync(payload),
    user: {
      nome: funcionario.nome,
      email: funcionario.email
    }
  };
}
}