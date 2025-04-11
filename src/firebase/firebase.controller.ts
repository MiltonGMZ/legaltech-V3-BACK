import { Controller, Get, Param, Post, Body, Delete } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Firestore')
@Controller('firestore')
export class FirestoreController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post('add')
  @ApiOperation({ summary: 'Agregar un documento a Firestore' })
  @ApiBody({ description: 'Datos del documento a agregar', type: Object })
  @ApiResponse({ status: 201, description: 'Documento agregado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error al agregar el documento' })
  async addDocument(@Body() data: any) {
    const { docId } = await this.firebaseService.addDocument('users', data);
    return { message: 'Documento agregado', docId };
  }

  // Obtener un documento de la colección 'users' por su ID
  @Get('get/:id')
  @ApiOperation({ summary: 'Obtener un documento de Firestore por su ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del documento a obtener',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Documento obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  async getDocument(@Param('id') id: string) {
    const documents = await this.firebaseService.getDocuments(
      'users',
      'id',
      id,
    ); // Campo 'id' y valor 'id'
    const doc = documents.find((d) => d.id === id);
    if (!doc) {
      throw new Error('Documento no encontrado');
    }
    return { data: doc };
  }

  @Post('update/:id')
  @ApiOperation({ summary: 'Actualizar un documento de Firestore' })
  @ApiParam({
    name: 'id',
    description: 'ID del documento a actualizar',
    type: String,
  })
  @ApiBody({ description: 'Datos a actualizar', type: Object })
  @ApiResponse({
    status: 200,
    description: 'Documento actualizado exitosamente',
  })
  async updateDocument(@Param('id') id: string, @Body() data: any) {
    await this.firebaseService.updateDocument('users', id, data);
    return { message: 'Documento actualizado' };
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Eliminar un documento de Firestore' })
  @ApiParam({
    name: 'id',
    description: 'ID del documento a eliminar',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Documento eliminado exitosamente' })
  async deleteDocument(@Param('id') id: string) {
    await this.firebaseService.deleteDocument('users', id);
    return { message: 'Documento eliminado' };
  }

  // Obtener todos los documentos de la colección 'users' sin filtros
  @Get('getAll')
  @ApiOperation({ summary: 'Obtener todos los documentos de Firestore' })
  @ApiResponse({
    status: 200,
    description: 'Documentos obtenidos exitosamente',
  })
  async getAllDocuments() {
    const documents = await this.firebaseService.getDocuments(
      'users',
      'id',
      '',
    ); // Campo 'id' y valor vacío
    if (!documents || documents.length === 0) {
      throw new Error('No se encontraron documentos');
    }
    return { data: documents };
  }
}
