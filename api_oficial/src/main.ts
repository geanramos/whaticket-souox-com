import { Logger } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ErrorExceptionFilter } from './@core/infra/filters/error-exception.filter';
import { PrismaClienteExceptionFilter } from './@core/infra/filters/prisma.filter';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('MainServer');
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new ErrorExceptionFilter());
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClienteExceptionFilter(httpAdapter));

  const config = new DocumentBuilder()
    .setTitle('Mult100 Router API')
    .setDescription('API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();

  const options: SwaggerDocumentOptions = {
    include: [],
  };

  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(process.env.PORT);
  logger.log(`🚀 Servidor API Oficial iniciado na porta ${process.env.PORT}`);
}
bootstrap();
