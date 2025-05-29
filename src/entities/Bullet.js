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
        
        // Set up physics body - slightly larger for more forgiving collisions
        this.body.setSize(12, 12);
        
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
        
        // Scale bullet to roughly 1/10 of player's scale for a much smaller appearance
        if (this.scene.player) {
            const desiredScale = this.scene.player.scaleX * 0.1; // 10x smaller
            this.setScale(desiredScale);
        }
        
        // After scaling, give the bullet a slightly larger invisible hitbox (6x6) centered on the sprite
        this.body.setSize(6, 6);
        this.body.setOffset(-3, -3); // Center hit-box around the sprite's origin
        
        // Make bullet semi-transparent and fade quickly for fast-moving effect
        this.setAlpha(0.6);
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: this.lifespan * 0.4,
            ease: 'Linear'
        });
    }
    
    update(time, delta) {
        // Only update if active
        if (!this.active) return;
        
        // Check if bullet should be destroyed
        if (time - this.startTime > this.lifespan) {
            this.deactivate();
            return;
        }
        
        // Check if bullet is out of world bounds
        if (this.x < 0 || this.x > 2048 || this.y < 0 || this.y > 1536) {
            this.deactivate();
        }
    }
    
    deactivate() {
        // Restore alpha and clean any lingering trail sprite (if previously created)
        this.setAlpha(1);
        if (this.trailSprite) {
            this.trailSprite.destroy();
            this.trailSprite = null;
        }
        
        // Reset bullet for reuse
        this.setActive(false);
        this.setVisible(false);
        if (this.body) {
            this.setVelocity(0, 0);
            this.body.enable = false; // Disable physics while inactive
        }
    }
    
    destroy() {
        this.deactivate();
        super.destroy();
    }
} 