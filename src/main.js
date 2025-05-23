import { Game } from './modules/Game.js';

// Adjust canvas size
const canvas = document.getElementById('game-canvas');
const loading = document.getElementById('loading');

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Initialize game after a brief loading period
setTimeout(() => {
  // Create and start the game
  const game = new Game(canvas);
  game.start();
  
  // Hide loading screen
  loading.style.opacity = '0';
  setTimeout(() => {
    loading.style.display = 'none';
  }, 500);
}, 1500); // Show loading for 1.5 seconds

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
} 