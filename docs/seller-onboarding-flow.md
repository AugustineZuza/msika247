# Seller Onboarding & Subscription Flow

## Overview

A seller signs up, chooses a monthly subscription, pays, and only then can start selling. If they stop paying, their shop automatically closes until they renew.

## Step-by-Step Flow

### 1️⃣ Seller Visits the Platform

- Seller opens the website (desktop or mobile)
- Clicks “Become a Seller” on the homepage or in the navigation
- Works the same on mobile and desktop

### 2️⃣ Seller Registration (Account Creation)

- Seller fills registration form:
  - Full name
  - Email
  - Phone number
  - Password
  - Shop / Store name
- At this stage:
  - Account is created as SELLER
  - Status = PENDING
  - Seller cannot sell yet
- After successful signup, seller is redirected to `/seller/subscription?onboarding=1`

### 3️⃣ Seller Chooses a Subscription Plan

- Immediately after signup, seller is on the “Choose a Subscription Plan” page
- Each plan shows:
  - Monthly price (MWK)
  - Product limits
  - Features
  - Duration (30 days)
- Example plans:
  - Basic – MWK 10,000 / month
  - Standard – MWK 25,000 / month
  - Premium – MWK 50,000 / month
- Seller selects a plan and clicks Subscribe

### 4️⃣ Seller Makes Payment

- Seller is taken to a secure payment page (PayChangu)
- Payment options:
  - Mobile Money (Airtel Money, TNM Mpamba, PayChangu)
  - Card (Visa / Mastercard)
- Seller completes payment

### 5️⃣ System Verifies Payment (Automatic)

- After payment:
  - Payment gateway sends confirmation to `/api/paychangu/callback`
  - System:
    - Records payment
    - Creates a Subscription record (ACTIVE, 30 days)
    - Sets start_date = today
    - Sets end_date = today + 30 days
    - Updates seller status → ACTIVE
    - Activates all seller’s products
- If payment fails:
  - Subscription not created
  - Seller stays INACTIVE
  - Prompt to retry payment on subscription page

### 6️⃣ (Optional) Admin Approval Step

- Admin can view pending sellers at `/admin/sellers`
- Admin can:
  - Approve seller immediately
  - Reject / suspend seller
- Until approved, seller remains unable to publish even if subscription is paid

### 7️⃣ Seller Dashboard Unlocked

- Seller now sees:
  - Subscription status (Active)
  - Subscription expiry date
  - “Add Product” button
  - Orders section
  - Sales analytics
- Dashboard shows renewal alerts when within 7 days of expiry

### 8️⃣ Seller Adds Products

- When seller clicks Add Product:
  - System checks:
    - Seller role = SELLER
    - Subscription status = ACTIVE
    - Subscription not expired
  - If all checks pass:
    - Product creation allowed
  - If not:
    - Seller sees: “Your subscription has expired. Please renew to continue selling.”

### 9️⃣ Subscription Renewal Flow (Monthly)

- Before expiry:
  - System sends reminder (email/SMS) 5 days before expiry
  - Dashboard shows orange renewal banner
- On expiry:
  - Seller account → DISABLED
  - Products → HIDDEN
  - Orders → PAUSED
- To renew:
  - Seller Dashboard → Renew Subscription → Pay → Reactivated

## 🔒 Important System Rules

- ❌ Seller cannot create products without paying
- ❌ Seller cannot receive orders if subscription expired
- ✅ Subscription controls entire seller access
- 🔁 Subscription is monthly and recurring
- 🧠 All seller pages are protected by `ActiveSubscriptionGuard`

## 🧠 Simple Explanation for Clients

“A seller signs up, chooses a monthly subscription, pays, and only then can start selling. If they stop paying, their shop automatically closes until they renew.”

## ⚙️ Technical Logic

```typescript
IF user.role == SELLER
AND subscription.status == ACTIVE
AND subscription.end_date >= today
THEN allow selling
ELSE block seller actions
```

## Files Involved

- Registration: `/app/(auth)/register/page.tsx`, `/app/api/auth/register/route.ts`
- Subscription plans: `/app/(seller)/seller/subscription/page.tsx`, `/app/api/seller/subscriptions/plans/route.ts`
- Checkout: `/app/api/seller/subscriptions/checkout/route.ts`
- Payment callback: `/app/api/paychangu/callback/route.ts`
- Guard: `/components/active-subscription-guard.tsx`
- Admin approval: `/app/api/admin/sellers/[id]/approve/route.ts`, `/app/(admin)/admin/sellers/page.tsx`
- Expiry/reminders: `/scripts/subscription-expiry-check.ts`, `/scripts/send-expiry-reminders.ts`

## Testing the Flow

1. Visit `/register?role=SELLER`
2. Fill form and submit
3. Choose a plan and pay via PayChangu test mode
4. Verify subscription is created and seller is active
5. Try adding a product
6. Simulate expiry by updating `endDate` in DB
7. Verify product/order endpoints are blocked
8. Renew subscription and verify access restored
