// register.dto.ts
import { IsEmail, IsString, MinLength, IsMobilePhone, IsEnum } from 'class-validator'
import { PersonType } from '@prisma/client'

export class RegisterDto {
  @IsString()
  name: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsMobilePhone('pt-BR')
  phone: string

  @IsString()
  document: string  // CPF ou CNPJ — validado no service

  @IsEnum(PersonType)
  personType: PersonType
}
