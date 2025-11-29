import {
  Controller,
  Param,
  Body,
  Injectable,
  HttpCode,
  Query,
  Get,
  Put,
  Delete,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';
import { UserProps, UserRole } from '../domain/entities/user.entity';
import { ListUsersService } from './services/list-users.service';
import { RemoveUserService } from './services/remove-user.service';
import { UpdateUserService } from './services/update-user.service';
import { UserPresentation } from './presentation/user.presentation';

class User {
  @ApiProperty({
    example: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
    required: true,
  })
  id: string;

  @ApiProperty({
    example: 'Pablo',
    required: true,
  })
  name: string;

  @ApiProperty({
    example: 'example@gmail.com',
    required: true,
  })
  email: string;

  @ApiProperty({
    example: 'ADMIN',
    required: true,
  })
  role: string;

  @ApiProperty({
    example: '2025-11-29T12:20:29-03:00',
    required: true,
  })
  created_at: string;

  @ApiProperty({
    example: '2025-11-29T12:20:29-03:00',
    required: true,
  })
  updated_at: string;
}

class IdParam {
  @ApiProperty({
    example: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

class UpdateUserBody {
  @ApiProperty({
    example: 'ADMIN',
    required: false,
  })
  @Transform(({ value }) => String(value as UserRole).toUpperCase())
  @IsEnum(UserRole)
  role?: string;
}

class ListgUsersResponse {
  @ApiProperty({
    example: 1,
    required: true,
  })
  current_page: number;

  @ApiProperty({
    example: 1,
    required: true,
  })
  total_pages: number;

  @ApiProperty({
    type: () => [User],
    required: true,
  })
  data: Array<User>;
}

enum Order {
  ASC = 'asc',
  DESC = 'desc',
}

enum OrderBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

class ListUsersQuery {
  @ApiProperty({ example: 1, required: false })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 'created_at', required: false })
  @Transform(({ value }) => (value as string).toLowerCase())
  @IsEnum(OrderBy)
  order_by?: OrderBy;

  @ApiProperty({ example: 'desc', required: false })
  @Transform(({ value }) => (value as string).toLowerCase())
  @IsEnum(Order)
  order?: Order;
}

@Controller('users')
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
export class UsersController {
  constructor(
    private readonly listUsersService: ListUsersService,
    private readonly removeUserService: RemoveUserService,
    private readonly updateUserService: UpdateUserService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({
    description: 'Users successfully listed.',
    type: ListgUsersResponse,
  })
  async list(@Query() params: ListUsersQuery) {
    const orderByOptions = { created_at: 'createdAt', updated_at: 'updatedAt' };
    const orderBy = orderByOptions[
      params?.order_by ?? OrderBy.CREATED_AT
    ] as keyof UserProps;

    const response = await this.listUsersService.execute({
      page: params.page ?? 1,
      order: params.order,
      orderBy,
    });

    const output = UserPresentation.toController(
      response.data,
      response.totalPages,
      response.currentPage,
    );

    return output;
  }

  @Put('/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update an user' })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: User,
  })
  async update(@Param() params: IdParam, @Body() body: UpdateUserBody) {
    const response = await this.updateUserService.execute({
      id: params.id,
      role: body.role as UserRole,
    });

    const output = UserPresentation.toController(response.user);
    return output;
  }

  @Delete('/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an user' })
  @ApiOkResponse({
    description: 'User deleted successfully',
  })
  async delete(@Param() params: IdParam) {
    await this.removeUserService.execute({
      id: params.id,
    });
  }
}
