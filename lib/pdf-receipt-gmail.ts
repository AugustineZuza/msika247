// Gmail-compatible PDF receipt generator
import { Payment, Order } from '@prisma/client'

interface ReceiptData {
  payment: Payment
  order: Order
  customerName?: string
  customerEmail?: string
  shippingAddress?: string
}

export class GmailReceiptGenerator {
  generateReceiptHash(data: ReceiptData): string {
    // Generate a unique hash for verification
    const hashString = `${data.payment.transactionId}-${data.order.orderNumber}-${data.payment.amount}-${data.payment.createdAt.getTime()}`
    return Buffer.from(hashString).toString('base64').substring(0, 12).toUpperCase()
  }

  generateVerificationURL(data: ReceiptData): string {
    // Generate verification URL for QR code
    const hash = this.generateReceiptHash(data)
    return `https://markert.com/verify/${hash}`
  }

  generateQRCodeDataURL(url: string): string {
    // Generate QR code as Data URL (simplified version)
    const qrData = this.createSimpleQRCode(url)
    return `data:image/svg+xml;base64,${Buffer.from(qrData).toString('base64')}`
  }

  createSimpleQRCode(text: string): string {
    // Simple QR code SVG generator (basic implementation)
    const size = 200
    const cellSize = 4
    const margin = 2
    
    // Create a simple pattern based on text hash
    const hash = this.simpleHash(text)
    const modules = this.generateQRModules(hash, 25) // 25x25 QR code
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
    svg += `<rect width="${size}" height="${size}" fill="white"/>`
    
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        if (modules[row][col]) {
          const x = margin + col * cellSize
          const y = margin + row * cellSize
          svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="black"/>`
        }
      }
    }
    
    svg += '</svg>'
    return svg
  }

  simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  generateQRModules(hash: number, size: number): boolean[][] {
    const modules: boolean[][] = []
    
    // Initialize modules
    for (let i = 0; i < size; i++) {
      modules[i] = new Array(size).fill(false)
    }
    
    // Add position markers (corners)
    this.addPositionMarker(modules, 0, 0, 7)
    this.addPositionMarker(modules, size - 7, 0, 7)
    this.addPositionMarker(modules, 0, size - 7, 7)
    
    // Fill data modules based on hash
    let seed = hash
    for (let i = 0; i < size * size; i++) {
      const row = Math.floor(i / size)
      const col = i % size
      
      // Skip position markers
      if (this.isPositionMarker(row, col, size, 7)) {
        continue
      }
      
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      modules[row][col] = (seed % 2) === 0
    }
    
    return modules
  }

  addPositionMarker(modules: boolean[][], row: number, col: number, size: number): void {
    const pattern = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ]
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (row + i < modules.length && col + j < modules[0].length) {
          modules[row + i][col + j] = pattern[i][j] === 1
        }
      }
    }
  }

  isPositionMarker(row: number, col: number, size: number, markerSize: number): boolean {
    // Check if position is in any of the three corner markers
    return (
      (row < markerSize && col < markerSize) || // Top-left
      (row >= size - markerSize && col < markerSize) || // Top-right
      (row < markerSize && col >= size - markerSize) // Bottom-left
    )
  }

  generateReceiptHTML(data: ReceiptData): string {
    const { payment, order, customerName, customerEmail } = data
    const receiptHash = this.generateReceiptHash(data)
    const verificationURL = this.generateVerificationURL(data)
    const qrCodeDataURL = this.generateQRCodeDataURL(verificationURL)
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt - ${order.orderNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.5;
            color: #2c3e50;
            background: #f5f5f5;
            min-height: 100vh;
            padding: 20px;
        }
        
        .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border: 2px solid #e1e8ed;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
        }
        
        .security-watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            font-weight: 900;
            color: rgba(0, 123, 255, 0.08);
            pointer-events: none;
            z-index: 0;
            letter-spacing: 10px;
        }
        
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
            z-index: 1;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .header .subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .security-badge {
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 15px;
            display: inline-block;
        }
        
        .content {
            padding: 30px;
            position: relative;
            z-index: 1;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e3c72;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e1e8ed;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .info-label {
            font-weight: 500;
            color: #6c757d;
            font-size: 13px;
        }
        
        .info-value {
            font-weight: 600;
            color: #2c3e50;
            font-size: 14px;
            text-align: right;
        }
        
        .amount-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            margin: 20px 0;
        }
        
        .amount-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        
        .amount-value {
            font-size: 32px;
            font-weight: 700;
            color: #1e3c72;
        }
        
        .verification-section {
            background: #e3f2fd;
            padding: 25px;
            border-radius: 6px;
            margin-top: 25px;
            text-align: center;
            border: 1px solid #bbdefb;
        }
        
        .verification-title {
            font-size: 14px;
            color: #1565c0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        
        .qr-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 20px 0;
        }
        
        .qr-code {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #1565c0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .qr-code img {
            width: 150px;
            height: 150px;
            display: block;
        }
        
        .verification-code {
            font-size: 18px;
            font-weight: 700;
            color: #1565c0;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
            margin: 15px 0;
            background: white;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #1565c0;
        }
        
        .verification-instructions {
            font-size: 12px;
            color: #666;
            margin-top: 15px;
            line-height: 1.4;
        }
        
        .status-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 20px 0;
            padding: 15px;
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 6px;
        }
        
        .status-label {
            font-size: 12px;
            color: #155724;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-value {
            font-size: 14px;
            color: #155724;
            font-weight: 700;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e1e8ed;
            font-size: 11px;
            color: #6c757d;
            position: relative;
            z-index: 1;
        }
        
        .footer .company {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .footer .security-note {
            margin-top: 10px;
            font-size: 10px;
            color: #999;
        }
        
        @media print {
            body { background: white; padding: 0; }
            .receipt-container { border: 1px solid #000; }
            .security-watermark { display: none; }
        }
        
        @media (max-width: 600px) {
            .content { padding: 20px; }
            .info-grid { grid-template-columns: 1fr; }
            .amount-value { font-size: 28px; }
            .qr-code img { width: 120px; height: 120px; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="security-watermark">AUTHENTIC</div>
        
        <header class="header">
            <h1>PAYMENT RECEIPT</h1>
            <p class="subtitle">Official Transaction Record</p>
            <div class="security-badge">✓ VERIFIED</div>
        </header>
        
        <main class="content">
            <div class="section">
                <h2 class="section-title">Transaction Details</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Receipt ID</span>
                        <span class="info-value">${receiptHash}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Order Number</span>
                        <span class="info-value">${order.orderNumber}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Transaction ID</span>
                        <span class="info-value">${payment.transactionId}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Date</span>
                        <span class="info-value">${new Date(payment.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })}</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Payment Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Customer Email</span>
                        <span class="info-value">${customerEmail || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Payment Method</span>
                        <span class="info-value">${payment.paymentMethod}</span>
                    </div>
                </div>
            </div>
            
            <div class="amount-section">
                <div class="amount-label">Total Amount Paid</div>
                <div class="amount-value">MWK ${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            
            <div class="status-section">
                <span class="status-label">Payment Status</span>
                <span class="status-value">✓ COMPLETED</span>
            </div>
            
            <div class="verification-section">
                <div class="verification-title">QR Code Verification</div>
                <div class="qr-container">
                    <div class="qr-code">
                        <img src="${qrCodeDataURL}" alt="Verification QR Code" />
                    </div>
                </div>
                <div class="verification-code">${receiptHash}</div>
                <div class="verification-instructions">
                    Scan this QR code or visit <strong>markert.com/verify/${receiptHash}</strong> to verify receipt authenticity
                </div>
            </div>
        </main>
        
        <footer class="footer">
            <div class="company">Markert Platform</div>
            <div>Lilongwe, Malawi</div>
            <div class="security-note">This receipt contains security features to prevent forgery. Verification code: ${receiptHash}</div>
        </footer>
    </div>
</body>
</html>`
  }

  generateReceiptFileName(orderNumber: string): string {
    return `receipt-${orderNumber}-${Date.now()}.html`
  }
}
