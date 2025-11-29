import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Injectable,
  Param,
  Patch,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiFoundResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateShortUrlService } from './services/create-short-url.service';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { HandleShortUrlService } from './services/handle-short-url.service';
import { ShortUrlPresentation } from './presentation/short-url.presentation';
import { ListShortnerUrlsService } from './services/list-shortner-urls.service';
import { ShortUrlProps } from '../domain/entities/short-url.entity';
import { Transform } from 'class-transformer';
import { DeleteShortUrlService } from './services/delete-short-url.service';
import { UpdateShortUrlService } from './services/update-short-url.service';

class ShortUrl {
  @ApiProperty({
    example: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
    required: true,
  })
  id: string;

  @ApiProperty({
    example: 'http://example.com/long-url',
    required: true,
  })
  url: string;

  @ApiProperty({
    example: '123abc',
    required: true,
  })
  hash: string;

  @ApiProperty({
    example: `http://localhost:3000/123abc`,
    required: true,
  })
  short_url: string;

  @ApiProperty({
    example: 9999,
    required: true,
  })
  click_count: number;

  @ApiProperty({
    example: '2025-11-27T15:48:00-03:00',
    required: true,
  })
  created_at: string;

  @ApiProperty({
    example: '2025-11-27T15:48:00-03:00',
    required: true,
  })
  updated_at: string;
}

class ListShortUrlsResponse {
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
    type: () => [ShortUrl],
    required: true,
  })
  data: Array<ShortUrl>;
}

class CreateShortUrlBody {
  @ApiProperty({ example: 'http://example.com/long-url', required: true })
  @IsNotEmpty()
  @IsUrl()
  url!: string;
}

class UpdateShortUrlBody {
  @ApiProperty({ example: 'http://example.com/new-long-url', required: true })
  @IsNotEmpty()
  @IsUrl()
  url!: string;
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

enum Order {
  ASC = 'asc',
  DESC = 'desc',
}

enum OrderBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

class ListShortenerUrlsQuery {
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

class RedirectParams {
  @ApiProperty({ example: 'abc123', required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  hash: string;
}

@Controller()
@Injectable()
@ApiUnauthorizedResponse({
  description: `
  The request was not authorized. This can occur if:
  
  - The **access token** is missing, invalid, or expired.
  - The user does not have permission to access the requested resource.
  Ensure that a valid access token is provided in the \`Authorization: Bearer <token>\` header.
  `,
})
@ApiBadRequestResponse({
  description: 'The request could not be processed due to invalid input.',
})
@ApiInternalServerErrorResponse({
  description: 'An internal server error occurred.',
})
@ApiNotFoundResponse({
  description: 'Some requested resource was not found',
})
@ApiBearerAuth()
export class ShortUrlController {
  constructor(
    @Inject()
    private readonly createShortUrlService: CreateShortUrlService,
    @Inject()
    private readonly listShortnerUrlsService: ListShortnerUrlsService,
    @Inject()
    private readonly handleShortUrlService: HandleShortUrlService,
    @Inject()
    private readonly updateShortUrlService: UpdateShortUrlService,
    @Inject()
    private readonly deleteShortUrlService: DeleteShortUrlService,
  ) {}

  @Post('/short-url')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a short url' })
  @ApiOkResponse({
    description: 'Short url created successfully',
    type: ShortUrl,
  })
  async create(@Body() body: CreateShortUrlBody) {
    const response = await this.createShortUrlService.execute({
      url: body.url,
    });

    const output = ShortUrlPresentation.toController(response.shortUrl);
    return output;
  }

  @Get('/short-url')
  @HttpCode(200)
  @ApiOperation({ summary: 'List shotener urls' })
  @ApiOkResponse({
    description: 'Shortened URLs successfully listed.',
    type: ListShortUrlsResponse,
  })
  async list(@Query() params: ListShortenerUrlsQuery) {
    const orderByOptions = { created_at: 'createdAt', updated_at: 'updatedAt' };
    const orderBy = orderByOptions[
      params?.order_by ?? OrderBy.CREATED_AT
    ] as keyof ShortUrlProps;

    const response = await this.listShortnerUrlsService.execute({
      page: params.page ?? 1,
      order: params.order,
      orderBy,
    });

    const output = ShortUrlPresentation.toController(
      response.data,
      response.totalPages,
      response.currentPage,
    );

    return output;
  }

  @Patch('/short-url/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a short url' })
  @ApiOkResponse({
    description: 'Short url updated successfully',
    type: ShortUrl,
  })
  async update(@Param() params: IdParam, @Body() body: UpdateShortUrlBody) {
    const response = await this.updateShortUrlService.execute({
      id: params.id,
      url: body.url,
    });

    const output = ShortUrlPresentation.toController(response.shortUrl);
    return output;
  }

  @Delete('/short-url/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a short url' })
  @ApiOkResponse({
    description: 'Short url deleted successfully',
  })
  async delete(@Param() params: IdParam) {
    await this.deleteShortUrlService.execute({
      id: params.id,
    });
  }

  @Get('/:hash')
  @HttpCode(302)
  @Redirect()
  @ApiOperation({ summary: 'Redirect to the original url' })
  @ApiFoundResponse({
    description: 'Redirection successful',
  })
  async redirect(@Param() params: RedirectParams) {
    const response = await this.handleShortUrlService.execute({
      hash: params.hash,
    });

    if (!response) return null;

    return { url: response.shortUrl.url };
  }
}
