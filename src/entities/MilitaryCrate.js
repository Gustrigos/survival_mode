import { SpriteScaler } from '../utils/SpriteScaler.js';

export class MilitaryCrate extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        let usesFallback = false;
        
        // Check if crate texture exists
        if (!scene.textures.exists('crates')) {
            console.warn('⚠️ Crate texture not found! Creating fallback crate.');
            console.warn('⚠️ Expected texture: crates');
            console.warn('⚠️ Available textures:', Object.keys(scene.textures.list).filter(key => key.includes('sand')));
            
            // Create a fallback texture instead of returning early
            const fallbackKey = `crate_fallback_${x}_${y}`;
            
            try {
                // Create a simple colored rectangle as a texture
                const canvas = scene.textures.createCanvas(fallbackKey, 48, 32);
                const ctx = canvas.getContext();
                
                // Draw a brown rectangle for crate
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
                
                console.log('✅ Created fallback crate texture');
            } catch (fallbackError) {
                console.error('❌ Failed to create fallback crate texture:', fallbackError);

                const invalidCrate = {
                    active: false,
                    scene: scene,
                    x: x,
                    y: y,
                    destroy: () => {},
                    isActive: false,
                    body: null,
                    visible: false,
                    alpha: 0,
                    texture: null
                };
                
                // Don't inherit from Crate prototype if we failed
                console.warn('⚠️ Returning invalid crate object - should be filtered out in GameScene');
                return invalidCrate;
            }
        } else {
            // Use normal texture
            super(scene, x, y, 'crates');
        }
        
        try {
            console.log('🛡️ Creating crate at', x, y, usesFallback ? '(using fallback texture)' : '(using crates texture)');
            
            scene.add.existing(this);
            scene.physics.add.existing(this, true); 
            
            this.scene = scene;
            this.usesFallback = usesFallback;
            
            // Structure properties
            this.structureType = 'crates';
            this.material = 'fabric';
            this.isDestructible = false;
            
            this.originalTint = 0xffffff;
            this.damageTint = 0xff6666;
            
            // Apply sprite scaling to match current crate sizing
            try {
                // First apply SpriteScaler.autoScale like crates currently do
                SpriteScaler.autoScale(this, 'military_crate', { maintainAspectRatio: true });
                
                // Then apply additional scaling like crates (0.6x smaller)
                const smallerScale = 0.6; // Same as current crates - 60% of the auto-scaled size
                this.setScale(this.scaleX * smallerScale, this.scaleY * smallerScale);
                
            } catch (error) {
                console.error('❌ Error scaling crate sprite:', error);
            }
            
            // Set depth for proper layering
            this.setDepth(1000);
            
            // Setup physics body for collision
            this.setupPhysicsBody();
            
            this.isActive = true;
            
        } catch (error) {
            console.error('❌ Error creating crate:', error);
            
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
            console.log('🛡️ Setting up crate physics body...');
            
            // Ensure we have a valid physics body
            if (!this.body) {
                console.error('❌ No physics body found for crate');
                return;
            }
            
            // Use the exact same physics setup as current crates in GameScene:
            // 1 - get the visible size after all scaling
            const visW = this.displayWidth;
            const visH = this.displayHeight;
            
            // 2 - make hit-box much smaller (60% width, 50% height) - exactly like current crates
            const bodyW = visW * 0.6;
            const bodyH = visH * 0.5;
            
            // 3 - apply size & center it inside the sprite
            this.body.setSize(bodyW, bodyH);
            this.body.setOffset(
                (visW - bodyW) / 2,
                (visH - bodyH) / 2
            );
            
            // 4 - static body refresh (required for static bodies) - exactly like current crates
            this.body.updateFromGameObject();
            
            // 5 - ensure it stays immovable - exactly like current crates
            this.body.immovable = true;
            this.body.moves = false;
            this.body.pushable = false;
            
            console.log(`🛡️ Crate body resized to: ${bodyW.toFixed(1)}x${bodyH.toFixed(1)} (was ${visW.toFixed(1)}x${visH.toFixed(1)} sprite)`);
            
        } catch (error) {
            console.error('❌ Error setting up crate physics body:', error);
            // Don't throw the error - just log it and continue
        }
    }
    
    destroyCrate() {
        console.log('🛡️ Crate destroyed!');
        
        // Mark as inactive IMMEDIATELY so zombies stop targeting it
        this.isActive = false;
        this.setActive(false);
        
        // Award points for player (defensive structure destroyed means zombies made progress)
        if (window.gameState) {
            window.gameState.score += 10; // More points than barricade since crates are special items
            if (window.updateUI) {
                window.updateUI.score(window.gameState.score);
            }
        }
        
        // Remove from scene immediately to prevent further interactions
        this.destroy();
    }
    
    update(time, delta) {
        if (!this.isActive) return;
        
    }
    
    destroy() {
        
        // Call parent destroy method
        super.destroy();
        console.log('🛡️ Crate completely destroyed and cleaned up');
    }
} 