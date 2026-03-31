import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api');

  const port = process.env.PORT || process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`API corriendo en http://localhost:${port}/api`);
}
bootstrap();
