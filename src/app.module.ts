import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileStreamInterceptor } from './interceptors/file-stream.interceptor';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, FileStreamInterceptor],
})
export class AppModule {}
