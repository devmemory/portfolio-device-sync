import { config } from 'dotenv';

config();

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { allowOrigin } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupGlobalOption(app);

  setupSwagger(app);

  app.enableShutdownHooks();

  await app.listen(8080);
}

bootstrap();

const setupGlobalOption = (app: INestApplication) => {
  app.use(cookieParser());

  app.use(helmet());

  app.enableCors({
    origin: allowOrigin(),
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['api-docs', 'metrics'] });

  // dto class validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
};

const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Admin API')
    .setDescription('Admin & Auth API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    useGlobalPrefix: false,
  });
};
