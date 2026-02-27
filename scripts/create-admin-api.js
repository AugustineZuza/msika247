const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminAccount() {
  try {
    const adminEmail = 'lumbanizuza@gmail.com'
    const adminPassword = '21chase??'
    const adminUsername = 'adminZUZA'

    console.log('Creating admin account...')

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
        console.log('✅ Updated existing user to ADMIN role')
      } else {
        console.log('✅ User is already an ADMIN')
      }
    } else {
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
    }

    console.log('\n✅ Admin account is ready to use!')
    console.log('Login Credentials:')
    console.log('📧 Email: lumbanizuza@gmail.com')
    console.log('🔑 Password: 21chase??')
    console.log('👤 Username: adminZUZA')
    console.log('\n🌐 Access the admin panel at: http://localhost:3000/admin')

  } catch (error) {
    console.error('❌ Error creating admin account:', error)
    console.error('Make sure your database is running and DATABASE_URL is set correctly')
  } finally {
    await prisma.$disconnect()
  }
}

createAdminAccount()
