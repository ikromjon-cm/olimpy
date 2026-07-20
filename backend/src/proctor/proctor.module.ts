import { Module } from '@nestjs/common';
import { ProctorService } from './proctor.service';
import { ProctorController } from './proctor.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [PrismaModule, AttendanceModule],
  controllers: [ProctorController],
  providers: [ProctorService],
  exports: [ProctorService],
})
export class ProctorModule {}