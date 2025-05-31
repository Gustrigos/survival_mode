export class Structure extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, config = {}) {
        super(scene, x, y, texture);
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body by default
        
        this.scene = scene;
        
        // Structure properties
        this.structureType = config.type || 'generic';
        this.material = config.material || 'stone'; // 'wood', 'stone', 'metal'
        this.isDestructible = config.destructible !== false; // Default to destructible
        this.maxHealth = config.health || this.getDefaultHealth();
        this.health = this.maxHealth;
        
        // Damage properties
        this.lastDamageTime = 0;
        this.damageImmunityTime = 500; // 0.5 seconds between damage
        
        // Visual properties
        this.originalTint = 0xffffff;
        this.damageTint = 0xff6666;
        
        // Set up physics body based on structure type
        this.setupPhysicsBody(config);
        
        // Set depth for proper layering
        this.setDepth(this.y + this.height);
        
        // Visual highlight to indicate collidable structure (filled + thick outline)
        // Disabled for cleaner look - no more structure highlights
        /*
        this.highlight = scene.add.rectangle(
            this.x,
            this.y,
            this.width + 8, // slightly larger than structure
            this.height + 8
        );
        this.highlight.setFillStyle(0x000000, 0); // transparent fill
        this.highlight.setOrigin(this.originX, this.originY);
        this.highlight.setStrokeStyle(4, 0xff00ff, 0.95); // thick magenta border
        this.highlight.setDepth(this.depth + 1);
        */
        
        console.log(`Created ${this.structureType} structure at ${x}, ${y} with ${this.health} health`);
    }
    
    getDefaultHealth() {
        switch (this.material) {
            case 'wood':
                return 100;
            case 'stone':
                return 300;
            case 'metal':
                return 500;
            default:
                return 150;
        }
    }
    
    setupPhysicsBody(config) {
        // Set collision box based on structure type
        const bodyConfig = this.getBodyConfig();
        
        if (bodyConfig.width && bodyConfig.height) {
            this.body.setSize(bodyConfig.width, bodyConfig.height);
        }
        
        if (bodyConfig.offsetX !== undefined && bodyConfig.offsetY !== undefined) {
            this.body.setOffset(bodyConfig.offsetX, bodyConfig.offsetY);
        }
        
        // Static bodies are immovable by default, no need to set
        // this.body.setImmovable(true); // Not needed for static bodies
        
        // Set collision category for different materials
        this.body.customData = {
            material: this.material,
            destructible: this.isDestructible,
            structureType: this.structureType
        };
    }
    
    getBodyConfig() {
        switch (this.structureType) {
            case 'crashed_helicopter':
                return { width: 200, height: 120, offsetX: 20, offsetY: 20 };
            case 'helicopter_wreckage':
                return { width: 70, height: 50, offsetX: 5, offsetY: 10 };
            case 'burning_wreckage':
                return { width: 55, height: 40, offsetX: 4, offsetY: 8 };
            case 'concrete_building':
                return { width: 110, height: 70, offsetX: 9, offsetY: 26 };
            case 'damaged_building':
                return { width: 85, height: 60, offsetX: 5, offsetY: 20 };
            case 'compound_wall':
                return { width: 60, height: 20, offsetX: 2, offsetY: 12 };
            case 'military_crate':
                return { width: 28, height: 28, offsetX: 2, offsetY: 2 };
            case 'sandbags':
                // Default moderate size; will be adjusted dynamically in GameScene
                return { width: 44, height: 20, offsetX: 2, offsetY: 12 };
            case 'barricade':
                return { width: 60, height: 16, offsetX: 2, offsetY: 16 };
            case 'debris':
                return { width: 28, height: 20, offsetX: 2, offsetY: 2 };
            case 'palm_tree':
                return { width: 20, height: 20, offsetX: 22, offsetY: 60 };
            case 'dead_tree':
                return { width: 24, height: 24, offsetX: 28, offsetY: 72 };
            default:
                return { width: this.width * 0.8, height: this.height * 0.8, offsetX: this.width * 0.1, offsetY: this.height * 0.1 };
        }
    }
    
    takeDamage(amount, damageType = 'bullet') {
        const currentTime = this.scene.time.now;
        
        // Check if structure can take damage
        if (!this.isDestructible || 
            this.health <= 0 || 
            currentTime - this.lastDamageTime < this.damageImmunityTime) {
            return false;
        }
        
        // Calculate damage based on material and damage type
        const actualDamage = this.calculateDamage(amount, damageType);
        
        this.health -= actualDamage;
        this.lastDamageTime = currentTime;
        
        // Visual feedback
        this.showDamageEffect();
        
        // Create debris
        this.createDebris(actualDamage);
        
        console.log(`${this.structureType} took ${actualDamage} damage, health: ${this.health}/${this.maxHealth}`);
        
        // Check if destroyed
        if (this.health <= 0) {
            this.destroy();
            return true; // Structure destroyed
        }
        
        return false; // Structure damaged but not destroyed
    }
    
    calculateDamage(baseDamage, damageType) {
        let multiplier = 1;
        
        // Material resistance
        switch (this.material) {
            case 'wood':
                if (damageType === 'fire') multiplier = 2.0;
                else if (damageType === 'bullet') multiplier = 1.2;
                else if (damageType === 'explosion') multiplier = 1.5;
                break;
            case 'stone':
                if (damageType === 'bullet') multiplier = 0.5;
                else if (damageType === 'explosion') multiplier = 1.2;
                break;
            case 'metal':
                if (damageType === 'bullet') multiplier = 0.3;
                else if (damageType === 'fire') multiplier = 0.8;
                else if (damageType === 'explosion') multiplier = 1.0;
                break;
        }
        
        return Math.ceil(baseDamage * multiplier);
    }
    
    showDamageEffect() {
        // Damage tint effect
        this.setTint(this.damageTint);
        
        this.scene.tweens.add({
            targets: this,
            duration: 200,
            onComplete: () => {
                this.clearTint();
            }
        });
        
        // Screen shake for large structures
        if (this.structureType === 'crashed_helicopter' || this.structureType === 'concrete_building') {
            if (this.scene && this.scene.cameras && this.scene.cameras.main) {
                this.scene.cameras.main.shake(150, 0.005);
            }
        }
    }
    
    createDebris(damage) {
        const debrisCount = Math.min(Math.ceil(damage / 20), 8);
        
        for (let i = 0; i < debrisCount; i++) {
            const debris = this.scene.add.rectangle(
                this.x + Phaser.Math.Between(-this.width/2, this.width/2),
                this.y + Phaser.Math.Between(-this.height/2, this.height/2),
                Phaser.Math.Between(2, 6),
                Phaser.Math.Between(2, 6),
                this.getDebrisColor()
            );
            
            debris.setDepth(this.depth + 1);
            
            // Animate debris
            this.scene.tweens.add({
                targets: debris,
                x: debris.x + Phaser.Math.Between(-30, 30),
                y: debris.y + Phaser.Math.Between(-30, 30),
                alpha: 0,
                rotation: Phaser.Math.Between(-Math.PI, Math.PI),
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    debris.destroy();
                }
            });
        }
    }
    
    getDebrisColor() {
        switch (this.material) {
            case 'wood':
                return 0x8B4513;
            case 'stone':
                return 0x696969;
            case 'metal':
                return 0x808080;
            default:
                return 0x654321;
        }
    }
    
    destroy() {
        // Mark as destroyed
        this.isDestroyed = true;
        
        // Clean up highlight
        /*
        if (this.highlight) {
            this.highlight.destroy();
        }
        */
        
        // Remove sprite
        super.destroy();
        
        console.log(`${this.structureType} destroyed!`);
        
        return true; // Structure was destroyed
    }
    
    createDestructionEffect() {
        if(!this.scene) return;
        // Large debris explosion
        const debrisCount = 15;
        
        for (let i = 0; i < debrisCount; i++) {
            const debris = this.scene.add.rectangle(
                this.x + Phaser.Math.Between(-this.width/4, this.width/4),
                this.y + Phaser.Math.Between(-this.height/4, this.height/4),
                Phaser.Math.Between(4, 12),
                Phaser.Math.Between(4, 12),
                this.getDebrisColor()
            );
            
            debris.setDepth(this.depth + 2);
            
            // Explosive animation
            this.scene.tweens.add({
                targets: debris,
                x: debris.x + Phaser.Math.Between(-80, 80),
                y: debris.y + Phaser.Math.Between(-80, 80),
                alpha: 0,
                rotation: Phaser.Math.Between(-Math.PI * 2, Math.PI * 2),
                scaleX: 0.1,
                scaleY: 0.1,
                duration: 1500,
                ease: 'Power3',
                onComplete: () => {
                    debris.destroy();
                }
            });
        }
        
        // Dust cloud effect
        const dustCloud = this.scene.add.circle(this.x, this.y, 5, 0x8B7355, 0.6);
        dustCloud.setDepth(this.depth + 1);
        
        this.scene.tweens.add({
            targets: dustCloud,
            scaleX: 8,
            scaleY: 8,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                dustCloud.destroy();
            }
        });
        
        // Screen shake for destruction
        if (this.scene && this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(300, 0.01);
        }
    }
    
    // Method for zombies to attack structures
    zombieAttack(damage = 10) {
        return this.takeDamage(damage, 'zombie');
    }
    
    // Method for bullet hits
    bulletHit(damage = 30) {
        return this.takeDamage(damage, 'bullet');
    }
    
    // Get health percentage for UI
    getHealthPercentage() {
        return this.health / this.maxHealth;
    }
    
    // Check if structure blocks line of sight
    blocksLineOfSight() {
        return this.structureType === 'crashed_helicopter' || 
               this.structureType === 'concrete_building' || 
               this.structureType === 'damaged_building' ||
               this.structureType === 'dead_tree';
    }
} 