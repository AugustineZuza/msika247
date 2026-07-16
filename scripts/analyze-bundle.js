#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function analyzeBundle() {
  log('🔍 Analyzing bundle size...', 'cyan')
  
  try {
    // Run next build
    log('📦 Building application...', 'yellow')
    execSync('npm run build', { stdio: 'inherit' })
    
    // Check if .next folder exists
    const nextFolder = path.join(process.cwd(), '.next')
    if (!fs.existsSync(nextFolder)) {
      log('❌ Build folder not found', 'red')
      process.exit(1)
    }
    
    // Analyze static chunks
    const staticFolder = path.join(nextFolder, 'static')
    if (fs.existsSync(staticFolder)) {
      log('\n📊 Static Assets Analysis:', 'bright')
      
      function analyzeFolder(folder, prefix = '') {
        const items = fs.readdirSync(folder)
        
        items.forEach(item => {
          const itemPath = path.join(folder, item)
          const stat = fs.statSync(itemPath)
          
          if (stat.isDirectory()) {
            analyzeFolder(itemPath, `${prefix}${item}/`)
          } else {
            const size = stat.size
            const sizeKB = (size / 1024).toFixed(2)
            const sizeMB = (size / 1024 / 1024).toFixed(2)
            
            let color = 'green'
            if (size > 1024 * 1024) color = 'red' // > 1MB
            else if (size > 512 * 1024) color = 'yellow' // > 512KB
            
            log(`${prefix}${item} - ${sizeKB} KB (${sizeMB} MB)`, color)
          }
        })
      }
      
      analyzeFolder(staticFolder)
    }
    
    // Check for large chunks
    log('\n🚨 Large Chunks Warning:', 'bright')
    const chunksFolder = path.join(nextFolder, 'static', 'chunks')
    if (fs.existsSync(chunksFolder)) {
      const chunks = fs.readdirSync(chunksFolder)
      
      chunks.forEach(chunk => {
        const chunkPath = path.join(chunksFolder, chunk)
        const stat = fs.statSync(chunkPath)
        const sizeMB = stat.size / 1024 / 1024
        
        if (sizeMB > 1) {
          log(`⚠️  ${chunk} is ${(sizeMB).toFixed(2)} MB - Consider code splitting!`, 'red')
        }
      })
    }
    
    // Generate bundle analysis report
    const report = {
      timestamp: new Date().toISOString(),
      buildSize: getFolderSize(nextFolder),
      recommendations: generateRecommendations()
    }
    
    fs.writeFileSync(
      path.join(process.cwd(), 'bundle-analysis.json'),
      JSON.stringify(report, null, 2)
    )
    
    log('\n✅ Bundle analysis complete!', 'green')
    log('📄 Report saved to bundle-analysis.json', 'cyan')
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

function getFolderSize(folder) {
  let totalSize = 0
  
  function calculateSize(folderPath) {
    const items = fs.readdirSync(folderPath)
    
    items.forEach(item => {
      const itemPath = path.join(folderPath, item)
      const stat = fs.statSync(itemPath)
      
      if (stat.isDirectory()) {
        calculateSize(itemPath)
      } else {
        totalSize += stat.size
      }
    })
  }
  
  calculateSize(folder)
  return totalSize
}

function generateRecommendations() {
  return [
    'Consider using dynamic imports for heavy components',
    'Optimize images with Next.js Image component',
    'Remove unused dependencies',
    'Enable compression for static assets',
    'Consider using CDN for static assets',
    'Implement proper caching strategies'
  ]
}

// Run the analysis
analyzeBundle()
