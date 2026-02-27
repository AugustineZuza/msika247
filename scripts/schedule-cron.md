# Scheduling Subscription Jobs

## Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/subscription-expiry",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/expiry-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Create API routes:

- `/api/cron/subscription-expiry` calls `checkAndUpdateSubscriptions`
- `/api/cron/expiry-reminders` calls `runReminderJob`

## Option 2: GitHub Actions (Self-hosted)

Create `.github/workflows/subscription-cron.yml`:

```yaml
name: Subscription Cron Jobs

on:
  schedule:
    - cron: '0 2 * * *' # 2 AM UTC daily
    - cron: '0 9 * * *' # 9 AM UTC daily
  workflow_dispatch:

jobs:
  expiry-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx tsx scripts/subscription-expiry-check.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx tsx scripts/send-expiry-reminders.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
```

## Option 3: Traditional Cron (VPS)

```bash
# Edit crontab
crontab -e

# Add lines (adjust paths)
0 2 * * * cd /path/to/project && npx tsx scripts/subscription-expiry-check.ts
0 9 * * * cd /path/to/project && npx tsx scripts/send-expiry-reminders.ts
```

## Notes

- Run expiry check at 2 AM UTC to minimize load
- Run reminders at 9 AM UTC for better open rates
- Ensure environment variables are available in the runtime
- Monitor logs for failures
