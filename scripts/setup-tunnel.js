#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 PAYCHANGU TUNNEL SETUP HELPER\n');

// Check if ngrok is installed
function checkNgrok() {
  return new Promise((resolve) => {
    const ngrok = spawn('npx', ['ngrok', 'version'], { stdio: 'pipe' });
    ngrok.on('close', (code) => {
      resolve(code === 0);
    });
    ngrok.on('error', () => {
      resolve(false);
    });
  });
}

// Start ngrok tunnel
function startNgrok() {
  return new Promise((resolve, reject) => {
    console.log('📍 Starting ngrok tunnel for port 3000...');
    
    const ngrok = spawn('npx', ['ngrok', 'http', '3000'], { stdio: 'pipe' });
    let output = '';
    
    ngrok.stdout.on('data', (data) => {
      output += data.toString();
      
      // Extract the HTTPS URL from ngrok output
      const match = output.match(/https:\/\/[a-zA-Z0-9.-]+\.ngrok\.io/);
      if (match) {
        const tunnelUrl = match[0];
        console.log(`✅ Tunnel URL: ${tunnelUrl}`);
        console.log(`📞 Callback URL: ${tunnelUrl}/api/paychangu/callback`);
        
        // Update .env.local file
        const envPath = path.join(process.cwd(), '.env.local');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Update or add NEXT_PUBLIC_APP_URL
        const urlRegex = /^NEXT_PUBLIC_APP_URL=.*$/m;
        if (urlRegex.test(envContent)) {
          envContent = envContent.replace(urlRegex, `NEXT_PUBLIC_APP_URL=${tunnelUrl}`);
        } else {
          envContent += `\nNEXT_PUBLIC_APP_URL=${tunnelUrl}`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ Updated .env.local with tunnel URL`);
        console.log(`🔄 Please restart your development server`);
        
        resolve(tunnelUrl);
      }
    });
    
    ngrok.stderr.on('data', (data) => {
      console.error(`❌ Error: ${data.toString()}`);
    });
    
    ngrok.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ngrok exited with code ${code}`));
      }
    });
  });
}

// Main execution
async function main() {
  try {
    const hasNgrok = await checkNgrok();
    
    if (!hasNgrok) {
      console.log('❌ ngrok not found. Please install it first:');
      console.log('   npm install -g ngrok');
      console.log('   or visit: https://ngrok.com/download');
      process.exit(1);
    }
    
    await startNgrok();
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Update your PayChangu dashboard with the callback URL');
    console.log('3. Test the payment flow');
    console.log('\n💡 Keep this terminal open to maintain the tunnel');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
