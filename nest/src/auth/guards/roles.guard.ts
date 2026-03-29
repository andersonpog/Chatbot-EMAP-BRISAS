import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) return true; // Se a rota não tiver @Roles, é pública para logados

    const { user } = context.switchToHttp().getRequest();
    
    const temPermissao = requiredRoles.some((role) => user.role === role);

    if (!temPermissao) {
      throw new ForbiddenException('Você não tem permissão para acessar esta área.');
    }
    
    return temPermissao;
  }
}