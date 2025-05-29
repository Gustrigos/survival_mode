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
        
        // Simple trail effect
        this.createSimpleTrail();
    }
    
    createSimpleTrail() {
        // Simple trail effect using a basic sprite instead of particles
        if (this.trailSprite) {
            this.trailSprite.destroy();
        }
        
        this.trailSprite = this.scene.add.image(this.x, this.y, 'bullet');
        this.trailSprite.setScale(0.5);
        this.trailSprite.setAlpha(0.5);
        this.trailSprite.setDepth(this.depth - 1);
        
        // Fade out trail
        this.scene.tweens.add({
            targets: this.trailSprite,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                if (this.trailSprite) {
                    this.trailSprite.destroy();
                    this.trailSprite = null;
                }
            }
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
        // Clean up trail effect
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