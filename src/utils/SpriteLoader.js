export class SpriteLoader {
    /**
     * Verify that sprite files exist before attempting to load them
     * @param {Phaser.Scene} scene - The game scene
     * @param {Array} filePaths - Array of file paths to verify
     */
    static async verifyFiles(scene, filePaths) {
        console.log('🔍 Verifying sprite files exist...');
        
        for (const filePath of filePaths) {
            try {
                const response = await fetch(filePath, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`✅ File exists: ${filePath}`);
                } else {
                    console.error(`❌ File not found (${response.status}): ${filePath}`);
                }
            } catch (error) {
                console.error(`❌ Error checking file: ${filePath}`, error);
            }
        }
    }

    static loadSprites(scene) {
        console.log('Loading PNG sprites...');
        
        this.loadPlayerSprites(scene);
        this.loadZombieSprites(scene);
        this.loadWeaponSprites(scene);
        this.loadEffectSprites(scene);
        this.loadEnvironmentSprites(scene);
        this.loadTerrainSprites(scene);
        this.loadBuildingSprites(scene);
        
        console.log('PNG sprites loaded successfully');
    }
    
    static loadPlayerSprites(scene) {
        // Load SWAT spritesheet - 1024x1024 image with 3x2 grid (6 total frames)
        // Frame size: 341x512 pixels each (1024÷3 = 341, 1024÷2 = 512)
        scene.load.spritesheet('swat_player', 'src/assets/sprites/player/swat_sprite.png', {
            frameWidth: 341,
            frameHeight: 512,
            startFrame: 0,
            endFrame: 5
        });
        
        // Keep loading placeholder sprites as fallback
        const directions = ['up', 'down', 'left', 'right'];
        directions.forEach(direction => {
            scene.load.image(`player_${direction}`, `src/assets/sprites/player/player_${direction}.png`);
        });
    }
    
    static loadZombieSprites(scene) {
        const cacheBuster = Date.now();

        // Load zombie spritesheet (3x2 grid 1024x1024)
        scene.load.spritesheet('zombie_sprite', `src/assets/sprites/zombies/zombie_sprite.png?v=${cacheBuster}`, {
            frameWidth: 341,
            frameHeight: 512,
            startFrame: 0,
            endFrame: 5
        });

        // Fallback individual PNGs
        const directions = ['up', 'down', 'left', 'right'];
        directions.forEach(direction => {
            scene.load.image(`zombie_${direction}`, `src/assets/sprites/zombies/zombie_${direction}.png?v=${cacheBuster}`);
        });
    }
    
    static loadWeaponSprites(scene) {
        const directions = ['up', 'down', 'left', 'right'];
        
        directions.forEach(direction => {
            scene.load.image(`weapon_${direction}`, `src/assets/sprites/weapons/weapon_${direction}.png`);
        });
        scene.load.image('machine_gun', 'src/assets/sprites/weapons/machine_gun.png');
        scene.load.image('minigun', 'src/assets/sprites/weapons/minigun.png');
        scene.load.image('pistol', 'src/assets/sprites/weapons/pistol.png');
        
        // Load sentry gun sprites
        scene.load.image('sentry_gun_right', 'src/assets/sprites/crafts/sentry_gun_right.png');
        scene.load.image('sentry_gun_up', 'src/assets/sprites/crafts/sentry_gun_up.png');
        scene.load.image('sentry_gun_down', 'src/assets/sprites/crafts/sentry_gun_down.png');
        scene.load.image('sentry_gun_up_right', 'src/assets/sprites/crafts/sentry_gun_up_right.png');
        scene.load.image('sentry_gun_down_right', 'src/assets/sprites/crafts/sentry_gun_down_right.png');
        
        // Load barricade sprites
        scene.load.image('barricade', 'src/assets/sprites/crafts/barricade.png');
        scene.load.image('broken_barricade', 'src/assets/sprites/crafts/broken_barricade.png');
        scene.load.image('much_broken_barricade', 'src/assets/sprites/crafts/much_broken_barricade.png');
        
        // Create left-facing sprites by flipping right-facing ones after loading
        scene.load.once('complete', () => {
            SpriteLoader.createSentryGunLeftSprites(scene);
        });
    }
    
    static createSentryGunLeftSprites(scene) {
        // Create left-facing sentry gun sprites by flipping the right-facing ones
        const rightSprites = [
            { right: 'sentry_gun_right', left: 'sentry_gun_left' },
            { right: 'sentry_gun_up_right', left: 'sentry_gun_up_left' },
            { right: 'sentry_gun_down_right', left: 'sentry_gun_down_left' }
        ];
        
        rightSprites.forEach(spriteInfo => {
            // Skip if left sprite already exists
            if (scene.textures.exists(spriteInfo.left)) {
                console.log(`⚠️ Left sprite ${spriteInfo.left} already exists, skipping creation`);
                return;
            }
            
            if (scene.textures.exists(spriteInfo.right)) {
                try {
                    // Get the original texture
                    const originalTexture = scene.textures.get(spriteInfo.right);
                    const originalFrame = originalTexture.get();
                    
                    // Create a canvas to flip the sprite
                    const canvas = scene.textures.createCanvas(
                        spriteInfo.left, 
                        originalFrame.width, 
                        originalFrame.height
                    );
                    
                    // Check if canvas was created successfully
                    if (!canvas) {
                        console.warn(`⚠️ Failed to create canvas for ${spriteInfo.left}`);
                        return;
                    }
                    
                    // Get the canvas context and flip horizontally
                    const ctx = canvas.getContext();
                    if (!ctx) {
                        console.warn(`⚠️ Failed to get canvas context for ${spriteInfo.left}`);
                        return;
                    }
                    
                    ctx.save();
                    ctx.scale(-1, 1); // Flip horizontally
                    ctx.drawImage(
                        originalTexture.getSourceImage(),
                        originalFrame.x,
                        originalFrame.y,
                        originalFrame.width,
                        originalFrame.height,
                        -originalFrame.width, // Negative width due to flip
                        0,
                        originalFrame.width,
                        originalFrame.height
                    );
                    ctx.restore();
                    
                    // Refresh the canvas texture
                    canvas.refresh();
                    
                    console.log(`✅ Created left-facing sprite: ${spriteInfo.left} from ${spriteInfo.right}`);
                } catch (error) {
                    console.warn(`⚠️ Error creating ${spriteInfo.left}:`, error);
                }
            } else {
                console.warn(`⚠️ Could not create ${spriteInfo.left} - source sprite ${spriteInfo.right} not found`);
            }
        });
    }
    
    static loadEffectSprites(scene) {
        scene.load.image('bullet', 'src/assets/sprites/effects/bullet.png');
        scene.load.image('bloodSplat', 'src/assets/sprites/effects/bloodSplat.png');
        scene.load.image('muzzleFlash', 'src/assets/sprites/effects/muzzleFlash.png');
        scene.load.image('shellCasing', 'src/assets/sprites/effects/shellCasing.png');
        
        // Helicopter crash site effects
        scene.load.image('smoke_puff', 'src/assets/sprites/effects/smoke_puff.png');
        
        // Small fire is optional - only load if it exists
        // scene.load.image('small_fire', 'src/assets/sprites/effects/small_fire.png');
    }
    
    static loadEnvironmentSprites(scene) {
        scene.load.image('tree', 'src/assets/sprites/environment/tree.png');
        scene.load.image('rock', 'src/assets/sprites/environment/rock.png');
        scene.load.image('bush', 'src/assets/sprites/environment/bush.png');
        scene.load.image('flowers', 'src/assets/sprites/environment/flowers.png');
        scene.load.image('palm_tree', 'src/assets/sprites/environment/palm_tree.png');
        scene.load.image('dead_tree', 'src/assets/sprites/environment/dead_tree.png');
        scene.load.image('crashed_helicopter', 'src/assets/sprites/environment/crashed_helicopter.png');
        scene.load.image('helicopter_wreckage', 'src/assets/sprites/environment/helicopter_wreckage.png');
        scene.load.image('military_crate', 'src/assets/sprites/environment/military_crate.png');
        scene.load.image('sandbags', 'src/assets/sprites/environment/sandbags.png');
        scene.load.image('tent', 'src/assets/sprites/environment/tent.png');
        scene.load.image('campfire', 'src/assets/sprites/environment/campfire.png');
        scene.load.image('debris', 'src/assets/sprites/environment/debris.png');
        
        // Fog of war sprite for exploration mechanics
        scene.load.image('sand_fog', 'src/assets/sprites/environment/sand_fog.png');
    }
    
    static loadTerrainSprites(scene) {
        console.log('🗺️ Loading terrain sprites...');
        
        // Add cache busting to prevent browser caching issues
        const cacheBuster = Date.now();
        
        scene.load.image('grass_texture', `src/assets/sprites/terrain/grass_texture.png?v=${cacheBuster}`);
        scene.load.image('dirt_texture', `src/assets/sprites/terrain/dirt_texture.png?v=${cacheBuster}`);
        scene.load.image('stone_texture', `src/assets/sprites/terrain/stone_texture.png?v=${cacheBuster}`);
        scene.load.image('water_texture', `src/assets/sprites/terrain/water_texture.png?v=${cacheBuster}`);
        
        console.log('🏖️ Loading sand_texture.png with cache buster...');
        scene.load.image('sand_texture', `src/assets/sprites/terrain/sand_texture.png?v=${cacheBuster}`);
        
        console.log('🛣️ Loading dirt_road.png with cache buster...');
        scene.load.image('dirt_road', `src/assets/sprites/terrain/dirt_road.png?v=${cacheBuster}`);
        
        scene.load.image('rubble', `src/assets/sprites/terrain/rubble.png?v=${cacheBuster}`);
        scene.load.image('crackled_concrete', `src/assets/sprites/terrain/crackled_concrete.png?v=${cacheBuster}`);
        
        // Add load event listeners for debugging
        scene.load.on('filecomplete-image-sand_texture', () => {
            console.log('✅ sand_texture.png loaded successfully');
        });
        
        scene.load.on('filecomplete-image-dirt_road', () => {
            console.log('✅ dirt_road.png loaded successfully');
        });
        
        // Add error handling for terrain sprites
        scene.load.on('loaderror', (file) => {
            if (file.key === 'sand_texture' || file.key === 'dirt_road') {
                console.error(`🚨 FAILED to load ${file.key} from ${file.src}`);
                console.log('Check if file exists at:', file.src.replace(/\?v=\d+/, ''));
            }
        });
        
        console.log('🗺️ Terrain sprites queued for loading with cache busting');
    }
    
    static loadBuildingSprites(scene) {
        scene.load.image('wall', 'src/assets/sprites/buildings/wall.png');
        scene.load.image('door', 'src/assets/sprites/buildings/door.png');
        scene.load.image('window', 'src/assets/sprites/buildings/window.png');
        scene.load.image('roof', 'src/assets/sprites/buildings/roof.png');
    }

    /**
     * Diagnostic method to check sprite loading issues
     * Can be called from browser console: SpriteLoader.diagnoseSprites()
     */
    static async diagnoseSprites() {
        console.log('🔧 SPRITE LOADING DIAGNOSTICS');
        console.log('=============================');
        
        const terrainSprites = [
            'src/assets/sprites/terrain/dirt_road.png',
            'src/assets/sprites/terrain/sand_texture.png',
            'src/assets/sprites/terrain/grass_texture.png',
            'src/assets/sprites/terrain/crackled_concrete.png',
            'src/assets/sprites/terrain/rubble.png'
        ];
        
        console.log('📁 Checking file existence...');
        await this.verifyFiles(null, terrainSprites);
        
        console.log('\n🎮 Checking if game scene exists...');
        if (window.game && window.game.scene && window.game.scene.scenes.length > 0) {
            const gameScene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
            if (gameScene) {
                console.log('✅ GameScene found');
                console.log('📝 Available textures:', Object.keys(gameScene.textures.list).filter(t => t.includes('texture') || t.includes('road')));
            } else {
                console.log('❌ GameScene not found');
            }
        } else {
            console.log('❌ Game not found or no scenes loaded');
        }
        
        console.log('\n🔄 To reload sprites, refresh the page with Ctrl+F5 (hard refresh)');
        console.log('🔧 Make sure your files are in the correct location:');
        terrainSprites.forEach(path => console.log(`   ${path}`));
    }
}

// Make SpriteLoader available globally for debugging
if (typeof window !== 'undefined') {
    window.SpriteLoader = SpriteLoader;
} 