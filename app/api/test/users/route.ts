import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        password: true, // Include password to verify it exists
      }
    })
    
    return NextResponse.json({
      count: users.length,
      users: users.map(user => ({
        ...user,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
      }))
    })
  } catch (error) {
    console.error('Test users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
