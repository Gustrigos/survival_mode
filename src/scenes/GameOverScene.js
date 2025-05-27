export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalWave = data.wave || 1;
        this.zombiesKilled = data.zombiesKilled || 0;
    }

    create() {
        // Background
        this.add.rectangle(512, 384, 1024, 768, 0x1a1a1a);
        
        // Game Over title
        this.add.text(512, 150, 'GAME OVER', {
            fontSize: '72px',
            fill: '#ff0000',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Stats
        this.add.text(512, 280, `Final Score: ${this.finalScore}`, {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        this.add.text(512, 330, `Wave Reached: ${this.finalWave}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        this.add.text(512, 370, `Zombies Killed: ${this.zombiesKilled}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Restart instructions
        const restartText = this.add.text(512, 500, 'PRESS SPACE TO RESTART', {
            fontSize: '28px',
            fill: '#00ff00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        this.add.text(512, 550, 'PRESS ESC FOR MENU', {
            fontSize: '20px',
            fill: '#ffff00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Blinking effect
        this.tweens.add({
            targets: restartText,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Input
        this.input.keyboard.on('keydown-SPACE', () => {
            // Reset game state
            window.gameState.score = 0;
            window.gameState.wave = 1;
            window.gameState.zombiesKilled = 0;
            window.gameState.playerHealth = 100;
            window.gameState.playerAmmo = 30;
            window.gameState.isReloading = false;
            
            this.scene.start('GameScene');
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }
} 