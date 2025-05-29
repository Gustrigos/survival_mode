export class SpriteLoader {
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
    }
    
    static loadEffectSprites(scene) {
        scene.load.image('bullet', 'src/assets/sprites/effects/bullet.png');
        scene.load.image('bloodSplat', 'src/assets/sprites/effects/bloodSplat.png');
        scene.load.image('muzzleFlash', 'src/assets/sprites/effects/muzzleFlash.png');
        scene.load.image('shellCasing', 'src/assets/sprites/effects/shellCasing.png');
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
    }
    
    static loadTerrainSprites(scene) {
        scene.load.image('grass_texture', 'src/assets/sprites/terrain/grass_texture.png');
        scene.load.image('dirt_texture', 'src/assets/sprites/terrain/dirt_texture.png');
        scene.load.image('stone_texture', 'src/assets/sprites/terrain/stone_texture.png');
        scene.load.image('water_texture', 'src/assets/sprites/terrain/water_texture.png');
        scene.load.image('sand_texture', 'src/assets/sprites/terrain/sand_texture.png');
        scene.load.image('dirt_road', 'src/assets/sprites/terrain/dirt_road.png');
        scene.load.image('rubble', 'src/assets/sprites/terrain/rubble.png');
        scene.load.image('crackled_concrete', 'src/assets/sprites/terrain/crackled_concrete.png');
    }
    
    static loadBuildingSprites(scene) {
        scene.load.image('wall', 'src/assets/sprites/buildings/wall.png');
        scene.load.image('door', 'src/assets/sprites/buildings/door.png');
        scene.load.image('window', 'src/assets/sprites/buildings/window.png');
        scene.load.image('roof', 'src/assets/sprites/buildings/roof.png');
    }
} 