import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

@Injectable()
export class FirebaseService {
  private firestore: admin.firestore.Firestore;

  constructor() {
    dotenv.config(); // Cargar las variables de entorno desde un archivo .env

    const serviceAccountPath = process.env.FIREBASE_CONFIG_PATH
      ? path.resolve(process.env.FIREBASE_CONFIG_PATH)
      : path.resolve(__dirname, '..', 'config', 'legaltechv2-firebase-adminsdk-fbsvc-053772f507.json'); // Cambia la ruta si es necesario

    // Comprobar si el archivo de configuración existe
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`El archivo de configuración de Firebase no se encuentra en la ruta: ${serviceAccountPath}`);
    }

    if (!admin.apps.length) {
      try {
        console.log('Inicializando Firebase...');
        // Inicialización de Firebase Admin SDK
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://legaltechv2-default-rtdb.firebaseio.com', // URL de Firebase Realtime Database
        });

        // Obtener la referencia a Firestore
        this.firestore = admin.firestore();
        console.log('Firebase ha sido inicializado correctamente');

      } catch (error) {
        console.error('Error al inicializar Firebase:', error);
        throw new Error('No se pudo inicializar Firebase');
      }
    } else {
      console.log('Firebase ya estaba inicializado');
      this.firestore = admin.firestore();
    }
  }

  // Método para agregar un documento
  async addDocument(collection: string, data: any): Promise<{ docId: string }> {
    if (!this.firestore) {
      throw new Error('Firestore no está inicializado');
    }

    try {
      console.log('Intentando agregar el documento a la colección:', collection);
      const docRef = await this.firestore.collection(collection).add(data);
      console.log('Documento agregado con ID:', docRef.id);
      return { docId: docRef.id };
    } catch (error) {
      console.error('Error al agregar el documento:', error);
      throw new Error(`Error al agregar el documento: ${error.message}`);
    }
  }

  // Método para obtener documentos
  async getDocuments(collectionName: string, field: string, value: string): Promise<any[]> {
    if (!this.firestore) {
      throw new Error('Firestore no está inicializado');
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
      throw new Error('No se pudieron obtener los documentos');
    }
  }

  // Método para actualizar un documento
  async updateDocument(collectionName: string, docId: string, data: any) {
    if (!this.firestore) {
      throw new Error('Firestore no está inicializado');
    }

    try {
      console.log(`Actualizando documento en la colección ${collectionName} con ID ${docId}`);
      const docRef = this.firestore.collection(collectionName).doc(docId);
      await docRef.update(data);
      console.log(`Documento ${docId} actualizado correctamente`);
    } catch (error) {
      console.error('Error al actualizar documento:', error);
      throw new Error('No se pudo actualizar el documento');
    }
  }

  // Método para eliminar un documento
  async deleteDocument(collectionName: string, docId: string) {
    if (!this.firestore) {
      throw new Error('Firestore no está inicializado');
    }

    try {
      console.log(`Eliminando documento en la colección ${collectionName} con ID ${docId}`);
      const docRef = this.firestore.collection(collectionName).doc(docId);
      await docRef.delete();
      console.log(`Documento ${docId} eliminado correctamente`);
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      throw new Error('No se pudo eliminar el documento');
    }
  }

  // Retorna la instancia de Firestore
  getFirestore(): admin.firestore.Firestore {
    return this.firestore;
  }
}
