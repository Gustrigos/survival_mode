export class SpriteScaler {
    /**
     * Sprite size configuration - defines target sizes for different sprite categories
     */
    static spriteConfig = {
        // Player and character sprites
        player: { targetWidth: 32, targetHeight: 48 },
        zombie: { targetWidth: 32, targetHeight: 48 },
        
        // Vehicle sprites
        helicopter: { targetWidth: 400, targetHeight: 250 },
        crashed_helicopter: { targetWidth: 400, targetHeight: 250 },
        helicopter_wreckage: { targetWidth: 200, targetHeight: 125 },
        
        // Building sprites
        building: { targetWidth: 96, targetHeight: 72 },
        wall: { targetWidth: 64, targetHeight: 32 },
        door: { targetWidth: 32, targetHeight: 48 },
        window: { targetWidth: 32, targetHeight: 32 },
        
        // Environment sprites
        tree: { targetWidth: 48, targetHeight: 64 },
        palm_tree: { targetWidth: 48, targetHeight: 80 },
        dead_tree: { targetWidth: 40, targetHeight: 64 },
        rock: { targetWidth: 32, targetHeight: 24 },
        bush: { targetWidth: 32, targetHeight: 24 },
        
        // Military/Equipment sprites
        military_crate: { targetWidth: 32, targetHeight: 32 },
        sandbags: { targetWidth: 48, targetHeight: 24 },
        tent: { targetWidth: 64, targetHeight: 48 },
        debris: { targetWidth: 32, targetHeight: 16 },
        
        // Sentry gun sprites - bigger than player for better visibility as defensive unit
        sentry_gun: { targetWidth: 48, targetHeight: 72 },
        sentry_gun_right: { targetWidth: 48, targetHeight: 72 },
        sentry_gun_left: { targetWidth: 48, targetHeight: 72 },
        sentry_gun_up_right: { targetWidth: 48, targetHeight: 72 },
        sentry_gun_up_left: { targetWidth: 48, targetHeight: 72 },
        sentry_gun_down_right: { targetWidth: 48, targetHeight: 72 },
        sentry_gun_down_left: { targetWidth: 48, targetHeight: 72 },
        
        // Weapon sprites (small)
        pistol: { targetWidth: 16, targetHeight: 16 },
        rifle: { targetWidth: 24, targetHeight: 8 },
        bullet: { targetWidth: 4, targetHeight: 8 },
        
        // Effects (properly sized relative to helicopter 400x250)
        smoke_puff: { targetWidth: 5, targetHeight: 5 }, // ~6% of helicopter height (much smaller)
        small_fire: { targetWidth: 12, targetHeight: 15 }, // ~6% of helicopter height
        blood_splat: { targetWidth: 12, targetHeight: 12 }
    };
    
    /**
     * Automatically scale a sprite to its target size
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Image} sprite - The sprite to scale
     * @param {string} spriteType - The type of sprite (used to look up target size)
     * @param {Object} options - Additional scaling options
     */
    static autoScale(sprite, spriteType, options = {}) {
        if (!sprite || !sprite.setDisplaySize) {
            console.warn('Invalid sprite passed to autoScale');
            return sprite;
        }
        
        // Get target size from config
        const config = this.spriteConfig[spriteType];
        if (!config) {
            // If no specific config, try to guess based on sprite type
            const guessedConfig = this.guessTargetSize(spriteType);
            if (guessedConfig) {
                console.log(`Using guessed size for ${spriteType}:`, guessedConfig);
                this.applySizing(sprite, guessedConfig, options);
            } else {
                console.warn(`No size configuration found for sprite type: ${spriteType}`);
            }
            return sprite;
        }
        
        this.applySizing(sprite, config, options);
        return sprite;
    }
    
    /**
     * Apply the sizing to a sprite
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Image} sprite 
     * @param {Object} config - Size configuration
     * @param {Object} options - Additional options
     */
    static applySizing(sprite, config, options = {}) {
        const { targetWidth, targetHeight } = config;
        const { 
            maintainAspectRatio = false, 
            scaleFactor = 1,
            maxScale = 3,
            minScale = 0.1 
        } = options;
        
        if (maintainAspectRatio) {
            // Scale uniformly to fit within target dimensions
            const currentWidth = sprite.width;
            const currentHeight = sprite.height;
            const scaleX = targetWidth / currentWidth;
            const scaleY = targetHeight / currentHeight;
            const uniformScale = Math.min(scaleX, scaleY) * scaleFactor;
            
            // Clamp scale to reasonable limits
            const finalScale = Math.max(minScale, Math.min(maxScale, uniformScale));
            sprite.setScale(finalScale);
        } else {
            // Scale to exact target dimensions
            sprite.setDisplaySize(targetWidth * scaleFactor, targetHeight * scaleFactor);
        }
        
        console.log(`Scaled ${sprite.texture?.key || 'sprite'} to ${sprite.displayWidth}x${sprite.displayHeight}`);
    }
    
    /**
     * Guess appropriate target size based on sprite name/type
     * @param {string} spriteType 
     * @returns {Object|null} Size configuration
     */
    static guessTargetSize(spriteType) {
        const type = spriteType.toLowerCase();
        
        // Check for common patterns
        if (type.includes('player') || type.includes('character')) {
            return { targetWidth: 32, targetHeight: 48 };
        }
        if (type.includes('zombie') || type.includes('enemy')) {
            return { targetWidth: 32, targetHeight: 48 };
        }
        if (type.includes('building') || type.includes('house')) {
            return { targetWidth: 96, targetHeight: 72 };
        }
        if (type.includes('tree')) {
            return { targetWidth: 48, targetHeight: 64 };
        }
        if (type.includes('helicopter') || type.includes('vehicle')) {
            return { targetWidth: 120, targetHeight: 80 };
        }
        if (type.includes('crate') || type.includes('box')) {
            return { targetWidth: 32, targetHeight: 32 };
        }
        if (type.includes('weapon') || type.includes('gun')) {
            return { targetWidth: 20, targetHeight: 12 };
        }
        if (type.includes('bullet') || type.includes('projectile')) {
            return { targetWidth: 4, targetHeight: 8 };
        }
        if (type.includes('effect') || type.includes('particle')) {
            return { targetWidth: 16, targetHeight: 16 };
        }
        
        // Default medium size for unknown sprites
        return { targetWidth: 48, targetHeight: 48 };
    }
    
    /**
     * Scale all sprites in a group to appropriate sizes
     * @param {Phaser.GameObjects.Group} group - Group containing sprites
     * @param {string} spriteType - Default sprite type for all sprites in group
     * @param {Object} options - Scaling options
     */
    static autoScaleGroup(group, spriteType, options = {}) {
        if (!group || !group.children) {
            console.warn('Invalid group passed to autoScaleGroup');
            return;
        }
        
        group.children.entries.forEach(sprite => {
            // Try to determine sprite type from texture key or use default
            const actualType = sprite.texture?.key || spriteType;
            this.autoScale(sprite, actualType, options);
        });
    }
    
    /**
     * Create a properly sized sprite
     * @param {Phaser.Scene} scene - The game scene
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} textureKey - Texture key
     * @param {string} spriteType - Sprite type for sizing
     * @param {Object} options - Additional options
     * @returns {Phaser.GameObjects.Sprite} The created and scaled sprite
     */
    static createScaledSprite(scene, x, y, textureKey, spriteType, options = {}) {
        const sprite = scene.add.sprite(x, y, textureKey);
        return this.autoScale(sprite, spriteType || textureKey, options);
    }
    
    /**
     * Create a properly sized image
     * @param {Phaser.Scene} scene - The game scene
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} textureKey - Texture key
     * @param {string} spriteType - Sprite type for sizing
     * @param {Object} options - Additional options
     * @returns {Phaser.GameObjects.Image} The created and scaled image
     */
    static createScaledImage(scene, x, y, textureKey, spriteType, options = {}) {
        const image = scene.add.image(x, y, textureKey);
        return this.autoScale(image, spriteType || textureKey, options);
    }
    
    /**
     * Update sprite configuration
     * @param {string} spriteType - Sprite type
     * @param {Object} config - New size configuration
     */
    static updateSpriteConfig(spriteType, config) {
        this.spriteConfig[spriteType] = { ...this.spriteConfig[spriteType], ...config };
    }
    
    /**
     * Get current configuration for a sprite type
     * @param {string} spriteType - Sprite type
     * @returns {Object|null} Size configuration
     */
    static getSpriteConfig(spriteType) {
        return this.spriteConfig[spriteType] || null;
    }
    
    /**
     * Apply consistent scaling to commonly oversized sprites
     * @param {Phaser.Scene} scene - The game scene
     */
    static applyGlobalScaling(scene) {
        console.log('Applying global sprite scaling...');
        
        // Scale down commonly oversized sprites
        const oversizedSprites = [
            'crashed_helicopter', 'helicopter_wreckage', 'military_crate',
            'concrete_building', 'damaged_building', 'palm_tree', 'dead_tree'
        ];
        
        oversizedSprites.forEach(spriteKey => {
            if (scene.textures.exists(spriteKey)) {
                const texture = scene.textures.get(spriteKey);
                const source = texture.getSourceImage();
                const originalWidth = source.width || source.naturalWidth;
                const originalHeight = source.height || source.naturalHeight;
                
                console.log(`Checking ${spriteKey}: ${originalWidth}x${originalHeight}`);
                
                // If sprite is much larger than expected, warn about it
                const config = this.spriteConfig[spriteKey] || this.guessTargetSize(spriteKey);
                if (config && originalWidth > config.targetWidth * 2) {
                    console.log(`⚠️  ${spriteKey} may be oversized. Original: ${originalWidth}x${originalHeight}, Target: ${config.targetWidth}x${config.targetHeight}`);
                }
            }
        });
    }
} 