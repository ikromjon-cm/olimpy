import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ResultsModule } from '../results/results.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [PrismaModule, ResultsModule, FilesModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}