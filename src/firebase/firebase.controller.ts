import { Controller, Get, Param, Post, Body, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Firestore')
@Controller('firestore')
export class FirestoreController {
  constructor(private readonly firebaseService: FirebaseService) {}

}