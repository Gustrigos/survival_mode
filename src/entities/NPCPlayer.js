import { Player } from './Player.js';

export class NPCPlayer extends Player {
    constructor(scene, x, y, squadConfig = {}) {
        super(scene, x, y);
        
        // Squad member properties
        this.isNPC = true;
        this.squadConfig = {
            name: squadConfig.name || 'Alpha',
            color: squadConfig.color || 0x00ff00, // Green for NPCs
            followDistance: squadConfig.followDistance || 60, // Distance to maintain from formation position
            maxSeparation: squadConfig.maxSeparation || 200, // Max distance from leader before abandoning combat
            formationOffset: squadConfig.formationOffset || { x: 0, y: 0 }, // Formation position relative to leader
            aggroRange: squadConfig.aggroRange || 300, // Range to detect and shoot zombies
            ...squadConfig
        };
        
        // AI behavior properties
        this.target = null; // Current zombie target
        this.lastTargetScanTime = 0;
        this.targetScanInterval = 500; // Scan for targets every 500ms
        this.lastFollowUpdateTime = 0;
        this.followUpdateInterval = 200; // Reduced frequency: Update follow position every 200ms (was 100ms)
        this.isFollowing = true;
        this.isDead = false; // Track death state to prevent multiple death calls
        this.isRetreating = false; // Track if NPC is retreating due to reloading
        
        // Create name tag
        this.createNameTag();
        
        // Set different weapon loadout for variety
        if (squadConfig.weapon) {
            this.switchWeapon(squadConfig.weapon);
        }
        
        console.log(`NPC Squad Member '${this.squadConfig.name}' created at ${x}, ${y}`);
    }
    
    createNameTag() {
        // Create name tag above the player
        this.nameTag = this.scene.add.text(this.x, this.y - 40, this.squadConfig.name, {
            fontSize: '12px',
            fill: `#${this.squadConfig.color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 2,
            alpha: 0.8
        });
        this.nameTag.setOrigin(0.5);
        this.nameTag.setDepth(2000); // High depth to stay above everything
        
        // Removed above-character health bars - using UI panel instead
    }
    
    update(time, delta) {
        // Handle reloading for NPCs (without updating main player's UI)
        if (this.isReloading) {
            const elapsed = time - this.reloadStartTime;
            
            if (elapsed >= this.reloadTime) {
                this.isReloading = false;
                this.ammo = this.maxAmmo;
                this.weapons[this.currentWeapon].ammo = this.ammo;
                
                // End retreat behavior when reloading finishes
                this.isRetreating = false;
                
                // Restore normal name tag color
                if (this.nameTag) {
                    this.nameTag.clearTint();
                }
                
                console.log(`${this.squadConfig.name} finished reloading and ready for combat!`);
                
                // DO NOT update window.gameState or window.updateUI 
                // (that's only for the main player's HTML UI)
            }
        }
        
        // Update animation (same as parent)
        this.updateAnimation(time);
        
        // Update sprite tint for damage effect (same as parent)
        if (time - this.lastDamageTime < 200) {
            this.setTint(0xff6666); // Red tint when damaged
        } else {
            this.clearTint();
        }
        
        // Update name tag position
        if (this.nameTag) {
            this.nameTag.x = this.x;
            this.nameTag.y = this.y - 40;
        }
        
        // AI behavior updates
        this.updateAI(time, delta);
    }
    
    updateAI(time, delta) {
        // Check if we're too far from the main player (priority override)
        const distanceToLeader = this.scene.player ? 
            Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y) : 0;
        
        // PRIORITY 1: If reloading, abandon everything and retreat to leader
        if (this.isRetreating && this.isReloading) {
            this.target = null;
            this.isFollowing = true;
            // Force follow behavior update every frame during retreat for responsiveness
            this.updateFollowBehavior();
            return; // Skip all other AI logic during retreat
        }
        
        // PRIORITY 2: If too far from leader, abandon combat and return to formation
        if (distanceToLeader > this.squadConfig.maxSeparation) {
            this.target = null;
            this.isFollowing = true;
            console.log(`${this.squadConfig.name} too far from leader (${distanceToLeader.toFixed(0)}), returning to formation`);
        }
        
        // Scan for zombie targets periodically (but only if not retreating or forced to follow)
        if (time - this.lastTargetScanTime > this.targetScanInterval && 
            distanceToLeader <= this.squadConfig.maxSeparation && 
            !this.isRetreating) {
            this.scanForTargets();
            this.lastTargetScanTime = time;
        }
        
        // Shoot at target if we have one and not retreating or too far from leader
        if (this.target && this.target.active && 
            distanceToLeader <= this.squadConfig.maxSeparation && 
            !this.isRetreating) {
            this.aimAndShoot();
        }
        
        // Always update follow behavior (but prioritize it when retreating or far from leader)
        if (time - this.lastFollowUpdateTime > this.followUpdateInterval) {
            this.updateFollowBehavior();
            this.lastFollowUpdateTime = time;
        }
        
        // Smart reload logic - reload proactively when safe near leader
        if (!this.isReloading && !this.isRetreating && distanceToLeader <= 50) {
            // If low on ammo and close to leader, reload preemptively for safety
            const ammoPercentage = this.ammo / this.maxAmmo;
            if (ammoPercentage <= 0.2 && !this.target) {
                console.log(`${this.squadConfig.name} proactively reloading while safe near leader`);
                this.reload();
            }
        }
    }
    
    scanForTargets() {
        if (!this.scene.zombies || !this.scene.player) return;
        
        let closestZombie = null;
        let closestDistance = this.squadConfig.aggroRange;
        
        // Find closest zombie within aggro range
        this.scene.zombies.children.entries.forEach(zombie => {
            if (!zombie.active) return;
            
            const distance = Phaser.Math.Distance.Between(this.x, this.y, zombie.x, zombie.y);
            if (distance < closestDistance) {
                closestZombie = zombie;
                closestDistance = distance;
            }
        });
        
        // Update target
        if (closestZombie) {
            this.target = closestZombie;
            this.isFollowing = false; // Stop following when engaging
        } else if (this.target) {
            // Only update behavior if we previously had a target
            this.target = null;
            // Don't automatically set isFollowing = true here
            // Let the normal follow logic handle positioning
        }
    }
    
    aimAndShoot() {
        if (!this.target || !this.target.active) {
            this.target = null;
            return;
        }
        
        // Calculate direction to target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        
        // Determine which direction to face based on angle - support 8 directions
        let direction = 'down';
        const degrees = Phaser.Math.RadToDeg(angle);
        
        // Map angle ranges to 8 directions including diagonals
        if (degrees >= -22.5 && degrees < 22.5) {
            direction = 'right';
        } else if (degrees >= 22.5 && degrees < 67.5) {
            direction = 'down-right';
        } else if (degrees >= 67.5 && degrees < 112.5) {
            direction = 'down';
        } else if (degrees >= 112.5 && degrees < 157.5) {
            direction = 'down-left';
        } else if (degrees >= 157.5 || degrees < -157.5) {
            direction = 'left';
        } else if (degrees >= -157.5 && degrees < -112.5) {
            direction = 'up-left';
        } else if (degrees >= -112.5 && degrees < -67.5) {
            direction = 'up';
        } else if (degrees >= -67.5 && degrees < -22.5) {
            direction = 'up-right';
        }
        
        // Update NPC direction
        this.setDirection(direction);
        
        // Shoot if we have a clear shot and are facing the right direction
        const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        if (distanceToTarget <= this.squadConfig.aggroRange) {
            this.shoot();
        }
    }
    
    updateFollowBehavior() {
        if (!this.scene.player) return;
        
        // Calculate desired position based on formation offset
        const mainPlayer = this.scene.player;
        let desiredX, desiredY;
        
        if (this.isRetreating) {
            // When retreating, get much closer to leader for protection (50% closer)
            desiredX = mainPlayer.x + (this.squadConfig.formationOffset.x * 0.5);
            desiredY = mainPlayer.y + (this.squadConfig.formationOffset.y * 0.5);
        } else {
            // Normal formation position
            desiredX = mainPlayer.x + this.squadConfig.formationOffset.x;
            desiredY = mainPlayer.y + this.squadConfig.formationOffset.y;
        }
        
        // Calculate distance to desired position
        const distanceToDesired = Phaser.Math.Distance.Between(this.x, this.y, desiredX, desiredY);
        const distanceToLeader = Phaser.Math.Distance.Between(this.x, this.y, mainPlayer.x, mainPlayer.y);
        
        // Create a larger "dead zone" to prevent constant micro-adjustments
        const deadZone = this.isRetreating ? 25 : 40; // Smaller when retreating, larger when in formation
        const followThreshold = this.squadConfig.followDistance + 20; // Add buffer to follow distance
        
        // Determine if we should follow based on distance and combat status
        const shouldFollow = this.isRetreating || // Always follow when retreating
                           distanceToDesired > followThreshold ||
                           distanceToLeader > this.squadConfig.maxSeparation;
        
        // Only move if outside the dead zone AND should follow
        if (shouldFollow && distanceToDesired > deadZone) {
            // Calculate movement direction
            const angle = Phaser.Math.Angle.Between(this.x, this.y, desiredX, desiredY);
            
            // Adjust speed based on distance and retreat status
            let speed = 120; // Base speed
            
            if (this.isRetreating) {
                speed = 250; // Much faster when retreating for protection!
                console.log(`${this.squadConfig.name} retreating at high speed to leader!`);
            } else if (distanceToLeader > this.squadConfig.maxSeparation) {
                speed = 220; // Much faster when too far from leader
            } else if (distanceToDesired > followThreshold * 1.5) {
                speed = 180; // Faster when moderately far
            } else {
                speed = 80; // Slower when close to avoid overshooting
            }
            
            // Move towards desired position
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            
            this.setVelocity(velocityX, velocityY);
            
            // Update direction for animation
            let direction = 'down';
            const degrees = Phaser.Math.RadToDeg(angle);
            
            // Map angle ranges to 8 directions including diagonals
            if (degrees >= -22.5 && degrees < 22.5) {
                direction = 'right';
            } else if (degrees >= 22.5 && degrees < 67.5) {
                direction = 'down-right';
            } else if (degrees >= 67.5 && degrees < 112.5) {
                direction = 'down';
            } else if (degrees >= 112.5 && degrees < 157.5) {
                direction = 'down-left';
            } else if (degrees >= 157.5 || degrees < -157.5) {
                direction = 'left';
            } else if (degrees >= -157.5 && degrees < -112.5) {
                direction = 'up-left';
            } else if (degrees >= -112.5 && degrees < -67.5) {
                direction = 'up';
            } else if (degrees >= -67.5 && degrees < -22.5) {
                direction = 'up-right';
            }
            
            this.setDirection(direction);
            this.setMoving(true);
            
            // Set following flag to false when we get close enough
            if (distanceToDesired <= deadZone) {
                this.isFollowing = false;
            }
        } else {
            // Stop moving when in dead zone or when close enough
            this.setVelocity(0, 0);
            this.setMoving(false);
            this.isFollowing = false; // Clear following flag to prevent constant re-triggering
        }
    }
    
    // Override takeDamage to prevent NPCs from updating main player's HTML UI
    takeDamage(amount) {
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastDamageTime < this.damageImmunityTime) {
            return false; // Still immune
        }
        
        this.health = Math.max(0, this.health - amount);
        this.lastDamageTime = currentTime;
        
        // Screen flash effect (same as parent)
        this.scene.cameras.main.flash(200, 255, 100, 100);
        
        // DO NOT update window.gameState.playerHealth or window.updateUI.health 
        // (that's only for the main player's HTML UI)
        
        // Flash name tag when taking damage (NPC-specific visual feedback)
        if (this.nameTag) {
            this.nameTag.setTint(0xff0000);
            this.scene.tweens.add({
                targets: this.nameTag,
                alpha: 0.3,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.nameTag.clearTint();
                    this.nameTag.setAlpha(0.8);
                }
            });
        }
        
        // Check for death
        if (this.health <= 0) {
            this.die();
            return true; // NPC was killed
        }
        
        return false; // NPC was damaged but not killed
    }
    
    // Death handling for NPCs
    die() {
        // Prevent multiple death calls
        if (this.isDead || !this.active) {
            return;
        }
        this.isDead = true;
        
        // Track this death for HUD display
        if (this.scene.trackDestroyedSquadMember) {
            this.scene.trackDestroyedSquadMember(this);
        }
        
        // Create death effects
        this.createDeathEffect();
        
        // Log elimination
        console.log(`Squad member '${this.squadConfig.name}' has been eliminated!`);
        
        // Remove from squad members group and destroy
        if (this.scene.squadMembers) {
            this.scene.squadMembers.remove(this, true, true); // Remove and destroy
        } else {
            this.destroy();
        }
    }
    
    // Create death effect for NPCs
    createDeathEffect() {
        // Create blood splats
        for (let i = 0; i < 2; i++) {
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            
            const bloodSplat = this.scene.add.image(this.x + offsetX, this.y + offsetY, 'bloodSplat');
            bloodSplat.setDepth(-5);
            bloodSplat.setAlpha(0.8);
            bloodSplat.setScale(0.3 + Math.random() * 0.3);
            
            if (this.scene.bloodSplats) {
                this.scene.bloodSplats.add(bloodSplat);
            }
            
            // Fade out blood splat over time
            this.scene.tweens.add({
                targets: bloodSplat,
                alpha: 0,
                duration: 12000,
                onComplete: () => bloodSplat.destroy()
            });
        }
        
        // Death message effect
        const deathText = this.scene.add.text(this.x, this.y - 60, `${this.squadConfig.name} KIA`, {
            fontSize: '14px',
            fill: '#ff0000',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 2
        });
        deathText.setOrigin(0.5);
        deathText.setDepth(2100);
        
        // Animate death text
        this.scene.tweens.add({
            targets: deathText,
            y: deathText.y - 40,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => deathText.destroy()
        });
    }
    
    // Override shoot method to prevent NPCs from updating main player's ammo UI
    shoot() {
        const currentTime = this.scene.time.now;
        
        if (this.isReloading || this.ammo <= 0 || currentTime - this.lastShotTime < this.fireRate) {
            return;
        }
        
        // Calculate bullet direction based on NPC direction
        let bulletVelX = 0;
        let bulletVelY = 0;
        let muzzleOffsetX = 0;
        let muzzleOffsetY = 0;
        
        // Use the physics body center directly
        const playerCenterX = this.body.center.x;
        const playerCenterY = this.body.center.y;
        
        switch (this.direction) {
            case 'up':
                bulletVelY = -this.bulletSpeed;
                muzzleOffsetY = -20;
                break;
            case 'down':
                bulletVelY = this.bulletSpeed;
                muzzleOffsetY = 20;
                break;
            case 'left':
                bulletVelX = -this.bulletSpeed;
                muzzleOffsetX = -20;
                break;
            case 'right':
                bulletVelX = this.bulletSpeed;
                muzzleOffsetX = 20;
                break;
            case 'up-left':
                bulletVelX = -this.bulletSpeed * 0.707; // Normalize diagonal speed
                bulletVelY = -this.bulletSpeed * 0.707;
                muzzleOffsetX = -14; // Diagonal offset
                muzzleOffsetY = -14;
                break;
            case 'up-right':
                bulletVelX = this.bulletSpeed * 0.707;
                bulletVelY = -this.bulletSpeed * 0.707;
                muzzleOffsetX = 14;
                muzzleOffsetY = -14;
                break;
            case 'down-left':
                bulletVelX = -this.bulletSpeed * 0.707;
                bulletVelY = this.bulletSpeed * 0.707;
                muzzleOffsetX = -14;
                muzzleOffsetY = 14;
                break;
            case 'down-right':
                bulletVelX = this.bulletSpeed * 0.707;
                bulletVelY = this.bulletSpeed * 0.707;
                muzzleOffsetX = 14;
                muzzleOffsetY = 14;
                break;
        }
        
        // Create bullet starting from NPC's collision box center
        const bulletStartX = playerCenterX + muzzleOffsetX;
        const bulletStartY = playerCenterY + muzzleOffsetY;
        
        const bullet = this.scene.bullets.get();
        if (bullet) {
            bullet.fire(bulletStartX, bulletStartY, bulletVelX, bulletVelY);
        }
        
        // Create muzzle flash (same as parent)
        this.createMuzzleFlash(muzzleOffsetX, muzzleOffsetY);
        
        // Create shell casing (same as parent)
        this.createShellCasing();
        
        // Update NPC's own ammo (NOT the main player's ammo UI)
        this.ammo--;
        this.weapons[this.currentWeapon].ammo = this.ammo;
        
        // DO NOT update window.gameState.playerAmmo or window.updateUI.ammo
        // (that's only for the main player's HTML UI)
        
        // Auto-reload when empty
        if (this.ammo <= 0) {
            this.reload();
        }
        
        this.lastShotTime = currentTime;
    }
    
    // Override reload method to trigger retreat behavior during vulnerable reloading
    reload() {
        if (this.isReloading || this.ammo >= this.maxAmmo) {
            return;
        }
        
        // Start reloading
        this.isReloading = true;
        this.reloadStartTime = this.scene.time.now;
        
        // Trigger retreat behavior - NPC becomes vulnerable and seeks leader protection
        this.isRetreating = true;
        this.target = null; // Abandon current target
        this.isFollowing = true; // Force follow mode
        
        console.log(`${this.squadConfig.name} is reloading and retreating to leader for protection!`);
        
        // Visual indication of retreating (subtle name tag color change)
        if (this.nameTag) {
            this.nameTag.setTint(0xffaa00); // Orange tint during retreat
        }
        
        // DO NOT update window.gameState.isReloading 
        // (that's only for the main player's HTML UI)
    }
    
    // Override for NPC-specific behavior when dying
    destroy() {
        if (this.nameTag) {
            this.nameTag.destroy();
        }
        // Removed health bar cleanup - using UI panel instead
        super.destroy();
        console.log(`Squad member '${this.squadConfig.name}' has been eliminated`);
    }
    
    // Set formation position for squad coordination
    setFormationOffset(offsetX, offsetY) {
        this.squadConfig.formationOffset.x = offsetX;
        this.squadConfig.formationOffset.y = offsetY;
    }
    
    // Manual target assignment (useful for coordinated attacks)
    assignTarget(zombie) {
        this.target = zombie;
        this.isFollowing = false;
    }
    
    // Get status for UI or debugging
    getStatus() {
        return {
            name: this.squadConfig.name,
            health: this.health,
            ammo: this.ammo,
            hasTarget: !!this.target,
            isFollowing: this.isFollowing,
            position: { x: this.x, y: this.y }
        };
    }
} 