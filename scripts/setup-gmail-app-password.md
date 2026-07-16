# Gmail App Password Setup Guide

## Problem
The email system is failing with `EAUTH` error because Gmail requires an **App Password** for third-party applications, not your regular password.

## Current Configuration Issue
```env
EMAIL_SERVER_USER="msika869@gmail.com"
EMAIL_SERVER_PASSWORD="yuzvtrslovrephje"  # ← This is your regular password
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
```

## Solution: Create Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security" tab
3. Under "Signing in to Google", click on "2-Step Verification"
4. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Go to [App Passwords Page](https://myaccount.google.com/apppasswords)
2. Select "Mail" from the app dropdown
3. Select "Other (Custom name)" from device dropdown
4. Enter "Markert Platform" as the custom name
5. Click "Generate"
6. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update Environment
Replace your current `.env.local` email settings:

```env
# Email Configuration
EMAIL_SERVER_USER="msika869@gmail.com"
EMAIL_SERVER_PASSWORD="abcd efgh ijkl mnop"  # ← Use the generated App Password
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_FROM="Markert Platform <noreply@markert.com>"
```

### Step 4: Restart Server
```bash
# Stop the current server (Ctrl+C)
# Restart to load new environment variables
npm run dev
```

## Alternative: Use Email Testing Service

For testing, you can temporarily use a service like [Ethereal Email](https://ethereal.email):

```env
EMAIL_SERVER_HOST=smtp.ethereal.email
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-ethereal-email@ethereal.email
EMAIL_SERVER_PASSWORD=your-ethereal-password
EMAIL_FROM=Markert Platform <noreply@markert.com>
```

## Verification

After setup, run the test again:
```bash
npx tsx scripts/test-email-notifications.ts
```

You should see:
- ✅ Test email sent successfully
- ✅ All email functions working

## Security Notes

1. **Never commit App Passwords** to version control
2. **Keep them secret** - they're as sensitive as your main password
3. **Revoke if compromised** - You can regenerate App Passwords anytime
4. **Use descriptive names** - Helps identify which app has access

## Troubleshooting

### If still getting EAUTH error:
1. **Check 2FA is enabled** - Required for App Passwords
2. **Verify App Password** - Make sure it's correctly copied
3. **Check Gmail settings** - Ensure "Less secure apps" is allowed
4. **Try different port** - Some networks block port 587

### Common Gmail Issues:
- **"Invalid credentials"** - Wrong App Password
- **"Authentication failed"** - 2FA not enabled
- **"Connection refused"** - Firewall blocking SMTP ports

## Production Considerations

For production, consider:
1. **Dedicated email service** - SendGrid, Mailgun, AWS SES
2. **Domain verification** - SPF, DKIM, DMARC records
3. **Rate limiting** - Gmail has sending limits
4. **Deliverability** - Professional email services have better deliverability

## Quick Fix (For Testing Only)

If you want to test immediately without Gmail setup:

1. Visit https://ethereal.email
2. Click "Create Account"
3. Use the provided credentials in `.env.local`
4. Test with those credentials
5. Check ethereal inbox for test emails

This will let you verify the email system works while you set up Gmail properly.
