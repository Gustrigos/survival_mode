import { GameScene } from './scenes/GameScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

console.log('Debug main.js loaded');

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#2c5530',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top-down game, no gravity
            debug: false // Set to true to see collision boxes
        }
    },
    scene: [GameScene], // Start directly with GameScene for debugging
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true, // For crisp pixel art
    antialias: false
};

console.log('Creating Phaser game with config:', config);

// Create the game
const game = new Phaser.Game(config);

console.log('Phaser game created:', game);

// Global game state
window.gameState = {
    score: 0,
    wave: 0, // Start from 0, GameScene will set to 1
    zombiesKilled: 0,
    playerHealth: 100,
    playerAmmo: 30,
    maxAmmo: 30,
    isReloading: false
};

console.log('Game state initialized:', window.gameState);

// UI update functions
window.updateUI = {
    health: (current, max) => {
        console.log('Updating health UI:', current, '/', max);
        const healthSpan = document.getElementById('health');
        const healthBar = document.getElementById('health-bar');
        if (healthSpan) healthSpan.textContent = current;
        if (healthBar) healthBar.style.width = `${(current / max) * 100}%`;
    },
    
    ammo: (current, max) => {
        console.log('Updating ammo UI:', current, '/', max);
        const ammoSpan = document.getElementById('ammo');
        const ammoBar = document.getElementById('ammo-bar');
        if (ammoSpan) ammoSpan.textContent = current;
        if (ammoBar) ammoBar.style.width = `${(current / max) * 100}%`;
    },
    
    score: (score) => {
        console.log('Updating score UI:', score);
        const scoreSpan = document.getElementById('score-value');
        if (scoreSpan) scoreSpan.textContent = score;
    },
    
    wave: (wave) => {
        console.log('Updating wave UI:', wave);
        const waveSpan = document.getElementById('wave');
        if (waveSpan) waveSpan.textContent = wave;
    },
    
    zombiesLeft: (count) => {
        console.log('Updating zombies left UI:', count);
        const zombiesSpan = document.getElementById('zombies-left');
        if (zombiesSpan) zombiesSpan.textContent = count;
    },
    
    reloadStatus: (isReloading, timeLeft = 0) => {
        console.log('Updating reload status UI:', isReloading, timeLeft);
        const reloadDiv = document.getElementById('reload-status');
        if (reloadDiv) {
            if (isReloading) {
                reloadDiv.textContent = `Reloading... ${Math.ceil(timeLeft / 1000)}s`;
                reloadDiv.style.color = '#f39c12';
            } else {
                reloadDiv.textContent = '';
            }
        }
    }
};

console.log('UI update functions initialized');

export { game }; 