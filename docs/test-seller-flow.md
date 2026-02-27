# How to Test the Full Seller Onboarding Flow

## Prerequisites

- Database running and seeded with subscription plans
- PayChangu test credentials configured in `.env.local`
- Admin user exists for approval step

## Step-by-Step Test

### 1. Registration

1. Navigate to `/register?role=SELLER`
2. Fill out the form:
   - Name: Test Seller
   - Email: seller@example.com
   - Phone: +265999123456
   - Password: password123
   - Shop name: Test Shop
3. Submit
4. Verify you are redirected to `/seller/subscription?onboarding=1`

### 2. Choose Plan

1. On the subscription page, verify plans are loaded
2. Click “Subscribe” on any plan
3. Verify you are redirected to PayChangu checkout
4. Complete test payment

### 3. Payment Verification

1. After payment, PayChangu will callback to `/api/paychangu/callback`
2. Verify in database:
   - `Payment` record with status SUCCESS
   - `Subscription` record with status ACTIVE
   - `Seller.isActive` = true
   - All existing `Product.isActive` = true for this seller

### 4. Dashboard Access

1. Navigate to `/seller`
2. Verify dashboard loads with:
   - Active subscription banner (green)
   - Stats cards
   - “Go to Products” button
3. Try visiting `/seller/products` and `/seller/orders` – should work

### 5. Add Product

1. Go to `/seller/products/add`
2. Fill product form and submit
3. Verify product is created and active

### 6. Simulate Expiry

1. In database, update seller subscription `endDate` to yesterday
2. Run `npx tsx scripts/subscription-expiry-check.ts`
3. Verify:
   - Subscription status = EXPIRED
   - Seller.isActive = false
   - All seller products are inactive

### 7. Verify Blocking

1. Try accessing `/seller` – should redirect to subscription page
2. Try `/seller/products` API – should return 403 with SUBSCRIPTION_INACTIVE
3. Try `/seller/orders` API – should return 403 with SUBSCRIPTION_INACTIVE

### 8. Renewal

1. Go to `/seller/subscription`
2. Verify expired banner (red) is shown
3. Subscribe to a new plan
4. After payment, verify seller is active again

### 9. Admin Approval (Optional)

1. Log in as admin
2. Go to `/admin/sellers`
3. Find a seller with PENDING verification
4. Click Approve/Reject
5. Verify seller verification status updates

### 10. Reminders (Manual)

1. Run `npx tsx scripts/send-expiry-reminders.ts`
2. Verify console output shows sellers needing reminders
3. (Email integration requires Resend/SendGrid setup)

## Database Queries for Verification

```sql
-- Check seller and subscription
SELECT 
  s.id, s.businessName, s.isActive, s.verificationStatus,
  sub.status, sub.startDate, sub.endDate,
  p.name as planName
FROM Seller s
LEFT JOIN Subscription sub ON s.id = sub.sellerId
LEFT JOIN SubscriptionPlan p ON sub.planId = p.id
WHERE s.businessName = 'Test Shop';

-- Check payments
SELECT * FROM Payment 
WHERE userId = (SELECT id FROM User WHERE email = 'seller@example.com')
ORDER BY createdAt DESC;

-- Check products
SELECT id, name, isActive FROM Product 
WHERE sellerId = (SELECT id FROM Seller WHERE businessName = 'Test Shop');
```

## Common Issues

- PayChangu callback not firing: check webhook URL and CORS
- Guard redirect loops: ensure `/seller/subscription` is exempt
- Subscription not activating: verify callback metadata includes sellerId and planId
- Products not activating: check `checkAndUpdateSubscriptions` script

## Automation

You can script this flow with Playwright or Cypress for regression testing.
