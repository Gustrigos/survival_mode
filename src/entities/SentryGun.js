import { SpriteScaler } from '../utils/SpriteScaler.js';

export class SentryGun extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'sentry_gun_right');
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body - blocks movement
        
        this.scene = scene;
        
        // FRIENDLY FIRE PROTECTION: Sentry guns are protected from friendly bullets
        // like squad members - only zombies can damage them through zombie attacks
        // Friendly fire protection is set up in GameScene.placeSentryGun() method
        
        // Structure properties (copied from Structure class)
        this.structureType = 'sentry_gun';
        this.material = 'metal';
        this.isDestructible = true;
        this.maxHealth = 100; // Reduced from 150 for balance
        this.health = this.maxHealth;
        
        // Damage properties
        this.lastDamageTime = 0;
        this.damageImmunityTime = 500;
        
        // Visual properties
        this.originalTint = 0xffffff;
        this.damageTint = 0xff6666;
        
        // Sentry gun specific properties
        this.detectionRange = 200; // Reduced range for balance
        this.fireRate = 250; // Faster fire rate for effectiveness
        this.damage = 30; // Increased damage
        this.bulletSpeed = 700; // Faster bullets
        this.lastShotTime = 0;
        this.currentTarget = null;
        this.direction = 'right'; // Current facing direction
        this.isActive = true;
        
        // Reload system - 30 rounds then 5 second reload
        this.maxAmmo = 30;
        this.currentAmmo = this.maxAmmo;
        this.isReloading = false;
        this.reloadTime = 5000; // 5 seconds
        this.reloadStartTime = 0;
        this.smokeEffects = []; // Track smoke effects during reload
        
        // Visual properties
        this.setDepth(1000); // High depth so it renders above most things
        
        // Use SpriteScaler to make it bigger than player (48x72 pixels)
        // Force exact size without maintaining aspect ratio to get 48x72 exactly
        SpriteScaler.autoScale(this, 'sentry_gun_right', { maintainAspectRatio: false });
        
        // If SpriteScaler didn't work as expected, force the size
        if (this.displayWidth !== 48 || this.displayHeight !== 72) {
            this.setDisplaySize(48, 72); // Force exact size
            console.log(`🎯 Forced sentry gun size to 48x72 (was ${this.displayWidth}x${this.displayHeight})`);
        }
        
        // Force an update to ensure scaling is applied before collision box calculation
        this.updateDisplayOrigin();
        
        // Make physics body much smaller than the sprite (after all scaling is done)
        // 1 - get the visible size after all scaling
        const visW = this.displayWidth;
        const visH = this.displayHeight;
        
        // 2 - make hit-box much smaller (55% width, 70% height to hug gun + tripod)
        const bodyW = visW * 0.55;
        const bodyH = visH * 0.70;
        
        // 3 - apply size & center it inside the sprite
        this.body.setSize(bodyW, bodyH);
        this.body.setOffset(
            (visW - bodyW) / 2,
            (visH - bodyH) / 2
        );
        
        // 4 - static body refresh (required for static bodies)
        this.body.updateFromGameObject();
        
        // 5 - ensure it stays immovable
        this.body.immovable = true;
        this.body.moves = false;
        this.body.pushable = false;
        this.body.enable = true;
        
        console.log(`🎯 Sentry gun body resized to: ${bodyW.toFixed(1)}x${bodyH.toFixed(1)} (was ${visW.toFixed(1)}x${visH.toFixed(1)} sprite)`);
        
        // EXPLICIT DEBUG: Log the collision box calculation step by step
        console.log(`🎯 COLLISION BOX DEBUG:`);
        console.log(`  visW: ${visW}, visH: ${visH}`);
        console.log(`  bodyW: ${bodyW}, bodyH: ${bodyH}`);
        console.log(`  final body.width: ${this.body.width}`);
        console.log(`  final body.height: ${this.body.height}`);
        console.log(`  body position: (${this.body.x}, ${this.body.y})`);
        console.log(`  body center: (${this.body.center.x}, ${this.body.center.y})`);
        
        console.log(`Sentry gun placed at (${x}, ${y}) with ${this.health} health`);
        
        // Create tiny health bar above the sentry gun
        this.createHealthBar();
    }
    
    update(time, delta) {
        if (!this.isActive || this.health <= 0) {
            return;
        }
        
        // Update health bar position and appearance
        this.updateHealthBar();
        
        // Handle reloading
        if (this.isReloading) {
            const elapsed = time - this.reloadStartTime;
            
            if (elapsed >= this.reloadTime) {
                // Reload complete
                this.isReloading = false;
                this.currentAmmo = this.maxAmmo;
                this.clearSmokeEffects();
                console.log('🎯 Sentry gun reload complete');
            }
            
            // Don't find targets or shoot while reloading
            return;
        }
        
        // Find closest zombie within range
        this.findTarget();
        
        // Shoot at target if available
        if (this.currentTarget && this.canShoot(time)) {
            console.log(`🎯 Sentry gun attempting to shoot!`);
            this.shootAtTarget(time);
        }
    }
    
    findTarget() {
        if (!this.scene.zombies) {
            this.currentTarget = null;
            return;
        }
        
        let closestZombie = null;
        let closestDistance = this.detectionRange;
        
        this.scene.zombies.children.entries.forEach(zombie => {
            if (!zombie.active || zombie.health <= 0) return;
            
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y, zombie.x, zombie.y
            );
            
            if (distance <= closestDistance) {
                // Check if we have line of sight to the zombie
                if (this.hasLineOfSight(zombie)) {
                    closestZombie = zombie;
                    closestDistance = distance;
                }
            }
        });
        
        // Update target with logging only on changes
        if (closestZombie !== this.currentTarget) {
            if (closestZombie) {
                console.log(`🎯 Sentry gun acquired NEW target at distance ${closestDistance.toFixed(0)}`);
            } else if (this.currentTarget) {
                console.log(`🎯 Sentry gun lost target`);
            }
            this.currentTarget = closestZombie;
        }
        
        // Update direction to face target
        if (this.currentTarget) {
            this.updateDirection();
        }
    }
    
    hasLineOfSight(target) {
        // Simple line of sight check - could be enhanced with raycasting
        // For now, assume clear line of sight within detection range
        return true;
    }
    
    updateDirection() {
        if (!this.currentTarget) return;
        
        const dx = this.currentTarget.x - this.x;
        const dy = this.currentTarget.y - this.y;
        const angle = Math.atan2(dy, dx);
        const degrees = Phaser.Math.RadToDeg(angle);
        
        // Determine sprite based on angle (8 directions)
        let newDirection = 'right';
        let newTexture = 'sentry_gun_right';
        let flipX = false;
        
        if (degrees >= -22.5 && degrees <= 22.5) {
            // Right
            newDirection = 'right';
            newTexture = 'sentry_gun_right';
        } else if (degrees > 22.5 && degrees <= 67.5) {
            // Down-right
            newDirection = 'down_right';
            newTexture = 'sentry_gun_down_right';
        } else if (degrees > 67.5 && degrees <= 112.5) {
            // Down - now uses pure down sprite
            newDirection = 'down';
            newTexture = 'sentry_gun_down';
        } else if (degrees > 112.5 && degrees <= 157.5) {
            // Down-left
            newDirection = 'down_left';
            newTexture = 'sentry_gun_down_left';
        } else if (degrees > 157.5 || degrees <= -157.5) {
            // Left
            newDirection = 'left';
            newTexture = 'sentry_gun_left';
        } else if (degrees > -157.5 && degrees <= -112.5) {
            // Up-left
            newDirection = 'up_left';
            newTexture = 'sentry_gun_up_left';
        } else if (degrees > -112.5 && degrees <= -67.5) {
            // Up - now uses pure up sprite
            newDirection = 'up';
            newTexture = 'sentry_gun_up';
        } else if (degrees > -67.5 && degrees < -22.5) {
            // Up-right
            newDirection = 'up_right';
            newTexture = 'sentry_gun_up_right';
        }
        
        // Update sprite if direction changed
        if (newDirection !== this.direction) {
            this.direction = newDirection;
            
            // Debug: Log direction changes for new up/down sprites
            if (newDirection === 'up' || newDirection === 'down') {
                console.log(`🎯 Sentry gun now facing ${newDirection.toUpperCase()} using sprite: ${newTexture}`);
            }
            
            // Check if the texture exists, fallback to right if not
            if (this.scene.textures.exists(newTexture)) {
                this.setTexture(newTexture);
                // Re-apply scaling to maintain consistent size - use exact sizing
                SpriteScaler.autoScale(this, newTexture, { maintainAspectRatio: false });
                
                // Force correct size if SpriteScaler didn't work
                if (this.displayWidth !== 48 || this.displayHeight !== 72) {
                    this.setDisplaySize(48, 72);
                }
            } else {
                console.warn(`Texture ${newTexture} not found, using fallback`);
                this.setTexture('sentry_gun_right');
                SpriteScaler.autoScale(this, 'sentry_gun_right', { maintainAspectRatio: false });
                
                // Force correct size if SpriteScaler didn't work
                if (this.displayWidth !== 48 || this.displayHeight !== 72) {
                    this.setDisplaySize(48, 72);
                }
            }
            
            // No need to flip since we have proper directional sprites
            this.setFlipX(flipX);
        }
    }
    
    canShoot(time) {
        return !this.isReloading && 
               this.currentAmmo > 0 && 
               time - this.lastShotTime >= this.fireRate;
    }
    
    shootAtTarget(time) {
        if (!this.currentTarget || !this.scene.bullets || this.isReloading || this.currentAmmo <= 0) return;
        
        // Calculate bullet direction
        const angle = Phaser.Math.Angle.Between(
            this.x, this.y, 
            this.currentTarget.x, this.currentTarget.y
        );
        
        const bulletVelX = Math.cos(angle) * this.bulletSpeed;
        const bulletVelY = Math.sin(angle) * this.bulletSpeed;
        
        // Calculate muzzle position based on direction (matching player size offsets)
        let muzzleOffsetX = 20; // Player-sized offsets
        let muzzleOffsetY = 0;
        
        switch (this.direction) {
            case 'right':
                muzzleOffsetX = 20;
                muzzleOffsetY = 0;
                break;
            case 'down_right':
                muzzleOffsetX = 14; // Diagonal offset
                muzzleOffsetY = 14;
                break;
            case 'down':
                muzzleOffsetX = 0;
                muzzleOffsetY = 20; // Pure down
                break;
            case 'down_left':
                muzzleOffsetX = -14;
                muzzleOffsetY = 14;
                break;
            case 'left':
                muzzleOffsetX = -20;
                muzzleOffsetY = 0;
                break;
            case 'up_left':
                muzzleOffsetX = -14;
                muzzleOffsetY = -14;
                break;
            case 'up':
                muzzleOffsetX = 0;
                muzzleOffsetY = -20; // Pure up
                break;
            case 'up_right':
                muzzleOffsetX = 14;
                muzzleOffsetY = -14;
                break;
            default:
                // Fallback to right
                muzzleOffsetX = 20;
                muzzleOffsetY = 0;
                break;
        }
        
        // Use physics body center like Player.js does (exactly matching the approach)
        const bulletStartX = this.body.center.x + muzzleOffsetX;
        const bulletStartY = this.body.center.y + muzzleOffsetY;
        
        // Debug: Enhanced bullet position logging
        console.log(`🎯 Sentry gun shooting:`, {
            sentryPos: { x: this.x.toFixed(1), y: this.y.toFixed(1) },
            bodyCenter: { x: this.body.center.x.toFixed(1), y: this.body.center.y.toFixed(1) },
            muzzleOffset: { x: muzzleOffsetX, y: muzzleOffsetY },
            bulletStart: { x: bulletStartX.toFixed(1), y: bulletStartY.toFixed(1) },
            direction: this.direction,
            velocity: { x: bulletVelX.toFixed(1), y: bulletVelY.toFixed(1) }
        });
        
        // Create bullet exactly like Player.js
        const bullet = this.scene.bullets.get();
        if (bullet) {
            bullet.fire(bulletStartX, bulletStartY, bulletVelX, bulletVelY);
            
            // Debug: Verify bullet sprite and properties (enhanced)
            console.log(`🎯 Sentry gun bullet created:`, {
                texture: bullet.texture.key,
                position: { x: bulletStartX.toFixed(1), y: bulletStartY.toFixed(1) },
                velocity: { x: bulletVelX.toFixed(1), y: bulletVelY.toFixed(1) },
                active: bullet.active,
                visible: bullet.visible,
                alpha: bullet.alpha,
                scale: { x: bullet.scaleX, y: bullet.scaleY },
                size: { width: bullet.width, height: bullet.height },
                bodyEnabled: bullet.body ? bullet.body.enable : 'no body',
                depth: bullet.depth
            });
            
            // Ensure bullet is properly visible (same as Player would create)
            if (bullet.active && bullet.visible) {
                console.log(`✅ Sentry gun bullet is active and visible`);
            } else {
                console.warn(`⚠️ Sentry gun bullet may not be visible - active: ${bullet.active}, visible: ${bullet.visible}`);
            }
            
            // Create muzzle flash exactly like Player.js
            this.createMuzzleFlash(muzzleOffsetX, muzzleOffsetY);
            
            // Create shell casing like Player.js
            this.createShellCasing();
            
            // Consume ammo
            this.currentAmmo--;
            this.lastShotTime = time;
            
            console.log(`🎯 Sentry gun fired (${this.currentAmmo}/${this.maxAmmo} ammo remaining)`);
            
            // Check if need to reload
            if (this.currentAmmo <= 0) {
                this.startReload();
            }
        } else {
            console.warn('🎯 No bullets available in pool for sentry gun');
        }
    }
    
    createMuzzleFlash(offsetX, offsetY) {
        // Use physics body center position for muzzle flash consistency with bullets (exactly like Player.js)
        const muzzleFlash = this.scene.add.image(this.body.center.x + offsetX, this.body.center.y + offsetY, 'muzzleFlash');
        muzzleFlash.setDepth(this.depth + 1);
        
        // Base scale relative to sentry gun size for consistency with tiny sprites (exactly like Player.js)
        const baseScale = this.scaleX * 0.20; // ~18% of sentry gun height (smaller)
        muzzleFlash.setScale(baseScale);
        muzzleFlash.setAlpha(0.85); // More transparent
        
        // Rotate muzzle flash to match firing direction (exactly like Player.js)
        switch (this.direction) {
            case 'up':
                muzzleFlash.setAngle(-90);
                break;
            case 'down':
                muzzleFlash.setAngle(90);
                break;
            case 'left':
                muzzleFlash.setAngle(0);
                break;
            case 'right':
                muzzleFlash.setAngle(180);
                break;
            case 'up_left':
                muzzleFlash.setAngle(-45);
                break;
            case 'up_right':
                muzzleFlash.setAngle(-135);
                break;
            case 'down_left':
                muzzleFlash.setAngle(45);
                break;
            case 'down_right':
                muzzleFlash.setAngle(135);
                break;
        }
        
        // Animate muzzle flash: quick expansion & fade (exactly like Player.js)
        this.scene.tweens.add({
            targets: muzzleFlash,
            alpha: 0,
            scaleX: baseScale * 1.5,
            scaleY: baseScale * 1.5,
            duration: 55, // fades even faster
            ease: 'Quad.easeOut',
            onComplete: () => muzzleFlash.destroy()
        });
    }
    
    createShellCasing() {
        // Create shell casing exactly like Player.js does
        const shellCasing = this.scene.add.image(this.x, this.y, 'shellCasing');
        shellCasing.setDepth(-1);
        this.scene.shellCasings.add(shellCasing);
        
        // Animate shell casing (exactly like Player.js)
        const randomX = (Math.random() - 0.5) * 100;
        const randomY = (Math.random() - 0.5) * 100;
        
        this.scene.tweens.add({
            targets: shellCasing,
            x: shellCasing.x + randomX,
            y: shellCasing.y + randomY,
            alpha: 0,
            rotation: Math.random() * Math.PI * 2,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => shellCasing.destroy()
        });
    }
    
    takeDamage(amount, damageType = 'bullet') {
        const currentTime = this.scene.time.now;
        
        // Check if structure can take damage
        if (!this.isDestructible || 
            this.health <= 0 || 
            currentTime - this.lastDamageTime < this.damageImmunityTime) {
            return false;
        }
        
        // Calculate damage based on material and damage type
        const actualDamage = this.calculateDamage(amount, damageType);
        
        this.health -= actualDamage;
        this.lastDamageTime = currentTime;
        
        // Update health bar immediately when damaged
        this.updateHealthBar();
        
        // Visual feedback
        this.showDamageEffect();
        
        console.log(`🎯 Sentry gun took ${actualDamage} ${damageType} damage, health: ${this.health}/${this.maxHealth}`);
        
        // Check if destroyed
        if (this.health <= 0) {
            this.isActive = false;
            this.createDestructionEffect();
            
            // Clean up smoke effects if reloading when destroyed
            this.clearSmokeEffects();
            
            console.log('🎯 Sentry gun destroyed!');
            this.destroy();
            return true; // Structure destroyed
        }
        
        return false; // Structure damaged but not destroyed
    }
    
    calculateDamage(baseDamage, damageType) {
        let multiplier = 1;
        
        // Material resistance for metal
        if (damageType === 'bullet') multiplier = 0.3;
        else if (damageType === 'fire') multiplier = 0.8;
        else if (damageType === 'explosion') multiplier = 1.0;
        else if (damageType === 'zombie') multiplier = 0.5; // Zombies are less effective against metal
        
        return Math.ceil(baseDamage * multiplier);
    }
    
    showDamageEffect() {
        // Damage tint effect
        this.setTint(this.damageTint);
        
        this.scene.tweens.add({
            targets: this,
            duration: 200,
            onComplete: () => {
                this.clearTint();
            }
        });
    }
    
    createDestructionEffect() {
        // Create explosion effect
        for (let i = 0; i < 6; i++) {
            const debris = this.scene.add.circle(
                this.x + (Math.random() - 0.5) * 30,
                this.y + (Math.random() - 0.5) * 30,
                3 + Math.random() * 4,
                0x666666
            );
            debris.setDepth(1500);
            
            this.scene.tweens.add({
                targets: debris,
                x: debris.x + (Math.random() - 0.5) * 80,
                y: debris.y + (Math.random() - 0.5) * 80,
                alpha: 0,
                duration: 1000 + Math.random() * 500,
                ease: 'Power2',
                onComplete: () => debris.destroy()
            });
        }
        
        // Smoke puff
        const smoke = this.scene.add.circle(this.x, this.y, 15, 0x444444, 0.6);
        smoke.setDepth(1500);
        this.scene.tweens.add({
            targets: smoke,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => smoke.destroy()
        });
    }
    
    destroy() {
        // Clean up smoke effects if reloading
        this.clearSmokeEffects();
        
        // Clean up health bar
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
            this.healthBarBg = null;
        }
        if (this.healthBarFill) {
            this.healthBarFill.destroy();
            this.healthBarFill = null;
        }
        
        // Call the Phaser sprite destroy method
        super.destroy();
        console.log('🎯 Sentry gun destroyed');
    }
    
    startReload() {
        this.isReloading = true;
        this.reloadStartTime = this.scene.time.now;
        console.log('🎯 Sentry gun starting reload (5 seconds)...');
        
        // Create smoke effects during reload (overheating)
        this.createReloadSmokeEffects();
    }
    
    createReloadSmokeEffects() {
        // Create tiny smoke effects from the top of the sentry gun (overheating)
        const smokeOffsets = [
            { dx: 0, dy: -30, type: 'main' },      // Top center smoke
            { dx: 5, dy: -28, type: 'secondary' }   // Slightly offset top smoke
        ];
        
        smokeOffsets.forEach((offset, index) => {
            const smokeTimer = this.scene.time.addEvent({
                delay: Phaser.Math.Between(800, 1200), // Even slower smoke generation
                loop: true,
                callback: () => {
                    // Only create smoke if still reloading
                    if (!this.isReloading || !this.active) {
                        smokeTimer.destroy();
                        return;
                    }
                    
                    let puff;
                    
                    if (this.scene.textures.exists('smoke_puff')) {
                        puff = this.scene.add.image(this.x + offset.dx, this.y + offset.dy, 'smoke_puff');
                        puff.setScale(0.03); // Much much smaller smoke (was 0.08)
                    } else {
                        // Simple fallback - tiny circle
                        puff = this.scene.add.circle(this.x + offset.dx, this.y + offset.dy, 0.5, 0x666666);
                    }
                    
                    puff.setDepth(this.depth + 50);
                    puff.setAlpha(0.4); // Even more transparent
                    
                    // Minimal upward movement
                    this.scene.tweens.add({
                        targets: puff,
                        y: puff.y - 15, // Small upward movement
                        x: puff.x + Phaser.Math.Between(-2, 2), // Minimal drift
                        scaleX: (puff.scaleX || 1) * 1.1, // Minimal expansion
                        scaleY: (puff.scaleY || 1) * 1.1, // Minimal expansion
                        alpha: 0,
                        duration: 1200, // Even shorter duration
                        ease: 'Linear',
                        onComplete: () => puff.destroy()
                    });
                }
            });
            
            // Track smoke timers for cleanup
            this.smokeEffects.push(smokeTimer);
        });
    }
    
    clearSmokeEffects() {
        // Clean up all smoke timers
        this.smokeEffects.forEach(timer => {
            if (timer && timer.destroy) {
                timer.destroy();
            }
        });
        this.smokeEffects = [];
    }
    
    createHealthBar() {
        // Create tiny health bar background (black outline)
        this.healthBarBg = this.scene.add.rectangle(this.x, this.y - 35, 32, 4, 0x000000, 0.8);
        this.healthBarBg.setDepth(this.depth + 50);
        this.healthBarBg.setStrokeStyle(1, 0x000000, 1);
        
        // Create health bar fill (green to red based on health)
        this.healthBarFill = this.scene.add.rectangle(this.x, this.y - 35, 30, 2, 0x00ff00, 1);
        this.healthBarFill.setDepth(this.depth + 51);
        
        // Update initial health bar
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        if (!this.healthBarBg || !this.healthBarFill) return;
        
        // Update position to follow sentry gun
        this.healthBarBg.x = this.x;
        this.healthBarBg.y = this.y - 35;
        this.healthBarFill.x = this.x;
        this.healthBarFill.y = this.y - 35;
        
        // Calculate health percentage
        const healthPercent = this.health / this.maxHealth;
        
        // Update health bar width
        const maxWidth = 30;
        this.healthBarFill.setDisplaySize(maxWidth * healthPercent, 2);
        
        // Update health bar color based on health percentage
        let healthColor = 0x00ff00; // Green
        if (healthPercent < 0.6) healthColor = 0xffff00; // Yellow
        if (healthPercent < 0.3) healthColor = 0xff0000; // Red
        
        this.healthBarFill.setFillStyle(healthColor);
        
        // Hide health bar if sentry gun is destroyed
        if (this.health <= 0) {
            this.healthBarBg.setVisible(false);
            this.healthBarFill.setVisible(false);
        }
    }
} 