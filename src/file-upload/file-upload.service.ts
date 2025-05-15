import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FileUploadService {
  private storage = admin.storage();
  private firestore = admin.firestore();

  async uploadFile(caseId: string, file: Express.Multer.File): Promise<string> {
    const bucket = this.storage.bucket();
    const uniqueName = `${Date.now()}_${file.originalname}`;
    const filePath = `evidencias/${caseId}/${uniqueName}`;
    const fileUpload = bucket.file(filePath);

    try {
      await fileUpload.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });

      // Hacer público para acceso (opcional, puedes usar signed URLs para más seguridad)
      await fileUpload.makePublic();

      const publicUrl = fileUpload.publicUrl();

      // Aquí podrías guardar la URL en Firestore si quieres
      // await this.firestore.collection('consultas').doc(caseId).update({ evidenciaUrl: publicUrl });

      return publicUrl;
    } catch (error) {
      throw new HttpException('Error al subir archivo a Firebase Storage: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
