import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Cookie parser — obrigatório para HTTP-only cookies
  app.use(cookieParser())

  // CORS — credentials obrigatório para cookies HTTP-only cross-origin
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })

  // Validação global com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Filtro global de exceções
  app.useGlobalFilters(new HttpExceptionFilter())

  app.setGlobalPrefix('api/v1')

  await app.listen(process.env.PORT ?? 3000)
  console.log(`🚀 Servidor rodando na porta ${process.env.PORT ?? 3000}`)
}
bootstrap()
