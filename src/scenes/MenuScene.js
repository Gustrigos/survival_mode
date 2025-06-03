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
        const title = this.add.text(512, 150, 'ZOMBIE SURVIVAL', {
            fontSize: '64px',
            fill: '#ff0000',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(512, 230, 'Procedural World Edition', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Quick Start button (original helicopter crash site)
        const quickStartButton = this.add.rectangle(512, 320, 300, 50, 0x006600);
        quickStartButton.setStrokeStyle(2, 0x00aa00);
        quickStartButton.setInteractive();

        this.add.text(512, 320, 'QUICK START', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(512, 345, '(Classic helicopter crash site)', {
            fontSize: '12px',
            fill: '#cccccc',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // World Generation button (new procedural system)
        const worldGenButton = this.add.rectangle(512, 400, 300, 50, 0x0066aa);
        worldGenButton.setStrokeStyle(2, 0x0099ff);
        worldGenButton.setInteractive();

        this.add.text(512, 400, 'PROCEDURAL WORLD', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(512, 425, '(Choose size, seed & generation)', {
            fontSize: '12px',
            fill: '#cccccc',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(512, 500, 'WASD - Move\nSPACE - Shoot\nR - Reload\n\nSurvive the zombie apocalypse!', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'center'
        }).setOrigin(0.5);

        // Keyboard shortcut for quick start
        this.add.text(512, 600, 'Or press SPACE for Quick Start', {
            fontSize: '16px',
            fill: '#00ff00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Button interactions
        quickStartButton.on('pointerdown', () => {
            // Clear any previous world generation settings
            this.registry.set('worldGeneration', { useWorldGeneration: false });
            this.scene.start('GameScene');
        });

        quickStartButton.on('pointerover', () => {
            quickStartButton.setFillStyle(0x008800);
        });

        quickStartButton.on('pointerout', () => {
            quickStartButton.setFillStyle(0x006600);
        });

        worldGenButton.on('pointerdown', () => {
            this.scene.start('MapSelectorScene');
        });

        worldGenButton.on('pointerover', () => {
            worldGenButton.setFillStyle(0x0088cc);
        });

        worldGenButton.on('pointerout', () => {
            worldGenButton.setFillStyle(0x0066aa);
        });

        // Blinking effect for quick start shortcut
        const spaceText = this.add.text(512, 650, 'PRESS SPACE FOR QUICK START', {
            fontSize: '16px',
            fill: '#00ff00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: spaceText,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Input
        this.input.keyboard.on('keydown-SPACE', () => {
            // Clear any previous world generation settings and start classic mode
            this.registry.set('worldGeneration', { useWorldGeneration: false });
            this.scene.start('GameScene');
        });
    }
} 