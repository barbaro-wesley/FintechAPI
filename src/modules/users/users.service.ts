import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { Role } from '@prisma/client'
import { UsersRepository } from './users.repository'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UpdateMeDto } from './dto/update-me.dto'
import { validateCpfCnpj } from '../../common/utils/cpf-cnpj.util'

@Injectable()
export class UsersService {
    constructor(private usersRepository: UsersRepository) { }

    async create(dto: CreateUserDto) {
        if (!validateCpfCnpj(dto.document)) {
            throw new BadRequestException('CPF ou CNPJ inválido')
        }

        if (await this.usersRepository.existsByEmail(dto.email)) {
            throw new ConflictException('E-mail já cadastrado')
        }

        if (await this.usersRepository.existsByDocument(dto.document)) {
            throw new ConflictException('CPF/CNPJ já cadastrado')
        }

        const hashedPassword = await bcrypt.hash(dto.password, 12)

        // Role SEMPRE começa como USER — nunca aceita role do payload
        return this.usersRepository.create({
            ...dto,
            password: hashedPassword,
            role: Role.USER,
        })
    }

    async findAll(page = 1, limit = 20) {
        return this.usersRepository.findAll({ page, limit })
    }

    async findOne(id: string) {
        const user = await this.usersRepository.findById(id)
        if (!user) throw new NotFoundException('Usuário não encontrado')
        return user
    }

    async updateByAdmin(id: string, dto: UpdateUserDto, adminId: string) {
        const user = await this.usersRepository.findById(id)
        if (!user) throw new NotFoundException('Usuário não encontrado')

        // Admin não pode rebaixar a si mesmo
        if (id === adminId && dto.role && dto.role !== Role.ADMIN) {
            throw new ForbiddenException('Você não pode alterar sua própria role')
        }

        // Admin não pode desativar a si mesmo
        if (id === adminId && dto.isActive === false) {
            throw new ForbiddenException('Você não pode desativar sua própria conta')
        }

        return this.usersRepository.update(id, dto)
    }

    async updateMe(id: string, dto: UpdateMeDto) {
        const user = await this.usersRepository.findById(id)
        if (!user) throw new NotFoundException('Usuário não encontrado')

        // dto.UpdateMeDto não tem role/isActive/isVerified — seguro por design
        return this.usersRepository.update(id, dto)
    }

    async remove(id: string, adminId: string) {
        if (id === adminId) {
            throw new ForbiddenException('Você não pode excluir sua própria conta')
        }

        const user = await this.usersRepository.findById(id)
        if (!user) throw new NotFoundException('Usuário não encontrado')

        return this.usersRepository.softDelete(id)
    }
}
