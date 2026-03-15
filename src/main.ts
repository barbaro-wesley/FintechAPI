import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Cookie parser — obrigatório para HTTP-only cookies
  app.use(cookieParser())

  // Validação global com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Remove campos não declarados no DTO
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Filtro global de exceções
  app.useGlobalFilters(new HttpExceptionFilter())

  app.setGlobalPrefix('api/v1')

  await app.listen(process.env.PORT || 3000)
}
bootstrap()
