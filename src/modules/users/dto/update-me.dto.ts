// update-me.dto.ts — usuário comum só pode alterar esses campos
import { IsString, IsOptional, MaxLength, IsMobilePhone } from 'class-validator'

export class UpdateMeDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string

    @IsOptional()
    @IsMobilePhone('pt-BR')
    phone?: string

    // ❌ Sem role, isActive, isVerified — usuário não toca nessas props
}
