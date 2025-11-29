import { Module } from '@nestjs/common';
import { ValidateSessionService } from './application/services/validate-session.service';
import { LoginService } from './application/services/login.service';
import { LogoutService } from './application/services/logout.service';
import { RefreshTokenService } from './application/services/refresh-token.service';
import { RegisterService } from './application/services/register.service';
import { AuthController } from './application/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [
    ValidateSessionService,
    LoginService,
    LogoutService,
    RefreshTokenService,
    RegisterService,
  ],
})
export class AuthModule {}
