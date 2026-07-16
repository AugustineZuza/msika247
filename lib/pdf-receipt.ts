// Simple PDF receipt generator without external dependencies
import { Payment, Order } from '@prisma/client'

interface ReceiptData {
  payment: Payment
  order: Order
  customerName?: string
  customerEmail?: string
  shippingAddress?: string
}

export class SimplePDFReceiptGenerator {
  generateReceiptHTML(data: ReceiptData): string {
    const { payment, order, customerName, customerEmail, shippingAddress } = data

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt - ${order.orderNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .receipt {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
          }
          .company-info {
            text-align: center;
            margin-bottom: 30px;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
          }
          .section h2 {
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 10px;
            margin-bottom: 20px;
          }
          .details-grid .label {
            font-weight: bold;
            color: #555;
          }
          .details-grid .value {
            color: #333;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th {
            background-color: #f8f9fa;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #007bff;
            font-weight: bold;
          }
          .table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          .totals {
            text-align: right;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            padding: 5px 0;
          }
          .total-row.final {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            border-top: 2px solid #007bff;
            padding-top: 10px;
            margin-top: 15px;
          }
          .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
          }
          .status.success {
            background-color: #d4edda;
            color: #155724;
          }
          .status.pending {
            background-color: #fff3cd;
            color: #856404;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { background: white; }
            .receipt { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>🧾 PAYMENT RECEIPT</h1>
            <div class="company-info">
              <strong>Markert Platform</strong><br>
              Lilongwe, Malawi<br>
              Email: support@markert.com
            </div>
          </div>

          <div class="section">
            <h2>📋 Receipt Details</h2>
            <div class="details-grid">
              <div class="label">Receipt Number:</div>
              <div class="value">${payment.transactionId || 'N/A'}</div>
              
              <div class="label">Order Number:</div>
              <div class="value">${order.orderNumber}</div>
              
              <div class="label">Payment Date:</div>
              <div class="value">${new Date(payment.createdAt).toLocaleDateString()}</div>
              
              <div class="label">Payment Method:</div>
              <div class="value">${payment.paymentMethod}</div>
            </div>
          </div>

          <div class="section">
            <h2>👤 Customer Information</h2>
            <div class="details-grid">
              <div class="label">Name:</div>
              <div class="value">${customerName || 'N/A'}</div>
              
              <div class="label">Email:</div>
              <div class="value">${customerEmail || 'N/A'}</div>
              
              <div class="label">Shipping Address:</div>
              <div class="value">${shippingAddress || 'N/A'}</div>
            </div>
          </div>

          <div class="section">
            <h2>📦 Order Details</h2>
            <table class="table">
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
                  <td style="text-align: right;">MWK ${order.subtotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>MWK ${order.subtotal.toLocaleString()}</span>
              </div>
              ${order.discountAmount > 0 ? `
              <div class="total-row">
                <span>Discount:</span>
                <span>-MWK ${order.discountAmount.toLocaleString()}</span>
              </div>` : ''}
              <div class="total-row">
                <span>Shipping:</span>
                <span>MWK ${order.shippingAmount.toLocaleString()}</span>
              </div>
              <div class="total-row final">
                <span>Total Amount:</span>
                <span>MWK ${order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>💳 Payment Status</h2>
            <div class="details-grid">
              <div class="label">Status:</div>
              <div class="value">
                <span class="status ${payment.status === 'SUCCESS' ? 'success' : 'pending'}">
                  ${payment.status || 'UNKNOWN'}
                </span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for your purchase!</strong></p>
            <p>This is a computer-generated receipt. No signature required.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  generateReceiptFileName(orderNumber: string): string {
    return `receipt-${orderNumber}-${Date.now()}.html`
  }
}
