import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as multer from 'multer';

@Injectable()
export class FirebaseService {
  private firestore: admin.firestore.Firestore;
  private storage: admin.storage.Storage;

  constructor() {
    dotenv.config();

    const serviceAccountPath = process.env.FIREBASE_CONFIG_PATH
      ? path.resolve(process.env.FIREBASE_CONFIG_PATH)
      : path.resolve(__dirname, '..', 'config', 'legaltechv2-firebase-adminsdk-fbsvc-053772f507.json');

    // Comprobar si el archivo de configuración existe
    if (!fs.existsSync(serviceAccountPath)) {
      throw new HttpException(`El archivo de configuración de Firebase no se encuentra en la ruta: ${serviceAccountPath}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!admin.apps.length) {
      try {
        console.log('Inicializando Firebase...');
        // Inicialización de Firebase Admin SDK
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        
        });

        // Obtener la referencia a Firestore
        this.firestore = admin.firestore();
        this.storage = admin.storage();
        console.log('Firebase ha sido inicializado correctamente');

      } catch (error) {
        console.error('Error al inicializar Firebase:', error);
        throw new HttpException('No se pudo inicializar Firebase', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } else {
      console.log('Firebase ya estaba inicializado');
      this.firestore = admin.firestore();
      this.storage = admin.storage();
    }
  }

  // Método para agregar un documento
  async addDocument(collection: string, data: any): Promise<{ docId: string }> {
    if (!this.firestore) {
      throw new HttpException('Firestore no está inicializado', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      console.log('Intentando agregar el documento a la colección:', collection);
      const docRef = await this.firestore.collection(collection).add(data);
      console.log('Documento agregado con ID:', docRef.id);
      return { docId: docRef.id };
    } catch (error) {
      console.error('Error al agregar el documento:', error);
      throw new HttpException(`Error al agregar el documento: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Método para obtener documentos
  async getDocuments(collectionName: string, field: string, value: string): Promise<any[]> {
    if (!this.firestore) {
      throw new HttpException('Firestore no está inicializado', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      console.log(`Obteniendo documentos de la colección ${collectionName} donde ${field} = ${value}`);
      const colRef = this.firestore.collection(collectionName);
      const snapshot = await colRef.where(field, '==', value).get();
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Documentos obtenidos:', documents);
      return documents;
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      throw new HttpException('No se pudieron obtener los documentos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any) {
    if (!this.firestore) {
      throw new HttpException('Firestore no está inicializado', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  
    try {
      // Limpiar datos para asegurarnos de que solo los valores válidos sean enviados
      const cleanData = this.cleanData(data);
  
      console.log(`Actualizando documento en la colección ${collectionName} con ID ${docId}`);
      const docRef = this.firestore.collection(collectionName).doc(docId);
  
      // Realizamos la actualización
      await docRef.update(cleanData);
      console.log(`Documento ${docId} actualizado correctamente`);
    } catch (error) {
      console.error('Error al actualizar documento:', error);
      throw new HttpException('No se pudo actualizar el documento', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  // Función para limpiar los datos y asegurarnos de que no haya valores no válidos
  private cleanData(data: any): any {
    const cleanData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        cleanData[key] = value;
      }
    }
    return cleanData;
  }

  // Subir archivo a Firebase Storage
 async uploadEvidence(file: Express.Multer.File, consultaId: string) {
  const bucket = this.storage.bucket();
  const fileName = `evidencias/${consultaId}/${Date.now()}_${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  try {
    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    await fileUpload.makePublic();

    const fileUrl = fileUpload.publicUrl();

    const consultaRef = this.firestore.collection('consultas').doc(consultaId);
    await consultaRef.update({
      evidencia: fileUrl,
    });

    return { message: 'Evidencia subida con éxito', fileUrl };
  } catch (error) {
    throw new HttpException('Error al subir la evidencia: ' + error.message, HttpStatus.BAD_REQUEST);
  }
}

  
  // Retornar la referencia de Firebase Storage
  getStorage(): admin.storage.Storage {
    return this.storage;
  }

  // Retorna la instancia de Firestore
  getFirestore(): admin.firestore.Firestore {
    return this.firestore;
  }
}
