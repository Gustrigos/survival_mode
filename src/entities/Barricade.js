import { SpriteScaler } from '../utils/SpriteScaler.js';

export class Barricade extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Check if barricade texture exists before creating sprite
        if (!scene.textures.exists('barricade')) {
            console.error('❌ Barricade texture not found! Cannot create barricade.');
            return null;
        }
        
        try {
            super(scene, x, y, 'barricade');
            
            console.log('🛡️ Creating barricade at', x, y);
            
            // Add to scene and physics
            scene.add.existing(this);
            scene.physics.add.existing(this, true); // Static body - blocks movement
            
            this.scene = scene;
            
            // Structure properties
            this.structureType = 'barricade';
            this.material = 'wood';
            this.isDestructible = true;
            this.maxHealth = 120; // More health than sandbags but less than sentry guns
            this.health = this.maxHealth;
            
            // Damage properties
            this.lastDamageTime = 0;
            this.damageImmunityTime = 300; // Brief immunity to prevent damage spam
            
            // Visual properties
            this.originalTint = 0xffffff;
            this.damageTint = 0xff6666;
            
            // Health state thresholds
            this.healthStates = {
                full: { min: 80, sprite: 'barricade' },           // 80-120 health
                damaged: { min: 40, sprite: 'broken_barricade' }, // 40-79 health  
                critical: { min: 1, sprite: 'much_broken_barricade' } // 1-39 health
            };
            
            this.currentHealthState = 'full';
            
            // Apply sprite scaling to match sandbags exactly
            try {
                // First apply SpriteScaler.autoScale like sandbags
                SpriteScaler.autoScale(this, 'barricade', { maintainAspectRatio: true });
                
                // Then apply additional scaling like sandbags (0.6x smaller)
                const smallerScale = 0.6; // Same as sandbags - 60% of the auto-scaled size
                this.setScale(this.scaleX * smallerScale, this.scaleY * smallerScale);
                
                console.log(`🛡️ Barricade scaled to: ${this.displayWidth}x${this.displayHeight} (same as sandbags)`);
            } catch (error) {
                console.error('❌ Error scaling barricade sprite:', error);
            }
            
            // Set depth for proper layering
            this.setDepth(1000);
            
            // Create health bar
            this.createHealthBar();
            
            // Setup physics body for collision
            this.setupPhysicsBody();
            
            this.isActive = true;
            
            console.log('✅ Barricade created successfully at', x, y, 'with', this.maxHealth, 'health');
            
        } catch (error) {
            console.error('❌ Error creating barricade:', error);
            if (this.scene) {
                this.scene = null;
            }
            return null;
        }
    }
    
    setupPhysicsBody() {
        try {
            console.log('🛡️ Setting up barricade physics body...');
            
            // Ensure we have a valid physics body
            if (!this.body) {
                console.error('❌ No physics body found for barricade');
                return;
            }
            
            // Match sandbag physics body setup exactly:
            // 1 - get the visible size after all scaling
            const visW = this.displayWidth;
            const visH = this.displayHeight;
            
            // 2 - make hit-box much smaller (60% width, 50% height) - exactly like sandbags
            const bodyW = visW * 0.6;
            const bodyH = visH * 0.5;
            
            // 3 - apply size & center it inside the sprite
            this.body.setSize(bodyW, bodyH);
            this.body.setOffset(
                (visW - bodyW) / 2,
                (visH - bodyH) / 2
            );
            
            // 4 - static body refresh (required for static bodies) - exactly like sandbags
            this.body.updateFromGameObject();
            
            // 5 - ensure it stays immovable - exactly like sandbags
            this.body.immovable = true;
            this.body.moves = false;
            this.body.pushable = false;
            
            console.log(`🛡️ Barricade body resized to: ${bodyW.toFixed(1)}x${bodyH.toFixed(1)} (was ${visW.toFixed(1)}x${visH.toFixed(1)} sprite)`);
            
        } catch (error) {
            console.error('❌ Error setting up barricade physics body:', error);
            // Don't throw the error - just log it and continue
        }
    }
    
    createHealthBar() {
        // Health bar background
        this.healthBarBg = this.scene.add.rectangle(this.x, this.y - 25, 40, 4, 0x000000, 0.7);
        this.healthBarBg.setDepth(this.depth + 100);
        
        // Health bar fill
        this.healthBarFill = this.scene.add.rectangle(this.x, this.y - 25, 38, 2, 0x00ff00);
        this.healthBarFill.setDepth(this.depth + 101);
        
        // Start hidden - only show when damaged
        this.healthBarBg.setVisible(false);
        this.healthBarFill.setVisible(false);
    }
    
    updateHealthBar() {
        if (this.healthBarBg && this.healthBarFill) {
            // Position health bar above barricade
            this.healthBarBg.x = this.x;
            this.healthBarBg.y = this.y - 25;
            this.healthBarFill.x = this.x;
            this.healthBarFill.y = this.y - 25;
            
            // Update health bar fill
            const healthPercent = this.health / this.maxHealth;
            this.healthBarFill.scaleX = healthPercent;
            
            // Color based on health
            if (healthPercent > 0.6) {
                this.healthBarFill.fillColor = 0x00ff00; // Green
            } else if (healthPercent > 0.3) {
                this.healthBarFill.fillColor = 0xffff00; // Yellow
            } else {
                this.healthBarFill.fillColor = 0xff0000; // Red
            }
            
            // Show health bar when damaged
            const shouldShowHealthBar = this.health < this.maxHealth;
            this.healthBarBg.setVisible(shouldShowHealthBar);
            this.healthBarFill.setVisible(shouldShowHealthBar);
        }
    }
    
    takeDamage(damage, damageType = 'bullet') {
        const currentTime = this.scene.time.now;
        
        // Check damage immunity
        if (currentTime - this.lastDamageTime < this.damageImmunityTime) {
            return false;
        }
        
        // Calculate actual damage based on material resistance
        const actualDamage = this.calculateDamage(damage, damageType);
        this.health -= actualDamage;
        this.lastDamageTime = currentTime;
        
        console.log(`🛡️ Barricade took ${actualDamage} ${damageType} damage (${this.health}/${this.maxHealth} remaining)`);
        
        // Update health state and sprite
        this.updateHealthState();
        
        // Visual damage effect
        this.showDamageEffect();
        
        // Check if destroyed
        if (this.health <= 0) {
            console.log(`🛡️ Barricade destroyed! Calling destroyBarricade()`);
            this.destroyBarricade();
            return true; // Destroyed
        }
        
        return false; // Still alive
    }
    
    updateHealthState() {
        try {
            let newState = 'critical'; // Default to most damaged
            
            // Determine health state based on current health
            for (const [stateName, stateData] of Object.entries(this.healthStates)) {
                if (this.health >= stateData.min) {
                    newState = stateName;
                    break;
                }
            }
            
            console.log(`🛡️ Barricade health check: ${this.health}/${this.maxHealth} HP, state: ${this.currentHealthState} -> ${newState}`);
            
            // Change sprite if health state changed
            if (newState !== this.currentHealthState) {
                this.currentHealthState = newState;
                const newSprite = this.healthStates[newState].sprite;
                
                console.log(`🛡️ Barricade health state changed to ${newState}, switching to sprite: ${newSprite}`);
                
                // Check if the new sprite texture exists
                if (!this.scene.textures.exists(newSprite)) {
                    console.warn(`⚠️ Sprite texture ${newSprite} not found, keeping current sprite`);
                    return;
                }
                
                // Change texture
                try {
                    this.setTexture(newSprite);
                    console.log(`✅ Sprite changed to ${newSprite}`);
                } catch (textureError) {
                    console.error(`❌ Error changing texture to ${newSprite}:`, textureError);
                    return; // Don't continue if texture change failed
                }
                
                // Reapply scaling to new sprite to match sandbags size
                try {
                    // First apply SpriteScaler.autoScale like sandbags
                    SpriteScaler.autoScale(this, 'barricade', { maintainAspectRatio: true });
                    
                    // Then apply additional scaling like sandbags (0.6x smaller)
                    const smallerScale = 0.6; // Same as sandbags - 60% of the auto-scaled size
                    this.setScale(this.scaleX * smallerScale, this.scaleY * smallerScale);
                    
                    console.log('✅ Sprite scaling applied');
                } catch (scaleError) {
                    console.error('❌ Error scaling sprite:', scaleError);
                    // Continue even if scaling fails
                }
                
                // Update physics body size for new sprite and refresh static body
                // Use the same approach as sandbags
                try {
                    if (this.body) {
                        // Match sandbag physics body setup exactly:
                        // 1 - get the visible size after all scaling
                        const visW = this.displayWidth;
                        const visH = this.displayHeight;
                        
                        // 2 - make hit-box much smaller (60% width, 50% height) - exactly like sandbags
                        const bodyW = visW * 0.6;
                        const bodyH = visH * 0.5;
                        
                        // 3 - apply size & center it inside the sprite
                        this.body.setSize(bodyW, bodyH);
                        this.body.setOffset(
                            (visW - bodyW) / 2,
                            (visH - bodyH) / 2
                        );
                        
                        // 4 - static body refresh (required for static bodies) - exactly like sandbags
                        this.body.updateFromGameObject();
                        
                        console.log('✅ Physics body updated for new sprite');
                    }
                } catch (physicsError) {
                    console.error('❌ Error updating physics body:', physicsError);
                    // Continue even if physics update fails
                }
            }
        } catch (error) {
            console.error('❌ Error in updateHealthState:', error);
            // Don't throw the error - just log it
        }
    }
    
    calculateDamage(baseDamage, damageType) {
        let multiplier = 1;
        
        // Wood is vulnerable to most damage types
        if (damageType === 'bullet') multiplier = 1.0;
        else if (damageType === 'fire') multiplier = 1.5; // Wood burns easily
        else if (damageType === 'explosion') multiplier = 1.2;
        else if (damageType === 'zombie') multiplier = 0.8; // Zombies less effective against wood
        
        return Math.ceil(baseDamage * multiplier);
    }
    
    showDamageEffect() {
        // Visual feedback for taking damage
        this.setTint(this.damageTint);
        
        // Create damage sparks/debris
        this.createDamageParticles();
        
        // Reset tint after brief period
        this.scene.time.delayedCall(100, () => {
            this.setTint(this.originalTint);
        });
    }
    
    createDamageParticles() {
        // Create wood chip particles when damaged
        const particleCount = 3;
        
        for (let i = 0; i < particleCount; i++) {
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 20;
            
            // Simple wood chip - small brown rectangle
            const chip = this.scene.add.rectangle(
                this.x + offsetX, 
                this.y + offsetY, 
                2, 3, 
                0x8B4513 // Brown color
            );
            
            chip.setDepth(this.depth + 50);
            
            // Animate chips flying away
            this.scene.tweens.add({
                targets: chip,
                x: chip.x + (Math.random() - 0.5) * 40,
                y: chip.y - Math.random() * 30,
                alpha: 0,
                rotation: Math.random() * Math.PI,
                duration: 800,
                ease: 'Power2',
                onComplete: () => chip.destroy()
            });
        }
    }
    
    destroyBarricade() {
        console.log('🛡️ Barricade destroyed!');
        
        // Mark as inactive IMMEDIATELY so zombies stop targeting it
        this.isActive = false;
        this.setActive(false);
        
        // Create destruction effect
        this.createDestructionEffect();
        
        // Remove health bar
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
            this.healthBarBg = null;
        }
        if (this.healthBarFill) {
            this.healthBarFill.destroy();
            this.healthBarFill = null;
        }
        
        // Award points for player (small amount since it's a defensive structure)
        if (window.gameState) {
            window.gameState.score += 5;
            if (window.updateUI) {
                window.updateUI.score(window.gameState.score);
            }
        }
        
        // Remove from scene immediately to prevent further interactions
        this.destroy();
    }
    
    createDestructionEffect() {
        // Large debris explosion
        const debrisCount = 8;
        
        for (let i = 0; i < debrisCount; i++) {
            const angle = (i / debrisCount) * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            
            const debris = this.scene.add.rectangle(
                this.x, this.y,
                3 + Math.random() * 4,
                3 + Math.random() * 4,
                0x8B4513
            );
            
            debris.setDepth(this.depth + 100);
            
            this.scene.tweens.add({
                targets: debris,
                x: debris.x + Math.cos(angle) * speed,
                y: debris.y + Math.sin(angle) * speed,
                alpha: 0,
                rotation: Math.random() * Math.PI * 4,
                duration: 1000 + Math.random() * 500,
                ease: 'Power2',
                onComplete: () => debris.destroy()
            });
        }
        
        // Dust cloud
        const dustCloud = this.scene.add.circle(this.x, this.y, 20, 0x8B7355, 0.3);
        dustCloud.setDepth(this.depth + 50);
        
        this.scene.tweens.add({
            targets: dustCloud,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => dustCloud.destroy()
        });
    }
    
    // Handle zombie attacks
    zombieAttack(damage) {
        return this.takeDamage(damage, 'zombie');
    }
    
    // Handle bullet hits
    bulletHit(damage) {
        return this.takeDamage(damage, 'bullet');
    }
    
    update(time, delta) {
        if (!this.isActive) return;
        
        // Update health bar position and appearance
        this.updateHealthBar();
    }
    
    destroy() {
        // Clean up health bar if it still exists
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
            this.healthBarBg = null;
        }
        if (this.healthBarFill) {
            this.healthBarFill.destroy();
            this.healthBarFill = null;
        }
        
        // Call parent destroy method
        super.destroy();
        console.log('🛡️ Barricade completely destroyed and cleaned up');
    }
} 