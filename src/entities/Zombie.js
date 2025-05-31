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
        
        // Knockback properties
        this.isKnockedBack = false;
        this.knockbackEndTime = 0;
        
        // Animation
        this.walkAnimSpeed = 600; // Slower than player
        this.lastAnimTime = 0;
        this.animFrame = 0;
        
        // Set up physics body - make it cover the full visible sprite, same as player
        this.setCollideWorldBounds(true);
        
        // Set physics mass for realistic collisions
        this.body.setMass(0.9); // Slightly heavier than before for more realistic knockback
        this.body.setDrag(150); // Moderate drag for natural deceleration
        this.body.setBounce(0.2); // Reduced bounce for less chaotic physics
        
        this.usingSheet = useSheet;
        if (this.usingSheet) {
            ZombieSpriteManager.setupAnimations(scene);
            this.setScale(0.1);
            
            // DYNAMIC collision box based on actual visual bounds
            const bounds = this.getBounds();
            const collisionWidth = bounds.width * 3.5;   // 300% of visual bounds - much larger for easy targeting  
            const collisionHeight = bounds.height * 5; // 350% of visual bounds - extra tall head-to-toe coverage
            
            // Set body size and center it (true flag centers automatically)
            this.body.setSize(collisionWidth, collisionHeight, true);
            
            console.log(`Zombie sprite sheet body: ${collisionWidth.toFixed(1)}x${collisionHeight.toFixed(1)} (${bounds.width.toFixed(1)}x${bounds.height.toFixed(1)} sprite bounds)`);
        } else {
            this.setScale(1); // Normal scale
            
            // DYNAMIC collision box for placeholder sprites
            const bounds = this.getBounds();
            const bodyWidth = bounds.width * 3.0;   // 300% of visual bounds - much larger
            const bodyHeight = bounds.height * 3.5; // 350% of visual bounds - extra tall coverage
            
            // Set body size and center it automatically
            this.body.setSize(bodyWidth, bodyHeight, true);
            
            console.log(`Zombie placeholder body: ${bodyWidth.toFixed(1)}x${bodyHeight.toFixed(1)} (${bounds.width.toFixed(1)}x${bounds.height.toFixed(1)} sprite bounds)`);
        }
        
        // Make sure sprite is visible and properly scaled
        this.setDepth(50);
        this.setVisible(true);
        this.setActive(true);
        this.setAlpha(1);
        
        // Set initial texture
        this.setTexture(textureKey);
        
        console.log('Zombie created with texture:', this.texture.key);
        console.log('Zombie position:', this.x, this.y);
        console.log('Zombie scale:', this.scaleX, this.scaleY);
        console.log('Zombie visible:', this.visible);
        console.log('Zombie alpha:', this.alpha);
        console.log('Zombie depth:', this.depth);
    }
    
    update(time, delta) {
        // Check if knockback period has ended
        if (this.isKnockedBack && time > this.knockbackEndTime) {
            this.isKnockedBack = false;
        }
        
        // Gradual velocity reduction during knockback for more natural physics
        if (this.isKnockedBack) {
            const currentVelocity = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2);
            if (currentVelocity > 30) { // Still moving significantly
                // Gradually reduce velocity by 8% each frame
                this.body.velocity.x *= 0.92;
                this.body.velocity.y *= 0.92;
            }
        }
        
        // Only move towards player if not currently knocked back
        if (!this.isKnockedBack) {
            this.moveTowardsPlayer();
        }
        
        // Update animation
        this.updateAnimation(time);
        
        // Occasionally change direction for more natural movement (only if not knocked back)
        if (!this.isKnockedBack && time - this.lastDirectionChange > this.directionChangeInterval) {
            this.addRandomMovement();
            this.lastDirectionChange = time;
        }
    }
    
    moveTowardsPlayer() {
        // Find the closest target (main player or any squad member)
        let closestTarget = null;
        let closestDistance = Infinity;
        
        // Check main player
        if (this.scene.player && this.scene.player.active) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
            if (distance < closestDistance) {
                closestTarget = this.scene.player;
                closestDistance = distance;
            }
        }
        
        // Check all squad members
        if (this.scene.squadMembers) {
            this.scene.squadMembers.children.entries.forEach(squadMember => {
                if (squadMember.active) {
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, squadMember.x, squadMember.y);
                    if (distance < closestDistance) {
                        closestTarget = squadMember;
                        closestDistance = distance;
                    }
                }
            });
        }
        
        if (!closestTarget) return;
        
        // Smart pathfinding: check for obstacles in direct path
        const directPath = this.getDirectPathToTarget(closestTarget);
        const obstacleAhead = this.checkForObstacles(directPath.x, directPath.y);
        
        let finalVelocity = directPath;
        
        if (obstacleAhead) {
            // Find alternate path around obstacles
            const alternatePath = this.findAlternatePath(closestTarget);
            if (alternatePath) {
                finalVelocity = alternatePath;
            } else {
                // If no alternate path, try to move around the obstacle
                finalVelocity = this.getObstacleAvoidanceVector(closestTarget);
            }
        }
        
        // Apply velocity with some randomness for natural movement
        const randomX = (Math.random() - 0.5) * 20;
        const randomY = (Math.random() - 0.5) * 20;
        
        this.setVelocity(finalVelocity.x + randomX, finalVelocity.y + randomY);
        
        // Update direction based on movement
        this.updateDirection(finalVelocity.x, finalVelocity.y);
    }
    
    getDirectPathToTarget(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const normalizedX = (dx / distance) * this.speed;
            const normalizedY = (dy / distance) * this.speed;
            return { x: normalizedX, y: normalizedY };
        }
        
        return { x: 0, y: 0 };
    }
    
    checkForObstacles(velX, velY) {
        // Check for sandbags in front of zombie
        const lookAheadDistance = 80; // Distance to look ahead
        const futureX = this.x + (velX / this.speed) * lookAheadDistance;
        const futureY = this.y + (velY / this.speed) * lookAheadDistance;
        
        // Check collision with sandbags
        if (this.scene.structures) {
            for (let structure of this.scene.structures.children.entries) {
                if (structure.structureType === 'sandbags' && structure.active) {
                    const distance = Phaser.Math.Distance.Between(futureX, futureY, structure.x, structure.y);
                    if (distance < 50) { // Within obstacle range
                        return structure; // Return the obstacle
                    }
                }
            }
        }
        
        return null;
    }
    
    findAlternatePath(target) {
        // Try multiple directions to find a clear path
        const angles = [
            Math.PI / 4,    // 45 degrees right
            -Math.PI / 4,   // 45 degrees left
            Math.PI / 2,    // 90 degrees right
            -Math.PI / 2,   // 90 degrees left
            3 * Math.PI / 4, // 135 degrees right
            -3 * Math.PI / 4 // 135 degrees left
        ];
        
        const baseAngle = Math.atan2(target.y - this.y, target.x - this.x);
        
        for (let angleOffset of angles) {
            const testAngle = baseAngle + angleOffset;
            const testVelX = Math.cos(testAngle) * this.speed;
            const testVelY = Math.sin(testAngle) * this.speed;
            
            // Check if this direction is clear
            if (!this.checkForObstacles(testVelX, testVelY)) {
                return { x: testVelX, y: testVelY };
            }
        }
        
        return null; // No clear path found
    }
    
    getObstacleAvoidanceVector(target) {
        // Simple obstacle avoidance: move perpendicular to obstacle
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        
        // Try moving perpendicular to the direct path
        const perpX = -dy;
        const perpY = dx;
        const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
        
        if (perpLength > 0) {
            const normalizedPerpX = (perpX / perpLength) * this.speed * 0.7;
            const normalizedPerpY = (perpY / perpLength) * this.speed * 0.7;
            
            // Randomly choose left or right
            const direction = Math.random() > 0.5 ? 1 : -1;
            return { 
                x: normalizedPerpX * direction, 
                y: normalizedPerpY * direction 
            };
        }
        
        // Fallback: move towards target anyway
        return this.getDirectPathToTarget(target);
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
        
        // Visual feedback for damage (separate from knockback tint)
        if (!this.isKnockedBack) {
            // Only apply damage tint if not already showing knockback tint
            this.setTint(0xff0000); // Red tint
            this.scene.time.delayedCall(100, () => {
                if (this.active) {
                    this.clearTint();
                }
            });
        }
        
        // Reduced knockback effect since bullets now provide their own knockback
        // Only apply minor knockback to avoid conflicting with bullet physics
        let closestTarget = null;
        let closestDistance = Infinity;
        
        // Check main player
        if (this.scene.player && this.scene.player.active) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
            if (distance < closestDistance) {
                closestTarget = this.scene.player;
                closestDistance = distance;
            }
        }
        
        // Check all squad members
        if (this.scene.squadMembers) {
            this.scene.squadMembers.children.entries.forEach(squadMember => {
                if (squadMember.active) {
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, squadMember.x, squadMember.y);
                    if (distance < closestDistance) {
                        closestTarget = squadMember;
                        closestDistance = distance;
                    }
                }
            });
        }
        
        // Apply lighter knockback away from closest target (reduced from 200 to 80)
        // Only apply if very close and not already being knocked back by bullets
        if (closestTarget && closestDistance < 100 && !this.isKnockedBack) {
            const angle = Phaser.Math.Angle.Between(closestTarget.x, closestTarget.y, this.x, this.y);
            this.setVelocity(Math.cos(angle) * 80, Math.sin(angle) * 80);
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
        
        // Removed screen shake for less annoying visual effects
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
    
    // Apply knockback effect (called when hit by bullets)
    applyKnockback(sourceX, sourceY, force = 180, duration = 400) {
        if (this.isKnockedBack) return; // Already being knocked back
        
        // Calculate knockback direction away from source
        const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y);
        const velocityX = Math.cos(angle) * force;
        const velocityY = Math.sin(angle) * force;
        
        // Apply knockback
        this.setVelocity(velocityX, velocityY);
        this.isKnockedBack = true;
        this.knockbackEndTime = this.scene.time.now + duration;
        
        console.log(`🔥 ZOMBIE KNOCKBACK APPLIED:`, {
            force: force,
            duration: duration + 'ms',
            velocity: { x: velocityX.toFixed(1), y: velocityY.toFixed(1) },
            position: { x: this.x.toFixed(1), y: this.y.toFixed(1) },
            endTime: this.knockbackEndTime
        });
        
        // More subtle visual feedback
        this.setTint(0xff6666); // Lighter red tint
        this.scene.time.delayedCall(120, () => { // Shorter duration
            if (this.active) {
                this.clearTint();
            }
        });
    }
} 