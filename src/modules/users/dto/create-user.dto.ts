// create-user.dto.ts
import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    IsMobilePhone,
    IsEnum,
} from 'class-validator'
import { PersonType } from '@prisma/client'

export class CreateUserDto {
    @IsString()
    @MaxLength(100)
    name: string

    @IsEmail()
    email: string

    @IsString()
    @MinLength(8)
    @MaxLength(64)
    password: string

    @IsMobilePhone('pt-BR')
    phone: string

    @IsString()
    document: string // CPF ou CNPJ

    @IsEnum(PersonType)
    personType: PersonType

    // ❌ role NÃO está aqui — usuário nunca define a própria role
}
