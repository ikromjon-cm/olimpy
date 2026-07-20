import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => {
          const path = e.path.join('.');
          return `${path}: ${e.message}`;
        });
        throw new BadRequestException({
          message: 'Ma\'lumotlar validatsiyasidan o\'tmadi',
          errors: messages,
        });
      }
      throw new BadRequestException('Validatsiya xatosi');
    }
  }
}