const { auth } = require('./lib/auth');

async function testAuth() {
  try {
    console.log('Testing auth function...');
    
    // Set environment variables
    process.env.DATABASE_URL = "mysql://root:21chase%3F%3F@127.0.0.1:3306/market";
    process.env.NEXTAUTH_SECRET = "markethub-secret-key-2024-very-secure-and-long-enough-for-production";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    
    console.log('Environment variables set');
    
    const session = await auth();
    console.log('Auth result:', session);
    
  } catch (error) {
    console.error('Auth test error:', error);
    console.error('Error stack:', error.stack);
  }
}

testAuth();
