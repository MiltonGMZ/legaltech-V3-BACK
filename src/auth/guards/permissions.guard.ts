// permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';


@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.uid;
    const requiredPermission = this.reflector.get<string>('requiredPermission', context.getHandler());

    if (!requiredPermission) {
      // Si no hay un permiso requerido, permitir el acceso
      return true;
    }

    // Verificar si el usuario tiene el permiso requerido
    return this.authService.hasPermission(userId, requiredPermission);
  }
}
