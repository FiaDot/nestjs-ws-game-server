import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from "@nestjs/common";

const logger = new Logger('main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  const configService: ConfigService = app.get(ConfigService);

  const port = process.env.PORT || configService.get('PORT');
  await app.listen(port);

  logger.log(
    `App listening at ${port} pid=${process.pid} env=${process.env.NODE_ENV}`,
  );
}
bootstrap();
