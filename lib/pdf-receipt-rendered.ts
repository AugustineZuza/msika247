// Rendered PDF receipt generator that creates properly formatted HTML files
import { Payment, Order } from '@prisma/client'

interface ReceiptData {
  payment: Payment
  order: Order
  customerName?: string
  customerEmail?: string
  shippingAddress?: string
}

export class RenderedPDFReceiptGenerator {
  generateReceiptHTML(data: ReceiptData): string {
    const { payment, order, customerName, customerEmail, shippingAddress } = data

    // Parse shipping address if available
    let parsedShippingAddress = shippingAddress || 'N/A'
    try {
      if (shippingAddress && typeof shippingAddress === 'string') {
        const address = JSON.parse(shippingAddress)
        parsedShippingAddress = `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
      }
    } catch (e) {
      // Keep original if parsing fails
    }

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
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shimmer 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
            50% { transform: translate(-30%, -30%) rotate(180deg); }
        }
        
        .header h1 {
            font-size: 36px;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }
        
        .header .subtitle {
            font-size: 18px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .company-info {
            background: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-bottom: 1px solid #e9ecef;
        }
        
        .company-info h3 {
            color: #495057;
            font-size: 20px;
            margin-bottom: 10px;
        }
        
        .company-info p {
            color: #6c757d;
            margin: 5px 0;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 35px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #007bff;
        }
        
        .section h2 {
            color: #007bff;
            font-size: 22px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section h2::before {
            content: '';
            width: 8px;
            height: 8px;
            background: #007bff;
            border-radius: 50%;
            display: inline-block;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 15px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .detail-label {
            font-weight: 600;
            color: #495057;
        }
        
        .detail-value {
            color: #212529;
            font-weight: 500;
        }
        
        .order-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .order-table th {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .order-table td {
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .order-table tr:last-child td {
            border-bottom: none;
        }
        
        .order-table tr:hover {
            background: #f8f9fa;
        }
        
        .totals {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            border: 1px solid #e9ecef;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f1f3f4;
        }
        
        .total-row:last-child {
            border-bottom: none;
            padding-top: 15px;
            margin-top: 10px;
            border-top: 2px solid #007bff;
        }
        
        .total-row.final {
            font-size: 20px;
            font-weight: 700;
            color: #007bff;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-success {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
        }
        
        .status-pending {
            background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
            color: white;
        }
        
        .footer {
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .footer h3 {
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .footer p {
            margin: 8px 0;
            opacity: 0.9;
        }
        
        .footer .generated {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.2);
            font-size: 12px;
            opacity: 0.7;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            font-weight: 900;
            color: rgba(0, 123, 255, 0.05);
            pointer-events: none;
            z-index: 0;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .receipt-container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .watermark {
                display: none;
            }
        }
        
        @media (max-width: 600px) {
            .content {
                padding: 20px;
            }
            
            .section {
                padding: 20px;
            }
            
            .details-grid {
                grid-template-columns: 1fr;
            }
            
            .order-table {
                font-size: 14px;
            }
            
            .order-table th,
            .order-table td {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="watermark">PAID</div>
        
        <header class="header">
            <h1>🧾 PAYMENT RECEIPT</h1>
            <p class="subtitle">Thank you for your purchase!</p>
        </header>
        
        <div class="company-info">
            <h3>Markert Platform</h3>
            <p>Lilongwe, Malawi</p>
            <p>Email: support@markert.com</p>
            <p>Phone: +265 123 456 789</p>
        </div>
        
        <main class="content">
            <section class="section">
                <h2>📋 Receipt Details</h2>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Receipt Number:</span>
                        <span class="detail-value">${payment.transactionId || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Order Number:</span>
                        <span class="detail-value">${order.orderNumber}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payment Date:</span>
                        <span class="detail-value">${new Date(payment.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payment Method:</span>
                        <span class="detail-value">${payment.paymentMethod}</span>
                    </div>
                </div>
            </section>
            
            <section class="section">
                <h2>👤 Customer Information</h2>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${customerName || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${customerEmail || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Shipping Address:</span>
                        <span class="detail-value">${parsedShippingAddress}</span>
                    </div>
                </div>
            </section>
            
            <section class="section">
                <h2>📦 Order Details</h2>
                <table class="order-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: center;">Quantity</th>
                            <th style="text-align: right;">Price (MWK)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Order Items</td>
                            <td style="text-align: center;">-</td>
                            <td style="text-align: right;">MWK ${order.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>MWK ${order.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    ${order.discountAmount > 0 ? `
                    <div class="total-row">
                        <span>Discount:</span>
                        <span style="color: #dc3545;">-MWK ${order.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>` : ''}
                    <div class="total-row">
                        <span>Shipping:</span>
                        <span>MWK ${order.shippingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="total-row final">
                        <span>Total Amount:</span>
                        <span>MWK ${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </section>
            
            <section class="section">
                <h2>💳 Payment Status</h2>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="status-badge ${payment.status === 'SUCCESS' ? 'status-success' : 'status-pending'}">
                                ${payment.status || 'UNKNOWN'}
                            </span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Currency:</span>
                        <span class="detail-value">${payment.currency || 'MWK'}</span>
                    </div>
                </div>
            </section>
        </main>
        
        <footer class="footer">
            <h3>Thank you for your purchase!</h3>
            <p>This is a computer-generated receipt. No signature required.</p>
            <p>For any questions, please contact our support team.</p>
            <div class="generated">
                Generated on: ${new Date().toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
        </footer>
    </div>
</body>
</html>`
  }

  generateReceiptFileName(orderNumber: string): string {
    return `receipt-${orderNumber}-${Date.now()}.html`
  }
}
