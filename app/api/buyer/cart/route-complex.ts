import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
    }

    // Check if user exists first
    let user = await prisma.user.findUnique({
      where: { id: token.sub }
    })

    if (!user) {
      console.error('User not found in database, attempting to find by email:', token.sub)
      console.log('Token data:', {
        sub: token.sub,
        email: token.email,
        name: token.name,
        role: token.role
      })
      
      // User doesn't exist in database but has valid token
      // This can happen after database reset/reseed
      try {
        // First, try to find user by email
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: token.email || '' }
        })
        
        if (existingUserByEmail) {
          console.log('Found existing user by email, using that user:', existingUserByEmail.id)
          user = existingUserByEmail
        } else {
          // Create new user if no existing user found
          const bcrypt = require('bcryptjs')
          const hashedPassword = await bcrypt.hash('temp-password-123', 12)
          
          console.log('Creating new user with data:', {
            id: token.sub,
            email: token.email,
            name: token.name,
            role: token.role
          })
          
          user = await prisma.user.create({
            data: {
              id: token.sub, // Use the same ID from token
              email: token.email || '',
              name: token.name || 'User',
              role: (token.role as any) || 'BUYER',
              password: hashedPassword, // Required field
            }
          })
          console.log('Successfully created new user in database:', user.id)
        }
      } catch (createError: any) {
        console.error('Failed to recreate user:', createError)
        console.error('Error details:', {
          code: createError.code,
          message: createError.message,
          meta: createError.meta
        })
        return NextResponse.json(
          { error: 'User account not found. Please try logging out and back in.' },
          { status: 404 }
        )
      }
    }

    // Get buyer profile
    let buyer = await prisma.buyer.findUnique({
      where: { userId: user.id } // Use the actual user ID (might be different from token.sub)
    })

    if (!buyer) {
      // Create buyer profile if it doesn't exist
      try {
        // Check if there's already a buyer profile for this user (in case of race conditions)
        const existingBuyer = await prisma.buyer.findUnique({
          where: { userId: user.id }
        })
        
        if (existingBuyer) {
          buyer = existingBuyer
        } else {
          buyer = await prisma.buyer.create({
            data: {
              userId: user.id, // Use the actual user ID
            }
          })
          console.log('Created buyer profile for user:', user.id)
        }
      } catch (createError: any) {
        console.error('Failed to create buyer profile:', createError)
        
        // If it's a foreign key constraint error, the user might not exist
        if (createError.code === 'P2003') {
          return NextResponse.json(
            { error: 'User account not found. Please try logging out and back in.' },
            { status: 404 }
          )
        }
        
        // If it's a unique constraint error, the buyer might already exist
        if (createError.code === 'P2002') {
          // Try to fetch the existing buyer
          buyer = await prisma.buyer.findUnique({
            where: { userId: user.id }
          })
          
          if (!buyer) {
            return NextResponse.json(
              { error: 'Failed to create buyer profile' },
              { status: 500 }
            )
          }
        } else {
          return NextResponse.json(
            { error: 'Failed to create buyer profile' },
            { status: 500 }
          )
        }
      }
    }

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { buyerId: buyer.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    businessName: true
                  }
                }
              }
            }
          }
        }
      }
    })

    console.log('Cart found for buyer:', buyer.id, 'Items count:', cart?.items?.length || 0)

    if (!cart) {
      console.log('No cart found for buyer:', buyer.id)
      return NextResponse.json({
        items: [],
        total: 0,
      })
    }

    // Calculate total
    const total = cart.items.reduce((sum: number, item: any) => {
      const price = item.product.discountPrice || item.product.price
      return sum + (price * item.quantity)
    }, 0)

    // Parse images JSON and format response
    const itemsWithParsedImages = cart.items.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        discountPrice: item.product.discountPrice,
        images: item.product.images ? JSON.parse(item.product.images) : [],
        seller: item.product.seller
      },
    }))

    return NextResponse.json({
      items: itemsWithParsedImages,
      total,
    })
  } catch (error) {
    console.error('Cart error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get buyer profile
    const buyer = await prisma.buyer.findUnique({
      where: { userId: token.sub }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      )
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { buyerId: buyer.id }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { buyerId: buyer.id }
      })
      console.log('Created new cart for buyer:', buyer.id)
    }

    console.log('Adding to cart - Product:', productId, 'Quantity:', quantity, 'Cart ID:', cart.id)

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    })

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          price: product.discountPrice || product.price,
        }
      })
      console.log('Updated existing cart item:', existingItem.id)
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.discountPrice || product.price,
        }
      })
      console.log('Created new cart item for product:', productId)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get buyer profile
    const buyer = await prisma.buyer.findUnique({
      where: { userId: token.sub }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      )
    }

    // Clear all cart items for this buyer
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          buyerId: buyer.id
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Cart cleared successfully' })
  } catch (error) {
    console.error('Clear cart error:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}
