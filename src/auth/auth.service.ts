import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from 'src/firebase/firebase.service';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly rolesService: RolesService,
  ) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(process.env.FIREBASE_CONFIG_PATH),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
  }

  // Registrar un nuevo usuario
async register(email: string, password: string, fullName: string, role: string = 'usuario') {
  try {
    // Verificar si el email ya está registrado
    const existingUser = await admin
      .auth()
      .getUserByEmail(email)
      .catch(() => null);
    if (existingUser) {
      throw new HttpException('El email ya está registrado', HttpStatus.BAD_REQUEST);
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
      role: role, // Usamos el rol enviado desde el frontend o el valor por defecto
      createdAt: new Date().toISOString(),
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
    throw new HttpException(`Error al crear el usuario: ${error.message}`, HttpStatus.BAD_REQUEST);
  }
}


  async verifyIdToken(idToken: string) {
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      throw new HttpException(`Token inválido: ${error.message}`, HttpStatus.UNAUTHORIZED);
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

  
  

  private async getUserData(uid: string) {
    const userDoc = await this.firebaseService.getDocuments('users', 'uid', uid);
    if (userDoc.length === 0) {
      throw new HttpException('No se encontró el usuario en Firestore', HttpStatus.NOT_FOUND);
    }
    return userDoc[0]; // Asumiendo que el documento existe
  }

 
  async getUserInfo(idToken: string) {
    try {
      const decodedToken = await this.verifyIdToken(idToken);
      const userRecord = await admin.auth().getUser(decodedToken.uid);

      // Obtener usuario desde Firestore
      const userData = await this.getUserData(decodedToken.uid);
      const role = userData?.role;

      if (!role) {
        throw new HttpException('El usuario no tiene un rol asignado', HttpStatus.BAD_REQUEST);
      }

      // Obtener permisos asociados al rol
      const permissions = await this.rolesService.getRolePermissions(role);
      if (!permissions || !Array.isArray(permissions)) {
        throw new HttpException('Permisos no encontrados o inválidos', HttpStatus.BAD_REQUEST);
      }
      

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        fullName: userRecord.displayName,
        role: role,
        permissions: permissions,  // Asegúrate de que los permisos están aquí
      };
    } catch (error) {
      throw new HttpException(`Error al obtener la información del usuario: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }


  async hasPermission(userId: string, requiredPermission: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(userId); // Obtener los datos del usuario
      const role = userData?.role;

      if (!role) {
        throw new HttpException('El usuario no tiene un rol asignado', HttpStatus.BAD_REQUEST);
      }

      // Obtener permisos asociados al rol del usuario
      const permissions = await this.rolesService.getRolePermissions(role);

      return permissions.includes(requiredPermission);
    } catch (error) {
      throw new HttpException(`Error al verificar permisos del usuario: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  // Método para enviar el correo de restablecimiento de contraseña
  async resetPassword(email: string): Promise<{ message: string }> {
    try {
      // Usamos el método de Firebase Auth para enviar el enlace de restablecimiento
      await admin.auth().generatePasswordResetLink(email);
      return { message: 'Se ha enviado el enlace de restablecimiento de contraseña a tu correo.' };
    } catch (error) {
      // Si el correo no está registrado o hay algún otro problema
      throw new BadRequestException('Error al enviar el enlace de restablecimiento de contraseña. Asegúrate de que el correo esté registrado.');
    }
  }
}
