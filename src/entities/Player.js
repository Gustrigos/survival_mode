import { SWATSpriteManager } from '../utils/SWATSpriteManager.js';
import { GameConfig } from '../utils/GameConfig.js';

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
        
        // Load weapon stats from GameConfig if available, otherwise use defaults
        const getWeaponAmmo = (weaponId) => {
            if (GameConfig && GameConfig.player && GameConfig.player.startingEquipment) {
                // Find the equipment slot that contains this weapon
                for (const slotNumber in GameConfig.player.startingEquipment) {
                    const equipment = GameConfig.player.startingEquipment[slotNumber];
                    if (equipment.type === 'weapon' && equipment.id === weaponId && equipment.ammo !== undefined) {
                        return equipment.ammo;
                    }
                }
            }
            return null; // No config found, use default
        };
        
        const machineGunAmmo = getWeaponAmmo('machineGun') || 30; // Default to 30 if not found
        const pistolAmmo = getWeaponAmmo('pistol') || 15;
        const minigunAmmo = getWeaponAmmo('minigun') || 100; // Default to 100 if not found
        
        this.weapons = {
            pistol: {
                ammo: pistolAmmo,
                maxAmmo: pistolAmmo,
                fireRate: 400,
                damage: 30,
                reloadTime: 1500,
                bulletSpeed: 500,
                automatic: false,
                icon: 'pistol',
                type: 'weapon'
            },
            machineGun: {
                ammo: machineGunAmmo,
                maxAmmo: machineGunAmmo,
                fireRate: 100, // automatic
                damage: 20,
                reloadTime: 2000,
                bulletSpeed: 600,
                automatic: true,
                icon: 'machine_gun',
                type: 'weapon'
            },
            minigun: {
                ammo: minigunAmmo,
                maxAmmo: minigunAmmo,
                fireRate: 50, // Very fast - twice as fast as machine gun
                damage: 35, // High damage - more than machine gun
                reloadTime: 3000, // Longer reload time due to large ammo capacity
                bulletSpeed: 700, // Faster bullets
                automatic: true,
                icon: 'minigun',
                type: 'weapon'
            }
        };
        
        console.log(`🔫 Weapon ammo loaded: Machine Gun: ${machineGunAmmo}, Pistol: ${pistolAmmo}, Minigun: ${minigunAmmo}`);
        
        // Equipment/Item system (including weapons and placeable items)
        // Load equipment from GameConfig instead of hardcoding values
        this.equipment = {};
        
        // Load starting equipment from GameConfig
        if (GameConfig && GameConfig.player && GameConfig.player.startingEquipment) {
            console.log('🎒 Loading starting equipment from GameConfig...');
            
            // Copy equipment from config
            Object.keys(GameConfig.player.startingEquipment).forEach(slotNumber => {
                const configEquipment = GameConfig.player.startingEquipment[slotNumber];
                this.equipment[slotNumber] = {
                    type: configEquipment.type,
                    id: configEquipment.id,
                    name: configEquipment.name,
                    icon: configEquipment.icon
                };
                
                // Add count for placeable items
                if (configEquipment.type === 'placeable' && configEquipment.count !== undefined) {
                    this.equipment[slotNumber].count = configEquipment.count;
                    this.equipment[slotNumber].maxStack = configEquipment.count + 5; // Allow collecting more
                }
                
                // Add ammo for weapons
                if (configEquipment.type === 'weapon' && configEquipment.ammo !== undefined) {
                    this.equipment[slotNumber].ammo = configEquipment.ammo;
                }
                
                console.log(`✅ Loaded ${configEquipment.name} in slot ${slotNumber}:`, this.equipment[slotNumber]);
            });
        } else {
            // Fallback to hardcoded values if GameConfig not available
            console.warn('⚠️ GameConfig not found, using fallback equipment');
            this.equipment = {
                1: {
                    type: 'weapon',
                    id: 'machineGun',
                    name: 'Machine Gun',
                    icon: 'machine_gun'
                },
                2: {
                    type: 'placeable',
                    id: 'sentryGun',
                    name: 'Sentry Gun',
                    icon: 'sentry_gun_right',
                    count: 3,
                    maxStack: 5
                },
                3: {
                    type: 'placeable',
                    id: 'barricade',
                    name: 'Barricade',
                    icon: 'barricade',
                    count: 5,
                    maxStack: 10
                }
            };
        }
        
        this.currentSlot = 1; // Currently selected slot
        
        // Debug: Verify equipment initialization
        
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
            
        } else {
            this.setScale(1);
            
            // DYNAMIC collision box for placeholder sprites
            const bounds = this.getBounds();
            const bodyWidth = bounds.width * 3.0;   // 300% of visual bounds - much larger
            const bodyHeight = bounds.height * 3.5; // 350% of visual bounds - extra tall coverage
            
            // Set body size and center it automatically
            this.body.setSize(bodyWidth, bodyHeight, true);
            
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
            
            
            // Map diagonal directions to sprite directions (we don't have diagonal sprites)
            let spriteDirection = direction;
            switch (direction) {
                case 'up-left':
                case 'up-right':
                    spriteDirection = 'up';
                    break;
                case 'down-left':
                case 'down-right':
                    spriteDirection = 'down';
                    break;
                // Cardinal directions stay the same
                case 'up':
                case 'down':
                case 'left':
                case 'right':
                    spriteDirection = direction;
                    break;
            }
            
            if (this.usingSWATSprites) {
                let frame = SWATSpriteManager.getFrameForDirection(spriteDirection);
                if (spriteDirection === 'right') {
                    // Use side frame and flip horizontally
                    frame = SWATSpriteManager.getFrameForDirection('left');
                    this.setFlipX(true);
                } else {
                    this.setFlipX(false);
                }
                this.setFrame(frame);
            } else {
                // Use placeholder sprites with cardinal directions
                this.setTexture(`player_${spriteDirection}`);
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
            case 'left':
                muzzleFlash.setAngle(0);
                break;
            case 'right':
                muzzleFlash.setAngle(180);
                break;
            case 'up-left':
                muzzleFlash.setAngle(-45);
                break;
            case 'up-right':
                muzzleFlash.setAngle(-135);
                break;
            case 'down-left':
                muzzleFlash.setAngle(45);
                break;
            case 'down-right':
                muzzleFlash.setAngle(135);
                break;
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
    
    // Equipment/Item system methods
    canEquipItem(itemType) {
        return this.equipment[itemType] && this.equipment[itemType].count > 0;
    }
    
    useItem(itemType) {
        if (this.canEquipItem(itemType)) {
            this.equipment[itemType].count--;
            console.log(`Used ${itemType}, remaining: ${this.equipment[itemType].count}`);
            return true;
        }
        return false;
    }
    
    addItem(itemType, amount = 1) {
        if (this.equipment[itemType]) {
            const maxStack = this.equipment[itemType].maxStack;
            const newCount = Math.min(this.equipment[itemType].count + amount, maxStack);
            this.equipment[itemType].count = newCount;
            console.log(`Added ${amount} ${itemType}, total: ${newCount}`);
            return true;
        }
        return false;
    }
    
    getCurrentSlotItemName() {
        return this.equipment[this.currentSlot] ? this.equipment[this.currentSlot].name : '';
    }
    
    getCurrentSlotItemIcon() {
        return this.equipment[this.currentSlot] ? this.equipment[this.currentSlot].icon : '';
    }
    
    // Switch to a specific equipment slot
    switchToSlot(slotNumber) {
        console.log(`switchToSlot called with slotNumber: ${slotNumber}`);
        console.log(`Current slot: ${this.currentSlot}`);
        console.log(`Available equipment:`, this.equipment);
        
        if (this.equipment[slotNumber]) {
            this.currentSlot = slotNumber;
            
            // If switching to a weapon slot, update current weapon
            if (this.equipment[slotNumber].type === 'weapon') {
                this.switchWeapon(this.equipment[slotNumber].id);
            }
            
            console.log(`✅ Successfully switched to slot ${slotNumber}: ${this.equipment[slotNumber].name}`);
            return true;
        } else {
            console.log(`❌ No equipment found in slot ${slotNumber}`);
            return false;
        }
    }
    
    // Get current slot equipment info
    getCurrentSlotEquipment() {
        return this.equipment[this.currentSlot];
    }
    
    // Check if current slot can be used
    canUseCurrentSlot() {
        const equipment = this.getCurrentSlotEquipment();
        if (!equipment) return false;
        
        if (equipment.type === 'weapon') {
            return true; // Weapons can always be used (for shooting)
        } else if (equipment.type === 'placeable') {
            return equipment.count > 0;
        }
        
        return false;
    }
    
    // Use current slot (either shoot weapon or place item)
    useCurrentSlot() {
        const equipment = this.getCurrentSlotEquipment();
        if (!equipment) return false;
        
        if (equipment.type === 'weapon') {
            this.shoot();
            return true;
        } else if (equipment.type === 'placeable' && equipment.count > 0) {
            // This will be handled by the game scene for placement
            return true;
        }
        
        return false;
    }
    
    // Use a placeable item from current slot
    usePlaceableItem() {
        const equipment = this.getCurrentSlotEquipment();
        if (equipment && equipment.type === 'placeable' && equipment.count > 0) {
            equipment.count--;
            return true;
        }
        return false;
    }
} 