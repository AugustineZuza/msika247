import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions: any = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your account. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
        <p style="margin-top: 20px;">If you didn't request this password reset, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html,
      text: `Reset your password by visiting: ${resetUrl}`,
    })
  }

  async sendEmailVerification(email: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Welcome!</p>
        <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email
        </a>
        <p style="margin-top: 20px;">If you didn't create an account, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html,
      text: `Verify your email by visiting: ${verificationUrl}`,
    })
  }

  async sendAccountActivation(email: string, activationToken: string): Promise<boolean> {
    const activationUrl = `${process.env.NEXTAUTH_URL}/activate-account?token=${activationToken}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Activate Your Account</h2>
        <p>Hello,</p>
        <p>Your account has been created and is ready to be activated. Click the link below to activate your account:</p>
        <a href="${activationUrl}" style="background-color: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Activate Account
        </a>
        <p style="margin-top: 20px;">Once activated, you'll be able to access all features of your account.</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 48 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `

    return this.sendEmail({
      to: email,
      subject: 'Activate Your Account',
      html,
      text: `Activate your account by visiting: ${activationUrl}`,
    })
  }

  async sendOrderConfirmationEmail(email: string, orderData: {
    orderNumber: string
    items: Array<{ name: string; quantity: number; price: number }>
    totalAmount: number
    shippingAddress: any
  }): Promise<boolean> {
    const { orderNumber, items, totalAmount, shippingAddress } = orderData
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Thank you for your order! Your order has been received and is now being processed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Total Amount:</strong> MWK ${totalAmount.toLocaleString()}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #333;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Quantity</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                  <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">MWK ${item.price.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #333;">Shipping Address</h3>
          <p>${shippingAddress.street || ''}</p>
          <p>${shippingAddress.city || ''}, ${shippingAddress.country || ''}</p>
          <p>Phone: ${shippingAddress.phone || ''}</p>
        </div>

        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;"><strong>Next Steps:</strong></p>
          <ul style="margin: 10px 0; color: #155724;">
            <li>You will receive another email when your order is shipped</li>
            <li>You can track your order status in your account dashboard</li>
            <li>Seller will process your order within 1-2 business days</li>
          </ul>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `

    return this.sendEmail({
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      html,
      text: `Order Confirmation - ${orderNumber}. Total: MWK ${totalAmount.toLocaleString()}`,
    })
  }

  async sendPaymentConfirmationEmail(email: string, paymentData: {
    amount: number
    transactionId: string
    orderNumber?: string
    paymentMethod: string
  }): Promise<boolean> {
    const { amount, transactionId, orderNumber, paymentMethod } = paymentData
    
    // Generate PDF receipt HTML
    const { GmailReceiptGenerator } = await import('./pdf-receipt-gmail')
    const pdfGenerator = new GmailReceiptGenerator()
    const receiptHTML = pdfGenerator.generateReceiptHTML({
      payment: {
        id: '',
        transactionId,
        amount,
        currency: 'MWK',
        status: 'SUCCESS',
        paymentMethod,
        stripePaymentIntentId: '',
        gatewayResponse: null,
        description: 'Payment confirmation',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '',
        orderId: '',
        subscriptionId: ''
      },
      order: {
        id: '',
        orderNumber: orderNumber || 'N/A',
        buyerId: '',
        sellerId: '',
        status: 'PAID',
        currency: 'MWK',
        subtotal: amount,
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        totalAmount: amount,
        shippingAddress: '',
        billingAddress: '',
        trackingNumber: '',
        notes: '',
        internalNotes: '',
        shippedAt: null,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      customerEmail: email,
      customerName: 'Customer'
    })
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Payment Successful</h2>
        <p>Your payment has been processed successfully. Thank you for your purchase!</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Payment Details</h3>
          <p><strong>Amount:</strong> MWK ${amount.toLocaleString()}</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          ${orderNumber ? `<p><strong>Order Number:</strong> ${orderNumber}</p>` : ''}
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #333;">What's Next?</h3>
          <ul>
            ${orderNumber ? `
              <li>Your order ${orderNumber} will be processed by the seller</li>
              <li>You'll receive shipping confirmation via email</li>
              <li>Track your order status in your dashboard</li>
            ` : `
              <li>Your subscription is now active</li>
              <li>You can access all premium features</li>
              <li>Manage your subscription in your account settings</li>
            `}
          </ul>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #6c757d;">
            <strong>Need Help?</strong> If you have any questions about this payment, 
            please contact our support team with your transaction ID: ${transactionId}
          </p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #1565c0;">
            <strong>📄 PDF Receipt:</strong> Your payment receipt is attached to this email as a downloadable PDF.
          </p>
        </div>
      </div>
    `

    // Create PDF receipt attachment
    const receiptFileName = pdfGenerator.generateReceiptFileName(orderNumber || 'PAYMENT')
    
    return this.sendEmail({
      to: email,
      subject: `💳 Payment Confirmation - MWK ${amount.toLocaleString()}`,
      html,
      text: `Payment Confirmation - MWK ${amount.toLocaleString()}. Transaction ID: ${transactionId}`,
      attachments: [
        {
          filename: receiptFileName,
          content: receiptHTML,
          contentType: 'text/html'
        }
      ]
    })
  }

  async sendNewOrderEmail(email: string, orderData: {
    orderNumber: string
    customerName: string
    items: Array<{ name: string; quantity: number }>
    totalAmount: number
  }): Promise<boolean> {
    const { orderNumber, customerName, items, totalAmount } = orderData
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">New Order Received</h2>
        <p>Great news! You've received a new order from ${customerName}.</p>
        
        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #004085; margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Total Amount:</strong> MWK ${totalAmount.toLocaleString()}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #333;">Ordered Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                  <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>Action Required:</strong> Please process this order within 1-2 business days 
            and update the shipping status in your dashboard.
          </p>
        </div>

        <div style="margin: 20px 0;">
          <a href="${process.env.NEXTAUTH_URL}/seller/orders" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Order in Dashboard
          </a>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `

    return this.sendEmail({
      to: email,
      subject: `New Order Received - ${orderNumber}`,
      html,
      text: `New order ${orderNumber} from ${customerName} - MWK ${totalAmount.toLocaleString()}`,
    })
  }
}

export const emailService = new EmailService()
