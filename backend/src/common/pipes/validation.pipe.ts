import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });

    if (errors.length > 0) {
      const messages = errors.map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'Validatsiya xatosi';
        return `${error.property}: ${constraints}`;
      });

      console.error('Validation errors payload:', value);
      console.error('Validation errors details:', JSON.stringify(errors, null, 2));

      throw new BadRequestException({
        message: 'Ma\'lumotlar validatsiyasidan o\'tmadi',
        errors: messages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}