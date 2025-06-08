import { SpriteScaler } from '../utils/SpriteScaler.js';

export class Sandbag extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        let usesFallback = false;
        
        // Check if sandbag texture exists
        if (!scene.textures.exists('sandbags')) {
            console.warn('⚠️ Sandbag texture not found! Creating fallback sandbag.');
            console.warn('⚠️ Expected texture: sandbags');
            console.warn('⚠️ Available textures:', Object.keys(scene.textures.list).filter(key => key.includes('sand')));
            
            // Create a fallback texture instead of returning early
            const fallbackKey = `sandbag_fallback_${x}_${y}`;
            
            try {
                // Create a simple colored rectangle as a texture
                const canvas = scene.textures.createCanvas(fallbackKey, 48, 32);
                const ctx = canvas.getContext();
                
                // Draw a brown rectangle for sandbag
                ctx.fillStyle = '#C2B280'; // Sandy brown color
                ctx.fillRect(0, 0, 48, 32);
                
                // Add some texture lines
                ctx.strokeStyle = '#A0956F';
                ctx.lineWidth = 1;
                for (let i = 8; i < 48; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, 32);
                    ctx.stroke();
                }
                for (let i = 8; i < 32; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(0, i);
                    ctx.lineTo(48, i);
                    ctx.stroke();
                }
                
                canvas.refresh();
                
                // Use the fallback texture
                super(scene, x, y, fallbackKey);
                usesFallback = true;
                
                console.log('✅ Created fallback sandbag texture');
            } catch (fallbackError) {
                console.error('❌ Failed to create fallback sandbag texture:', fallbackError);
                // Last resort - return a minimal object that will fail validation
                // IMPORTANT: Don't call super() if we failed to create texture
                const invalidSandbag = {
                    active: false,
                    scene: scene,
                    x: x,
                    y: y,
                    destroy: () => {},
                    isActive: false,
                    body: null, // Explicitly set to null
                    visible: false,
                    alpha: 0,
                    texture: null
                };
                
                // Don't inherit from Sandbag prototype if we failed
                console.warn('⚠️ Returning invalid sandbag object - should be filtered out in GameScene');
                return invalidSandbag;
            }
        } else {
            // Use normal texture
            super(scene, x, y, 'sandbags');
        }
        
        try {
            console.log('🛡️ Creating sandbag at', x, y, usesFallback ? '(using fallback texture)' : '(using sandbags texture)');
            
            // Add to scene and physics
            scene.add.existing(this);
            scene.physics.add.existing(this, true); // Static body - blocks movement
            
            this.scene = scene;
            this.usesFallback = usesFallback;
            
            // Structure properties
            this.structureType = 'sandbags';
            this.material = 'fabric';
            this.isDestructible = true;
            this.maxHealth = 288; // Reduced from 480 - now 2.4x barricade health (40% less than original 4x)
            this.health = this.maxHealth;
            
            // Damage properties
            this.lastDamageTime = 0;
            this.damageImmunityTime = 400; // Slightly longer immunity than barricades
            
            // Visual properties
            this.originalTint = 0xffffff;
            this.damageTint = 0xff6666;
            
            // Health state thresholds (using same sprites but different health ranges)
            this.healthStates = {
                full: { min: 210, sprite: 'sandbags' },           // 210-288 health (73%-100%)
                damaged: { min: 90, sprite: 'damaged_sandbags' }, // 90-209 health (31%-72%)  
                critical: { min: 1, sprite: 'torn_sandbags' }    // 1-89 health (0%-31%)
            };
            
            this.currentHealthState = 'full';
            
            // Apply sprite scaling to match current sandbag sizing
            try {
                // First apply SpriteScaler.autoScale like sandbags currently do
                SpriteScaler.autoScale(this, 'sandbags', { maintainAspectRatio: true });
                
                // Then apply additional scaling like sandbags (0.6x smaller)
                const smallerScale = 0.6; // Same as current sandbags - 60% of the auto-scaled size
                this.setScale(this.scaleX * smallerScale, this.scaleY * smallerScale);
                
            } catch (error) {
                console.error('❌ Error scaling sandbag sprite:', error);
            }
            
            // Set depth for proper layering
            this.setDepth(1000);
            
            // Create health bar
            this.createHealthBar();
            
            // Setup physics body for collision (same as current sandbags)
            this.setupPhysicsBody();
            
            this.isActive = true;
            
            console.log('✅ Sandbag created successfully at', x, y, 'with', this.maxHealth, 'health');
            
        } catch (error) {
            console.error('❌ Error creating sandbag:', error);
            
            // If we get here, super() was called but something else failed
            // Clean up and mark as inactive
            if (this.scene) {
                this.scene = null;
            }
            this.active = false;
            this.isActive = false;
            
            // Return the broken object so it can be detected and handled
            return this;
        }
    }
    
    setupPhysicsBody() {
        try {
            console.log('🛡️ Setting up sandbag physics body...');
            
            // Ensure we have a valid physics body
            if (!this.body) {
                console.error('❌ No physics body found for sandbag');
                return;
            }
            
            // Use the exact same physics setup as current sandbags in GameScene:
            // 1 - get the visible size after all scaling
            const visW = this.displayWidth;
            const visH = this.displayHeight;
            
            // 2 - make hit-box much smaller (60% width, 50% height) - exactly like current sandbags
            const bodyW = visW * 0.6;
            const bodyH = visH * 0.5;
            
            // 3 - apply size & center it inside the sprite
            this.body.setSize(bodyW, bodyH);
            this.body.setOffset(
                (visW - bodyW) / 2,
                (visH - bodyH) / 2
            );
            
            // 4 - static body refresh (required for static bodies) - exactly like current sandbags
            this.body.updateFromGameObject();
            
            // 5 - ensure it stays immovable - exactly like current sandbags
            this.body.immovable = true;
            this.body.moves = false;
            this.body.pushable = false;
            
            console.log(`🛡️ Sandbag body resized to: ${bodyW.toFixed(1)}x${bodyH.toFixed(1)} (was ${visW.toFixed(1)}x${visH.toFixed(1)} sprite)`);
            
        } catch (error) {
            console.error('❌ Error setting up sandbag physics body:', error);
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
            // Position health bar above sandbag
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
    
    takeDamage(damage, damageType = 'zombie') {
        const currentTime = this.scene.time.now;
        
        // Check damage immunity
        if (currentTime - this.lastDamageTime < this.damageImmunityTime) {
            return false;
        }
        
        // Calculate actual damage based on material resistance
        const actualDamage = this.calculateDamage(damage, damageType);
        this.health -= actualDamage;
        this.lastDamageTime = currentTime;
        
        console.log(`🛡️ Sandbag took ${actualDamage} ${damageType} damage (${this.health}/${this.maxHealth} remaining)`);
        
        // Update health state and sprite
        this.updateHealthState();
        
        // Visual damage effect
        this.showDamageEffect();
        
        // Check if destroyed
        if (this.health <= 0) {
            console.log(`🛡️ Sandbag destroyed! Calling destroySandbag()`);
            this.destroySandbag();
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
            
            // Change sprite if health state changed
            if (newState !== this.currentHealthState) {
                this.currentHealthState = newState;
                const newSprite = this.healthStates[newState].sprite;
                
                // Check if the new sprite texture exists, otherwise keep current sprite
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
                
                // Reapply scaling to new sprite to maintain size
                try {
                    // First apply SpriteScaler.autoScale like sandbags
                    SpriteScaler.autoScale(this, 'sandbags', { maintainAspectRatio: true });
                    
                    // Then apply additional scaling like sandbags (0.6x smaller)
                    const smallerScale = 0.6; // Same as sandbags - 60% of the auto-scaled size
                    this.setScale(this.scaleX * smallerScale, this.scaleY * smallerScale);
                    
                    console.log('✅ Sprite scaling applied');
                } catch (scaleError) {
                    console.error('❌ Error scaling sprite:', scaleError);
                    // Continue even if scaling fails
                }
                
                // Update physics body size for new sprite and refresh static body
                try {
                    if (this.body) {
                        // Use the same approach as current sandbags
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
        
        // Fabric/sand is resistant to bullets but vulnerable to explosions and fire
        if (damageType === 'bullet') multiplier = 0.2; // Very resistant to bullets (80% damage reduction)
        else if (damageType === 'fire') multiplier = 1.5; // Fabric burns easily
        else if (damageType === 'explosion') multiplier = 1.3; // Explosions scatter sand
        else if (damageType === 'zombie') multiplier = 1.0; // Normal zombie damage
        
        return Math.ceil(baseDamage * multiplier);
    }
    
    showDamageEffect() {
        // Visual feedback for taking damage
        this.setTint(this.damageTint);
        
        // Create damage particles (sand/fabric debris)
        this.createDamageParticles();
        
        // Reset tint after brief period
        this.scene.time.delayedCall(100, () => {
            this.setTint(this.originalTint);
        });
    }
    
    createDamageParticles() {
        // Create sand/fabric particles when damaged
        const particleCount = 4;
        
        for (let i = 0; i < particleCount; i++) {
            const offsetX = (Math.random() - 0.5) * 25;
            const offsetY = (Math.random() - 0.5) * 15;
            
            // Sand/fabric debris - sandy brown color
            const debris = this.scene.add.rectangle(
                this.x + offsetX, 
                this.y + offsetY, 
                2, 2, 
                0xC2B280 // Sandy color like sandbags
            );
            
            debris.setDepth(this.depth + 50);
            
            // Animate debris flying away
            this.scene.tweens.add({
                targets: debris,
                x: debris.x + (Math.random() - 0.5) * 30,
                y: debris.y - Math.random() * 25,
                alpha: 0,
                rotation: Math.random() * Math.PI,
                duration: 600,
                ease: 'Power2',
                onComplete: () => debris.destroy()
            });
        }
    }
    
    destroySandbag() {
        console.log('🛡️ Sandbag destroyed!');
        
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
        
        // Award points for player (defensive structure destroyed means zombies made progress)
        if (window.gameState) {
            window.gameState.score += 10; // More points than barricade since sandbags have more health
            if (window.updateUI) {
                window.updateUI.score(window.gameState.score);
            }
        }
        
        // Remove from scene immediately to prevent further interactions
        this.destroy();
    }
    
    createDestructionEffect() {
        // Large sand/fabric explosion
        const debrisCount = 10; // More debris than barricades since sandbags are bigger/stronger
        
        for (let i = 0; i < debrisCount; i++) {
            const angle = (i / debrisCount) * Math.PI * 2;
            const speed = 40 + Math.random() * 40;
            
            const debris = this.scene.add.rectangle(
                this.x, this.y,
                2 + Math.random() * 3,
                2 + Math.random() * 3,
                0xC2B280 // Sandy color
            );
            
            debris.setDepth(this.depth + 100);
            
            this.scene.tweens.add({
                targets: debris,
                x: debris.x + Math.cos(angle) * speed,
                y: debris.y + Math.sin(angle) * speed,
                alpha: 0,
                rotation: Math.random() * Math.PI * 4,
                duration: 800 + Math.random() * 400,
                ease: 'Power2',
                onComplete: () => debris.destroy()
            });
        }
        
        // Sand cloud (larger than barricade dust cloud)
        const sandCloud = this.scene.add.circle(this.x, this.y, 25, 0xC2B280, 0.4);
        sandCloud.setDepth(this.depth + 50);
        
        this.scene.tweens.add({
            targets: sandCloud,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => sandCloud.destroy()
        });
    }
    
    // Handle zombie attacks (main damage source for sandbags)
    zombieAttack(damage) {
        return this.takeDamage(damage, 'zombie');
    }
    
    // Handle bullet hits (friendly fire protected - bullets pass through)
    // This method won't be called due to friendly fire protection, but keeping for completeness
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
        console.log('🛡️ Sandbag completely destroyed and cleaned up');
    }
} 