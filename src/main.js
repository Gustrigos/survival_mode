import { GameScene } from './scenes/GameScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MapSelectorScene } from './scenes/MapSelectorScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#8B7355',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top-down game, no gravity
            debug: false
        }
    },
    scene: [MenuScene, MapSelectorScene, GameScene, GameOverScene], // Start with MenuScene first
    pixelArt: true, // For crisp pixel art
    antialias: false
};

// Create the game
const game = new Phaser.Game(config);

// Global game state - Start from wave 0 so GameScene can properly initialize to wave 1
window.gameState = {
    score: 0,
    wave: 0, // Start from 0, GameScene will set to 1
    zombiesKilled: 0,
    playerHealth: 100,
    playerAmmo: 30,
    maxAmmo: 30,
    isReloading: false
};

// UI update functions
window.updateUI = {
    health: (current, max) => {
        const healthSpan = document.getElementById('health');
        const healthBar = document.getElementById('health-bar');
        if (healthSpan) healthSpan.textContent = current;
        if (healthBar) healthBar.style.width = `${(current / max) * 100}%`;
    },
    
    ammo: (current, max) => {
        const ammoSpan = document.getElementById('ammo');
        const ammoBar = document.getElementById('ammo-bar');
        if (ammoSpan) ammoSpan.textContent = current;
        if (ammoBar) ammoBar.style.width = `${(current / max) * 100}%`;
    },
    
    score: (score) => {
        const scoreSpan = document.getElementById('score-value');
        if (scoreSpan) scoreSpan.textContent = score;
    },
    
    wave: (wave) => {
        const waveSpan = document.getElementById('wave');
        if (waveSpan) waveSpan.textContent = wave;
    },
    
    zombiesLeft: (count) => {
        const zombiesSpan = document.getElementById('zombies-left');
        if (zombiesSpan) zombiesSpan.textContent = count;
    },
    
    reloadStatus: (isReloading, timeLeft = 0) => {
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

export { game }; 