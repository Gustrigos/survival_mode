import { InteriorSpace } from './InteriorSpace.js';
import { Structure } from './Structure.js';

export class Farmhouse extends InteriorSpace {
    constructor(scene, x, y) {
        super(scene, x, y, 120, 90, {
            type: 'farmhouse',
            lightLevel: 0.7,
            safeZone: false
        });
        
        this.exteriorStructure = null;
        this.door = null;
        this.windows = [];
        this.isPlayerInside = false;
        this.entranceZone = null;
        
        this.createExterior();
        this.createInterior();
        this.createEntrances();
        
        // Initially hide interior
        this.hideInterior();
    }
    
    createExterior() {
        // Create the main farmhouse structure
        this.exteriorStructure = this.scene.createStructureWithFallback(
            this.x, this.y, 'farmhouse', {
                type: 'farmhouse',
                material: 'wood',
                health: 500,
                destructible: false // Main structure can't be destroyed, but doors/windows can
            }, 0x8B4513, 128, 96
        );
        
        // Create breakable door
        this.door = new Structure(this.scene, this.x, this.y + 35, 'wooden_door', {
            type: 'door',
            material: 'wood',
            health: 100,
            destructible: true
        });
        
        // Fallback door if texture doesn't exist
        if (!this.scene.textures.exists('wooden_door')) {
            this.door = this.scene.add.rectangle(this.x, this.y + 35, 16, 32, 0x5D4037);
            this.scene.physics.add.existing(this.door, true);
            this.door.body.setImmovable(true);
            this.door.health = 100;
            this.door.maxHealth = 100;
            this.door.material = 'wood';
            this.door.isDestructible = true;
            this.door.structureType = 'door';
            
            // Add door methods
            this.door.takeDamage = (amount, damageType = 'zombie') => {
                this.door.health -= amount;
                console.log(`Door took ${amount} damage, health: ${this.door.health}`);
                
                // Visual damage effect
                this.door.setTint(0xff6666);
                this.scene.time.delayedCall(200, () => {
                    this.door.clearTint();
                });
                
                if (this.door.health <= 0) {
                    this.destroyDoor();
                    return true;
                }
                return false;
            };
            
            this.door.bulletHit = (damage) => this.door.takeDamage(damage, 'bullet');
            this.door.zombieAttack = (damage) => this.door.takeDamage(damage, 'zombie');
        }
        
        this.door.setDepth(this.y + 50);
        
        // Create breakable windows
        this.createWindows();
        
        // Add door and windows to structures group for collision
        if (this.scene.structures) {
            this.scene.structures.add(this.door);
            this.windows.forEach(window => {
                this.scene.structures.add(window);
            });
        }
    }
    
    createWindows() {
        const windowPositions = [
            { x: this.x - 40, y: this.y + 10, side: 'left' },
            { x: this.x + 40, y: this.y + 10, side: 'right' }
        ];
        
        windowPositions.forEach(pos => {
            let window;
            
            if (this.scene.textures.exists('window')) {
                window = new Structure(this.scene, pos.x, pos.y, 'window', {
                    type: 'window',
                    material: 'glass',
                    health: 50,
                    destructible: true
                });
            } else {
                // Fallback window
                window = this.scene.add.rectangle(pos.x, pos.y, 16, 16, 0x87CEEB);
                this.scene.physics.add.existing(window, true);
                window.body.setImmovable(true);
                window.health = 50;
                window.maxHealth = 50;
                window.material = 'glass';
                window.isDestructible = true;
                window.structureType = 'window';
                window.side = pos.side;
                
                // Add window methods
                window.takeDamage = (amount, damageType = 'zombie') => {
                    window.health -= amount;
                    console.log(`Window took ${amount} damage, health: ${window.health}`);
                    
                    // Glass breaking effect
                    this.createGlassShards(window.x, window.y);
                    
                    if (window.health <= 0) {
                        this.destroyWindow(window);
                        return true;
                    }
                    return false;
                };
                
                window.bulletHit = (damage) => window.takeDamage(damage, 'bullet');
                window.zombieAttack = (damage) => window.takeDamage(damage, 'zombie');
            }
            
            window.setDepth(this.y + 20);
            this.windows.push(window);
        });
    }
    
    createInterior() {
        // Interior walls
        const wallThickness = 8;
        
        // Top wall
        this.addWall(this.x, this.y - 40, 120, wallThickness);
        // Bottom wall (with door gap)
        this.addWall(this.x - 40, this.y + 40, 40, wallThickness);
        this.addWall(this.x + 40, this.y + 40, 40, wallThickness);
        // Left wall (with window gap)
        this.addWall(this.x - 60, this.y - 10, wallThickness, 30);
        this.addWall(this.x - 60, this.y + 30, wallThickness, 20);
        // Right wall (with window gap)
        this.addWall(this.x + 60, this.y - 10, wallThickness, 30);
        this.addWall(this.x + 60, this.y + 30, wallThickness, 20);
        
        // Interior furniture
        this.createFurniture();
        
        // Floor
        const floor = this.scene.add.rectangle(this.x, this.y, 110, 80, 0x8B7355);
        floor.setDepth(this.y - 50);
        floor.setVisible(false);
        this.furniture.push(floor);
    }
    
    createFurniture() {
        // Table in center
        this.addFurniture(this.x, this.y - 10, 30, 20, 0x8B4513, { collision: true });
        
        // Chairs around table
        this.addFurniture(this.x - 20, this.y - 10, 12, 12, 0x654321, { collision: true });
        this.addFurniture(this.x + 20, this.y - 10, 12, 12, 0x654321, { collision: true });
        
        // Bed in corner
        this.addFurniture(this.x - 35, this.y - 25, 25, 15, 0x4A4A4A, { collision: true });
        
        // Chest/storage
        this.addFurniture(this.x + 35, this.y - 25, 20, 15, 0xD2691E, { collision: true });
        
        // Fireplace
        this.addFurniture(this.x + 35, this.y + 15, 20, 20, 0x696969, { collision: true });
    }
    
    createEntrances() {
        // Create entrance zone at the door
        this.entranceZone = this.scene.add.zone(this.x, this.y + 50, 30, 20);
        this.scene.physics.add.existing(this.entranceZone);
        this.entranceZone.body.setImmovable(true);
        
        // Add overlap detection with player
        this.scene.physics.add.overlap(this.scene.player, this.entranceZone, () => {
            this.handlePlayerAtEntrance();
        });
    }
    
    handlePlayerAtEntrance() {
        // Check if door is destroyed or open
        if (!this.door || this.door.health <= 0) {
            if (!this.isPlayerInside) {
                this.enterFarmhouse();
            }
        } else {
            // Show interaction prompt
            this.showInteractionPrompt();
        }
    }
    
    showInteractionPrompt() {
        if (!this.interactionText) {
            this.interactionText = this.scene.add.text(
                this.x, this.y - 60,
                'Press E to enter',
                {
                    fontSize: '16px',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 8, y: 4 }
                }
            ).setOrigin(0.5).setDepth(1000);
            
            // Auto-hide after 3 seconds
            this.scene.time.delayedCall(3000, () => {
                if (this.interactionText) {
                    this.interactionText.destroy();
                    this.interactionText = null;
                }
            });
        }
    }
    
    enterFarmhouse() {
        if (this.isPlayerInside) return;
        
        this.isPlayerInside = true;
        this.enterSpace(this.scene.player);
        
        // Move player inside
        this.scene.player.setPosition(this.x, this.y + 20);
        
        // Show exit prompt
        this.showExitPrompt();
        
        console.log('Player entered farmhouse');
    }
    
    exitFarmhouse() {
        if (!this.isPlayerInside) return;
        
        this.isPlayerInside = false;
        this.exitSpace(this.scene.player);
        
        // Move player outside
        this.scene.player.setPosition(this.x, this.y + 60);
        
        // Hide exit prompt
        if (this.exitText) {
            this.exitText.destroy();
            this.exitText = null;
        }
        
        console.log('Player exited farmhouse');
    }
    
    showExitPrompt() {
        this.exitText = this.scene.add.text(
            this.x, this.y - 30,
            'Press E to exit',
            {
                fontSize: '16px',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        ).setOrigin(0.5).setDepth(1000).setScrollFactor(0);
    }
    
    destroyDoor() {
        console.log('Farmhouse door destroyed!');
        
        // Create destruction effect
        this.createWoodDebris(this.door.x, this.door.y);
        
        // Remove door
        if (this.door.destroy) {
            this.door.destroy();
        } else {
            this.door.setVisible(false);
            this.door.body.destroy();
        }
        this.door = null;
        
        // Zombies can now enter
        console.log('Zombies can now enter the farmhouse!');
    }
    
    destroyWindow(window) {
        console.log(`Farmhouse window destroyed!`);
        
        // Create glass breaking effect
        this.createGlassShards(window.x, window.y);
        
        // Remove window
        if (window.destroy) {
            window.destroy();
        } else {
            window.setVisible(false);
            if (window.body) window.body.destroy();
        }
        
        // Remove from windows array
        const index = this.windows.indexOf(window);
        if (index > -1) {
            this.windows.splice(index, 1);
        }
        
        // Zombies can now enter through this window
        console.log('Zombies can now enter through the broken window!');
    }
    
    createWoodDebris(x, y) {
        for (let i = 0; i < 8; i++) {
            const debris = this.scene.add.rectangle(
                x + Phaser.Math.Between(-10, 10),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(3, 8),
                Phaser.Math.Between(3, 8),
                0x8B4513
            );
            
            debris.setDepth(1000);
            
            this.scene.tweens.add({
                targets: debris,
                x: debris.x + Phaser.Math.Between(-40, 40),
                y: debris.y + Phaser.Math.Between(-40, 40),
                alpha: 0,
                rotation: Phaser.Math.Between(-Math.PI, Math.PI),
                duration: 1500,
                ease: 'Power2',
                onComplete: () => debris.destroy()
            });
        }
    }
    
    createGlassShards(x, y) {
        for (let i = 0; i < 12; i++) {
            const shard = this.scene.add.rectangle(
                x + Phaser.Math.Between(-8, 8),
                y + Phaser.Math.Between(-8, 8),
                Phaser.Math.Between(2, 5),
                Phaser.Math.Between(2, 5),
                0xFFFFFF
            );
            
            shard.setDepth(1000);
            
            this.scene.tweens.add({
                targets: shard,
                x: shard.x + Phaser.Math.Between(-30, 30),
                y: shard.y + Phaser.Math.Between(-30, 30),
                alpha: 0,
                rotation: Phaser.Math.Between(-Math.PI, Math.PI),
                duration: 1000,
                ease: 'Power2',
                onComplete: () => shard.destroy()
            });
        }
        
        // Glass breaking sound effect (visual feedback)
        this.scene.cameras.main.shake(100, 0.01);
    }
    
    handleInput(key) {
        if (key === 'E' || key === 'e') {
            if (this.isPlayerInside) {
                this.exitFarmhouse();
            } else if (this.checkPlayerProximity(this.scene.player)) {
                if (!this.door || this.door.health <= 0) {
                    this.enterFarmhouse();
                }
            }
        }
    }
    
    update() {
        // Check if player is near entrance
        if (this.checkPlayerProximity(this.scene.player) && !this.isPlayerInside) {
            if (!this.interactionText && (!this.door || this.door.health <= 0)) {
                this.showInteractionPrompt();
            }
        } else {
            // Hide interaction prompt if player moves away
            if (this.interactionText && !this.isPlayerInside) {
                this.interactionText.destroy();
                this.interactionText = null;
            }
        }
    }
    
    showExterior() {
        if (this.exteriorStructure && this.exteriorStructure.setVisible) {
            this.exteriorStructure.setVisible(true);
        }
        if (this.door && this.door.setVisible) {
            this.door.setVisible(true);
        }
        this.windows.forEach(window => {
            if (window.setVisible) window.setVisible(true);
        });
    }
    
    hideExterior() {
        if (this.exteriorStructure && this.exteriorStructure.setVisible) {
            this.exteriorStructure.setVisible(false);
        }
        if (this.door && this.door.setVisible) {
            this.door.setVisible(false);
        }
        this.windows.forEach(window => {
            if (window.setVisible) window.setVisible(false);
        });
    }
} 