// Test authentication flow
const bcrypt = require('bcryptjs');

async function testAuth() {
  const testPassword = 'password123';
  const email = 'test@example.com';
  
  // Hash password like in registration
  const hashedPassword = await bcrypt.hash(testPassword, 12);
  console.log('Hashed password:', hashedPassword);
  
  // Compare password like in login
  const isValid = await bcrypt.compare(testPassword, hashedPassword);
  console.log('Password comparison result:', isValid);
  
  // Test with wrong password
  const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
  console.log('Wrong password comparison:', isInvalid);
}

testAuth().catch(console.error);
