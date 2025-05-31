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
        
        // === SQUAD COMMAND PROPERTIES ===
        this.squadMode = 'follow'; // 'follow' or 'hold' - controlled by player
        this.pingTarget = null; // Specific zombie to focus fire on
        this.pingLocation = null; // Specific location to move to
        this.holdPosition = null; // Position to hold when in 'hold' mode
        this.isExecutingPing = false; // Whether currently executing a ping command
        
        // Create name tag
        this.createNameTag();
        
        // Set different weapon loadout for variety
        if (squadConfig.weapon) {
            this.switchWeapon(squadConfig.weapon);
        }
        
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
        
        // PRIORITY 1: If reloading and NOT in hold mode, retreat to leader
        if (this.isRetreating && this.isReloading && this.squadMode !== 'hold') {
            this.target = null;
            this.isFollowing = true;
            // Force follow behavior update every frame during retreat for responsiveness
            this.updateFollowBehavior();
            return; // Skip all other AI logic during retreat
        }
        
        // PRIORITY 2: Check if we're blocking the player's line of fire and move out of the way
        if (this.isBlockingPlayer()) {
            this.repositionToAvoidBlocking();
            return; // Skip other AI logic while repositioning
        }
        
        // PRIORITY 3: Execute squad commands (NEW) - This now takes precedence over max separation
        if (this.executeSquadCommands(distanceToLeader)) {
            return; // Skip normal AI if executing specific squad commands
        }
        
        // PRIORITY 4: If too far from leader AND NOT in hold mode, abandon combat and return to formation
        if (distanceToLeader > this.squadConfig.maxSeparation && this.squadMode !== 'hold') {
            this.target = null;
            this.isFollowing = true;
        }
        
        // NOTE: Removed emergency follow logic - hold mode is now absolute
        
        // Scan for zombie targets periodically (but only if not retreating or forced to follow)
        // Works for both follow and move modes
        if (time - this.lastTargetScanTime > this.targetScanInterval && 
            distanceToLeader <= this.squadConfig.maxSeparation && 
            !this.isRetreating) {
            this.scanForTargets();
            this.lastTargetScanTime = time;
        }
        
        // Shoot at target if we have one and not retreating or too far from leader
        // Works for both follow and move modes
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
        
        // Check line of sight before shooting to prevent friendly fire
        if (!this.scene.checkLineOfSight(this, this.target)) {
            
            // Try to find a better firing position
            this.repositionForClearShot();
            return; // Don't shoot if friendly units are in the way
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
    
    // Reposition to get a clear shot when line of sight is blocked
    repositionForClearShot() {
        if (!this.target || !this.scene.player) return;
        
        // Calculate perpendicular positions around the target for flanking
        const targetX = this.target.x;
        const targetY = this.target.y;
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        
        // Calculate angle from target to player
        const targetToPlayerAngle = Phaser.Math.Angle.Between(targetX, targetY, playerX, playerY);
        
        // Try flanking positions 90 degrees left and right of the target-to-player line
        const flankDistance = 80; // Distance to move for flanking
        const leftFlankAngle = targetToPlayerAngle + Math.PI / 2; // 90 degrees left
        const rightFlankAngle = targetToPlayerAngle - Math.PI / 2; // 90 degrees right
        
        // Choose the closer flanking position
        const leftFlankX = targetX + Math.cos(leftFlankAngle) * flankDistance;
        const leftFlankY = targetY + Math.sin(leftFlankAngle) * flankDistance;
        const rightFlankX = targetX + Math.cos(rightFlankAngle) * flankDistance;
        const rightFlankY = targetY + Math.sin(rightFlankAngle) * flankDistance;
        
        const leftDistance = Phaser.Math.Distance.Between(this.x, this.y, leftFlankX, leftFlankY);
        const rightDistance = Phaser.Math.Distance.Between(this.x, this.y, rightFlankX, rightFlankY);
        
        // Choose the closer flanking position
        const targetFlankX = leftDistance < rightDistance ? leftFlankX : rightFlankX;
        const targetFlankY = leftDistance < rightDistance ? leftFlankY : rightFlankY;
        
        // Move towards the flanking position
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetFlankX, targetFlankY);
        const speed = 150; // Tactical repositioning speed
        
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
        
    }
    
    updateFollowBehavior() {
        if (!this.scene.player) return;
        
        // If in hold mode, don't follow at all - ABSOLUTE hold with no exceptions
        if (this.squadMode === 'hold') {
            // In hold mode - don't follow, just stay put regardless of retreat status
            this.setVelocity(0, 0);
            this.setMoving(false);
            this.isFollowing = false;
            return;
        }
        
        // Move mode behaves the same as follow mode for basic movement
        // The difference is in how they respond to commands (move mode is more responsive to left-click)
        
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
        // Both follow and move modes use the same logic
        const shouldFollow = this.isRetreating || // Always follow when retreating
                           ((this.squadMode === 'follow' || this.squadMode === 'move') && distanceToDesired > followThreshold) ||
                           distanceToLeader > this.squadConfig.maxSeparation; // Normal max separation for follow/move mode only
        
        // Only move if outside the dead zone AND should follow
        if (shouldFollow && distanceToDesired > deadZone) {
            // Calculate movement direction
            const angle = Phaser.Math.Angle.Between(this.x, this.y, desiredX, desiredY);
            
            // Adjust speed based on distance and retreat status
            let speed = 120; // Base speed
            
            if (this.isRetreating) {
                speed = 250; // Much faster when retreating for protection!
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
            
            // Safely create name tag damage tween
            try {
                this.scene.tweens.add({
                    targets: this.nameTag,
                    alpha: 0.3,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        if (this.nameTag && this.nameTag.active) {
                            this.nameTag.clearTint();
                            this.nameTag.setAlpha(0.8);
                        }
                    }
                });
            } catch (error) {
                console.warn(`Error creating name tag tween for ${this.squadConfig.name}:`, error);
                // Fallback: just clear the tint immediately
                if (this.nameTag && this.nameTag.active) {
                    this.nameTag.clearTint();
                    this.nameTag.setAlpha(0.8);
                }
            }
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
        
        // Animate death text with safety check
        try {
            this.scene.tweens.add({
                targets: deathText,
                y: deathText.y - 40,
                alpha: 0,
                duration: 2000,
                ease: 'Power2',
                onComplete: () => {
                    if (deathText && deathText.active) {
                        deathText.destroy();
                    }
                }
            });
        } catch (error) {
            console.warn(`Error creating death text tween for ${this.squadConfig.name}:`, error);
            // Fallback: destroy text immediately
            if (deathText && deathText.active) {
                deathText.destroy();
            }
        }
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
        
        // Only trigger retreat behavior if NOT in hold mode
        if (this.squadMode !== 'hold') {
            this.isRetreating = true;
            this.target = null; // Abandon current target
            this.isFollowing = true; // Force follow mode
            
            // Visual indication of retreating (subtle name tag color change)
            if (this.nameTag) {
                this.nameTag.setTint(0xffaa00); // Orange tint during retreat
            }
        } else {
            // In hold mode - stay put while reloading, no retreat
            this.target = null; // Still abandon current target while reloading
            
            // Visual indication of reloading in place
            if (this.nameTag) {
                this.nameTag.setTint(0xaaaa00); // Darker yellow tint for reload in place
            }
        }
        
        // DO NOT update window.gameState.isReloading 
        // (that's only for the main player's HTML UI)
    }
    
    // Override for NPC-specific behavior when dying
    destroy() {
        // Clean up name tag and any associated tweens
        if (this.nameTag && this.nameTag.active) {
            try {
                // Kill any tweens targeting the name tag
                this.scene.tweens.killTweensOf(this.nameTag);
                this.nameTag.destroy();
            } catch (error) {
                console.warn(`Error destroying name tag for ${this.squadConfig.name}:`, error);
            }
            this.nameTag = null;
        }
        
        // Call parent destroy
        super.destroy();
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
    
    // Check if this NPC is blocking the player's line of fire
    isBlockingPlayer() {
        if (!this.scene.player || !this.scene.player.active) {
            return false;
        }
        
        // Only check blocking if player is moving or has recently moved
        const player = this.scene.player;
        const playerDirection = player.direction;
        
        // Skip check if player is not facing any direction
        if (!playerDirection) {
            return false;
        }
        
        // Calculate player's facing direction vector
        let facingX = 0, facingY = 0;
        switch (playerDirection) {
            case 'up':
                facingY = -1;
                break;
            case 'down':
                facingY = 1;
                break;
            case 'left':
                facingX = -1;
                break;
            case 'right':
                facingX = 1;
                break;
            case 'up-left':
                facingX = -0.707;
                facingY = -0.707;
                break;
            case 'up-right':
                facingX = 0.707;
                facingY = -0.707;
                break;
            case 'down-left':
                facingX = -0.707;
                facingY = 0.707;
                break;
            case 'down-right':
                facingX = 0.707;
                facingY = 0.707;
                break;
        }
        
        // Check if NPC is in front of the player (within 60 pixels in facing direction)
        const directionX = this.x - player.x;
        const directionY = this.y - player.y;
        
        // Project NPC position onto player's facing direction
        const dotProduct = directionX * facingX + directionY * facingY;
        
        // If NPC is in front of player (positive dot product) and close to the line
        if (dotProduct > 0 && dotProduct < 60) {
            // Calculate perpendicular distance from NPC to player's facing line
            const perpendicularDistance = Math.abs(directionX * facingY - directionY * facingX);
            
            // If NPC is within 35 pixels of the player's facing line, they're blocking
            if (perpendicularDistance < 35) {
                return true;
            }
        }
        
        return false;
    }
    
    // Reposition to avoid blocking the player
    repositionToAvoidBlocking() {
        if (!this.scene.player) return;
        
        const player = this.scene.player;
        
        // Calculate perpendicular directions to player's facing direction
        let moveX = 0, moveY = 0;
        
        switch (player.direction) {
            case 'up':
            case 'down':
                // Move left or right
                moveX = this.x < player.x ? -60 : 60; // Move away from player's horizontal position
                break;
            case 'left':
            case 'right':
                // Move up or down
                moveY = this.y < player.y ? -60 : 60; // Move away from player's vertical position
                break;
            case 'up-left':
            case 'down-right':
                // Move in perpendicular diagonal
                moveX = 60;
                moveY = -60;
                break;
            case 'up-right':
            case 'down-left':
                // Move in perpendicular diagonal
                moveX = -60;
                moveY = -60;
                break;
        }
        
        // Calculate new target position
        const targetX = player.x + moveX;
        const targetY = player.y + moveY;
        
        // Move towards the repositioning target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        const speed = 180; // Fast repositioning speed
        
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
        
    }
    
    // === SQUAD COMMAND SYSTEM ===
    
    updateSquadCommand() {
        // Skip if game is still initializing
        if (this.scene && !this.scene.squadCommandsInitialized) {
            return;
        }
        
        // Handle mode transitions
        if (this.squadMode === 'hold' && !this.holdPosition) {
            // Switching TO hold mode: set hold position at current location
            this.holdPosition = { x: this.x, y: this.y };
        } else if (this.squadMode === 'follow') {
            // Switching TO follow mode: clear any hold positions (from both hold mode and move commands)
            this.holdPosition = null;
        } else if (this.squadMode === 'move') {
            // Switching TO move mode: clear any existing hold positions from previous hold commands
            // (but keep hold positions created by move commands)
            if (this.holdPosition && !this.isExecutingPing) {
                // Only clear if we're not currently executing a move command
                this.holdPosition = null;
            }
        }
        
        // Set ping execution flag
        this.isExecutingPing = !!(this.pingTarget || this.pingLocation);
        
        // Update name tag to show current command - with safety check
        if (!this.isDead && this.active) {
            this.updateNameTagWithCommand();
        }
    }
    
    executeSquadCommands(distanceToLeader) {
        // Return true if we're handling a specific command and should skip normal AI
        
        // PRIORITY 1: Execute ping target (focus fire)
        if (this.pingTarget && this.pingTarget.active) {
            // Target the pinged zombie specifically
            this.target = this.pingTarget;
            this.aimAndShoot();
            
            // Show we're executing focus fire command
            if (this.nameTag && this.nameTag.active && !this.isDead) {
                try {
                    this.nameTag.setText(`${this.squadConfig.name} [FOCUS]`);
                    this.nameTag.setTint(0xff0000); // Red tint for focus fire
                } catch (error) {
                    console.warn(`Error updating name tag for focus fire: ${this.squadConfig.name}`, error);
                }
            }
            
            return true; // Skip normal AI
        }
        
        // PRIORITY 2: Execute ping location (move to position) - works in both follow and move modes
        if (this.pingLocation && (this.squadMode === 'follow' || this.squadMode === 'move')) {
            const distanceToPing = Phaser.Math.Distance.Between(this.x, this.y, this.pingLocation.x, this.pingLocation.y);
            
            if (distanceToPing > 30) { // Move towards ping location
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.pingLocation.x, this.pingLocation.y);
                const speed = 180; // Fast movement for ping commands
                
                this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                this.updateDirectionFromMovement(angle);
                this.setMoving(true);
                
                // Show we're executing move command
                if (this.nameTag && this.nameTag.active && !this.isDead) {
                    try {
                        this.nameTag.setText(`${this.squadConfig.name} [MOVE]`);
                        this.nameTag.setTint(0x00ffff); // Cyan tint for movement
                    } catch (error) {
                        console.warn(`Error updating name tag for move: ${this.squadConfig.name}`, error);
                    }
                }
                
                return true; // Skip normal AI
            } else {
                // Reached ping location
                if (this.squadMode === 'move') {
                    // In move mode: convert ping location to hold position
                    this.holdPosition = { x: this.pingLocation.x, y: this.pingLocation.y };
                    this.pingLocation = null;
                    this.isExecutingPing = false;
                } else {
                    // In follow mode: just clear the ping and resume following
                    this.pingLocation = null;
                    this.isExecutingPing = false;
                }
            }
        }
        
        // PRIORITY 3: Hold position mode - absolute hold
        if (this.squadMode === 'hold' && this.holdPosition) {
            const distanceToHold = Phaser.Math.Distance.Between(this.x, this.y, this.holdPosition.x, this.holdPosition.y);
            
            if (distanceToHold > 25) { // Return to hold position if moved too far
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.holdPosition.x, this.holdPosition.y);
                const speed = 120; // Moderate speed to return to position
                
                this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                this.updateDirectionFromMovement(angle);
                this.setMoving(true);
                
                // Show we're returning to hold position
                if (this.nameTag && this.nameTag.active && !this.isDead) {
                    try {
                        this.nameTag.setText(`${this.squadConfig.name} [HOLD]`);
                        this.nameTag.setTint(0xff6600); // Orange tint for hold
                    } catch (error) {
                        console.warn(`Error updating name tag for hold: ${this.squadConfig.name}`, error);
                    }
                }
                
                return true; // Skip normal AI
            } else {
                // At hold position, just scan for targets but don't move
                this.setVelocity(0, 0);
                this.setMoving(false);
                
                // Scan for targets while holding position
                this.scanForTargets();
                if (this.target && this.target.active) {
                    this.aimAndShoot();
                }
                
                // Show we're holding position
                if (this.nameTag && this.nameTag.active && !this.isDead) {
                    try {
                        this.nameTag.setText(`${this.squadConfig.name} [HOLD]`);
                        this.nameTag.setTint(0xff6600); // Orange tint for hold
                    } catch (error) {
                        console.warn(`Error updating name tag for hold stationary: ${this.squadConfig.name}`, error);
                    }
                }
                
                return true; // Skip normal follow AI
            }
        }
        
        // PRIORITY 4: Move mode - handle hold positions created by move commands
        if (this.squadMode === 'move' && this.holdPosition) {
            const distanceToHold = Phaser.Math.Distance.Between(this.x, this.y, this.holdPosition.x, this.holdPosition.y);
            
            if (distanceToHold > 25) { // Return to move destination if moved too far
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.holdPosition.x, this.holdPosition.y);
                const speed = 120; // Moderate speed to return to position
                
                this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                this.updateDirectionFromMovement(angle);
                this.setMoving(true);
                
                // Show we're returning to move destination
                if (this.nameTag && this.nameTag.active && !this.isDead) {
                    try {
                        this.nameTag.setText(`${this.squadConfig.name} [MOVE]`);
                        this.nameTag.setTint(0x00ffff); // Cyan tint for move mode
                    } catch (error) {
                        console.warn(`Error updating name tag for move hold: ${this.squadConfig.name}`, error);
                    }
                }
                
                return true; // Skip normal AI
            } else {
                // At move destination, just scan for targets but don't move
                this.setVelocity(0, 0);
                this.setMoving(false);
                
                // Scan for targets while holding at move position
                this.scanForTargets();
                if (this.target && this.target.active) {
                    this.aimAndShoot();
                }
                
                // Show we're holding at move destination
                if (this.nameTag && this.nameTag.active && !this.isDead) {
                    try {
                        this.nameTag.setText(`${this.squadConfig.name} [MOVE]`);
                        this.nameTag.setTint(0x00ffff); // Cyan tint for move mode
                    } catch (error) {
                        console.warn(`Error updating name tag for move hold stationary: ${this.squadConfig.name}`, error);
                    }
                }
                
                return true; // Skip normal follow AI
            }
        }
        
        // If not executing any specific command, restore normal name tag
        if (!this.isDead && this.active) {
            this.updateNameTagWithCommand();
        }
        
        return false; // Continue with normal AI
    }
    
    updateNameTagWithCommand() {
        if (!this.nameTag || !this.nameTag.active) return;
        
        try {
            // Reset to normal name and color
            this.nameTag.setText(this.squadConfig.name);
            this.nameTag.clearTint();
            
            // Add mode indicator
            if (this.squadMode === 'hold') {
                this.nameTag.setText(`${this.squadConfig.name} [H]`); // H for Hold
                this.nameTag.setTint(0xffaa00); // Light orange for hold mode
            } else if (this.squadMode === 'move') {
                this.nameTag.setText(`${this.squadConfig.name} [M]`); // M for Move
                this.nameTag.setTint(0x00ffff); // Cyan for move mode
            }
        } catch (error) {
            console.warn(`Error updating name tag for ${this.squadConfig.name}:`, error);
        }
    }
    
    updateDirectionFromMovement(angle) {
        // Update direction for animation based on movement angle
        let direction = 'down';
        const degrees = Phaser.Math.RadToDeg(angle);
        
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
    }
} 