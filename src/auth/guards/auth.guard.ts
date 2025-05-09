import { Injectable, CanActivate, ExecutionContext, HttpStatus, HttpException } from '@nestjs/common';
import { AuthService } from '../auth.service';


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const idToken = request.headers['authorization']?.split(' ')[1];  // Asumiendo que el token viene en el encabezado Authorization

    if (!idToken) {
      throw new HttpException('Token no proporcionado', HttpStatus.UNAUTHORIZED);
    }

    try {
      const decodedToken = await this.authService.verifyIdToken(idToken);
      request.user = decodedToken; // Agrega la información del usuario al request
    } catch (error) {
      throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
