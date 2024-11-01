import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExcelStreamInterceptor } from './interceptors/excel-stream.interceptor';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ExcelStreamInterceptor],
})
export class AppModule {}
