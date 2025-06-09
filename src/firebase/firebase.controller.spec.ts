import { Test, TestingModule } from '@nestjs/testing';
import { FirestoreController } from './firebase.controller';
import { FirebaseService } from './firebase.service';

describe('FirebaseController', () => {
  let controller: FirestoreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FirestoreController],
      providers: [FirebaseService],
    }).compile();

    controller = module.get<FirestoreController>(FirestoreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
