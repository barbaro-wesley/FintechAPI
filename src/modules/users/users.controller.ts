import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    UseGuards,
    HttpCode,
    Post,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UpdateMeDto } from './dto/update-me.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Role } from '@prisma/client'
import { Throttle } from '@nestjs/throttler'

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    // ✅ PÚBLICO — tela de "Crie sua conta"
    // Rate limit reforçado: 10 cadastros / 60s por IP
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Post('register')
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto)
    }

    // ✅ ADMIN — listar todos os usuários
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    findAll(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
        return this.usersService.findAll(Number(page), Number(limit))
    }

    // ✅ LOGADO — ver próprio perfil
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@CurrentUser() user: { id: string }) {
        return this.usersService.findOne(user.id)
    }

    // ✅ LOGADO — editar próprio perfil (sem alterar role)
    @UseGuards(JwtAuthGuard)
    @Patch('me')
    updateMe(
        @CurrentUser() user: { id: string },
        @Body() dto: UpdateMeDto,
    ) {
        return this.usersService.updateMe(user.id, dto)
    }

    // ✅ ADMIN — buscar usuário por ID
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.findOne(id)
    }

    // ✅ ADMIN — atualizar usuário (pode promover para ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserDto,
        @CurrentUser() admin: { id: string },
    ) {
        return this.usersService.updateByAdmin(id, dto, admin.id)
    }

    // ✅ ADMIN — soft delete (desativa usuário)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    @HttpCode(200)
    remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() admin: { id: string },
    ) {
        return this.usersService.remove(id, admin.id)
    }
}
