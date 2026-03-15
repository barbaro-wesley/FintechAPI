import 'dotenv/config'
import { PrismaClient, Role, PersonType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'

// Prisma 7 exige adapter explícito
const pool = new Pool({
    connectionString: process.env.DIRECT_URL, // seed usa conexão direta
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Iniciando seed...')

    const email = 'wendelbarbaro@gmail.com'
    const password = 'wendel@2026'

    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
        console.log(`⚠️  Usuário ${email} já existe — seed ignorado.`)
        return
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const admin = await prisma.user.create({
        data: {
            name: 'Wendel Barbaro',
            email,
            password: hashedPassword,
            phone: '(54) 99999-9999',
            document: '529.982.247-25',
            personType: PersonType.PF,
            role: Role.ADMIN,
            isActive: true,
            isVerified: true,
        },
    })

    console.log(`✅ Admin criado: ${admin.email} (id: ${admin.id})`)
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
