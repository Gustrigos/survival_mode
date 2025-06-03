/**
 * MapSelectorScene.js - Map size and generation options selection
 */

import { WorldGenerator } from '../modules/WorldGenerator.js';

export class MapSelectorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapSelectorScene' });
        this.worldGenerator = new WorldGenerator();
        this.selectedMapSize = 'medium';
        this.customSeed = null;
    }

    preload() {
        // Use simple colored rectangles for UI
        this.load.image('menuBg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    create() {
        // Background
        this.add.rectangle(512, 384, 1024, 768, 0x2c5530);
        
        // Title
        this.add.text(512, 120, 'WORLD GENERATION', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Map size selection
        this.add.text(512, 200, 'Select Map Size:', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        this.createPreviewInfo();
        this.createMapSizeButtons();
        this.createSeedInput();
        this.createActionButtons();
    }

    createMapSizeButtons() {
        const mapSizes = this.worldGenerator.getMapSizes();
        const buttonWidth = 200;
        const buttonHeight = 40;
        const spacing = 220;
        const startX = 512 - (Object.keys(mapSizes).length - 1) * spacing / 2;
        
        this.sizeButtons = {};
        let index = 0;

        for (const [sizeKey, sizeData] of Object.entries(mapSizes)) {
            const x = startX + index * spacing;
            const y = 280;

            // Button background
            const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x444444);
            button.setStrokeStyle(2, 0x666666);
            button.setInteractive();

            // Button text
            const buttonText = this.add.text(x, y - 10, sizeKey.toUpperCase(), {
                fontSize: '16px',
                fill: '#ffffff',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Size info
            const sizeInfo = this.add.text(x, y + 10, sizeData.name, {
                fontSize: '12px',
                fill: '#cccccc',
                fontFamily: 'Courier New'
            }).setOrigin(0.5);

            // Store references
            this.sizeButtons[sizeKey] = {
                button: button,
                text: buttonText,
                info: sizeInfo,
                data: sizeData
            };

            // Click handler
            button.on('pointerdown', () => {
                this.selectMapSize(sizeKey);
            });

            // Hover effects
            button.on('pointerover', () => {
                button.setFillStyle(0x555555);
            });

            button.on('pointerout', () => {
                if (this.selectedMapSize !== sizeKey) {
                    button.setFillStyle(0x444444);
                }
            });

            index++;
        }

        // Set default selection
        this.selectMapSize(this.selectedMapSize);
    }

    createSeedInput() {
        // Seed section
        this.add.text(512, 360, 'Random Seed (Optional):', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        this.add.text(512, 385, 'Leave empty for random generation', {
            fontSize: '14px',
            fill: '#cccccc',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Seed input simulation (since HTML input is complex in Phaser)
        this.seedDisplay = this.add.text(512, 420, 'Random Seed', {
            fontSize: '16px',
            fill: '#00ff00',
            fontFamily: 'Courier New',
            backgroundColor: '#003300',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Random seed button
        const randomSeedBtn = this.add.rectangle(512, 460, 180, 30, 0x006600);
        randomSeedBtn.setStrokeStyle(1, 0x00aa00);
        randomSeedBtn.setInteractive();

        this.add.text(512, 460, 'Generate Random Seed', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        randomSeedBtn.on('pointerdown', () => {
            this.generateRandomSeed();
        });

        randomSeedBtn.on('pointerover', () => {
            randomSeedBtn.setFillStyle(0x008800);
        });

        randomSeedBtn.on('pointerout', () => {
            randomSeedBtn.setFillStyle(0x006600);
        });

        // Initialize random seed
        this.generateRandomSeed();
    }

    createActionButtons() {
        // Start game button
        const startButton = this.add.rectangle(412, 580, 160, 50, 0x006600);
        startButton.setStrokeStyle(2, 0x00aa00);
        startButton.setInteractive();

        this.add.text(412, 580, 'START GAME', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        startButton.on('pointerdown', () => {
            this.startGame();
        });

        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x008800);
        });

        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x006600);
        });

        // Back button
        const backButton = this.add.rectangle(612, 580, 160, 50, 0x660000);
        backButton.setStrokeStyle(2, 0xaa0000);
        backButton.setInteractive();

        this.add.text(612, 580, 'BACK TO MENU', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        backButton.on('pointerover', () => {
            backButton.setFillStyle(0x880000);
        });

        backButton.on('pointerout', () => {
            backButton.setFillStyle(0x660000);
        });
    }

    createPreviewInfo() {
        this.previewText = this.add.text(512, 520, '', {
            fontSize: '14px',
            fill: '#ffff00',
            fontFamily: 'Courier New',
            align: 'center'
        }).setOrigin(0.5);

        this.updatePreview();
    }

    selectMapSize(sizeKey) {
        // Update selection
        this.selectedMapSize = sizeKey;

        // Update button appearances
        for (const [key, buttonData] of Object.entries(this.sizeButtons)) {
            if (key === sizeKey) {
                buttonData.button.setFillStyle(0x00aa00);
                buttonData.text.setFill('#000000');
            } else {
                buttonData.button.setFillStyle(0x444444);
                buttonData.text.setFill('#ffffff');
            }
        }

        this.updatePreview();
    }

    generateRandomSeed() {
        this.customSeed = Math.floor(Math.random() * 1000000);
        this.seedDisplay.setText(`Seed: ${this.customSeed}`);
        this.updatePreview();
    }

    updatePreview() {
        // Safety check to ensure previewText exists
        if (!this.previewText) {
            return;
        }
        
        const sizeData = this.worldGenerator.getMapSizes()[this.selectedMapSize];
        const estimatedStructures = Math.floor((sizeData.width * sizeData.height) / (300 * 300));
        const estimatedCrashSites = Math.max(1, Math.floor(estimatedStructures * 0.1));

        this.previewText.setText(
            `Map: ${sizeData.name}\n` +
            `Estimated Structures: ~${estimatedStructures}\n` +
            `Helicopter Crash Sites: ~${estimatedCrashSites}\n` +
            `Seed: ${this.customSeed || 'Random'}`
        );
    }

    startGame() {
        console.log(`🎮 Starting game with ${this.selectedMapSize} map, seed: ${this.customSeed}`);
        
        // Store world generation parameters in registry for GameScene to use
        this.registry.set('worldGeneration', {
            mapSize: this.selectedMapSize,
            seed: this.customSeed,
            useWorldGeneration: true
        });

        // Start the game
        this.scene.start('GameScene');
    }
} 