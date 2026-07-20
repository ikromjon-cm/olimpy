import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OlympiadsModule } from './olympiads/olympiads.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { RedisModule } from './redis/redis.module';
import { PaymentsModule } from './payments/payments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ResultsModule } from './results/results.module';
import { AdminModule } from './admin/admin.module';
import { ProctorModule } from './proctor/proctor.module';
import { FilesModule } from './files/files.module';
import { CommonModule } from './common/common.module';
import { RegionsModule } from './regions/regions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: (config) => {
        const required = [
          'DATABASE_URL',
          'JWT_SECRET',
          'JWT_REFRESH_SECRET',
        ];
        for (const key of required) {
          if (!config[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
          }
        }
        return config;
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL') || 60,
            limit: config.get('THROTTLE_LIMIT') || 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    CommonModule,
    AuthModule,
    UsersModule,
    OlympiadsModule,
    RegistrationsModule,
    PaymentsModule,
    AttendanceModule,
    ResultsModule,
    AdminModule,
    ProctorModule,
    FilesModule,
    RegionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}