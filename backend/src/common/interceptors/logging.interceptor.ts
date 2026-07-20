import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, body, user } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = user?.id || 'anonymous';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - now;
          this.logger.log(
            `${method} ${url} ${response?.statusCode || 200} - ${duration}ms - User: ${userId} - IP: ${ip}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `${method} ${url} ${error.status || 500} - ${duration}ms - User: ${userId} - IP: ${ip} - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}