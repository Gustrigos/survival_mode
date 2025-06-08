@echo off
echo 🧟 Setting up Zombie Survival PWA...

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Generate service worker
echo 🔧 Generating service worker...
npm run build-sw

echo ✅ PWA setup complete!
echo.
echo 🚀 To serve and test:
echo    1. Run: npm run serve
echo    2. Open http://localhost:8080 in your browser
echo    3. On mobile: find your computer's IP and visit http://YOUR-IP:8080
echo    4. On iPhone Safari: tap Share → Add to Home Screen
echo.
echo 🧪 To test offline:
echo    1. Launch from home screen icon
echo    2. Turn on Airplane Mode
echo    3. Game should still load and work!
echo.
echo 📱 Alternative serving options:
echo    - Python: python -m http.server 8080
echo    - Node: npx http-server -p 8080
echo    - Vite: npm run serve-vite

pause 