import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
// import { GoogleDriveController } from 'src/google_drive/google.drive.controller';
// import { GoogleDriveModule } from 'src/google_drive/google.drive.module';
// import { GoogleDriveService } from 'src/google_drive/google.drive.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
