// update-user.dto.ts — admin pode atualizar esses campos
import {
    IsString,
    IsOptional,
    MaxLength,
    IsMobilePhone,
    IsBoolean,
    IsEnum,
} from 'class-validator'
import { Role } from '@prisma/client'

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string

    @IsOptional()
    @IsMobilePhone('pt-BR')
    phone?: string

    @IsOptional()
    @IsBoolean()
    isActive?: boolean

    @IsOptional()
    @IsBoolean()
    isVerified?: boolean

    // Apenas ADMIN pode promover para ADMIN — validado no service
    @IsOptional()
    @IsEnum(Role)
    role?: Role
}
