import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de la validación global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Habilitar CORS
  app.enableCors({
    origin: ['https://legaltechv2.web.app', 'http://localhost:4200' ], // Permitir solicitudes desde el frontend en el puerto 4200
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.setGlobalPrefix('api'); // Prefijo para todas las rutas de la API

  // Configuración de Swagger para documentación
  const config = new DocumentBuilder()
    .setTitle('API Example')
    .setDescription('API documentation for the project')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Iniciar la aplicación
  await app.listen(3000);
}
bootstrap();
