const { PrismaClient, Role } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
    console.log('Bắt đầu seed database...')

    const adminEmail = process.env.ADMIN_EMAIL || 'superAdmin@tutorcenter.com'
    const adminPassword = process.env.ADMIN_PASSWORD || '12345678'
    const adminFullName = process.env.ADMIN_FULL_NAME || 'Root Admin'
    const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER || '0123456789'

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    })

    if (existingAdmin) {
        console.log('Admin đã tồn tại:', existingAdmin.email)
        return
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const admin = await prisma.user.create({
        data: {
            fullName: adminFullName,
            email: adminEmail,
            passwordHash: hashedPassword,
            phoneNumber: adminPhoneNumber,
            role: Role.admin,
            isActive: true,
        },
    })

    console.log('Đã tạo admin user thành công!')
    console.log('Email:', admin.email)
    console.log('Tên:', admin.fullName)
    console.log('Role:', admin.role)
    console.log('Số điện thoại:', admin.phoneNumber)
}

main()
    .catch((error) => {
        console.error('Lỗi khi seed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
