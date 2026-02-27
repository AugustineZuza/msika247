import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminAccount() {
  try {
    const adminEmail = 'lumbanizuza@gmail.com'
    const adminPassword = '21chase??'
    const adminUsername = 'adminZUZA'

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingUser) {
      console.log('Admin user already exists:', existingUser.email)
      
      // Update existing user to admin role if not already
      if (existingUser.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'ADMIN' }
        })
        console.log('Updated existing user to ADMIN role')
      }
      return
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminUsername,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      }
    })

    console.log('✅ Admin account created successfully!')
    console.log('Email:', adminUser.email)
    console.log('Username:', adminUser.name)
    console.log('Role:', adminUser.role)
    console.log('ID:', adminUser.id)

    console.log('✅ Admin account is ready to use!')
    console.log('You can now login with:')
    console.log('Email: lumbanizuza@gmail.com')
    console.log('Password: 21chase??')

  } catch (error) {
    console.error('❌ Error creating admin account:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminAccount()
