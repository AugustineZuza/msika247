#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function migrateToProduction() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting production migration...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Run migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrations completed');
    
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
    
    // Seed data if needed
    // execSync('npx prisma db seed', { stdio: 'inherit' });
    // console.log('✅ Database seeded');
    
    console.log('🎉 Production migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToProduction();
