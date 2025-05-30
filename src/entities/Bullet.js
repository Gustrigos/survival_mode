export class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Bullet properties
        this.scene = scene;
        this.speed = 400;
        this.damage = 25;
        this.lifespan = 2000; // 2 seconds
        this.startTime = 0;
        
        // Set up physics body - use a slightly larger collision box for more reliable hits
        const collisionSize = 6; // Increased from 4 → 6
        this.body.setSize(collisionSize, collisionSize);
        // Center the collision box on the sprite (will be recalculated in fire() after scaling)
        this.body.setOffset((this.width - collisionSize) / 2, (this.height - collisionSize) / 2);
        
        // Start inactive
        this.setActive(false);
        this.setVisible(false);
        
        // Disable physics body until fired to prevent stray collisions
        this.body.enable = false;
        
        console.log('Bullet created with texture:', this.texture.key);
    }
    
    fire(x, y, velocityX, velocityY) {
        // Reset bullet
        this.setPosition(x, y);
        this.setVelocity(velocityX, velocityY);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true; // Enable physics for collision detection
        this.startTime = this.scene.time.now;
        
        // Orient the bullet sprite based on direction of travel (default sprite faces left)
        let angleDeg = 0;
        if (Math.abs(velocityX) > Math.abs(velocityY)) {
            // Horizontal shot
            angleDeg = velocityX > 0 ? 180 : 0; // Right needs flip (180°), left is default (0°)
        } else {
            // Vertical shot (invert north/south per feedback)
            angleDeg = velocityY > 0 ? -90 : 90; // Down -90°, Up 90°
        }
        this.setAngle(angleDeg);
        
        /*
         * Keep things simple and deterministic: render every bullet at a fixed WORLD size so it's
         * always easy to see and the physics body always lines up 1-to-1 with the pixels you see.
         */
        const WORLD_SIZE = 12; // world-pixels

        // Resize the sprite (this internally sets scaleX / scaleY)
        this.setDisplaySize(WORLD_SIZE, WORLD_SIZE);

        // Match the physics body to the exact same world size.
        const bodySize = WORLD_SIZE / this.scaleX; // convert back to texture units
        this.body.setSize(bodySize, bodySize, true);
        
        // Make bullet more noticeable (higher initial alpha) and give it a longer fade-out
        this.setAlpha(0.9);
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: this.lifespan * 0.6,
            ease: 'Linear'
        });
    }
    
    update(time, delta) {
        // Only update if active
        if (!this.active) return;
        
        // Debug bullet movement every 100ms to avoid spam
        if (time % 100 < 16) { // Roughly every 100ms (accounting for frame time)
            console.log('🚀 BULLET UPDATE:', {
                pos: { x: this.x.toFixed(2), y: this.y.toFixed(2) },
                vel: { x: this.body.velocity.x, y: this.body.velocity.y },
                timeAlive: (time - this.startTime).toFixed(0) + 'ms',
                lifespan: this.lifespan + 'ms',
                worldBounds: {
                    inBounds: this.x >= 0 && this.x <= 2048 && this.y >= 0 && this.y <= 1536
                }
            });
        }
        
        // Check if bullet should be destroyed
        if (time - this.startTime > this.lifespan) {
            console.log('⏰ BULLET EXPIRED (lifespan):', {
                pos: { x: this.x.toFixed(2), y: this.y.toFixed(2) },
                timeAlive: (time - this.startTime).toFixed(0) + 'ms'
            });
            this.deactivate();
            return;
        }
        
        // Check if bullet is out of world bounds
        if (this.x < 0 || this.x > 2048 || this.y < 0 || this.y > 1536) {
            console.log('🌍 BULLET OUT OF BOUNDS:', {
                pos: { x: this.x.toFixed(2), y: this.y.toFixed(2) },
                worldBounds: '0,0 to 2048,1536',
                timeAlive: (time - this.startTime).toFixed(0) + 'ms'
            });
            this.deactivate();
        }
    }
    
    deactivate() {
        console.log('💥 BULLET DEACTIVATED:', {
            finalPos: { x: this.x.toFixed(2), y: this.y.toFixed(2) },
            wasActive: this.active,
            wasVisible: this.visible,
            bodyEnabled: this.body ? this.body.enable : 'no body',
            timeAlive: this.scene ? (this.scene.time.now - this.startTime).toFixed(0) + 'ms' : 'unknown'
        });
        
        // Restore alpha and clean any lingering trail sprite (if previously created)
        this.setAlpha(1);
        
        // Disable physics body and hide sprite
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        
        // Reset velocity to stop any movement
        this.setVelocity(0, 0);
    }
    
    destroy() {
        this.deactivate();
        super.destroy();
    }
} 