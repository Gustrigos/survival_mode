import { SWATSpriteManager } from '../utils/SWATSpriteManager.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Try to use SWAT sprite first, fallback to placeholder
        const initialTexture = scene.textures.exists('swat_player') ? 'swat_player' : 'player_down';
        const initialFrame = scene.textures.exists('swat_player') ? SWATSpriteManager.getFrameForDirection('down') : 0;
        
        super(scene, x, y, initialTexture, initialFrame);
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Player properties
        this.scene = scene;
        this.health = 100;
        this.maxHealth = 100;
        this.usingSWATSprites = scene.textures.exists('swat_player');
        
        // Set up SWAT animations if using SWAT sprites
        if (this.usingSWATSprites) {
            SWATSpriteManager.setupAnimations(scene);
        }
        
        // Weapon system
        this.currentWeapon = 'machineGun';
        this.weapons = {
            pistol: {
                ammo: 15,
                maxAmmo: 15,
                fireRate: 400,
                damage: 30,
                reloadTime: 1500,
                bulletSpeed: 500,
                automatic: false,
                icon: 'weapon_right'
            },
            machineGun: {
                ammo: 30,
                maxAmmo: 30,
                fireRate: 100, // automatic
                damage: 20,
                reloadTime: 2000,
                bulletSpeed: 600,
                automatic: true,
                icon: 'machine_gun'
            }
        };
        
        // Current weapon stats (will be updated based on currentWeapon)
        this.ammo = this.weapons[this.currentWeapon].ammo;
        this.maxAmmo = this.weapons[this.currentWeapon].maxAmmo;
        this.fireRate = this.weapons[this.currentWeapon].fireRate;
        this.damage = this.weapons[this.currentWeapon].damage;
        this.reloadTime = this.weapons[this.currentWeapon].reloadTime;
        this.bulletSpeed = this.weapons[this.currentWeapon].bulletSpeed;
        
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.lastShotTime = 0;
        
        // Movement and animation
        this.direction = 'down';
        this.isMoving = false;
        this.walkAnimSpeed = 500; // ms per frame
        this.lastAnimTime = 0;
        this.animFrame = 0;
        
        // Damage immunity
        this.lastDamageTime = 0;
        this.damageImmunityTime = 1000; // 1 second
        
        // Set up physics body - make it cover the full visible sprite
        this.setCollideWorldBounds(true);
        
        // Set physics mass for realistic collisions
        this.body.setMass(1.5); // Players are heavier than zombies
        this.body.setDrag(300); // Add drag to prevent sliding after collisions
        
        if (this.usingSWATSprites) {
            this.setScale(0.1); // Scale down large SWAT sprites (341x512 -> ~34x51)
            
            // DYNAMIC collision box based on actual visual bounds
            const bounds = this.getBounds();
            const collisionWidth = bounds.width * 3.5;   // 300% of visual bounds - much larger for easy targeting
            const collisionHeight = bounds.height * 5; // 350% of visual bounds - extra tall head-to-toe coverage
            
            // Set body size and center it (true flag centers automatically)
            this.body.setSize(collisionWidth, collisionHeight, true);
            
            console.log(`Player SWAT body: ${collisionWidth.toFixed(1)}x${collisionHeight.toFixed(1)} (${bounds.width.toFixed(1)}x${bounds.height.toFixed(1)} sprite bounds)`);
        } else {
            this.setScale(1);
            
            // DYNAMIC collision box for placeholder sprites
            const bounds = this.getBounds();
            const bodyWidth = bounds.width * 3.0;   // 300% of visual bounds - much larger
            const bodyHeight = bounds.height * 3.5; // 350% of visual bounds - extra tall coverage
            
            // Set body size and center it automatically
            this.body.setSize(bodyWidth, bodyHeight, true);
            
            console.log(`Player placeholder body: ${bodyWidth.toFixed(1)}x${bodyHeight.toFixed(1)} (${bounds.width.toFixed(1)}x${bounds.height.toFixed(1)} sprite bounds)`);
        }
        
        // Make sure sprite is visible and properly configured
        this.setDepth(100);
        this.setVisible(true);
        this.setActive(true);
        this.setAlpha(1);
        
        // Initialize game state
        window.gameState.playerHealth = this.health;
        window.gameState.playerAmmo = this.ammo;
        
        // Weapon sprite attached to player
        this.weaponSprite = null; // Disabled to avoid performance hit
        
        console.log('Player created with texture:', this.texture.key);
        console.log('Using SWAT sprites:', this.usingSWATSprites);
        console.log('Player position:', this.x, this.y);
        console.log('Player scale:', this.scaleX, this.scaleY);
        console.log('Player visible:', this.visible);
        console.log('Player alpha:', this.alpha);
        console.log('Player depth:', this.depth);
    }
    
    update(time, delta) {
        // Handle reloading
        if (this.isReloading) {
            const elapsed = time - this.reloadStartTime;
            const timeLeft = this.reloadTime - elapsed;
            
            window.updateUI.reloadStatus(true, timeLeft);
            
            if (elapsed >= this.reloadTime) {
                this.isReloading = false;
                this.ammo = this.maxAmmo;
                this.weapons[this.currentWeapon].ammo = this.ammo; // Update weapon's ammo
                window.gameState.playerAmmo = this.ammo;
                window.gameState.isReloading = false;
                window.updateUI.reloadStatus(false);
                window.updateUI.ammo(this.ammo, this.maxAmmo);
            }
        }
        
        // Update animation
        this.updateAnimation(time);
        
        // Update sprite tint for damage effect
        if (time - this.lastDamageTime < 200) {
            this.setTint(0xff6666); // Red tint when damaged
        } else {
            this.clearTint();
        }
    }
    
    setDirection(direction) {
        if (this.direction !== direction) {
            const oldDirection = this.direction;
            this.direction = direction;
            
            console.log('🧭 DIRECTION CHANGE:', {
                from: oldDirection,
                to: direction,
                playerPos: { x: this.x.toFixed(2), y: this.y.toFixed(2) }
            });
            
            if (this.usingSWATSprites) {
                let frame = SWATSpriteManager.getFrameForDirection(direction);
                if (direction === 'right') {
                    // Use side frame and flip horizontally
                    frame = SWATSpriteManager.getFrameForDirection('left');
                    this.setFlipX(true);
                } else {
                    this.setFlipX(false);
                }
                this.setFrame(frame);
            } else {
                // Use placeholder sprites
                this.setTexture(`player_${direction}`);
            }
        }
    }
    
    setMoving(moving) {
        this.isMoving = moving;
    }
    
    updateAnimation(time) {
        // Simple animation by slightly changing the sprite position
        if (this.isMoving && time - this.lastAnimTime > this.walkAnimSpeed) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.lastAnimTime = time;
            
            // Simple bobbing effect
            if (this.animFrame === 0) {
                this.y -= 1;
            } else {
                this.y += 1;
            }
        }
    }
    
    shoot() {
        const currentTime = this.scene.time.now;
        
        if (this.isReloading || this.ammo <= 0 || currentTime - this.lastShotTime < this.fireRate) {
            return;
        }
        
        // Enhanced debugging for direction and position
        console.log('🔫 SHOOTING DEBUG:', {
            playerDirection: this.direction,
            playerPosition: { x: this.x.toFixed(2), y: this.y.toFixed(2) },
            playerBodyCenter: { x: this.body.center.x.toFixed(2), y: this.body.center.y.toFixed(2) },
            playerBodySize: { w: this.body.width, h: this.body.height },
            playerScale: { x: this.scaleX.toFixed(3), y: this.scaleY.toFixed(3) },
            usingSWATSprites: this.usingSWATSprites
        });

        // Calculate bullet direction based on player direction
        let bulletVelX = 0;
        let bulletVelY = 0;
        let muzzleOffsetX = 0;
        let muzzleOffsetY = 0;
        
        // Calculate the TRUE center of the player sprite by accounting for the collision box
        // For SWAT sprites: sprite is 341x512 scaled to 0.1 = ~34x51, collision box is 32x40
        // For placeholder sprites: sprite is 32x32, collision box is 24x30
        let playerCenterX, playerCenterY;
        
        if (this.usingSWATSprites) {
            // For SWAT sprites, the collision box is centered within the scaled sprite
            // this.x, this.y is the sprite origin, but we need to find the center of the collision box
            playerCenterX = this.x + this.body.centerX - this.x;
            playerCenterY = this.y + this.body.centerY - this.y;
        } else {
            // For placeholder sprites, use the collision box center
            playerCenterX = this.x + this.body.centerX - this.x;
            playerCenterY = this.y + this.body.centerY - this.y;
        }
        
        // Simplified: Use the physics body center directly
        playerCenterX = this.body.center.x;
        playerCenterY = this.body.center.y;
        
        switch (this.direction) {
            case 'up':
                bulletVelY = -this.bulletSpeed;
                muzzleOffsetY = -20; // Slightly increased offset
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
        
        // Enhanced debugging for bullet creation
        const bulletStartX = playerCenterX + muzzleOffsetX;
        const bulletStartY = playerCenterY + muzzleOffsetY;
        
        console.log('🎯 BULLET CREATION:', {
            direction: this.direction,
            startPos: { x: bulletStartX.toFixed(2), y: bulletStartY.toFixed(2) },
            velocity: { x: bulletVelX, y: bulletVelY },
            muzzleOffset: { x: muzzleOffsetX, y: muzzleOffsetY },
            bulletSpeed: this.bulletSpeed
        });

        // Create bullet starting from player's collision box center
        const bullet = this.scene.bullets.get();
        if (bullet) {
            bullet.fire(bulletStartX, bulletStartY, bulletVelX, bulletVelY);
            
            // Log bullet state after firing
            console.log('🟢 BULLET FIRED:', {
                bulletPos: { x: bullet.x.toFixed(2), y: bullet.y.toFixed(2) },
                bulletVel: { x: bullet.body.velocity.x, y: bullet.body.velocity.y },
                bulletActive: bullet.active,
                bulletVisible: bullet.visible,
                bulletBodyEnabled: bullet.body.enable,
                bulletScale: { x: bullet.scaleX.toFixed(3), y: bullet.scaleY.toFixed(3) },
                bulletBodySize: { w: bullet.body.width, h: bullet.body.height },
                bulletBodyOffset: { x: bullet.body.offset.x.toFixed(2), y: bullet.body.offset.y.toFixed(2) }
            });
        } else {
            console.log('❌ NO BULLET AVAILABLE FROM POOL');
        }
        
        // Create muzzle flash
        this.createMuzzleFlash(muzzleOffsetX, muzzleOffsetY);
        
        // Create shell casing
        this.createShellCasing();
        
        // Update ammo
        this.ammo--;
        this.weapons[this.currentWeapon].ammo = this.ammo; // Update weapon's ammo
        window.gameState.playerAmmo = this.ammo;
        window.updateUI.ammo(this.ammo, this.maxAmmo);
        
        // Auto-reload when empty
        if (this.ammo <= 0) {
            this.reload();
        }
        
        this.lastShotTime = currentTime;
        
        // Removed screen shake effect to reduce annoying recoil
    }
    
    createMuzzleFlash(offsetX, offsetY) {
        // Use physics body center position for muzzle flash consistency with bullets
        const muzzleFlash = this.scene.add.image(this.body.center.x + offsetX, this.body.center.y + offsetY, 'muzzleFlash');
        muzzleFlash.setDepth(this.depth + 1);
        
        // Base scale relative to player size for consistency with tiny sprites
        const baseScale = this.scaleX * 0.20; // ~18% of player height (smaller)
        muzzleFlash.setScale(baseScale);
        muzzleFlash.setAlpha(0.85); // More transparent
        
        // Rotate muzzle flash to match firing direction
        switch (this.direction) {
            case 'up':
                muzzleFlash.setAngle(-90);
                break;
            case 'down':
                muzzleFlash.setAngle(90);
                break;
            case 'right':
                muzzleFlash.setAngle(180);
                break;
            default:
                muzzleFlash.setAngle(0);
        }
        
        // Animate muzzle flash: quick expansion & fade
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
        const shellCasing = this.scene.add.image(this.x, this.y, 'shellCasing');
        shellCasing.setDepth(-1);
        this.scene.shellCasings.add(shellCasing);
        
        // Animate shell casing
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
    
    reload() {
        if (this.isReloading || this.ammo >= this.maxAmmo) {
            return;
        }
        
        this.isReloading = true;
        this.reloadStartTime = this.scene.time.now;
        window.gameState.isReloading = true;
    }
    
    takeDamage(amount) {
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastDamageTime < this.damageImmunityTime) {
            return false; // Still immune
        }
        
        this.health = Math.max(0, this.health - amount);
        window.gameState.playerHealth = this.health;
        this.lastDamageTime = currentTime;
        
        // Screen flash effect
        this.scene.cameras.main.flash(200, 255, 100, 100);
        
        // Update UI to reflect new health value
        if (window.updateUI && window.updateUI.health) {
            window.updateUI.health(this.health, this.maxHealth);
        }
        
        return true;
    }
    
    canTakeDamage() {
        const currentTime = this.scene.time.now;
        return currentTime - this.lastDamageTime >= this.damageImmunityTime;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        window.gameState.playerHealth = this.health;
        
        // Update UI to reflect healed value
        if (window.updateUI && window.updateUI.health) {
            window.updateUI.health(this.health, this.maxHealth);
        }
    }
    
    switchWeapon(weaponType) {
        if (this.weapons[weaponType] && weaponType !== this.currentWeapon) {
            this.currentWeapon = weaponType;
            const weapon = this.weapons[weaponType];
            
            // Update current weapon stats
            this.ammo = weapon.ammo;
            this.maxAmmo = weapon.maxAmmo;
            this.fireRate = weapon.fireRate;
            this.damage = weapon.damage;
            this.reloadTime = weapon.reloadTime;
            this.bulletSpeed = weapon.bulletSpeed;
            
            // Update UI
            window.gameState.playerAmmo = this.ammo;
            window.updateUI.ammo(this.ammo, this.maxAmmo);
            
            console.log(`Switched to ${weaponType}`);
            
            if(this.weaponSprite){
                this.weaponSprite.setTexture(weapon.icon);
            }
        }
    }
    
    getCurrentWeaponName() {
        return this.currentWeapon;
    }
} 