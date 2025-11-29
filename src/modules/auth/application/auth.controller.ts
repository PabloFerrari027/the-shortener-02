import {
  Controller,
  Post,
  Param,
  Body,
  Injectable,
  HttpCode,
} from '@nestjs/common';
import { LoginService } from './services/login.service';
import { LogoutService } from './services/logout.service';
import { RefreshTokenService } from './services/refresh-token.service';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ValidateSessionService } from './services/validate-session.service';
import { RegisterService } from './services/register.service';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsJWT, IsString, IsUUID, MinLength } from 'class-validator';
import { SessionPresentation } from './presentation/session.presentation';

class Session {
  @ApiProperty({
    example: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
    required: true,
  })
  session_id: string;

  @ApiProperty({
    example: 'Bearer b7f9d2a3-4567-8901-abcd-ef2345678901',
    required: true,
  })
  access_token: string;

  @ApiProperty({
    example: 'Bearer b7f9d2a3-4567-8901-abcd-ef2345678901',
    required: true,
  })
  refresh_token: string;
}

class LoginBody {
  @ApiProperty({
    example: 'user@email.com',
    description: 'Email of the user',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123abc',
    description: 'Password of the user',
    required: true,
  })
  @IsString()
  password: string;
}

class LogoutParam {
  @ApiProperty({
    description: 'Unique identifier of the session (UUID format).',
    example: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
    required: true,
  })
  @IsUUID()
  session_id: string;
}

class RefreshTokenBody {
  @ApiProperty({
    description: 'Access token',
    required: true,
  })
  @IsJWT()
  access_token: string;

  @ApiProperty({
    description: 'Refresh token',
    required: true,
  })
  @IsJWT()
  refresh_token: string;
}

class RegisterBody {
  @ApiProperty({
    example: 'Pablo',
    description: 'Name of the user',
    required: true,
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: 'user@email.com',
    description: 'Email of the user',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123abc',
    description: 'Password of the user',
    required: true,
  })
  @IsString()
  password: string;
}

class ValidateSessionBody {
  @ApiProperty({
    description: 'Code generated to validate the session',
    example: '123456',
    required: true,
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Unique identifier of the session (UUID format).',
    example: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
    required: true,
  })
  @IsUUID()
  session_id: string;
}

@Controller('auth')
@Injectable()
@ApiBadRequestResponse({
  description: 'The request could not be processed due to invalid input.',
  schema: {
    type: 'object',
    properties: {
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
  },
})
@ApiInternalServerErrorResponse({
  description: 'An internal server error occurred.',
  schema: {
    type: 'object',
    properties: {
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
  },
})
@ApiNotFoundResponse({
  description: 'Some requested resource was not found',
  schema: {
    type: 'object',
    properties: {
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
  },
})
export class AuthController {
  constructor(
    private readonly ValidateSessionUseCase: ValidateSessionService,
    private readonly loginUseCase: LoginService,
    private readonly logoutUseCase: LogoutService,
    private readonly refreshTokenUseCase: RefreshTokenService,
    private readonly registerUseCase: RegisterService,
  ) {}

  @Post('/register')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'User successfully created',
    type: Session,
  })
  @ApiOperation({
    summary: 'Register new user',
    description: `When registering a new user, a **validation session** will be generated and displayed in the terminal. You must provide this code to the **validation service** to confirm your session.`,
  })
  async register(@Body() body: RegisterBody) {
    const response = await this.registerUseCase.execute(body);
    return SessionPresentation.toController({
      session: response.session,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
  }

  @Post('/login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login',
    description: `When you log in, a **validation session** will be generated and displayed in the terminal. You must provide this code to the **validation service** to confirm your session.`,
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: Session,
  })
  async login(@Body() body: LoginBody) {
    const response = await this.loginUseCase.execute(body);
    return SessionPresentation.toController({
      session: response.session,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
  }

  @Post('/validate/session')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Validate session',
    description: `
Upon successfully validating the session, you will receive two tokens: an **access token** and a **refresh token**.

- The **access token** is valid for **1 hour** and must be sent in the authentication header (\`Authorization: Bearer <token>\`) to access protected routes.
- The **refresh token** can be used to obtain a new access token once the current one expires, without requiring full re-authentication.
`,
  })
  @ApiOkResponse({
    description: 'Session successfully validated',
  })
  async validateCode(@Body() body: ValidateSessionBody) {
    await this.ValidateSessionUseCase.execute({
      code: body.code,
      sessionId: body.session_id,
    });
  }

  @Post('/refresh/token')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Refresh access token',
    description: `
After refreshing your access token, you will receive a **new access token** and a **new refresh token**.  

- The **access token** is valid for **1 hour** and should be included in the authentication header (\`Authorization: Bearer <token>\`) to access protected routes.  
- The **refresh token** can be used to obtain a new access token again without requiring a full login.
`,
  })
  @ApiOkResponse({
    description: 'Access token refresh completed successfully',
    type: Session,
  })
  async refresh(@Body() body: RefreshTokenBody) {
    const response = await this.refreshTokenUseCase.execute({
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
    });

    return SessionPresentation.toController({
      session: response.session,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
  }

  @Post('/logout/:session_id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'End session',
    description: `Once the session is terminated, you **will no longer be able to access protected routes** until you log in and validate your session again. Make sure to log in again to continue accessing the API's protected resources.`,
  })
  @ApiOkResponse({ description: 'Session ended successfully' })
  async logout(@Param() params: LogoutParam) {
    await this.logoutUseCase.execute({ sessionId: params.session_id });
  }
}
