import { ZombieSpriteManager } from '../utils/ZombieSpriteManager.js';

export class Zombie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        const useSheet = scene.textures.exists('zombie_sprite');
        const textureKey = useSheet ? 'zombie_sprite' : 'zombie_down';
        const frame = useSheet ? ZombieSpriteManager.getFrame('down') : 0;
        super(scene, x, y, textureKey, frame);
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Zombie properties
        this.scene = scene;
        this.health = 75;
        this.maxHealth = 75;
        this.speed = 80 + Math.random() * 40; // Random speed variation
        this.damage = 20;
        
        // AI properties
        this.direction = 'down';
        this.lastDirectionChange = 0;
        this.directionChangeInterval = 2000; // Change direction every 2 seconds
        this.attackCooldown = 1000; // 1 second between attacks
        this.lastAttackTime = 0;
        
        // Animation
        this.walkAnimSpeed = 600; // Slower than player
        this.lastAnimTime = 0;
        this.animFrame = 0;
        
        // Set up physics body - adjusted for new sprite size (48x48)
        this.setCollideWorldBounds(true);
        if(this.usingSheet){
            this.body.setSize(34,51);
            this.body.setOffset(0,0);
        }else{
            this.body.setSize(24,30);
            this.body.setOffset(12,18);
        }
        
        // Make sure sprite is visible and properly scaled
        this.setScale(1); // Normal scale
        this.setDepth(50);
        this.setVisible(true);
        this.setActive(true);
        this.setAlpha(1);
        
        // Set initial texture
        this.setTexture(textureKey);
        
        this.usingSheet = useSheet;
        if (this.usingSheet) {
            ZombieSpriteManager.setupAnimations(scene);
            this.setScale(0.1);
            this.body.setSize(32,40);
            this.body.setOffset(341*0.1/2 -16, 512*0.1 -50);
        }
        
        console.log('Zombie created with texture:', this.texture.key);
        console.log('Zombie position:', this.x, this.y);
        console.log('Zombie scale:', this.scaleX, this.scaleY);
        console.log('Zombie visible:', this.visible);
        console.log('Zombie alpha:', this.alpha);
        console.log('Zombie depth:', this.depth);
    }
    
    update(time, delta) {
        // Move towards player
        this.moveTowardsPlayer();
        
        // Update animation
        this.updateAnimation(time);
        
        // Occasionally change direction for more natural movement
        if (time - this.lastDirectionChange > this.directionChangeInterval) {
            this.addRandomMovement();
            this.lastDirectionChange = time;
        }
    }
    
    moveTowardsPlayer() {
        const player = this.scene.player;
        if (!player) return;
        
        // Calculate direction to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize and apply speed
            const normalizedX = (dx / distance) * this.speed;
            const normalizedY = (dy / distance) * this.speed;
            
            // Add some randomness to movement
            const randomX = (Math.random() - 0.5) * 20;
            const randomY = (Math.random() - 0.5) * 20;
            
            this.setVelocity(normalizedX + randomX, normalizedY + randomY);
            
            // Update direction based on movement
            this.updateDirection(normalizedX, normalizedY);
        }
    }
    
    addRandomMovement() {
        // Add some random movement to make zombies less predictable
        const randomAngle = Math.random() * Math.PI * 2;
        const randomForce = 30;
        
        this.body.velocity.x += Math.cos(randomAngle) * randomForce;
        this.body.velocity.y += Math.sin(randomAngle) * randomForce;
    }
    
    updateDirection(velX, velY) {
        let newDir;
        if(Math.abs(velX)>Math.abs(velY)) newDir=velX>0?'right':'left';
        else newDir=velY>0?'down':'up';
        this.setDirection(newDir);
    }
    
    setDirection(dir){
        if(this.direction!==dir){
            this.direction=dir;
            if(this.usingSheet){
                let frame = ZombieSpriteManager.getFrame(dir==='right'?'left':dir);
                this.setFlipX(dir==='right');
                this.setFrame(frame);
            }else{
                this.setTexture(`zombie_${dir}`);
            }
        }
    }
    
    setRandomDirection() {
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        this.setTexture(`zombie_${this.direction}`);
    }
    
    updateAnimation(time) {
        // Simple walking animation
        if (time - this.lastAnimTime > this.walkAnimSpeed) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.lastAnimTime = time;
            
            // Simple bobbing effect (less smooth than player)
            if (this.animFrame === 0) {
                this.y -= 0.5;
            } else {
                this.y += 0.5;
            }
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Visual feedback for damage
        this.setTint(0xff0000); // Red tint
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
        
        // Knockback effect
        const player = this.scene.player;
        if (player) {
            const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
            this.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
        }
        
        // Death
        if (this.health <= 0) {
            this.die();
            return true; // Zombie was killed
        }
        
        return false; // Zombie was damaged but not killed
    }
    
    die() {
        // Create death effect
        this.createDeathEffect();
        
        // Update zombie count
        window.updateUI.zombiesLeft(this.scene.zombiesInWave - this.scene.zombies.children.size + 1);
        
        // Remove from scene
        this.destroy();
    }
    
    createDeathEffect() {
        // Create multiple blood splats
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            
            const bloodSplat = this.scene.add.image(this.x + offsetX, this.y + offsetY, 'bloodSplat');
            bloodSplat.setDepth(-5);
            bloodSplat.setAlpha(0.8);
            bloodSplat.setScale(0.5 + Math.random() * 0.5);
            
            this.scene.bloodSplats.add(bloodSplat);
            
            // Fade out blood splat over time
            this.scene.tweens.add({
                targets: bloodSplat,
                alpha: 0,
                duration: 15000,
                onComplete: () => bloodSplat.destroy()
            });
        }
        
        // Screen shake for dramatic effect
        this.scene.cameras.main.shake(50, 0.005);
    }
    
    canAttack() {
        const currentTime = this.scene.time.now;
        return currentTime - this.lastAttackTime >= this.attackCooldown;
    }
    
    attack() {
        if (!this.canAttack()) return;
        
        this.lastAttackTime = this.scene.time.now;
        
        // Visual attack effect
        this.setTint(0xff6666);
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });
        
        // Scale up briefly for attack animation
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }
} 