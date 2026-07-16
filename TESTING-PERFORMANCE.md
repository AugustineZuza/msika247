# Testing Performance Optimizations

This guide will help you test and verify all the performance optimizations implemented in Msika247.

## 🧪 Quick Test Checklist

### ✅ Pre-Testing Requirements
- [ ] Node.js installed
- [ ] Project dependencies installed (`npm install` or `pnpm install`)
- [ ] Development server running (`npm run dev`)
- [ ] Chrome/Edge browser (recommended for DevTools)

## 🚀 Step-by-Step Testing Guide

### 1. **Basic Performance Test**

#### Open Performance Monitor
1. **Start dev server**: `npm run dev`
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Toggle monitor**: Press `Ctrl+Shift+P`
4. **Check metrics**: Look for FCP, LCP, FID, CLS scores

#### Expected Results:
- Performance badge should show a score (0-100)
- Connection status should show "Online"
- Cache size should be > 0 after browsing

### 2. **Image Optimization Test**

#### Test Optimized Images
1. **Navigate to homepage**: `http://localhost:3000`
2. **Open DevTools**: Press `F12` → Network tab
3. **Clear cache**: Right-click Network tab → Clear browser cache
4. **Reload page**: Press `Ctrl+Shift+R` (hard reload)
5. **Check images**: Look for `.webp` or `.avif` formats

#### Expected Results:
- Images should load with WebP/AVIF format
- Images should have proper `sizes` attribute
- Blur placeholders should appear before full load
- No broken images

### 3. **Caching Test**

#### Test API Caching
1. **Open DevTools**: Network tab
2. **Visit product page**: Navigate to any product
3. **Check API calls**: Look for `landing-products` API
4. **Refresh page**: Press `F5`
5. **Check headers**: API response should show `X-Cache: HIT`

#### Expected Results:
- First visit: `X-Cache: MISS`
- Second visit: `X-Cache: HIT`
- Response time should be faster on second visit

### 4. **Bundle Size Test**

#### Analyze Bundle Size
1. **Run analysis**: `npm run analyze`
2. **Check output**: Look at console output
3. **Review report**: Check `bundle-analysis.json`

#### Expected Results:
- Bundle size should be < 2MB total
- Individual chunks should be < 1MB
- No warnings for extremely large chunks

### 5. **Service Worker Test**

#### Test Offline Functionality
1. **Register Service Worker**: Open DevTools → Application tab → Service Workers
2. **Check registration**: Should show "activated and is running"
3. **Go offline**: In DevTools → Network tab → select "Offline"
4. **Navigate site**: Try browsing different pages
5. **Check offline page**: Visit `http://localhost:3000/offline`

#### Expected Results:
- Service worker should be registered
- Previously visited pages should work offline
- Offline page should show helpful information
- No "failed to load" errors for cached content

### 6. **Lazy Loading Test**

#### Test Component Lazy Loading
1. **Open DevTools**: Network tab
2. **Navigate to admin**: `http://localhost:3000/admin`
3. **Check chunks**: Look for dynamic chunk loading
4. **Monitor loading**: Should see loading spinner first

#### Expected Results:
- Heavy components should load on-demand
- Loading spinners should appear
- Network tab should show dynamic chunk requests

## 🔧 Advanced Testing

### **Chrome DevTools Performance Audit**

1. **Open Lighthouse**: DevTools → Lighthouse tab
2. **Configure audit**: Select "Performance" only
3. **Run audit**: Click "Generate report"
4. **Check scores**: Look for Performance score > 90

### **Core Web Vitals Measurement**

1. **Open DevTools**: Performance tab
2. **Start recording**: Click record button
3. **Navigate site**: Browse for 30 seconds
4. **Stop recording**: Click stop
5. **Analyze metrics**: Check FCP, LCP, FID, CLS

### **Network Throttling Test**

1. **Open DevTools**: Network tab
2. **Set throttling**: Select "Slow 3G" or "Fast 3G"
3. **Test loading**: Navigate through site
4. **Check performance**: Monitor load times

## 🐛 Common Issues & Solutions

### **Service Worker Not Registering**
```bash
# Clear service worker cache
# In browser DevTools → Application → Service Workers → Unregister
# Then refresh the page
```

### **Cache Headers Not Working**
```bash
# Check headers in Network tab
# Look for Cache-Control header
# Should show proper max-age values
```

### **Bundle Size Too Large**
```bash
# Run bundle analyzer
npm run analyze

# Check for large dependencies
npm ls --depth=0
```

### **Images Not Optimizing**
```bash
# Check next.config.mjs image settings
# Verify images are using <OptimizedImage> component
# Check Network tab for image formats
```

## 📊 Performance Benchmarks

### **Good Performance Targets**
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- First Input Delay: < 100ms
- Cumulative Layout Shift: < 0.1
- Time to First Byte: < 600ms

### **Bundle Size Targets**
- Initial bundle: < 800KB
- Individual chunks: < 1MB
- Total bundle size: < 2MB

### **Cache Performance**
- API response time (cached): < 50ms
- Static asset load time: < 100ms
- Page reload time: < 2s

## 🧪 Testing Scripts

### **Automated Performance Test**
```bash
# Create test script
npm run test:performance
```

### **Load Testing**
```bash
# Install load testing tool
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## 📱 Mobile Testing

### **Mobile Performance**
1. **Open DevTools**: Toggle device toolbar
2. **Select device**: iPhone 12 or similar
3. **Test performance**: Repeat all tests
4. **Check touch**: Test touch interactions

### **Network Conditions**
1. **Set throttling**: "Fast 3G" or "Slow 3G"
2. **Test offline**: Toggle network status
3. **Check responsiveness**: Test on different screen sizes

## 🔍 Debugging Tools

### **Performance Monitor Features**
- Real-time Core Web Vitals
- Cache size monitoring
- Network status indicator
- Update notifications
- Performance scoring

### **Browser DevTools**
- **Network Tab**: Check caching, formats, sizes
- **Performance Tab**: Record and analyze runtime
- **Application Tab**: Service workers, storage
- **Lighthouse**: Comprehensive audit

## ✅ Test Results Template

### **Performance Test Results**
```
Date: [Date]
Browser: [Browser version]
Device: [Desktop/Mobile]

Core Web Vitals:
- FCP: [time]s (Target: <1.8s)
- LCP: [time]s (Target: <2.5s)
- FID: [time]ms (Target: <100ms)
- CLS: [score] (Target: <0.1)
- TTFB: [time]ms (Target: <600ms)

Bundle Size:
- Initial: [size]KB
- Total: [size]KB
- Largest chunk: [size]KB

Cache Performance:
- API cache: [HIT/MISS ratio]
- Static cache: [working/not working]
- Service worker: [registered/not registered]

Overall Score: [0-100]
```

## 🚨 Troubleshooting

### **If Tests Fail**
1. **Check console** for JavaScript errors
2. **Verify configuration** in `next.config.mjs`
3. **Clear browser cache** and retest
4. **Restart dev server** with fresh cache
5. **Check environment variables** if needed

### **Performance Regression**
1. **Compare with baseline** measurements
2. **Check recent changes** in code
3. **Run bundle analysis** to find issues
4. **Monitor network requests** for bottlenecks

## 📈 Continuous Monitoring

### **Production Monitoring**
- Set up real user monitoring (RUM)
- Track Core Web Vitals in production
- Monitor error rates and performance
- Set up alerts for regressions

### **Regular Testing**
- Run performance tests weekly
- Monitor bundle size changes
- Test on different devices/browsers
- Keep track of performance trends

---

This testing guide should help you verify that all performance optimizations are working correctly. Run through each test systematically to ensure the best possible performance for your users.
