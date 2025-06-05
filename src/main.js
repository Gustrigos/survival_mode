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
    showGameUI: () => {
        const uiElement = document.getElementById('ui');
        if (uiElement) {
            uiElement.classList.add('game-active');
        }
    },
    
    hideGameUI: () => {
        const uiElement = document.getElementById('ui');
        if (uiElement) {
            uiElement.classList.remove('game-active');
        }
    },
    
    health: (current, max) => {
        const healthSpan = document.getElementById('health');
        const healthBar = document.getElementById('health-bar');
        if (healthSpan) healthSpan.textContent = `${current}/${max}`;
        if (healthBar) healthBar.style.width = `${(current / max) * 100}%`;
        // Show UI when health is first updated (game has started)
        window.updateUI.showGameUI();
    },
    
    ammo: (current, max) => {
        const ammoSpan = document.getElementById('ammo');
        const ammoBar = document.getElementById('ammo-bar');
        if (ammoSpan) ammoSpan.textContent = `${current}/${max}`;
        if (ammoBar) ammoBar.style.width = `${(current / max) * 100}%`;
        // Show UI when ammo is first updated (game has started)
        window.updateUI.showGameUI();
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
        const ammoBar = document.getElementById('ammo-bar');
        const ammoContainer = document.getElementById('ammo-bar-container');
        
        if (reloadDiv) {
            if (isReloading) {
                reloadDiv.textContent = `Reloading... ${Math.ceil(timeLeft / 1000)}s`;
                reloadDiv.style.color = '#f39c12';
            } else {
                reloadDiv.textContent = '';
            }
        }
        
        // Add visual feedback to ammo bar during reload
        if (ammoBar && ammoContainer) {
            if (isReloading) {
                const ammoLabel = document.getElementById('ammo');
                
                // Add reloading class for CSS animations
                ammoContainer.classList.add('reloading');
                ammoBar.classList.add('reloading');
                
                // Store original background for restoration
                if (!ammoBar.dataset.originalBackground) {
                    ammoBar.dataset.originalBackground = ammoBar.style.background || '';
                }
                
                // Store original ammo text for restoration
                if (ammoLabel && !ammoLabel.dataset.originalText) {
                    ammoLabel.dataset.originalText = ammoLabel.textContent;
                }
                
                // Change ammo bar to pulsing orange/yellow during reload
                ammoBar.style.background = 'linear-gradient(90deg, #e67e22, #f39c12)';
                
                // Change ammo label to show reload progress
                if (ammoLabel) {
                    const secondsLeft = Math.ceil(timeLeft / 1000);
                    ammoLabel.textContent = `RELOAD ${secondsLeft}s`;
                }
                
            } else {
                const ammoLabel = document.getElementById('ammo');
                
                // Remove reloading class and restore original appearance
                ammoContainer.classList.remove('reloading');
                ammoBar.classList.remove('reloading');
                
                // Restore original background
                if (ammoBar.dataset.originalBackground !== undefined) {
                    ammoBar.style.background = ammoBar.dataset.originalBackground;
                    delete ammoBar.dataset.originalBackground;
                }
                
                // Restore original ammo text
                if (ammoLabel && ammoLabel.dataset.originalText !== undefined) {
                    ammoLabel.textContent = ammoLabel.dataset.originalText;
                    delete ammoLabel.dataset.originalText;
                }
            }
        }
    }
};

export { game }; 