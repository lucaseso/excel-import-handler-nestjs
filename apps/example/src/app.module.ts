import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExcelStreamMiddleware } from '@mtrix-df/apidevtools';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ExcelStreamMiddleware).forRoutes('/test/interceptor'); // Aplica o middleware na rota específica
  }
}
