import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { Prisma } from '@prisma/client'

// Campos retornados publicamente — nunca expõe a senha
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  document: true,
  personType: true,
  role: true,
  isActive: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) { }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      select: safeUserSelect,
    })
  }

  async findAll(params: { page: number; limit: number }) {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: safeUserSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ])

    return { users, total, page, limit }
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    })
  }

  // Usado internamente no auth — retorna senha também
  async findByIdWithPassword(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async findByDocument(document: string) {
    return this.prisma.user.findUnique({ where: { document } })
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    })
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: safeUserSelect,
    })
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } })
    return count > 0
  }

  async existsByDocument(document: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { document } })
    return count > 0
  }
}
