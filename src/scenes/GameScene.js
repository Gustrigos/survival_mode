import { Player } from '../entities/Player.js';
import { NPCPlayer } from '../entities/NPCPlayer.js';
import { Zombie } from '../entities/Zombie.js';
import { Bullet } from '../entities/Bullet.js';
import { Structure } from '../entities/Structure.js';
import { SpriteGenerator } from '../utils/SpriteGenerator.js';
import { SWATSpriteManager } from '../utils/SWATSpriteManager.js';
import { TerrainOptimizer } from '../utils/TerrainOptimizer.js';
import { SpriteScaler } from '../utils/SpriteScaler.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        console.log('GameScene preload() called');
        
        // Load sprites (this queues them for loading)
        try {
            SpriteGenerator.generateSprites(this);
            console.log('Sprites queued for loading successfully');
        } catch (error) {
            console.error('Error loading sprites:', error);
        }
    }

    create() {
        console.log('GameScene create() called');
        
        // NOW check for loaded textures - they're actually available now
        console.log('Available textures:', Object.keys(this.textures.list));
        
        // Check for SWAT spritesheet first
        if (this.textures.exists('swat_player')) {
            console.log('✓ SWAT spritesheet loaded successfully');
            // Set up SWAT animations
            SWATSpriteManager.setupAnimations(this);
        } else {
            console.warn('✗ SWAT spritesheet not found, will use placeholder sprites');
        }
        
        // Check for other required textures
        const requiredTextures = ['player_down', 'player_up', 'player_left', 'player_right', 
                                 'zombie_down', 'zombie_up', 'zombie_left', 'zombie_right', 'bullet'];
        requiredTextures.forEach(texture => {
            if (this.textures.exists(texture)) {
                console.log(`✓ Texture '${texture}' exists`);
            } else {
                console.error(`✗ Texture '${texture}' missing!`);
            }
        });
        
        // Optimize terrain textures for better performance and visual quality
        try {
            TerrainOptimizer.optimizeTextures(this, {
                targetTileSize: 64,
                useNearestFilter: true,
                compressLargeTextures: true
            });
        } catch (error) {
            console.warn('Terrain optimization failed:', error);
        }
        
        // Apply automatic sprite scaling to fix oversized sprites
        try {
            SpriteScaler.applyGlobalScaling(this);
        } catch (error) {
            console.warn('Sprite scaling failed:', error);
        }
        
        // Specifically check for helicopter texture
        if (this.textures.exists('crashed_helicopter')) {
            console.log('✓ Crashed helicopter texture exists and is ready');
        } else {
            console.error('✗ Crashed helicopter texture missing!');
        }
        
        // Expand world bounds for larger crash site area
        const worldWidth = 2048;
        const worldHeight = 1536;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        
        // Create groups first
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 50,
            runChildUpdate: true
        });
        
        this.zombies = this.physics.add.group({
            classType: Zombie,
            runChildUpdate: true
        });
        
        // Squad members group for NPCs
        this.squadMembers = this.physics.add.group({
            classType: NPCPlayer,
            runChildUpdate: true
        });
        
        // Static structures (helicopter, buildings, wreckage, etc.) should live in a static physics group.
        // Using a dynamic group for GameObjects that already have static bodies causes runtime errors
        // when the group tries to apply dynamic-body callbacks. Switching to a static group fixes this.
        this.structures = this.physics.add.staticGroup({
            classType: Structure,
            runChildUpdate: false
        });
        
        this.bloodSplats = this.add.group();
        this.shellCasings = this.add.group();
        
        // Create detailed crash site background and structures
        this.createCrashSiteMap();
        
        // Create player in crash site area
        console.log('Creating player...');
        try {
            // Check if player textures exist (SWAT or placeholder)
            if (this.textures.exists('swat_player') || this.textures.exists('player_down')) {
                this.player = new Player(this, 900, 650); // Start closer to helicopter crash site
                console.log('Player created successfully with sprites');
                console.log('Player texture:', this.player.texture.key);
                console.log('Player using SWAT sprites:', this.player.usingSWATSprites);
            } else {
                console.warn('No player textures found, creating fallback player');
                this.createFallbackPlayer();
            }
            
            // Make sure player is visible and properly positioned
            this.player.setVisible(true);
            this.player.setActive(true);
            this.player.setDepth(1000); // High depth to stay on top
            this.player.setAlpha(1);
            // Keep existing scale unless using placeholder rectangle sprite
            if (!this.player.usingSWATSprites && this.player.texture.key !== 'swat_player') {
                this.player.setScale(1);
            }
            
            // Collision boxes are now properly set in Player.js constructor with generous sizing
            // No need to override here anymore
            
            console.log('Player final position:', this.player.x, this.player.y);
        } catch (error) {
            console.error('Error creating player:', error);
            // Create a simple placeholder if player creation fails
            this.player = this.add.rectangle(900, 650, 64, 64, 0x00ff00);
            this.player.setDepth(1000);
            this.physics.add.existing(this.player);
            this.player.body.setCollideWorldBounds(true);
            
            // Add minimal required properties
            this.player.health = 100;
            this.player.maxHealth = 100;
            this.player.damage = 30;
            this.player.usingSWATSprites = false;
            this.player.canTakeDamage = () => true;
            this.player.takeDamage = (amount) => {
                this.player.health -= amount;
                window.gameState.playerHealth = this.player.health;
                window.updateUI.health(this.player.health, this.player.maxHealth);
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            };
            this.player.die = () => {
                this.gameOver();
            };
            this.player.shoot = () => {
                console.log('Player shooting (fallback)');
                const bullet = this.bullets.get();
                if (bullet) {
                    bullet.fire(this.player.x, this.player.y - 20, 0, -300);
                }
            };
            this.player.reload = () => console.log('Player reloading (fallback)');
            this.player.update = () => {};
            this.player.setDirection = () => {};
            this.player.setMoving = () => {};
            
            console.log('Created minimal fallback player');
        }
        
        // Create main player name tag
        this.createMainPlayerNameTag();
        
        // Create squad members
        this.createSquad();
        
        // Camera setup - follow player with bounds
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setZoom(1);
        
        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE,R,E');
        
        // Set up collisions
        this.setupCollisions();
        
        // Game state
        this.zombiesInWave = 5;
        this.zombiesSpawned = 0;
        this.zombieSpawnTimer = 0;
        this.waveStartDelay = 3000;
        this.nextWaveTimer = 0;
        this.isWaveActive = false;
        
        // Reset wave to 1 and start properly
        window.gameState.wave = 0; // Will be set to 1 in startWave
        
        // Start first wave
        console.log('Starting first wave...');
        this.startWave();
        
        // Update UI
        this.updateUI();
        
        console.log('GameScene create() completed');
        
        // Create inventory hotbar (Minecraft style)
        this.createInventoryHotbar();
        
        // Add debug text overlay
        this.debugText = this.add.text(10, 10, '', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setDepth(1000).setScrollFactor(0);
        
        this.updateDebugText();

        /* ============================
         *  DEBUGGING AIDS
         *  ---------------------------
         *  1. Collision-shape overlay using Phaser's built-in Arcade-debug graphics.
         *  2. Toggle with the "H" key (think "hit-box"). Starts enabled so you see it right away.
         * ============================ */

        // Create a debug graphic once – Phaser will draw all bodies onto this each frame when enabled.
        this.physics.world.createDebugGraphic();

        // Bump the debug graphic above the playfield but below UI text so it is always visible.
        if (this.physics.world.debugGraphic) {
            // Let the graphic scroll with the world (default scrollFactor = 1)
            this.physics.world.debugGraphic.setDepth(1500);
        }

        // Track visibility state
        this.showDebugBodies = true;
        if (this.physics.world.debugGraphic) {
            this.physics.world.debugGraphic.visible = this.showDebugBodies;
        }

        // Press "H" to toggle collision-box visibility on-the-fly.
        this.input.keyboard.on('keydown-H', () => {
            this.showDebugBodies = !this.showDebugBodies;
            if (this.physics.world.debugGraphic) {
                this.physics.world.debugGraphic.visible = this.showDebugBodies;
            }
            console.log(`Debug hit-box overlay ${this.showDebugBodies ? 'ON' : 'OFF'}`);
        });
    }

    createCrashSiteMap() {
        console.log('Creating helicopter crash site map...');
        
        try {
            // Create base terrain
            this.createTerrain();
            
            // Create crash site structures
            this.createCrashSiteStructures();
            
            // Create urban barriers and defenses
            this.createUrbanBarriers();
            
            // Create sparse vegetation
            this.createUrbanVegetation();
            
            // Create roads and paths
            this.createPaths();
            
            console.log('Helicopter crash site map created successfully');
        } catch (error) {
            console.error('Error creating crash site map, using fallback:', error);
            this.createFallbackBackground();
        }
    }
    
    createFallbackBackground() {
        console.log('Creating fallback background...');
        
        // Create simple sandy background
        const worldWidth = 2048;
        const worldHeight = 1536;
        const tileSize = 64;
        
        for (let x = 0; x < worldWidth; x += tileSize) {
            for (let y = 0; y < worldHeight; y += tileSize) {
                const tile = this.add.rectangle(x + tileSize/2, y + tileSize/2, tileSize, tileSize, 0xF4E4BC);
                tile.setDepth(-10);
            }
        }
        
        // Add some simple structures for gameplay
        const crashedHelicopter = this.add.rectangle(1000, 750, 240, 160, 0x2F4F4F);
        crashedHelicopter.setDepth(750);
        this.physics.add.existing(crashedHelicopter, true);
        crashedHelicopter.body.setImmovable(true);
        crashedHelicopter.body.setSize(200, 120); // Match the collision box from Structure.js
        
        const building = this.add.rectangle(400, 500, 128, 96, 0xC0C0C0);
        building.setDepth(500);
        this.physics.add.existing(building, true);
        building.body.setImmovable(true);
        
        // Add collision for player
        if (this.player && this.player.body) {
            this.physics.add.collider(this.player, crashedHelicopter);
            this.physics.add.collider(this.player, building);
        }
        
        console.log('Fallback background created');
    }
    
    createTerrain() {
        // Terrain Configuration - Easy to adjust for different sizes and performance
        const terrainConfig = {
            tileSize: 64,           // Display size of each terrain tile
            worldWidth: 2048,       // Total world width
            worldHeight: 1536,      // Total world height
            useNearestFilter: true, // Use pixel-perfect scaling (good for pixel art)
            
            // Terrain type definitions with optimal settings
            terrainTypes: {
                sand_texture: { 
                    sourceSize: 1024,  // Original texture size
                    tiling: true       // Whether texture should tile seamlessly
                },
                grass_texture: { 
                    sourceSize: 1024, 
                    tiling: true 
                },
                crackled_concrete: { 
                    sourceSize: 1024, 
                    tiling: true 
                },
                dirt_road: { 
                    sourceSize: 32, 
                    tiling: true 
                },
                dirt_texture: { 
                    sourceSize: 32, 
                    tiling: true 
                },
                rubble: { 
                    sourceSize: 32, 
                    tiling: false 
                },
                stone_texture: { 
                    sourceSize: 32, 
                    tiling: true 
                },
                water_texture: { 
                    sourceSize: 32, 
                    tiling: true 
                }
            }
        };
        
        const { tileSize, worldWidth, worldHeight, useNearestFilter, terrainTypes } = terrainConfig;
        
        console.log(`Creating terrain with ${tileSize}x${tileSize} tiles...`);
        
        // Create varied terrain base
        for (let x = 0; x < worldWidth; x += tileSize) {
            for (let y = 0; y < worldHeight; y += tileSize) {
                let terrainType = 'sand_texture';
                
                // Crash site area (center of map)
                if (x >= 800 && x <= 1200 && y >= 600 && y <= 900) {
                    terrainType = 'rubble';
                }
                // Urban areas with concrete
                else if (x >= 256 && x <= 640 && y >= 448 && y <= 768) {
                    terrainType = 'crackled_concrete';
                }
                // Main roads
                else if ((x >= 320 && x <= 384 && y >= 0 && y <= worldHeight) || // Main vertical road
                         (x >= 0 && x <= worldWidth && y >= 576 && y <= 640)) { // Main horizontal road
                    terrainType = 'dirt_road';
                }
                // Random rubble patches (reduced for clarity)
                else if (Math.random() < 0.01) { // 1% chance – almost none
                    terrainType = 'rubble';
                }
                
                // Check if texture exists, fallback to simple colored rectangle
                let tile;
                if (this.textures.exists(terrainType)) {
                    tile = this.add.image(x + tileSize/2, y + tileSize/2, terrainType);
                    
                    // Ensure all terrain tiles are exactly the right size
                    // This handles both 32x32 and 1024x1024 source textures properly
                    tile.setDisplaySize(tileSize, tileSize);
                    
                    // Apply filtering based on configuration
                    if (useNearestFilter) {
                        // Use nearest neighbor scaling for pixel-perfect textures
                        // This prevents blurring on pixel art style textures
                        tile.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
                    }
                    
                    // Optional: Add tiling information for future use
                    const typeConfig = terrainTypes[terrainType];
                    if (typeConfig) {
                        tile.setData('sourceSize', typeConfig.sourceSize);
                        tile.setData('tiling', typeConfig.tiling);
                    }
                } else {
                    console.warn(`Texture ${terrainType} not found, using fallback`);
                    // Create fallback colored rectangles
                    let color = 0xF4E4BC; // Default sand color
                    if (terrainType === 'rubble') color = 0x8B7355; // Brown rubble
                    else if (terrainType === 'crackled_concrete') color = 0xB0B0B0; // Gray concrete
                    else if (terrainType === 'dirt_road') color = 0xA0956F; // Dusty brown
                    
                    tile = this.add.rectangle(x + tileSize/2, y + tileSize/2, tileSize, tileSize, color);
                }
                tile.setDepth(-10);
            }
        }
        
        console.log(`Terrain created successfully with ${(worldWidth/tileSize) * (worldHeight/tileSize)} tiles`);
    }
    
    createCrashSiteStructures() {
        console.log('Creating crash site structures...');
        
        try {
            // Main crashed helicopter at center
            const helicopter = this.createStructureWithFallback(1000, 750, 'crashed_helicopter', {
                type: 'crashed_helicopter',
                material: 'metal',
                health: 1500,
                destructible: false
            }, 0x2F4F4F, 240, 160);
            
            // Apply proper scaling using SpriteScaler instead of hardcoded scaling
            if (helicopter && helicopter.texture) {
                console.log('🚁 BEFORE scaling - Helicopter size:', helicopter.width, 'x', helicopter.height);
                SpriteScaler.autoScale(helicopter, 'crashed_helicopter', { maintainAspectRatio: true });
                console.log('🚁 AFTER scaling - Helicopter display size:', helicopter.displayWidth, 'x', helicopter.displayHeight);
                console.log('🚁 Target size from config:', SpriteScaler.getSpriteConfig('crashed_helicopter'));
                
                // Update collision box to match new size
                if (helicopter.body && helicopter.body.setSize) {
                    const scaledWidth = helicopter.displayWidth * 0.8;  // 80% of display size for collision
                    const scaledHeight = helicopter.displayHeight * 0.6; // 60% of display size for collision
                    helicopter.body.setSize(scaledWidth, scaledHeight);
                    helicopter.body.setOffset(
                        (helicopter.displayWidth - scaledWidth) / 2,
                        (helicopter.displayHeight - scaledHeight) / 2
                    );
                    console.log('🚁 Collision box updated to:', scaledWidth, 'x', scaledHeight);
                }
            }
            
            // Add smoke effects to the main helicopter
            this.addHelicopterEffects(helicopter.x, helicopter.y);
            
            // Removed helicopter tail/wreckage - keeping only the main crashed helicopter
            console.log('✅ Helicopter beacon and label have been removed');
            console.log('🚁 Smoke effects added to main helicopter only');
            
            // Simplified layout: skip additional burning wreckage and debris to reduce ground clutter
            return; // <-- no more structures after the main helicopter
            
            // Burning wreckage around crash site
            const burningPositions = [
                {x: 900, y: 700}, {x: 1100, y: 800}, {x: 950, y: 850}
            ];
            
            burningPositions.forEach(pos => {
                const wreck = this.createStructureWithFallback(pos.x, pos.y, 'burning_wreckage', {
                    type: 'burning_wreckage',
                    material: 'metal',
                    health: 200,
                    destructible: true
                }, 0x2F4F4F, 64, 48);

                // Add pulsating fire effect to give life to the flames
                this.tweens.add({
                    targets: wreck,
                    scaleX: { from: 0.9, to: 1.05 },
                    scaleY: { from: 0.9, to: 1.05 },
                    alpha: { from: 0.8, to: 1 },
                    yoyo: true,
                    repeat: -1,
                    duration: Phaser.Math.Between(500, 800)
                });

                // Extra smoke from each burning wreckage
                this.addHelicopterEffects(pos.x, pos.y);
            });
            
            // Helicopter wreckage pieces
            const wreckagePositions = [
                {x: 850, y: 650}, {x: 1150, y: 700}, {x: 1050, y: 900}, {x: 800, y: 800}
            ];
            
            wreckagePositions.forEach(pos => {
                this.createStructureWithFallback(pos.x, pos.y, 'helicopter_wreckage', {
                    type: 'helicopter_wreckage',
                    material: 'metal',
                    health: 100,
                    destructible: true
                }, 0x2F4F4F, 80, 60);
            });
            
            // Somalia-style concrete buildings
            const buildingPositions = [
                {x: 400, y: 500, texture: 'concrete_building'},
                {x: 600, y: 400, texture: 'damaged_building'},
                {x: 1400, y: 600, texture: 'concrete_building'},
                {x: 1600, y: 800, texture: 'damaged_building'}
            ];
            
            buildingPositions.forEach(pos => {
                const width = pos.texture === 'concrete_building' ? 128 : 96;
                const height = pos.texture === 'concrete_building' ? 96 : 80;
                this.createStructureWithFallback(pos.x, pos.y, pos.texture, {
                    type: pos.texture,
                    material: 'concrete',
                    health: 1200,
                    destructible: true
                }, 0xC0C0C0, width, height);
            });
            
            // Military supply crates
            const cratePositions = [
                {x: 450, y: 650}, {x: 520, y: 680}, {x: 380, y: 720},
                {x: 1300, y: 500}, {x: 1350, y: 520}, {x: 1250, y: 480}
            ];
            
            cratePositions.forEach(pos => {
                this.createStructureWithFallback(pos.x, pos.y, 'military_crate', {
                    type: 'military_crate',
                    material: 'metal',
                    health: 100,
                    destructible: true
                }, 0x4A5D23, 32, 32);
            });
            
            // Debris piles
            const debrisPositions = [
                {x: 750, y: 750}, {x: 1200, y: 650}, {x: 900, y: 950},
                {x: 1100, y: 600}, {x: 850, y: 900}
            ];
            
            debrisPositions.forEach(pos => {
                this.createStructureWithFallback(pos.x, pos.y, 'debris', {
                    type: 'debris',
                    material: 'concrete',
                    health: 50,
                    destructible: true
                }, 0x696969, 32, 24);
            });
            
            // Restore smoke / fire effects for the larger helicopter body
            this.addHelicopterEffects(1000, 750);
            
            console.log('Crash site structures created successfully');
        } catch (error) {
            console.error('Error creating crash site structures:', error);
        }
    }
    
    createStructureWithFallback(x, y, textureKey, config, fallbackColor, width, height) {
        try {
            if (this.textures.exists(textureKey)) {
                const structure = new Structure(this, x, y, textureKey, config);
                
                // Don't auto-scale here since we handle scaling manually for specific structures
                // This prevents double scaling issues
                
                this.structures.add(structure);
                return structure;
            } else {
                console.warn(`Texture ${textureKey} not found, creating fallback`);
                // Create a simple colored rectangle as fallback
                const fallbackRect = this.add.rectangle(x, y, width, height, fallbackColor);
                fallbackRect.setDepth(y + height);
                
                // Add basic physics body for collision
                this.physics.add.existing(fallbackRect, true);
                fallbackRect.body.setSize(width * 0.8, height * 0.8);
                fallbackRect.body.setImmovable(true);
                
                return fallbackRect;
            }
        } catch (error) {
            console.error(`Error creating structure ${textureKey}:`, error);
            // Create minimal fallback
            const fallbackRect = this.add.rectangle(x, y, width || 32, height || 32, fallbackColor || 0x666666);
            fallbackRect.setDepth(y + (height || 32));
            return fallbackRect;
        }
    }
    
    createUrbanBarriers() {
        console.log('Skipping urban barriers for simplified map...');

        // Early exit: disable walls, sandbags, barricades to remove hidden obstacles
        return;

        /* The block below is kept for reference but will never execute
        try {
            // Compound walls around buildings
            const wallPositions = [
                // Around first building
                {x: 320, y: 448}, {x: 384, y: 448}, {x: 448, y: 448},
                {x: 320, y: 512}, {x: 320, y: 576}, {x: 448, y: 512}, {x: 448, y: 576},
                {x: 320, y: 640}, {x: 384, y: 640}, {x: 448, y: 640},
                
                // Around crash site perimeter
                {x: 700, y: 600}, {x: 764, y: 600}, {x: 828, y: 600},
                {x: 1200, y: 600}, {x: 1264, y: 600}, {x: 1328, y: 600},
                {x: 700, y: 900}, {x: 764, y: 900}, {x: 828, y: 900},
                {x: 1200, y: 900}, {x: 1264, y: 900}, {x: 1328, y: 900}
            ];
            
            wallPositions.forEach(pos => {
                this.createStructureWithFallback(pos.x, pos.y, 'compound_wall', {
                    type: 'compound_wall',
                    material: 'concrete',
                    health: 300,
                    destructible: true
                }, 0xA0A0A0, 64, 32);
            });
            
            // Sandbag positions for defensive positions
            const sandbagPositions = [
                {x: 500, y: 600}, {x: 550, y: 650}, {x: 600, y: 700},
                {x: 1400, y: 700}, {x: 1450, y: 750}, {x: 1500, y: 800}
            ];
            
            sandbagPositions.forEach(pos => {
                this.createStructureWithFallback(pos.x, pos.y, 'sandbags', {
                    type: 'sandbags',
                    material: 'fabric',
                    health: 150,
                    destructible: true
                }, 0xC2B280, 48, 32);
            });
            
            // Barricades at key positions
            const barricadePositions = [
                {x: 352, y: 500}, {x: 352, y: 700}, {x: 1000, y: 500}, {x: 1000, y: 1000}
            ];
            
            barricadePositions.forEach(pos => {
                this.createStructureWithFallback(pos.x, pos.y, 'barricade', {
                    type: 'barricade',
                    material: 'wood',
                    health: 80,
                    destructible: true
                }, 0x8B4513, 64, 24);
            });
            
            console.log('Urban barriers created successfully');
        } catch (error) {
            console.error('Error creating urban barriers:', error);
        }
        */
    }
    
    createUrbanVegetation() {
        console.log('Creating sparse urban vegetation...');
        
        try {
            // Sparse palm trees
            const palmPositions = [
                {x: 200, y: 300}, {x: 1800, y: 400}, {x: 300, y: 1200}, {x: 1700, y: 1100}
            ];
            
            palmPositions.forEach(pos => {
                const palmTree = this.createStructureWithFallback(pos.x, pos.y, 'palm_tree', {
                    type: 'palm_tree',
                    material: 'wood',
                    health: 120,
                    destructible: true
                }, 0x8B7355, 48, 80);
                
                // Trees are automatically scaled in createStructureWithFallback now
            });
            
            // Dead trees
            const deadTreePositions = [
                {x: 150, y: 800}, {x: 1900, y: 600}, {x: 400, y: 1300}
            ];
            
            deadTreePositions.forEach(pos => {
                const deadTree = this.createStructureWithFallback(pos.x, pos.y, 'dead_tree', {
                    type: 'dead_tree',
                    material: 'wood',
                    health: 60,
                    destructible: true
                }, 0x654321, 32, 64);
                
                // Trees are automatically scaled in createStructureWithFallback now
            });
            
            // Scrub bushes (non-collidable decoration)
            const bushPositions = [
                {x: 180, y: 400}, {x: 220, y: 450}, {x: 1800, y: 650},
                {x: 1850, y: 700}, {x: 350, y: 1250}
            ];
            
            bushPositions.forEach(pos => {
                if (this.textures.exists('scrub_bush')) {
                    const bush = this.add.image(pos.x, pos.y, 'scrub_bush');
                    bush.setDepth(pos.y);
                    
                    // Apply scaling to bush
                    SpriteScaler.autoScale(bush, 'bush', { maintainAspectRatio: true });
                } else {
                    const bush = this.add.circle(pos.x, pos.y, 12, 0x6B8E23);
                    bush.setDepth(pos.y);
                }
            });
            
            console.log('Urban vegetation created successfully');
        } catch (error) {
            console.error('Error creating urban vegetation:', error);
        }
    }
    
    createPaths() {
        // Main dirt road connecting areas - already created in terrain
        // Add some path markers and signs
        
        // Simple path markers (rocks)
        const markerPositions = [
            {x: 352, y: 300}, {x: 352, y: 900}, {x: 352, y: 1200},
            {x: 600, y: 608}, {x: 900, y: 608}, {x: 1200, y: 608}
        ];
        
        markerPositions.forEach(pos => {
            const marker = this.add.circle(pos.x, pos.y, 8, 0x696969);
            marker.setDepth(pos.y);
        });
    }

    update(time, delta) {
        // Update player
        this.player.update(time, delta);
        
        // Update main player name tag position
        if (this.player.nameTag) {
            this.player.nameTag.x = this.player.x;
            this.player.nameTag.y = this.player.y - 40;
        }
        
        // Removed main player health bar updates - using UI panel instead
        
        // Update crash site structures (if any have special behavior)
        // Currently no special updates needed for crash site structures
        
        // Handle input
        this.handleInput();
        
        // Spawn zombies
        this.handleZombieSpawning(time, delta);
        
        // Check wave completion
        this.checkWaveCompletion();
        
        // Update depth sorting for Pokemon-style layering
        this.updateDepthSorting();
        
        // Clean up old effects
        this.cleanupEffects();
        
        // Update debug text
        this.updateDebugText();
        
        // Update HTML squad status
        this.updateHTMLSquadStatus();
    }
    
    handleInput() {
        const player = this.player;
        
        // Movement
        let velocityX = 0;
        let velocityY = 0;
        const speed = 200;
        
        const pressedKeys = [];
        if (this.wasd.A.isDown) {
            velocityX = -speed;
            pressedKeys.push('A');
        }
        if (this.wasd.D.isDown) {
            velocityX = speed;
            pressedKeys.push('D');
        }
        if (this.wasd.W.isDown) {
            velocityY = -speed;
            pressedKeys.push('W');
        }
        if (this.wasd.S.isDown) {
            velocityY = speed;
            pressedKeys.push('S');
        }
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        player.setVelocity(velocityX, velocityY);
        
        // Update player direction and animation
        let newDirection = null;
        if (velocityX !== 0 || velocityY !== 0) {
            player.setMoving(true);
            
            // Set direction based on movement
            if (Math.abs(velocityX) > Math.abs(velocityY)) {
                newDirection = velocityX > 0 ? 'right' : 'left';
            } else {
                newDirection = velocityY > 0 ? 'down' : 'up';
            }
            player.setDirection(newDirection);
        } else {
            player.setMoving(false);
        }
        
        // Enhanced shooting debug
        if (this.wasd.SPACE.isDown) {
            this.player.shoot();
        }
        
        // Reloading
        if (Phaser.Input.Keyboard.JustDown(this.wasd.R)) {
            this.player.reload();
        }
        
        // Structure interaction (for future features like entering buildings)
        if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
            // Future: Add interaction with crash site structures
            // Could include searching wreckage, entering buildings, etc.
        }
    }
    
    handleZombieSpawning(time, delta) {
        if (!this.isWaveActive) {
            console.log('Wave not active, skipping zombie spawn');
            return;
        }
        
        this.zombieSpawnTimer += delta;
        
        if (this.zombiesSpawned < this.zombiesInWave && this.zombieSpawnTimer > 2000) {
            this.spawnZombie();
            this.zombieSpawnTimer = 0;
            this.zombiesSpawned++;
        } else if (this.zombiesSpawned < this.zombiesInWave) {
            // Still waiting to spawn

        }
    }
    
    spawnZombie() {
        // Spawn zombie near the edges of the world, but not too close to player
        const playerX = this.player.x;
        const playerY = this.player.y;
        const worldWidth = 2048;
        const worldHeight = 1536;
        
        let spawnX, spawnY;
        const side = Phaser.Math.Between(0, 3);
        const margin = 150; // Distance from edge
        const minDistanceFromPlayer = 300; // Minimum distance from player
        
        let attempts = 0;
        do {
            switch (side) {
                case 0: // Top
                    spawnX = Phaser.Math.Between(margin, worldWidth - margin);
                    spawnY = margin;
                    break;
                case 1: // Right
                    spawnX = worldWidth - margin;
                    spawnY = Phaser.Math.Between(margin, worldHeight - margin);
                    break;
                case 2: // Bottom
                    spawnX = Phaser.Math.Between(margin, worldWidth - margin);
                    spawnY = worldHeight - margin;
                    break;
                case 3: // Left
                    spawnX = margin;
                    spawnY = Phaser.Math.Between(margin, worldHeight - margin);
                    break;
            }
            attempts++;
        } while (Phaser.Math.Distance.Between(spawnX, spawnY, playerX, playerY) < minDistanceFromPlayer && attempts < 10);
        
        console.log('🧟 ZOMBIE SPAWN ATTEMPT:', {
            side: ['Top', 'Right', 'Bottom', 'Left'][side],
            spawnPos: { x: spawnX.toFixed(2), y: spawnY.toFixed(2) },
            playerPos: { x: playerX.toFixed(2), y: playerY.toFixed(2) },
            distanceFromPlayer: Phaser.Math.Distance.Between(spawnX, spawnY, playerX, playerY).toFixed(2),
            attempts
        });
        
        const zombie = new Zombie(this, spawnX, spawnY);
        this.zombies.add(zombie);
        
        // Enhanced zombie debugging after creation
        console.log('🟢 ZOMBIE CREATED:', {
            position: { x: zombie.x.toFixed(2), y: zombie.y.toFixed(2) },
            bodyCenter: { x: zombie.body.center.x.toFixed(2), y: zombie.body.center.y.toFixed(2) },
            bodySize: { w: zombie.body.width, h: zombie.body.height },
            bodyOffset: { x: zombie.body.offset.x.toFixed(2), y: zombie.body.offset.y.toFixed(2) },
            scale: { x: zombie.scaleX.toFixed(3), y: zombie.scaleY.toFixed(3) },
            texture: zombie.texture.key,
            usingSheet: zombie.usingSheet,
            health: zombie.health,
            speed: zombie.speed.toFixed(1)
        });
        
        console.log('Total zombies:', this.zombies.children.size);
        
        window.updateUI.zombiesLeft(this.zombiesInWave - this.zombies.children.size);
    }
    
    bulletHitZombie(bullet, zombie) {
        console.log('Bullet hit zombie!', {
            bulletPos: { x: bullet.x.toFixed(2), y: bullet.y.toFixed(2) },
            zombiePos: { x: zombie.x.toFixed(2), y: zombie.y.toFixed(2) },
            bulletBodyCenter: { x: bullet.body.center.x.toFixed(2), y: bullet.body.center.y.toFixed(2) },
            zombieBodyCenter: { x: zombie.body.center.x.toFixed(2), y: zombie.body.center.y.toFixed(2) },
            bulletSize: { w: bullet.body.width, h: bullet.body.height },
            zombieSize: { w: zombie.body.width, h: zombie.body.height },
            bulletScale: { x: bullet.scaleX.toFixed(3), y: bullet.scaleY.toFixed(3) },
            zombieScale: { x: zombie.scaleX.toFixed(3), y: zombie.scaleY.toFixed(3) }
        });
        
        // Create blood splat at zombie's center for better visual feedback
        this.createBloodSplat(zombie.body.center.x, zombie.body.center.y);
        
        // Damage zombie
        const killed = zombie.takeDamage(this.player.damage);
        
        if (killed) {
            window.gameState.score += 10;
            window.gameState.zombiesKilled++;
            window.updateUI.score(window.gameState.score);
        }
        
        // Remove bullet properly and disable its physics body
        bullet.deactivate();
        
        // Removed screen shake effect to reduce annoying recoil
    }
    
    bulletHitStructure(bullet, structure) {
        // Only wooden structures can be damaged by bullets
        if (structure.material === 'wood' && structure.isDestructible) {
            const destroyed = structure.bulletHit(this.player.damage);
            
            if (destroyed) {
                console.log(`Structure ${structure.structureType} destroyed by bullet!`);
                // Award points for destroying structures
                window.gameState.score += 5;
                window.updateUI.score(window.gameState.score);
            }
        } else {
            // Create spark effect for non-destructible structures
            this.createSparkEffect(bullet.x, bullet.y);
        }
        
        // Remove bullet properly and disable its physics body
        bullet.deactivate();
    }
    
    createSparkEffect(x, y) {
        const sparkCount = 5;
        
        for (let i = 0; i < sparkCount; i++) {
            const spark = this.add.rectangle(x, y, 2, 2, 0xFF69B4);
            spark.setDepth(1000);
            
            console.log('✨ Created pink spark effect (was yellow)');
            
            this.tweens.add({
                targets: spark,
                x: x + Phaser.Math.Between(-20, 20),
                y: y + Phaser.Math.Between(-20, 20),
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    spark.destroy();
                }
            });
        }
    }

    playerHitZombie(player, zombie) {
        // Safety check: make sure player still exists and has a body
        if (!player || !player.body || !player.active) {
            return; // Player has been destroyed, skip collision
        }
        
        if (player.canTakeDamage()) {
            player.takeDamage(20);
            
            // Safety check: make sure player still has a body after taking damage
            if (!player.body || !player.active) {
                return; // Player was destroyed by the damage, skip knockback
            }
            
            // Knockback effect
            const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, player.x, player.y);
            player.body.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
            
            // Stop knockback after short time
            this.time.delayedCall(100, () => {
                if (player && player.body && player.active) {
                    player.body.setVelocity(0, 0);
                }
            });
            
            // Only trigger game over if the MAIN player dies, not squad members
            if (player.health <= 0 && !player.isNPC) {
                this.gameOver();
            }
            // Squad members handle their own death in NPCPlayer.die() method
        }
    }
    
    zombieHitStructure(zombie, structure) {
        // Safety check: make sure zombie still exists and has a body
        if (!zombie || !zombie.body || !zombie.active) {
            return; // Zombie has been destroyed, skip collision
        }
        
        // Zombies attack wooden structures
        if (structure.material === 'wood' && structure.isDestructible) {
            const destroyed = structure.zombieAttack(5); // Zombies do less damage than bullets
            
            if (destroyed) {
                console.log(`Structure ${structure.structureType} destroyed by zombie!`);
            }
            
            // Safety check: make sure zombie still has a body after structure interaction
            if (!zombie.body || !zombie.active) {
                return; // Zombie was destroyed during interaction, skip movement
            }
            
            // Zombie briefly stops to attack
            zombie.body.setVelocity(0, 0);
            this.time.delayedCall(500, () => {
                if (zombie && zombie.body && zombie.active) {
                    // Resume movement toward player
                    const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, this.player.x, this.player.y);
                    zombie.body.setVelocity(Math.cos(angle) * zombie.speed, Math.sin(angle) * zombie.speed);
                }
            });
        }
    }
    
    createBloodSplat(x, y) {
        const bloodSplat = this.add.image(x, y, 'bloodSplat');
        bloodSplat.setDepth(-5);
        bloodSplat.setAlpha(0.8);
        this.bloodSplats.add(bloodSplat);
        
        // Fade out blood splat over time
        this.tweens.add({
            targets: bloodSplat,
            alpha: 0,
            duration: 10000,
            onComplete: () => bloodSplat.destroy()
        });
    }
    
    checkWaveCompletion() {
        if (this.isWaveActive && this.zombies.children.size === 0 && this.zombiesSpawned >= this.zombiesInWave) {
            this.isWaveActive = false;
            this.nextWaveTimer = this.time.now + this.waveStartDelay;
            
            // Show wave complete message
            const waveCompleteText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 
                `Wave ${window.gameState.wave} Complete!\nNext wave in 3 seconds...`, {
                fontSize: '32px',
                fill: '#00ff00',
                fontFamily: 'Courier New',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0);
            
            this.tweens.add({
                targets: waveCompleteText,
                alpha: 0,
                duration: 3000,
                onComplete: () => waveCompleteText.destroy()
            });
            
            // Start next wave after delay
            this.time.delayedCall(this.waveStartDelay, () => {
                this.startWave();
            });
        }
    }
    
    startWave() {
        // FIXED: Properly handle wave initialization
        if (window.gameState.wave === 0) {
            // First time starting, set to wave 1
            window.gameState.wave = 1;
        } else if (this.isWaveActive === false) {
            // Starting next wave
            window.gameState.wave++;
        }
        
        this.zombiesInWave = 5 + (window.gameState.wave - 1) * 2; // Increase zombies each wave
        this.zombiesSpawned = 0;
        this.isWaveActive = true;
        
        console.log(`Starting Wave ${window.gameState.wave} with ${this.zombiesInWave} zombies`);
        
        window.updateUI.wave(window.gameState.wave);
        window.updateUI.zombiesLeft(this.zombiesInWave);
        
        // Show wave start message
        const waveStartText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 
            `Wave ${window.gameState.wave}`, {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.tweens.add({
            targets: waveStartText,
            alpha: 0,
            duration: 2000,
            onComplete: () => waveStartText.destroy()
        });
    }
    
    updateDepthSorting() {
        // Sort sprites by Y position for Pokemon-style layering
        if (this.player && this.player.active) {
            this.player.setDepth(this.player.y);
        }
        
        // Update squad members depth
        if (this.squadMembers) {
            this.squadMembers.children.entries.forEach(squadMember => {
                if (squadMember && squadMember.active) {
                    squadMember.setDepth(squadMember.y);
                }
            });
        }
        
        if (this.zombies) {
            this.zombies.children.entries.forEach(zombie => {
                if (zombie && zombie.active) {
                    zombie.setDepth(zombie.y);
                }
            });
        }
    }
    
    cleanupEffects() {
        // Clean up shell casings
        this.shellCasings.children.entries.forEach(casing => {
            if (casing.alpha <= 0) {
                casing.destroy();
            }
        });
    }
    
    updateUI() {
        window.updateUI.health(window.gameState.playerHealth, this.player ? this.player.maxHealth : 100);
        window.updateUI.ammo(window.gameState.playerAmmo, window.gameState.maxAmmo);
        window.updateUI.score(window.gameState.score);
        window.updateUI.reloadStatus(window.gameState.isReloading);
    }
    
    gameOver() {
        this.scene.start('GameOverScene', {
            score: window.gameState.score,
            wave: window.gameState.wave,
            zombiesKilled: window.gameState.zombiesKilled
        });
    }
    
    setupCollisions() {
        // Player vs zombies
        this.physics.add.overlap(this.player, this.zombies, this.playerHitZombie, null, this);
        
        // Squad members vs zombies
        this.physics.add.overlap(this.squadMembers, this.zombies, this.playerHitZombie, null, this);
        
        // Bullets vs zombies
        this.physics.add.overlap(this.bullets, this.zombies, this.bulletHitZombie, null, this);
        
        // Player vs structures
        this.physics.add.collider(this.player, this.structures);
        
        // Squad members vs structures
        this.physics.add.collider(this.squadMembers, this.structures);
        
        // Bullets vs structures
        this.physics.add.overlap(this.bullets, this.structures, this.bulletHitStructure, null, this);
        
        // Zombies vs structures
        this.physics.add.collider(this.zombies, this.structures, this.zombieHitStructure, null, this);
        
        console.log('Collisions set up with structures and squad members');
    }
    
    updateDebugText() {
        if (this.debugText) {
            const zombieCount = this.zombies ? this.zombies.children.size : 0;
            const squadCount = this.squadMembers ? this.squadMembers.children.size : 0;
            this.debugText.setText([
                `Zombies: ${zombieCount}`,
                `Squad Members: ${squadCount}`,
                `Wave: ${window.gameState.wave || 1}`,
                `Score: ${window.gameState.score || 0}`
            ].join('\n'));
        }
    }
    
    createInventoryHotbar() {
        const slotSize = 50;
        const slotCount = 9; // Minecraft style - 9 slots
        const totalWidth = slotCount * slotSize + (slotCount - 1) * 4; // 4px spacing between slots
        const startX = (1024 - totalWidth) / 2; // Center horizontally
        const startY = 768 - 80; // 80px from bottom
        
        // No background - transparent and minimalistic
        
        // Create inventory slots
        this.inventorySlots = [];
        this.inventoryItems = [];
        
        for (let i = 0; i < slotCount; i++) {
            const x = startX + i * (slotSize + 4);
            const y = startY;
            
            // Minimalistic slot - just a subtle outline
            const slot = this.add.rectangle(x + slotSize/2, y + slotSize/2, slotSize, slotSize, 0x000000, 0)
                .setDepth(2001)
                .setScrollFactor(0)
                .setStrokeStyle(2, 0x404040, 0.8); // Thicker darker grey border
            
            // Selected slot highlight (only for first slot initially)
            if (i === 0) {
                slot.setStrokeStyle(3, 0xFF69B4, 0.9); // Pink border for selection instead of white
            }
            
            this.inventorySlots.push(slot);
            
            // Add weapon to first slot
            if (i === 0) {
                const iconTexture = this.player && this.player.weapons[this.player.currentWeapon].icon ? this.player.weapons[this.player.currentWeapon].icon : 'pistol_down';
                const weaponIcon = this.add.image(x + slotSize/2, y + slotSize/2, iconTexture)
                    .setDepth(2002)
                    .setScrollFactor(0);
                weaponIcon.setDisplaySize(slotSize*0.8, slotSize*0.8); // keep a margin
                
                this.inventoryItems.push(weaponIcon);
                
                // Add weapon name text below hotbar - more subtle
                const weaponName = this.player ? this.player.getCurrentWeaponName() : 'Weapon';
                this.weaponNameText = this.add.text(x + slotSize/2, y + slotSize + 10, weaponName.charAt(0).toUpperCase()+weaponName.slice(1), {
                    fontSize: '12px',
                    fill: '#ffffff',
                    fontFamily: 'Courier New',
                    alpha: 0.8 // Semi-transparent text
                }).setOrigin(0.5, 0).setDepth(2003).setScrollFactor(0);
            } else {
                this.inventoryItems.push(null);
            }
        }
        
        // Store current selected slot
        this.selectedSlot = 0;
        
        console.log('Minimalistic inventory hotbar created');
    }
    
    updateInventoryHotbar() {
        // Update selected slot highlighting
        this.inventorySlots.forEach((slot, index) => {
            if (index === this.selectedSlot) {
                slot.setStrokeStyle(3, 0xFF69B4, 0.9); // Selected: thicker pink border
            } else {
                slot.setStrokeStyle(2, 0x404040, 0.8); // Unselected: thicker darker grey border
            }
        });
        
        // Update weapon name text
        if (this.weaponNameText && this.player) {
            const weaponName = this.player.getCurrentWeaponName();
            this.weaponNameText.setText(weaponName.charAt(0).toUpperCase() + weaponName.slice(1));
            // Update icon texture for slot 0 if changed
            const currentIcon = this.player.weapons[this.player.currentWeapon].icon;
            const iconSprite = this.inventoryItems[0];
            if(iconSprite && iconSprite.texture.key !== currentIcon){
                iconSprite.setTexture(currentIcon);
                iconSprite.setDisplaySize(slotSize*0.8, slotSize*0.8);
            }
        }
    }

    addHelicopterEffects(x, y) {
        console.log('🚁 Adding basic helicopter smoke effects');
        
        // Much simpler approach - just 2 basic smoke sources
        const smokeOffsets = [
            { dx: 0, dy: -20, type: 'main' },      // Main engine smoke
            { dx: 30, dy: 10, type: 'secondary' }  // Secondary smoke source
        ];
        
        smokeOffsets.forEach((offset, index) => {
            this.time.addEvent({
                delay: Phaser.Math.Between(800, 1200), // Slower, more basic timing
                loop: true,
                callback: () => {
                    let puff;
                    
                    if (this.textures.exists('smoke_puff')) {
                        puff = this.add.image(x + offset.dx, y + offset.dy, 'smoke_puff');
                        
                        // Use SpriteScaler consistently like we did for helicopter
                        SpriteScaler.autoScale(puff, 'smoke_puff', { maintainAspectRatio: true });
                        
                    } else {
                        // Simple fallback - very small circle
                        puff = this.add.circle(x + offset.dx, y + offset.dy, 3, 0x666666);
                    }
                    
                    puff.setDepth(y + 100);
                    puff.setAlpha(0.7);
                    
                    // Basic upward movement with simple expansion
                    this.tweens.add({
                        targets: puff,
                        y: puff.y - 60, // Simple upward movement
                        x: puff.x + Phaser.Math.Between(-10, 10), // Minimal drift
                        scaleX: (puff.scaleX || 1) * 2, // Double the size
                        scaleY: (puff.scaleY || 1) * 2, // Double the size
                        alpha: 0,
                        duration: 3000, // Simple 3 second duration
                        ease: 'Linear',
                        onComplete: () => puff.destroy()
                    });
                }
            });
        });
        
        // Simple fire effects
        if (this.textures.exists('small_fire')) {
            const flame = this.add.image(x - 10, y + 20, 'small_fire');
            
            // Use SpriteScaler for fire too
            SpriteScaler.autoScale(flame, 'small_fire', { maintainAspectRatio: true });
            
            flame.setDepth(y + 50);
            flame.setAlpha(0.8);
            
            // Simple flickering
            this.tweens.add({
                targets: flame,
                alpha: { from: 0.6, to: 1.0 },
                yoyo: true,
                repeat: -1,
                duration: 400
            });
            
            console.log('✅ Using small_fire.png with SpriteScaler:', flame.displayWidth, 'x', flame.displayHeight);
        } else {
            // Simple fallback fire
            const flame = this.add.circle(x - 10, y + 20, 8, 0xFF4500);
            flame.setDepth(y + 50);
            flame.setAlpha(0.8);
            
            this.tweens.add({
                targets: flame,
                alpha: { from: 0.6, to: 1.0 },
                yoyo: true,
                repeat: -1,
                duration: 400
            });
            
            console.log('⚠️ small_fire.png not found, using 8px fallback');
        }
        
        console.log('🔥 Basic helicopter effects initialized');
    }

    createFallbackPlayer() {
        console.log('Creating fallback player...');
        this.player = this.add.rectangle(900, 650, 48, 64, 0x00ff00);
        this.player.setDepth(1000);
        
        // Add basic physics
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(32, 40);
        this.player.body.setOffset(8, 24);
        
        // Add basic movement methods
        this.player.health = 100;
        this.player.maxHealth = 100;
        this.player.damage = 30;
        this.player.usingSWATSprites = false;
        this.player.canTakeDamage = () => true;
        this.player.takeDamage = (amount) => {
            this.player.health -= amount;
            window.gameState.playerHealth = this.player.health;
            window.updateUI.health(this.player.health, this.player.maxHealth);
            if (this.player.health <= 0) {
                this.gameOver();
            }
        };
        this.player.die = () => {
            this.gameOver();
        };
        this.player.shoot = () => {
            console.log('Player shooting (fallback)');
            const bullet = this.bullets.get();
            if (bullet) {
                bullet.fire(this.player.x, this.player.y - 20, 0, -300);
            }
        };
        this.player.reload = () => console.log('Player reloading (fallback)');
        this.player.update = () => {};
        this.player.setDirection = () => {};
        this.player.setMoving = () => {};
        
        console.log('Fallback player created');
    }

    createMainPlayerNameTag() {
        // Create name tag for main player (different color to distinguish from NPCs)
        if (this.player && !this.player.isNPC) {
            this.player.nameTag = this.add.text(this.player.x, this.player.y - 40, 'LEADER', {
                fontSize: '12px',
                fill: '#00BFFF', // Blue color for main player
                fontFamily: 'Courier New',
                stroke: '#000000',
                strokeThickness: 2,
                alpha: 0.9
            });
            this.player.nameTag.setOrigin(0.5);
            this.player.nameTag.setDepth(2000); // High depth to stay above everything
            
            // Removed above-character health bar - using UI panel instead
            
            console.log('Main player name tag created');
        }
    }

    createSquad() {
        // Create NPC squad members with different configurations
        console.log('Creating squad members...');
        
        // Squad member configurations
        const squadConfigs = [
            {
                name: 'Alpha',
                color: 0x00ff00, // Green
                formationOffset: { x: -50, y: 40 }, // Tighter left-back formation
                weapon: 'pistol',
                aggroRange: 250,
                followDistance: 60, // Closer follow distance
                maxSeparation: 200 // Max distance before abandoning combat to follow
            },
            {
                name: 'Bravo',
                color: 0xff8800, // Orange
                formationOffset: { x: 50, y: 40 }, // Tighter right-back formation
                weapon: 'machineGun',
                aggroRange: 300,
                followDistance: 60, // Closer follow distance
                maxSeparation: 200 // Max distance before abandoning combat to follow
            }
        ];
        
        // Create each squad member
        squadConfigs.forEach((config, index) => {
            try {
                // Start squad members near the main player
                const startX = this.player.x + config.formationOffset.x;
                const startY = this.player.y + config.formationOffset.y;
                
                const squadMember = new NPCPlayer(this, startX, startY, config);
                this.squadMembers.add(squadMember);
                
                console.log(`Squad member '${config.name}' created at position (${startX}, ${startY})`);
            } catch (error) {
                console.error(`Error creating squad member '${config.name}':`, error);
            }
        });
        
        console.log(`Squad creation complete. Total members: ${this.squadMembers.children.size}`);
    }

    updateHTMLSquadStatus() {
        const squadMembersDiv = document.getElementById('squad-members');
        if (!squadMembersDiv) return; // HTML element not found
        
        // Clear existing content
        squadMembersDiv.innerHTML = '';
        
        // Show all squad members (including dead ones) to track casualties
        if (this.squadMembers) {
            // Get all squad members that were created (including destroyed ones)
            const allSquadMembers = [
                ...this.squadMembers.children.entries,
                // Also track destroyed squad members by checking our initial squad configs
                ...this.getDestroyedSquadMembers()
            ];
            
            // If we have active squad members, show them
            this.squadMembers.children.entries.forEach((squadMember, index) => {
                if (squadMember) { // Check if exists (active or inactive)
                    const memberDiv = document.createElement('div');
                    memberDiv.className = 'squad-member';
                    
                    const name = squadMember.squadConfig.name;
                    const health = squadMember.active ? Math.ceil(squadMember.health) : 0;
                    const maxHealth = squadMember.maxHealth;
                    const healthPercent = squadMember.active ? (health / maxHealth) : 0;
                    const color = `#${squadMember.squadConfig.color.toString(16).padStart(6, '0')}`;
                    
                    // Show different styling for dead vs alive
                    const statusClass = squadMember.active && health > 0 ? '' : ' style="opacity: 0.5;"';
                    const statusText = squadMember.active && health > 0 ? '' : ' [KIA]';
                    
                    memberDiv.innerHTML = `
                        <span style="color: ${color}; font-weight: bold;"${statusClass}>${name}${statusText}</span>
                        <div class="squad-health-bar"${statusClass}>
                            <div class="squad-health-fill" style="width: ${healthPercent * 100}%;"></div>
                        </div>
                        <span${statusClass}>${health}/${maxHealth}</span>
                    `;
                    
                    squadMembersDiv.appendChild(memberDiv);
                }
            });
            
            // Also show destroyed squad members
            const destroyedMembers = this.getDestroyedSquadMembers();
            destroyedMembers.forEach(memberInfo => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'squad-member';
                
                const color = `#${memberInfo.color.toString(16).padStart(6, '0')}`;
                
                memberDiv.innerHTML = `
                    <span style="color: ${color}; font-weight: bold; opacity: 0.5;">${memberInfo.name} [KIA]</span>
                    <div class="squad-health-bar" style="opacity: 0.5;">
                        <div class="squad-health-fill" style="width: 0%;"></div>
                    </div>
                    <span style="opacity: 0.5;">0/${memberInfo.maxHealth}</span>
                `;
                
                squadMembersDiv.appendChild(memberDiv);
            });
        }
    }
    
    // Track destroyed squad members for HUD display
    getDestroyedSquadMembers() {
        if (!this.destroyedSquadMembers) {
            this.destroyedSquadMembers = [];
        }
        return this.destroyedSquadMembers;
    }
    
    // Call this when a squad member dies to track them
    trackDestroyedSquadMember(squadMember) {
        if (!this.destroyedSquadMembers) {
            this.destroyedSquadMembers = [];
        }
        
        this.destroyedSquadMembers.push({
            name: squadMember.squadConfig.name,
            color: squadMember.squadConfig.color,
            maxHealth: squadMember.maxHealth
        });
    }
} 