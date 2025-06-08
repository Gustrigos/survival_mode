# 🧟 Zombie Survival PWA Setup Guide

## Quick Start (≈ 15 minutes)

### Step 1: Setup
```bash
# Mac/Linux
chmod +x setup-pwa.sh
./setup-pwa.sh

# Windows
setup-pwa.bat
```

### Step 2: Serve Locally
```bash
# Option 1: Python (if you have Python)
python -m http.server 8080

# Option 2: NPM script
npm run serve

# Option 3: Node.js
npx http-server -p 8080
```

### Step 3: Test on Mobile
1. **Find your computer's IP address:**
   - Mac: `ifconfig | grep inet`
   - Windows: `ipconfig`
   - Look for your local network IP (usually 192.168.x.x)

2. **On your phone:**
   - Open Safari (iOS) or Chrome (Android)
   - Visit `http://YOUR-IP-ADDRESS:8080`
   - The game should load

3. **Add to Home Screen:**
   - **iOS:** Tap Share button → "Add to Home Screen"
   - **Android:** Tap menu → "Add to Home screen" or "Install app"

### Step 4: Test Offline
1. Launch the game from your home screen icon
2. Turn on Airplane Mode
3. The game should still work completely offline! 🎉

## What's Included

### ✅ Web App Manifest (`manifest.json`)
- Full-screen standalone mode
- App name and description
- Theme colors matching game design
- SVG icon that scales to any size

### ✅ Service Worker (`sw.js`)
- **Cache Strategy:** Cache First → Network fallback
- **Precached files:** HTML, JS, CSS, images, Phaser library
- **Runtime caching:** Fonts and external resources
- **iOS 18 compatibility:** Navigation fallback for cache bugs

### ✅ PWA Meta Tags
- Mobile-optimized viewport
- iOS-specific app settings
- Theme color for status bar
- App icons for all platforms

## Files Created

```
📁 Your Game Directory/
├── manifest.json          # PWA configuration
├── icon-192.svg          # App icon (scalable)
├── sw.js                 # Service worker (auto-generated)
├── workbox-config.js     # Service worker config
├── setup-pwa.sh         # Setup script (Mac/Linux)
├── setup-pwa.bat        # Setup script (Windows)
└── PWA-SETUP.md         # This guide
```

## Troubleshooting

### Game Won't Load Offline
- Check browser developer tools → Application → Service Workers
- Make sure service worker is registered and active
- Clear browser cache and try again

### Icons Not Showing
- Make sure `icon-192.svg` exists in your root directory
- Check browser developer tools → Application → Manifest

### iOS 18 Cache Issues
- The service worker includes navigation fallback
- Try force-refreshing the page after adding to home screen
- Check Safari Developer → Console for cache errors

## Advanced Options

### Custom Icons
Replace `icon-192.svg` with your own design (keep same filename)

### Modify Cache Strategy
Edit `workbox-config.js` to change caching behavior:
- `CacheFirst`: Offline-first (current)
- `NetworkFirst`: Online-first with offline fallback
- `StaleWhileRevalidate`: Background updates

### Serve on Different Port
```bash
# Port 3000
python -m http.server 3000

# Then visit http://YOUR-IP:3000
```

## Testing Checklist

- [ ] Game loads in browser at `http://localhost:8080`
- [ ] Service worker registers (check DevTools → Application)
- [ ] Can add to home screen on mobile
- [ ] App launches full-screen from home screen
- [ ] Game works offline after caching
- [ ] Icons display correctly

## Need Help?

Common issues and solutions:

**"Service worker won't register"**
- Make sure you're serving over HTTP (not file://)
- Check for JavaScript errors in console

**"Add to Home Screen not available"**
- iOS requires HTTPS for PWA features (local HTTP is OK for testing)
- Make sure manifest.json is loading without errors

**"Game is slow/won't cache"**
- Check network tab - large files might timeout
- Consider reducing asset sizes if needed

---

**🎮 Ready to survive the zombie apocalypse offline!** 