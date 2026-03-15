import { Controller, Post, Body, Res, Req, HttpCode, UseGuards } from '@nestjs/common'
import type { Response, Request } from 'express'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS em produção
  sameSite: 'strict' as const,
  path: '/',
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  // Rate limiting reforçado no login: 5 tentativas / 60s
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(
      dto,
      req.headers['user-agent'],
      req.ip,
    )

    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutos em ms
    })

    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
      path: '/api/v1/auth/refresh', // Restringe o cookie apenas à rota de refresh
    })

    return { message: 'Login realizado com sucesso' }
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token
    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token não encontrado' })
      return
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refresh(
      refreshToken,
      req.headers['user-agent'],
      req.ip,
    )

    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    })

    res.cookie('refresh_token', newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    })

    return { message: 'Token renovado com sucesso' }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token
    await this.authService.logout(refreshToken)

    res.clearCookie('access_token', COOKIE_OPTIONS)
    res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/v1/auth/refresh' })

    return { message: 'Logout realizado com sucesso' }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(200)
  async logoutAll(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { id: string }
    await this.authService.logoutAll(user.id)

    res.clearCookie('access_token', COOKIE_OPTIONS)
    res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/v1/auth/refresh' })

    return { message: 'Sessão encerrada em todos os dispositivos' }
  }
}
