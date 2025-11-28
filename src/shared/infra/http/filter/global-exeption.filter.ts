import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { CustomError } from '../../../common/custom-error';

type Exception = CustomError | HttpException;

type ExceptionResponse =
  | { message: string | string[]; statusCode: number; code: string }
  | string;

@Catch(Error)
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Exception, host: ArgumentsHost) {
    console.log(exception.message);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errors: Array<{ message: string }> = [];
    let status = 500;

    if (exception instanceof HttpException) {
      const exceptionRes = exception.getResponse() as ExceptionResponse;

      if (typeof exceptionRes === 'object') {
        status = exceptionRes.statusCode;

        if (typeof exceptionRes.message === 'string') {
          errors.push({ message: exceptionRes.message });
        } else {
          exceptionRes.message.forEach((m) => errors.push({ message: m }));
        }
      }
    }

    if (exception instanceof CustomError) {
      errors.push({ message: exception.message });
      status = exception.statusCode;
    }

    response.status(status).json({ errors });
  }
}
