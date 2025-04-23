import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as validator from 'class-validator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Ruta de registro
  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado con éxito' })
  @ApiResponse({ status: 400, description: 'Error en la creación del usuario' })
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('fullName') fullName: string,
  ) {
    // Validación básica de entrada
    if (!email || !password || !fullName) {
      throw new BadRequestException('Todos los campos son obligatorios');
    }

    // Validación del formato del correo electrónico
    if (!validator.isEmail(email)) {
      throw new BadRequestException('El correo electrónico no es válido');
    }

    try {
      const userRecord = await this.authService.register(
        email,
        password,
        fullName,
      );
      return {
        statusCode: 201,
        message: 'Usuario creado con éxito',
        user: userRecord,
      };
    } catch (error) {
      throw new HttpException(
        {
          message: error.message,
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Ruta de login
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con token' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso' })
  @ApiResponse({ status: 400, description: 'Error de autenticación' })
  async login(@Body('idToken') idToken: string) {
    if (!idToken) {
      throw new BadRequestException('El token de autenticación es requerido');
    }

    try {
      const userInfo = await this.authService.getUserInfo(idToken);
      return {
        message: 'Inicio de sesión exitoso',
        user: userInfo,
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Ruta para obtener la información del usuario autenticado
  @Get('user-info')
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Información del usuario obtenida' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserInfo(@Headers('Authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'No se ha proporcionado un token de autorización válido',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const idToken = authHeader.replace('Bearer ', ''); // Extraer el token del encabezado
    try {
      const userInfo = await this.authService.getUserInfo(idToken);
      return {
        statusCode: 200,
        message: 'Información del usuario obtenida con éxito',
        user: userInfo, 
      };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error al obtener información del usuario',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Ruta de recuperación de contraseña
  @Post('reset-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({
    status: 200,
    description: 'Recuperación de contraseña solicitada',
  })
  @ApiResponse({
    status: 400,
    description: 'Error al solicitar recuperación de contraseña',
  })
  async resetPassword(@Body('email') email: string) {
    // Validación básica de entrada
    if (!email) {
      throw new BadRequestException('El correo electrónico es obligatorio');
    }

    try {
      const response = await this.authService.resetPassword(email);
      return {
        statusCode: 200,
        message: 'Recuperación de contraseña solicitada',
        data: response,
      };
    } catch (error) {
      throw new HttpException(
        {
          message: error.message,
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
