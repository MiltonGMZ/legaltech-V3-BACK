import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

@Injectable()
export class FirebaseService {
  private firestore: admin.firestore.Firestore;

  constructor() {
    dotenv.config();

    const serviceAccountPath = process.env.FIREBASE_CONFIG_PATH
      ? path.resolve(process.env.FIREBASE_CONFIG_PATH)
      : path.resolve(__dirname, '..', 'config', 'legaltechv2-firebase-adminsdk-fbsvc-053772f507.json');

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`El archivo de configuración de Firebase no se encuentra en la ruta: ${serviceAccountPath}`);
    }

    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://legaltechv2-default-rtdb.firebaseio.com',
        });

        this.firestore = admin.firestore();
        console.log('Firebase ha sido inicializado correctamente');
      } catch (error) {
        console.error('Error al inicializar Firebase:', error);
        throw new Error('No se pudo inicializar Firebase');
      }
    }
  }

  async addDocument(collection: string, data: any): Promise<{ docId: string }> {
    try {
      const docRef = await this.firestore.collection(collection).add(data);
      return { docId: docRef.id };
    } catch (error) {
      throw new Error(`Error al agregar el documento: ${error.message}`);
    }
  }

  async getDocuments(collectionName: string, field: string, value: string): Promise<any[]> {
    try {
      const colRef = this.firestore.collection(collectionName);
      const snapshot = await colRef.where(field, '==', value).get();
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return documents;
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      throw new Error('No se pudieron obtener los documentos');
    }
  }
  
  
  

  async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      const docRef = this.firestore.collection(collectionName).doc(docId);
      await docRef.update(data);
    } catch (error) {
      console.error('Error al actualizar documento:', error);
      throw new Error('No se pudo actualizar el documento');
    }
  }

  async deleteDocument(collectionName: string, docId: string) {
    try {
      const docRef = this.firestore.collection(collectionName).doc(docId);
      await docRef.delete();
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      throw new Error('No se pudo eliminar el documento');
    }
  }

  getFirestore(): admin.firestore.Firestore {
    return this.firestore;
  }
}
