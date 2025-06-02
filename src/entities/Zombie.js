import { ZombieSpriteManager } from '../utils/ZombieSpriteManager.js';
import { GameConfig } from '../utils/GameConfig.js';

export class Zombie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        const useSheet = scene.textures.exists('zombie_sprite');
        const textureKey = useSheet ? 'zombie_sprite' : 'zombie_down';
        const frame = useSheet ? ZombieSpriteManager.getFrame('down') : 0;
        super(scene, x, y, textureKey, frame);
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Get zombie stats from config (includes difficulty modifiers)
        const zombieStats = GameConfig.getZombieStats();
        
        // Zombie properties - use config values
        this.scene = scene;
        this.health = zombieStats.health;
        this.maxHealth = zombieStats.health;
        this.speed = zombieStats.speed + Math.random() * zombieStats.speedVariation - zombieStats.speedVariation/2; // Random speed variation
        this.damage = zombieStats.damage;
        
        // AI properties - use config values
        this.direction = 'down';
        this.lastDirectionChange = 0;
        this.directionChangeInterval = zombieStats.directionChangeInterval;
        this.attackCooldown = zombieStats.attackCooldown;
        this.lastAttackTime = 0;
        
        // Barricade attack properties - use config values
        this.targetBarricade = null; // Barricade the zombie is trying to destroy
        this.lastBarricadeAttackTime = 0;
        this.barricadeAttackCooldown = zombieStats.barricadeAttackCooldown;
        this.barricadeAttackRange = zombieStats.barricadeAttackRange;
        this.barricadeAttackDamage = zombieStats.barricadeAttackDamage;
        
        // Sandbag attack properties - use config values
        this.lastSandbagAttackTime = 0;
        this.sandbagAttackCooldown = zombieStats.sandbagAttackCooldown;
        this.sandbagAttackRange = zombieStats.sandbagAttackRange;
        this.sandbagAttackDamage = zombieStats.sandbagAttackDamage;
        
        // Knockback properties - use config values
        this.isKnockedBack = false;
        this.knockbackEndTime = 0;
        this.knockbackResistance = zombieStats.knockbackResistance;
        
        // Animation
        this.walkAnimSpeed = 600; // Slower than player
        this.lastAnimTime = 0;
        this.animFrame = 0;
        
        // Movement behavior - use config values
        this.randomMovementForce = zombieStats.randomMovementForce;
        this.aggroRange = zombieStats.aggroRange;
        
        // Set up physics body - make it cover the full visible sprite, same as player
        this.setCollideWorldBounds(true);
        
        // Set physics mass for realistic collisions
        this.body.setMass(0.9); // Slightly heavier than before for more realistic knockback
        this.body.setDrag(150); // Moderate drag for natural deceleration
        this.body.setBounce(0.05); // Much smaller bounce coefficient
        
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
            
        } else {
            this.setScale(1); // Normal scale
            
            // DYNAMIC collision box for placeholder sprites
            const bounds = this.getBounds();
            const bodyWidth = bounds.width * 3.0;   // 300% of visual bounds - much larger
            const bodyHeight = bounds.height * 3.5; // 350% of visual bounds - extra tall coverage
            
            // Set body size and center it automatically
            this.body.setSize(bodyWidth, bodyHeight, true);
            
        }
        
        // Make sure sprite is visible and properly scaled
        this.setDepth(50);
        this.setVisible(true);
        this.setActive(true);
        this.setAlpha(1);
        
        // Set initial texture
        this.setTexture(textureKey);

        console.log(`🧟 Zombie created with stats: Health=${this.health}, Speed=${this.speed.toFixed(1)}, Damage=${this.damage} (Difficulty: ${GameConfig.currentDifficulty})`);
    }
    
    update(time, delta) {
        // Check if knockback period has ended
        if (this.isKnockedBack && time > this.knockbackEndTime) {
            this.isKnockedBack = false;
        }
        
        // Clean up destroyed barricade target
        if (this.targetBarricade && (!this.targetBarricade.active || this.targetBarricade.health <= 0)) {
            this.targetBarricade = null;
        }
        
        // STUCK DETECTION: If zombie is moving very slowly and there's a barricade nearby, attack it
        if (!this.isKnockedBack && !this.targetBarricade) {
            const currentSpeed = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2);
            
            // If zombie is trying to move but going very slowly (stuck against something)
            if (currentSpeed < 20 && this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
                // Look for nearby barricades to attack
                if (this.scene.barricadesList) {
                    for (let barricade of this.scene.barricadesList) {
                        if (barricade && barricade.active) {
                            const distance = Phaser.Math.Distance.Between(this.x, this.y, barricade.x, barricade.y);
                            if (distance < 70) { // Very close
                                this.targetBarricade = barricade;
                                break;
                            }
                        }
                    }
                }
            }
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
        
        // Occasionally change direction for more natural movement (only if not knocked back and not attacking barricade)
        if (!this.isKnockedBack && !this.targetBarricade && time - this.lastDirectionChange > this.directionChangeInterval) {
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
        
        // PRIORITY 0: Check if we're touching any barricade and should attack it
        if (!this.targetBarricade) {
            // Look for barricades we're very close to (touching)
            if (this.scene.barricadesList) {
                for (let barricade of this.scene.barricadesList) {
                    if (barricade && barricade.active) {
                        const distance = Phaser.Math.Distance.Between(this.x, this.y, barricade.x, barricade.y);
                        if (distance < 60) { // Very close - practically touching
                            // Check if this barricade is between us and the player
                            const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, closestTarget.x, closestTarget.y);
                            const angleToBarricade = Phaser.Math.Angle.Between(this.x, this.y, barricade.x, barricade.y);
                            const angleDifference = Math.abs(angleToPlayer - angleToBarricade);
                            
                            // If barricade is roughly in the direction of the player (within 45 degrees)
                            if (angleDifference < Math.PI / 4 || angleDifference > (2 * Math.PI - Math.PI / 4)) {
                                this.targetBarricade = barricade;
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        // PRIORITY 1: If we have a target barricade, attack it first
        if (this.targetBarricade && this.targetBarricade.active) {
            const distanceToBarricade = Phaser.Math.Distance.Between(this.x, this.y, this.targetBarricade.x, this.targetBarricade.y);
            
            if (distanceToBarricade <= this.barricadeAttackRange) {
                // Close enough to attack the barricade
                this.attackBarricade();
                this.setVelocity(0, 0); // Stop moving while attacking
                
                // Check if barricade still exists after attack (might have been destroyed)
                if (this.targetBarricade && this.targetBarricade.active) {
                    // Face the barricade while attacking
                    const barricadeDirection = this.getDirectionToTarget(this.targetBarricade);
                    this.updateDirection(barricadeDirection.x, barricadeDirection.y);
                }
                
                return; // Don't move while attacking barricade
            } else {
                // Move towards the barricade to attack it
                const pathToBarricade = this.getDirectPathToTarget(this.targetBarricade);
                this.setVelocity(pathToBarricade.x, pathToBarricade.y);
                this.updateDirection(pathToBarricade.x, pathToBarricade.y);
                
                return;
            }
        }
        
        // PRIORITY 2: Check for barricades blocking path to player
        const directPath = this.getDirectPathToTarget(closestTarget);
        const obstacleAhead = this.checkForObstacles(directPath.x, directPath.y);
        
        if (obstacleAhead && obstacleAhead.structureType === 'barricade') {
            // Barricade is blocking our path - set it as target to destroy
            this.targetBarricade = obstacleAhead;
            
            // Move towards the barricade to attack it
            const pathToBarricade = this.getDirectPathToTarget(this.targetBarricade);
            this.setVelocity(pathToBarricade.x, pathToBarricade.y);
            this.updateDirection(pathToBarricade.x, pathToBarricade.y);
            return;
        }
        
        // PRIORITY 3: Normal pathfinding (no barricade blocking)
        let finalVelocity = directPath;
        
        if (obstacleAhead) {
            // Some other obstacle (not barricade) - try to go around it
            const alternatePath = this.findAlternatePath(closestTarget);
            if (alternatePath) {
                finalVelocity = alternatePath;
            } else {
                // If no alternate path, try to move around the obstacle
                finalVelocity = this.getObstacleAvoidanceVector(closestTarget);
            }
        }
        
        /*
         * Introduce a smaller, context-aware jitter so zombies don't visibly "stutter"
         * when they are right up against sandbags or other solid objects.  When an
         * obstacle is detected directly ahead we completely suppress the random
         * offset – this lets the path-finding logic take over and avoids the rapid
         * direction changes that made the sprite appear to stumble.
         */
        let randomX = 0,
            randomY = 0;
        if (!obstacleAhead) {
            const jitterMag = 14; // down from 20 – gentler sway
            randomX = (Math.random() - 0.5) * jitterMag;
            randomY = (Math.random() - 0.5) * jitterMag;
        }

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
    
    getDirectionToTarget(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return { x: dx, y: dy };
    }
    
    checkForObstacles(velX, velY) {
        // Check for sandbags and barricades in front of zombie
        const lookAheadDistance = 80; // Distance to look ahead
        const futureX = this.x + (velX / this.speed) * lookAheadDistance;
        const futureY = this.y + (velY / this.speed) * lookAheadDistance;
        
        // Check collision with old sandbags in structures (for backward compatibility)
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
        
        // Check collision with new sandbags in sandbagsList
        if (this.scene.sandbagsList) {
            for (let sandbag of this.scene.sandbagsList) {
                if (sandbag && sandbag.active && sandbag.isActive) {
                    const distance = Phaser.Math.Distance.Between(futureX, futureY, sandbag.x, sandbag.y);
                    if (distance < 50) { // Within obstacle range
                        return sandbag; // Return the obstacle
                    }
                }
            }
        }
        
        // Also check for barricades in the barricadesList
        if (this.scene.barricadesList) {
            for (let barricade of this.scene.barricadesList) {
                if (barricade && barricade.active) {
                    const distance = Phaser.Math.Distance.Between(futureX, futureY, barricade.x, barricade.y);
                    if (distance < 50) { // Within obstacle range for barricades
                        return barricade; // Return the barricade obstacle
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
        // Add some random movement to make zombies less predictable - use config value
        const randomAngle = Math.random() * Math.PI * 2;
        const randomForce = this.randomMovementForce;
        
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
    
    // Apply knockback effect (called when hit by bullets) - use config resistance
    applyKnockback(sourceX, sourceY, force = 180, duration = 400) {
        if (this.isKnockedBack) return; // Already being knocked back
        
        // Apply knockback resistance from config
        const effectiveForce = force * (1 - this.knockbackResistance);
        
        // Calculate knockback direction away from source
        const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y);
        const velocityX = Math.cos(angle) * effectiveForce;
        const velocityY = Math.sin(angle) * effectiveForce;
        
        // Apply knockback
        this.setVelocity(velocityX, velocityY);
        this.isKnockedBack = true;
        this.knockbackEndTime = this.scene.time.now + duration;
        
        
        // More subtle visual feedback
        this.setTint(0xff6666); // Lighter red tint
        this.scene.time.delayedCall(120, () => { // Shorter duration
            if (this.active) {
                this.clearTint();
            }
        });
    }
    
    attackBarricade() {
        const currentTime = this.scene.time.now;
        
        // Check attack cooldown
        if (currentTime - this.lastBarricadeAttackTime < this.barricadeAttackCooldown) {
            return;
        }
        
        // Verify barricade still exists and is in range
        if (!this.targetBarricade || !this.targetBarricade.active) {
            this.targetBarricade = null;
            return;
        }
        
        const distanceToBarricade = Phaser.Math.Distance.Between(this.x, this.y, this.targetBarricade.x, this.targetBarricade.y);
        if (distanceToBarricade > this.barricadeAttackRange) {
            return; // Too far to attack
        }
        
        // Store barricade position BEFORE potentially destroying it
        const barricadeX = this.targetBarricade.x;
        const barricadeY = this.targetBarricade.y;
        
        // Attack the barricade
        this.lastBarricadeAttackTime = currentTime;
        
        // ACTUALLY DAMAGE THE BARRICADE - use config damage value
        const destroyed = this.targetBarricade.takeDamage(this.barricadeAttackDamage, 'zombie');
        
        if (destroyed) {
            this.targetBarricade = null; // Clear target since it's destroyed
        }
        
        // Visual attack effect on zombie
        this.setTint(0xff6666);
        this.scene.time.delayedCall(200, () => {
            if (this.active) {
                this.clearTint();
            }
        });
        
        // Scale up briefly for attack animation
        this.scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.2,
            scaleY: this.scaleY * 1.2,
            duration: 150,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Create attack effect at barricade location (use stored position)
        const attackEffect = this.scene.add.circle(barricadeX, barricadeY, 12, 0xff4444, 0.7);
        attackEffect.setDepth(1500);
        this.scene.tweens.add({
            targets: attackEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => attackEffect.destroy()
        });
    }
} 