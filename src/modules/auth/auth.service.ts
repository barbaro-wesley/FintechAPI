import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { UsersRepository } from '../users/users.repository'
import { PrismaService } from '../../database/prisma.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { validateCpfCnpj } from '../../common/utils/cpf-cnpj.util'

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async register(dto: RegisterDto) {
    // Valida CPF/CNPJ
    if (!validateCpfCnpj(dto.document)) {
      throw new BadRequestException('CPF ou CNPJ inválido')
    }

    // Verifica duplicidade
    const emailExists = await this.usersRepository.findByEmail(dto.email)
    if (emailExists) throw new ConflictException('E-mail já cadastrado')

    const docExists = await this.usersRepository.findByDocument(dto.document)
    if (docExists) throw new ConflictException('CPF/CNPJ já cadastrado')

    const hashedPassword = await bcrypt.hash(dto.password, 12)

    const user = await this.usersRepository.create({
      ...dto,
      password: hashedPassword,
    })

    return user
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await this.usersRepository.findByEmail(dto.email)

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password)
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role)

    // Salva refresh token no banco
    await this.saveRefreshToken(user.id, tokens.refreshToken, userAgent, ipAddress)

    return tokens
  }

  async refresh(refreshToken: string, userAgent?: string, ipAddress?: string) {
    // Verifica token no banco
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado')
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('Usuário inativo')
    }

    // Rotação de refresh token — invalida o atual e gera novo
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    })

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    )

    await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken, userAgent, ipAddress)

    return tokens
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return

    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    })
  }

  async logoutAll(userId: string) {
    // Revoga TODOS os refresh tokens do usuário (ex: "sair de todos os dispositivos")
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    })
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') as any,
      }),
    ])

    return { accessToken, refreshToken }
  }

  private async saveRefreshToken(
    userId: string,
    token: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 dias

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
      },
    })
  }
}
