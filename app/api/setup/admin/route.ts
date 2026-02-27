import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
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
        return NextResponse.json({ 
          message: 'Admin account updated successfully',
          email: adminEmail,
          username: adminUsername
        })
      } else {
        console.log('✅ User is already an ADMIN')
        return NextResponse.json({ 
          message: 'Admin account already exists',
          email: adminEmail,
          username: adminUsername
        })
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

      return NextResponse.json({ 
        message: 'Admin account created successfully',
        email: adminEmail,
        username: adminUsername,
        userId: adminUser.id
      })
    }

  } catch (error: unknown) {
    console.error('❌ Error creating admin account:', error)
    return NextResponse.json(
      { error: 'Failed to create admin account', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Admin setup endpoint',
    instructions: 'Send POST request to create admin account'
  })
}
