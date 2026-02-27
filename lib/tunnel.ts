// Development tunnel configuration for PayChangu callbacks
export function getCallbackUrl(): string {
  // For local development with ngrok tunnel
  if (process.env.NODE_ENV === 'development') {
    const tunnelUrl = process.env.NEXT_PUBLIC_APP_URL
    if (tunnelUrl && !tunnelUrl.includes('localhost')) {
      // We have a tunnel URL configured
      return `${tunnelUrl}/api/paychangu/callback`
    }
    
    // No tunnel URL - warn the user
    console.warn('⚠️  LOCAL DEVELOPMENT DETECTED')
    console.warn('PayChangu callbacks require a public URL.')
    console.warn('Please set up a tunnel and update NEXT_PUBLIC_APP_URL')
    console.warn('Example: https://your-ngrok-url.ngrok.io')
    
    // Fallback to localhost (won't work for callbacks)
    return 'http://localhost:3000/api/paychangu/callback'
  }
  
  // For production, use the configured APP_URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.NEXTAUTH_URL || 
                  'http://localhost:3000'
  
  return `${baseUrl}/api/paychangu/callback`
}

export function getPublicUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return baseUrl
}

// Tunnel setup instructions
export const TUNNEL_INSTRUCTIONS = `
🚀 SETTING UP LOCAL TUNNEL FOR PAYCHANGU CALLBACKS:

Option 1: ngrok (Recommended)
1. Install: npm install -g ngrok
2. Start your server: npm run dev
3. Create tunnel: ngrok http 3000
4. Copy the HTTPS URL (looks like: https://abc123.ngrok.io)
5. Update your .env file:
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

Option 2: cloudflared
1. Install: npm install -g cloudflared
2. Create tunnel: cloudflared tunnel --url http://localhost:3000
3. Copy the URL and update .env

Option 3: localtunnel
1. Install: npm install -g localtunnel
2. Create tunnel: lt --port 3000
3. Copy the URL and update .env

IMPORTANT:
- Always use HTTPS URLs for PayChangu
- Update your PayChangu dashboard with the callback URL
- Test the tunnel before making payments

Example callback URL: https://your-tunnel-url.ngrok.io/api/paychangu/callback
`
