import { Player } from './Player.js';

export class NPCPlayer extends Player {
    constructor(scene, x, y, squadConfig = {}) {
        super(scene, x, y);
        
        // Squad member properties
        this.isNPC = true;
        this.squadConfig = {
            name: squadConfig.name || 'Alpha',
            color: squadConfig.color || 0x00ff00, // Green for NPCs
            followDistance: squadConfig.followDistance || 100, // Distance to maintain from main player
            formationOffset: squadConfig.formationOffset || { x: 0, y: 0 }, // Formation position relative to leader
            aggroRange: squadConfig.aggroRange || 300, // Range to detect and shoot zombies
            ...squadConfig
        };
        
        // AI behavior properties
        this.target = null; // Current zombie target
        this.lastTargetScanTime = 0;
        this.targetScanInterval = 500; // Scan for targets every 500ms
        this.lastFollowUpdateTime = 0;
        this.followUpdateInterval = 100; // Update follow position every 100ms
        this.isFollowing = true;
        
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
        // Scan for zombie targets periodically
        if (time - this.lastTargetScanTime > this.targetScanInterval) {
            this.scanForTargets();
            this.lastTargetScanTime = time;
        }
        
        // Shoot at target if we have one
        if (this.target && this.target.active) {
            this.aimAndShoot();
        }
        
        // Follow main player if not engaged in combat or if target is far
        if (time - this.lastFollowUpdateTime > this.followUpdateInterval) {
            this.updateFollowBehavior();
            this.lastFollowUpdateTime = time;
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
        } else {
            this.target = null;
            this.isFollowing = true; // Resume following when no targets
        }
    }
    
    aimAndShoot() {
        if (!this.target || !this.target.active) {
            this.target = null;
            return;
        }
        
        // Calculate direction to target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        
        // Determine which direction to face based on angle
        let direction = 'down';
        const degrees = Phaser.Math.RadToDeg(angle);
        
        if (degrees >= -45 && degrees < 45) {
            direction = 'right';
        } else if (degrees >= 45 && degrees < 135) {
            direction = 'down';
        } else if (degrees >= 135 || degrees < -135) {
            direction = 'left';
        } else {
            direction = 'up';
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
        if (!this.isFollowing || !this.scene.player) return;
        
        // Calculate desired position based on formation offset
        const mainPlayer = this.scene.player;
        const desiredX = mainPlayer.x + this.squadConfig.formationOffset.x;
        const desiredY = mainPlayer.y + this.squadConfig.formationOffset.y;
        
        // Calculate distance to desired position
        const distanceToDesired = Phaser.Math.Distance.Between(this.x, this.y, desiredX, desiredY);
        
        // Only move if we're too far from desired position
        if (distanceToDesired > this.squadConfig.followDistance) {
            // Calculate movement direction
            const angle = Phaser.Math.Angle.Between(this.x, this.y, desiredX, desiredY);
            
            // Move towards desired position
            const speed = 150; // Slightly slower than player for more natural following
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            
            this.setVelocity(velocityX, velocityY);
            
            // Update direction for animation
            let direction = 'down';
            const degrees = Phaser.Math.RadToDeg(angle);
            
            if (degrees >= -45 && degrees < 45) {
                direction = 'right';
            } else if (degrees >= 45 && degrees < 135) {
                direction = 'down';
            } else if (degrees >= 135 || degrees < -135) {
                direction = 'left';
            } else {
                direction = 'up';
            }
            
            this.setDirection(direction);
            this.setMoving(true);
        } else {
            // Stop moving when close enough to desired position
            this.setVelocity(0, 0);
            this.setMoving(false);
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
        
        return true;
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
    
    // Override reload method to prevent NPCs from updating main player's reload UI
    reload() {
        if (this.isReloading || this.ammo >= this.maxAmmo) {
            return;
        }
        
        this.isReloading = true;
        this.reloadStartTime = this.scene.time.now;
        
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