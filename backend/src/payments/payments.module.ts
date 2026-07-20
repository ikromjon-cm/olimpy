import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { FilesModule } from '../files/files.module';
import { RedisModule } from '../redis/redis.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    PrismaModule,
    RegistrationsModule,
    FilesModule,
    RedisModule,
    SmsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}