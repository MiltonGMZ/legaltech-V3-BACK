import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PermissionsService } from 'src/permissions/permissions.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly permissionsService: PermissionsService,
  ) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(process.env.FIREBASE_CONFIG_PATH),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
  }

  // Registrar un nuevo usuario
  async register(email: string, password: string, fullName: string) {
    try {
      // Verificar si el email ya está registrado
      const existingUser = await admin.auth().getUserByEmail(email).catch(() => null);
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Crear el nuevo usuario en Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: fullName,
      });

      // Crear el objeto de datos para Firestore
      const userData = {
        uid: userRecord.uid,
        email: userRecord.email,
        fullName,
        role: 'usuario',
        createdAt: new Date(),
      };

      // Guardar el usuario en Firestore
      const { docId } = await this.firebaseService.addDocument('users', userData);

      // Crear un token personalizado para el usuario
      const idToken = await admin.auth().createCustomToken(userRecord.uid);

      return {
        message: 'Usuario creado con éxito',
        userRecord,
        idToken,
        docId,
      };
    } catch (error) {
      throw new Error(`Error al crear el usuario: ${error.message}`);
    }
  }

  // Verificar el ID Token
  async verifyIdToken(idToken: string) {
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      throw new Error(`Token inválido: ${error.message}`);
    }
  }

  // Comprobar si el usuario está autenticado
  async isAuthenticated(idToken: string): Promise<boolean> {
    try {
      await admin.auth().verifyIdToken(idToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Restablecer la contraseña
  async resetPassword(email: string) {
    try {
      await admin.auth().generatePasswordResetLink(email);
      return { message: 'Enlace de recuperación de contraseña enviado' };
    } catch (error) {
      throw new Error(`Error al generar el enlace de recuperación: ${error.message}`);
    }
  }

  // Obtener información del usuario autenticado
  async getUserInfo(idToken: string) {
    try {
      const decodedToken = await this.verifyIdToken(idToken);
      const userRecord = await admin.auth().getUser(decodedToken.uid);
      return userRecord;
    } catch (error) {
      throw new Error(`Error al obtener la información del usuario: ${error.message}`);
    }
  }

  // Verificar permisos de un usuario
  async hasPermission(userId: string, requiredPermission: string): Promise<boolean> {
    try {
      const firestore = this.firebaseService.getFirestore();
      const userDoc = await firestore.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error(`Usuario con id ${userId} no encontrado`);
      }

      const userData = userDoc.data();
      const role = userData?.role;

      if (!role) {
        throw new Error(`El usuario no tiene un rol asignado`);
      }

      // Obtener los permisos asociados al rol del usuario
      const permissions = await this.permissionsService.getPermissionsForRole(role);

      return permissions.includes(requiredPermission);
    } catch (error) {
      throw new Error(`Error al verificar permisos: ${error.message}`);
    }
  }

  
  
}
