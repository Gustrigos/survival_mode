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
        
        // Set up physics body - adjusted for SWAT sprite size (341x512)
        this.setCollideWorldBounds(true);
        if (this.usingSWATSprites) {
            this.body.setSize(32, 40); // Collision box stays reasonable
            this.body.setOffset(341*0.1/2 - 16, 512*0.1 - 50); // Adjusted for new scale
            this.setScale(0.1); // Further scale down large SWAT sprites (341x512 -> ~34x51)
        } else {
            this.body.setSize(24, 30); // Original size for placeholder sprites
            this.body.setOffset(12, 18);
            this.setScale(1);
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
            this.direction = direction;
            
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
        
        // Calculate bullet direction based on player direction
        let bulletVelX = 0;
        let bulletVelY = 0;
        let muzzleOffsetX = 0;
        let muzzleOffsetY = 0;
        
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
        
        // Create bullet
        const bullet = this.scene.bullets.get();
        if (bullet) {
            bullet.fire(this.x + muzzleOffsetX, this.y + muzzleOffsetY, bulletVelX, bulletVelY);
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
        
        // Screen shake
        this.scene.cameras.main.shake(100, 0.01);
    }
    
    createMuzzleFlash(offsetX, offsetY) {
        const muzzleFlash = this.scene.add.image(this.x + offsetX, this.y + offsetY, 'muzzleFlash');
        muzzleFlash.setDepth(this.depth + 1);
        
        // Animate muzzle flash
        this.scene.tweens.add({
            targets: muzzleFlash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 100,
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