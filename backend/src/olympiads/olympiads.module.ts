import { Module } from '@nestjs/common';
import { OlympiadsService } from './olympiads.service';
import { OlympiadsController } from './olympiads.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [OlympiadsController],
  providers: [OlympiadsService],
  exports: [OlympiadsService],
})
export class OlympiadsModule {}