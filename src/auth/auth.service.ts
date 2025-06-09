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
  const serviceAccount = {
    project_id: "legaltechv2",
    private_key_id: "053772f50762851009706dc0071986e8bf5351b3",
    private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDhzJRHvm55oD1C
hQ8BPOsuTghlL2KCObAmdi+GlAgOWHjJBroyAigELgGLiV+igLoEwOJMYTRs75p9
Yg+AbG5pI4tGk1a9fsLJ0r9On5E608/CHuQFOfmHIbE50w9p+rNn10EMNnTg9u4q
ljzHkESss4irY0MIJq/INGm1k00rqeKg8OSC4JxSzoyoQd4ESKxVTH55HUVog7M/
JBvRe2GFO/X/8fsFdzEjuDBZyeIhkpcRjNj6FgwQ+41lkdOrEQOMK6tn9lBsmhmJ
whmMIAxDv7AWg89VyK2nTvJXEaJJdvILq2ZlXZ2GKNCU6IElryeLqCTn41h9E+D7
182dvQpFAgMBAAECggEACGhV8Brw4aH8DfVG4wCp8CIzMVNTm2469x+o8t2htCkK
rE+OEM0gQNGWuKOflj0tT/5/nqDy8whz6+3CDoHbFZqfdbwIO4uUBLBOc8bAwVxA
LOX6DxDC0AuK3hCUDxno4rmy4BnJ/dNr+FV6Q2MFj5mqwdjzFsNcAbwj4IEw2yqJ
EGZxJpG5tPPTJkeq4beBFH7RXPcI1XUFo0f5Jft8CfIUzMaiSZcPzzz1sIMlvebh
NJwAAX1xNlJiUCEgR353axorQn1CVhfw+cNGoGOvlb0KedZvOESzDO2T8GLVuvS7
3rsAI6wsanRGavRu+lCpGm2pCJ6CFVZZ1jLRVfzjwQKBgQDwt6b3SI5vwHU9SleI
+LbLbTgYT624GLBSYgCHiPnYE2FC/5FSv2yshcq+iagXTTZq2hB7DDGuI6JN1TzM
uDL/YSZvEST7SfY38gTqWZ3Y74NXV49DfrOxIob6Nj68I5zr6ffsjhptI8s+m8hD
Pas/tUzs8mN41MOr6zW9/7d3hQKBgQDwInZtohZZFg6AHI0UMsp4mj/LBtpyiP0z
P/MyuV9PBMpi+OI2DvsHTMebW/bbywlqdEINd2ecZeCDGLEXxhKBXiCa0VjxipL7
4Hc/wVwLDXZqpTW9d1zQfye2ClhNeiy1ilVcjbdCd6RD0b+1PQ3oFxvigkfbr+0N
OKOUG/3jwQKBgH2YNON81eR01DbgXP+4VReaqtP0br1JFGZHf+M3krQsmGiuk5JL
ElaJkBkOFcfin2vszwCEgj9LlFlr0sc1rFYWyEjW9yatlmvmOK5Vh8gyX6LoqnUa
3IKlcyuFtgHPywZEEvk3w44CSP8npLuAp6Mb40EVztSynk1K8cVqcL1JAoGBAJFU
WhYpxZqu1aHFJcC2qIDq4XbPM/+jVpHgvx/QvpTFEnNpqwYKdPRLDHbC5pjIvW8W
4y7hN+yYX5MXq3322xY+UD9CObEdK62SgLkuHbV2tVb/m5GKHrr0aaUrh5uEOHC6
QsUb43AvllORKpPWWoc/DRo9vJ2BUFbzE1S8yCBBAoGAQW3rSPQBlA3K1LsjLGqS
yyjWpXKwhHapWFN42zXrIGFmLMyL2GM/5uO64BW65CJmuxKC0MjtBqhQ6uUicdHd
8ogrOHQwGqLRjqleDmHhalCtBmOemxYZWefXFGz6X2o/v3NEG6Ps/yuln81bPoDg
EYLJWmtzxhBy/5jfskv089Q=
-----END PRIVATE KEY-----`,
    client_email: "firebase-adminsdk-fbsvc@legaltechv2.iam.gserviceaccount.com",
    client_id: "101568004577036068456",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40legaltechv2.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: "https://legaltechv2.firebaseio.com",
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
