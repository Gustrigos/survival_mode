export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Create simple colored rectangles for menu
        this.load.image('menuBg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    create() {
        // Background
        this.add.rectangle(512, 384, 1024, 768, 0x2c5530);
        
        // Title
        const title = this.add.text(512, 200, 'ZOMBIE SURVIVAL', {
            fontSize: '64px',
            fill: '#ff0000',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(512, 280, 'Pokemon Style Edition', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Start button
        const startButton = this.add.text(512, 400, 'PRESS SPACE TO START', {
            fontSize: '32px',
            fill: '#00ff00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(512, 500, 'WASD - Move\nSPACE - Shoot\nR - Reload\n\nSurvive the zombie apocalypse!', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'center'
        }).setOrigin(0.5);

        // Blinking effect for start button
        this.tweens.add({
            targets: startButton,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Input
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
} 