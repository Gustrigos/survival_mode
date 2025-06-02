import { Player } from '../entities/Player.js';
import { NPCPlayer } from '../entities/NPCPlayer.js';
import { Zombie } from '../entities/Zombie.js';
import { Bullet } from '../entities/Bullet.js';
import { Structure } from '../entities/Structure.js';
import { SentryGun } from '../entities/SentryGun.js';
import { Barricade } from '../entities/Barricade.js';
import { Sandbag } from '../entities/Sandbag.js';
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
        
        // Add loading completion event
        this.load.on('complete', () => {
            console.log('🗺️ All assets loaded, textures should be available now');
            this.texturesFullyLoaded = true;
        });
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
        
        // Check terrain textures specifically
        const terrainTextures = ['dirt_road', 'sand_texture', 'grass_texture', 'crackled_concrete', 'rubble'];
        console.log('🗺️ TERRAIN TEXTURE CHECK:');
        terrainTextures.forEach(texture => {
            if (this.textures.exists(texture)) {
                console.log(`✓ Terrain texture '${texture}' exists`);
                // Log additional details about the loaded texture
                const textureObj = this.textures.get(texture);
                const source = textureObj.getSourceImage();
                const width = source.width || source.naturalWidth || 'unknown';
                const height = source.height || source.naturalHeight || 'unknown';
                console.log(`  → ${texture} dimensions: ${width}x${height}`);
            } else {
                console.error(`✗ Terrain texture '${texture}' missing!`);
                console.error(`  → This will cause fallback rectangles to be used instead of sprites`);
            }
        });
        
        // IMPORTANT: Wait for all textures to be loaded before creating terrain
        let texturesReady = terrainTextures.every(texture => this.textures.exists(texture));
        console.log(`🗺️ All terrain textures ready: ${texturesReady}`);
        
        // List all available textures for debugging
        const allTextures = Object.keys(this.textures.list);
        console.log('🗺️ ALL AVAILABLE TEXTURES:', allTextures.filter(t => t.includes('texture') || t.includes('road')));
        
        if (!texturesReady) {
            console.warn('⚠️ Some terrain textures not loaded yet, will retry terrain creation...');
            console.warn('⚠️ Missing textures:', terrainTextures.filter(texture => !this.textures.exists(texture)));
            // Set a flag to retry terrain creation once textures are loaded
            this.needsTerrainRetry = true;
        }
        
        // Optimize terrain textures for better performance and visual quality
        try {
            TerrainOptimizer.optimizeTextures(this, {
                targetTileSize: 64,
                useNearestFilter: true,
                compressLargeTextures: true
            });
            
            // OPTIONAL: Generate seamless terrain textures without transparent borders
            // Uncomment the line below to use programmatically generated terrain instead of sprites
            // TerrainOptimizer.createSeamlessTerrainTextures(this);
            // Or just roads: TerrainOptimizer.createSeamlessRoadTextures(this);
            
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
        
        // Initialize sentry guns list (not using physics group to avoid conflicts)
        this.sentryGunsList = [];
        
        // Initialize barricades list
        this.barricadesList = [];
        
        // Initialize sandbags list
        this.sandbagsList = [];
        
        this.bloodSplats = this.add.group();
        this.shellCasings = this.add.group();
        
        // === PLACEMENT PREVIEW SYSTEM ===
        this.placementPreview = null; // The preview sprite
        this.isShowingPreview = false; // Whether we're currently showing a preview
        this.lastPreviewUpdate = 0; // Time tracking for preview updates
        this.previewUpdateInterval = 50; // Update preview every 50ms for smooth movement
        
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
        
        // === SQUAD COMMAND SYSTEM ===
        this.squadMode = 'follow'; // 'follow', 'hold', or 'move'
        this.pingTarget = null; // Current ping target for focus fire
        this.pingMarker = null; // Visual marker for ping
        this.squadModeText = null; // UI text showing current mode
        this.squadCommandsInitialized = false; // Flag to prevent early updates
        this.qKeyWasDown = false; // Track Q key state for hold behavior
        
        // Move mode cursor elements
        this.moveCursor = null;
        this.moveCursorH = null;
        this.moveCursorV = null;
        this.moveCursorDot = null;
        
        // Create squad mode UI indicator
        this.createSquadModeUI();
        
        // Initialize squad members with current mode (without triggering updates)
        this.initializeSquadCommands();
        
        // Set up right-click for target pinging
        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                this.handleRightClick(pointer);
            } else if (pointer.leftButtonDown() && this.squadMode === 'move') {
                // Left-click in move mode - send squad to that location
                this.handleLeftClickMove(pointer);
            }
        });
        
        // Set up pointer movement for move cursor
        this.input.on('pointermove', (pointer) => {
            this.updateMoveCursor(pointer);
        });
        
        // Mark squad commands as ready
        this.squadCommandsInitialized = true;
        
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
        this.zombiesInWave = 25; // Changed from 5 to 25 for more intense first wave
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
        
        // NOW CREATE SANDBAGS - All systems are ready!
        console.log('🛡️ All game systems initialized, now creating sandbags...');
        try {
            this.createCrashSiteSandbags();
        } catch (sandbagError) {
            console.error('❌ Error creating sandbags at end of create():', sandbagError);
        }
        
        console.log('GameScene create() completed');
        
        // Make this scene instance accessible for debugging
        if (typeof window !== 'undefined') {
            window.gameScene = this;
            window.NPCPlayer = NPCPlayer; // Make NPCPlayer class available for debugging
            console.log('🔧 GameScene available globally as window.gameScene');
            console.log('🔧 Run gameScene.debugRoadLayout() to debug roads');
            console.log('🔧 Run gameScene.enableSeamlessTerrain() to fix ALL terrain gaps');
            console.log('🔧 Run gameScene.enableSeamlessRoads() to fix road gaps only');
            console.log('');
            console.log('🤖 NPC DEBUG CONTROLS:');
            console.log('🔧 To enable debug for all NPCs: NPCPlayer.toggleAllDebug(gameScene, true)');
            console.log('🔧 To disable debug for all NPCs: NPCPlayer.toggleAllDebug(gameScene, false)');
            console.log('🔧 To debug individual NPC: gameScene.squadMembers.children.entries[0].enableDebug()');
            console.log('🔧 Available NPCs: Charlie, Delta, Alpha, Bravo');
        }
        
        // Create inventory hotbar (Minecraft style)
        this.createInventoryHotbar();
        
        // Initialize placement preview if player starts with a placeable item
        this.handleEquipmentChange();
        
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
        
        // SIMPLE TEST: Try to create one basic brown rectangle as a sandbag
        console.log('🧪 TESTING: Creating simple test sandbag...');
        try {
            const testSandbag = this.add.rectangle(950, 700, 48, 32, 0xC2B280); // Brown rectangle
            testSandbag.setDepth(700);
            console.log('✅ TEST: Simple sandbag rectangle created successfully at (950, 700)');
        } catch (testError) {
            console.error('❌ TEST: Failed to create simple sandbag rectangle:', testError);
        }
        
        // NOTE: Sandbag creation moved to end of create() method after all systems are ready
        
        console.log('✅ Helicopter beacon and label have been removed');
        console.log('🚁 Smoke effects added to main helicopter only');
        console.log('🛡️ Defensive sandbags will be added after all systems are ready');
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
                let rotation = 0; // Track rotation for directional tiles
                
                // Crash site area (center of map)
                if (x >= 800 && x <= 1200 && y >= 600 && y <= 900) {
                    terrainType = 'sand_texture';
                }
                // Urban areas with concrete
                else if (x >= 256 && x <= 640 && y >= 448 && y <= 768) {
                    terrainType = 'crackled_concrete';
                }
                // Main roads - improved alignment and rotation
                else if (x >= 288 && x <= 416 && y >= 544 && y <= 672) {
                    // Intersection area - use no rotation for consistency
                    terrainType = 'dirt_road';
                    rotation = 0; // No rotation for intersection
                }
                else if (x >= 288 && x <= 416 && y >= 0 && y <= worldHeight) {
                    // Main vertical road - NO rotation so lines run vertically
                    terrainType = 'dirt_road';
                    rotation = 0; // No rotation for vertical lines
                }
                else if (x >= 0 && x <= worldWidth && y >= 544 && y <= 672) {
                    // Main horizontal road - rotate 90 degrees so lines run horizontally
                    terrainType = 'dirt_road';
                    rotation = Math.PI / 2; // 90 degrees for horizontal lines
                }
                // Random rubble patches (reduced for clarity)
                else if (Math.random() < 0.01) { // 1% chance – almost none
                    terrainType = 'rubble';
                }
                
                // Check if texture exists, fallback to simple colored rectangle
                let tile;
                if (this.textures.exists(terrainType)) {
                    tile = this.add.image(x + tileSize/2, y + tileSize/2, terrainType);
                    
                    // Apply rotation for directional tiles (like vertical roads)
                    if (rotation !== 0) {
                        tile.setRotation(rotation);
                    }
                    
                    // Debug specific terrain types
                    if (terrainType === 'dirt_road') {
                        const direction = rotation === 0 ? 'vertical' : 'horizontal';
                    }
                    if (terrainType === 'sand_texture') {
                    }
                    
                    // Handle sprite sizing - ALL terrain sprites need to be larger to eliminate gaps
                    // Most sprite files have transparent borders, so we oversize them to ensure seamless tiling
                    const oversizeMultiplier = 1.25; // 25% larger to cover transparent borders
                    tile.setDisplaySize(tileSize * oversizeMultiplier, tileSize * oversizeMultiplier);
                    
                    if (terrainType === 'dirt_road') {
                    } else {
                    }
                    
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
                        tile.setData('direction', rotation === 0 ? 'vertical' : 'horizontal');
                    }
                } else {
                    console.warn(`Texture ${terrainType} not found, using fallback`);
                    
                    // Debug specific failures
                    if (terrainType === 'dirt_road') {

                    }
                    if (terrainType === 'sand_texture') {
    
                    }
                    
                    // Create fallback colored rectangles
                    let color = 0xF4E4BC; // Default sand color
                    if (terrainType === 'rubble') color = 0x8B7355; // Brown rubble
                    else if (terrainType === 'crackled_concrete') color = 0xB0B0B0; // Gray concrete
                    else if (terrainType === 'dirt_road') color = 0xA0956F; // Dusty brown
                    else if (terrainType === 'sand_texture') color = 0xF4A460; // Sandy brown
                    
                    tile = this.add.rectangle(x + tileSize/2, y + tileSize/2, tileSize, tileSize, color);
                }
                tile.setDepth(-10);
            }
        }
        
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
                
                // Make helicopter larger - apply additional scaling
                const additionalScale = 1.5; // 50% larger than normal
                helicopter.setScale(helicopter.scaleX * additionalScale, helicopter.scaleY * additionalScale);
                console.log('🚁 AFTER additional scaling - Final display size:', helicopter.displayWidth, 'x', helicopter.displayHeight);
                
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
            
            // SIMPLE TEST: Try to create one basic brown rectangle as a sandbag
            console.log('🧪 TESTING: Creating simple test sandbag...');
            try {
                const testSandbag = this.add.rectangle(950, 700, 48, 32, 0xC2B280); // Brown rectangle
                testSandbag.setDepth(700);
                console.log('✅ TEST: Simple sandbag rectangle created successfully at (950, 700)');
            } catch (testError) {
                console.error('❌ TEST: Failed to create simple sandbag rectangle:', testError);
            }
            
            // Add defensive sandbags around the crash site
            // console.log('🛡️ ABOUT TO CREATE SANDBAGS - calling createCrashSiteSandbags()...');
            // this.createCrashSiteSandbags();
            // console.log('🛡️ FINISHED CALLING createCrashSiteSandbags()');
            // NOTE: Sandbag creation moved to end of create() method after all systems are ready
            
            console.log('✅ Helicopter beacon and label have been removed');
            console.log('🚁 Smoke effects added to main helicopter only');
            console.log('🛡️ Defensive sandbags will be added after all systems are ready');
            
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
    
    createCrashSiteSandbags() {
        console.log('Creating defensive sandbags around crash site...');
        
        // Early safety check: ensure all required systems are ready
        if (!this.textures || !this.physics || !this.player || !this.squadMembers || !this.zombies || !this.bullets) {
            console.error('❌ Required game systems not ready for sandbag creation, skipping sandbags');
            console.error('❌ Missing systems:', {
                textures: !!this.textures,
                physics: !!this.physics,
                player: !!this.player,
                squadMembers: !!this.squadMembers,
                zombies: !!this.zombies,
                bullets: !!this.bullets
            });
            return;
        }
        
        console.log('✅ All required systems are ready for sandbag creation');
        
        // Check if sandbag texture exists before proceeding
        if (!this.textures.exists('sandbags')) {
            console.error('❌ Sandbag texture not found, skipping sandbag creation');
            console.error('❌ Available textures containing "sand":', Object.keys(this.textures.list).filter(key => key.includes('sand')));
            console.error('❌ All available textures:', Object.keys(this.textures.list).slice(0, 10)); // Show first 10 textures
            return;
        }
        
        console.log('✅ Sandbag texture found, proceeding with creation');
        
        try {
            // Helicopter is at (1000, 750), rubble area is roughly 800-1200 x 600-900
            // Create sandbag perimeter around the crash site with strategic entrances
            const sandbagSpacing = 64; // Distance between sandbag groups
            const helicopterX = 1000;
            const helicopterY = 750;
            
            // Northern perimeter (leaving gaps for entrances)
            const northernSandbags = [
                {x: helicopterX - 200, y: helicopterY - 180}, // Left side
                {x: helicopterX - 136, y: helicopterY - 180},
                {x: helicopterX - 72, y: helicopterY - 180},
                // Gap for entrance (from x-72 to x+72)
                {x: helicopterX + 72, y: helicopterY - 180}, // Right side
                {x: helicopterX + 136, y: helicopterY - 180},
                {x: helicopterX + 200, y: helicopterY - 180}
            ];
            
            // Southern perimeter (with two smaller entrances)
            const southernSandbags = [
                {x: helicopterX - 200, y: helicopterY + 180}, // Left side
                {x: helicopterX - 136, y: helicopterY + 180},
                // Small gap for entrance
                {x: helicopterX - 40, y: helicopterY + 180}, // Center-left
                {x: helicopterX + 24, y: helicopterY + 180}, // Center-right
                // Small gap for entrance
                {x: helicopterX + 136, y: helicopterY + 180}, // Right side
                {x: helicopterX + 200, y: helicopterY + 180}
            ];
            
            // Western perimeter (with one entrance)
            const westernSandbags = [
                {x: helicopterX - 250, y: helicopterY - 120}, // Top
                {x: helicopterX - 250, y: helicopterY - 60},
                // Gap for entrance
                {x: helicopterX - 250, y: helicopterY + 60}, // Bottom
                {x: helicopterX - 250, y: helicopterY + 120}
            ];
            
            // Eastern perimeter (with one entrance)  
            const easternSandbags = [
                {x: helicopterX + 250, y: helicopterY - 120}, // Top
                {x: helicopterX + 250, y: helicopterY - 60},
                // Gap for entrance
                {x: helicopterX + 250, y: helicopterY + 60}, // Bottom
                {x: helicopterX + 250, y: helicopterY + 120}
            ];
            
            // Additional corner reinforcements and fill-in sandbags
            const additionalSandbags = [
                // Northwest corner reinforcement
                {x: helicopterX - 225, y: helicopterY - 150},
                {x: helicopterX - 175, y: helicopterY - 205},
                
                // Northeast corner reinforcement
                {x: helicopterX + 225, y: helicopterY - 150},
                {x: helicopterX + 175, y: helicopterY - 205},
                
                // Southwest corner reinforcement
                {x: helicopterX - 225, y: helicopterY + 150},
                {x: helicopterX - 175, y: helicopterY + 205},
                
                // Southeast corner reinforcement
                {x: helicopterX + 225, y: helicopterY + 150},
                {x: helicopterX + 175, y: helicopterY + 205},
                
                // Fill some gaps in the northern perimeter (partial)
                {x: helicopterX - 36, y: helicopterY - 180}, // Narrow the main entrance slightly
                {x: helicopterX + 36, y: helicopterY - 180},
                
                // Add some inner defensive positions
                {x: helicopterX - 150, y: helicopterY - 100}, // Inner left
                {x: helicopterX + 150, y: helicopterY - 100}, // Inner right
                {x: helicopterX - 150, y: helicopterY + 100}, // Inner left back
                {x: helicopterX + 150, y: helicopterY + 100}, // Inner right back
                
                // Forward outposts
                {x: helicopterX - 80, y: helicopterY - 220}, // Forward left
                {x: helicopterX + 80, y: helicopterY - 220}, // Forward right
            ];
            
            // Combine all sandbag positions
            const allSandbagPositions = [
                ...northernSandbags,
                ...southernSandbags, 
                ...westernSandbags,
                ...easternSandbags,
                ...additionalSandbags
            ];
            
            // Create sandbag structures
            console.log(`🛡️ Attempting to create ${allSandbagPositions.length} sandbags...`);
            let successfulSandbags = 0;
            
            allSandbagPositions.forEach((pos, index) => {
                try {
                    console.log(`🛡️ Creating sandbag ${index + 1}/${allSandbagPositions.length} at (${pos.x}, ${pos.y})`);
                    const sandbag = new Sandbag(this, pos.x, pos.y);
                    
                    console.log(`🛡️ Sandbag constructor returned:`, {
                        exists: !!sandbag,
                        active: sandbag ? sandbag.active : 'N/A',
                        isActive: sandbag ? sandbag.isActive : 'N/A',
                        hasBody: sandbag ? !!sandbag.body : 'N/A',
                        hasValidX: sandbag ? (!isNaN(sandbag.x) && sandbag.x !== undefined) : 'N/A',
                        hasValidY: sandbag ? (!isNaN(sandbag.y) && sandbag.y !== undefined) : 'N/A',
                        x: sandbag ? sandbag.x : 'N/A',
                        y: sandbag ? sandbag.y : 'N/A'
                    });
                    
                    // Check if sandbag creation was successful AND has all required properties
                    // Make this check less restrictive - just check the essential properties
                    if (!sandbag || !sandbag.active || !sandbag.isActive) {
                        console.error('❌ Sandbag creation failed basic validation at', pos.x, pos.y);
                        return;
                    }
                    
                    // Secondary check for physics body - but don't fail completely if missing
                    if (!sandbag.body) {
                        console.warn('⚠️ Sandbag has no physics body at', pos.x, pos.y, '- will skip colliders but keep sandbag');
                    }
                    
                    console.log('🛡️ Sandbag passed validation, adding to list...');
                    
                    // Add to sandbags list for updates
                    if (!this.sandbagsList) {
                        this.sandbagsList = [];
                    }
                    this.sandbagsList.push(sandbag);
                    successfulSandbags++;
                    
                    // Set up solid collisions for this sandbag (blocks movement) - only if has body
                    if (sandbag.body) {
                        try {
                            console.log('🛡️ Setting up colliders for sandbag...');
                            
                            // Set up colliders with additional safety wrapping
                            this.physics.add.collider(this.player, sandbag, (player, sandbagObj) => {
                                if (player && sandbagObj && player.active && sandbagObj.active) {
                                }
                            });
                            
                            this.physics.add.collider(this.squadMembers, sandbag, (unit, sandbagObj) => {
                                if (unit && sandbagObj && unit.active && sandbagObj.active) {
                                }
                            });
                            
                            this.physics.add.collider(this.zombies, sandbag, (zombie, sandbagObj) => {
                                if (zombie && sandbagObj && zombie.active && sandbagObj.active) {
                                }
                            });
                            
                            // Add friendly fire protection for this sandbag (bullets pass through)
                            this.physics.add.overlap(this.bullets, sandbag, this.bulletHitSandbagFriendly, null, this);
                            
                            console.log('✅ Colliders set up successfully for sandbag');
                            
                        } catch (colliderError) {
                            console.error('❌ Error setting up sandbag colliders (keeping sandbag anyway):', colliderError);
                            // Don't remove sandbag from list - just skip colliders
                        }
                    } else {
                        console.log('🛡️ Skipping collider setup for sandbag without physics body');
                    }
                    
                    console.log(`✅ Sandbag ${index + 1} placed successfully at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
                    
                } catch (sandbagError) {
                    console.error(`❌ Critical error creating sandbag ${index + 1} at`, pos.x, pos.y, ':', sandbagError);
                    // Continue with next sandbag instead of breaking the loop
                }
            });
            
            console.log(`🛡️ Sandbag creation complete: ${successfulSandbags}/${allSandbagPositions.length} successful`);
            
            if (successfulSandbags === 0) {
                console.error('❌ No sandbags were created successfully! Check the Sandbag class constructor.');
            } else {
                console.log(`✅ Created ${successfulSandbags} sandbags around crash site with multiple entrances`);
                console.log('🛡️ Enhanced sandbag perimeter established with:');
                console.log('   - Main northern entrance (narrowed but still accessible)');
                console.log('   - Two southern entrances (96px each)');
                console.log('   - Western entrance (120px wide)');
                console.log('   - Eastern entrance (120px wide)');
                console.log('   - Corner reinforcements for better coverage');
                console.log('   - Inner defensive positions for layered defense');
                console.log('   - Forward outposts for early warning');
            }
            
        } catch (error) {
            console.error('Error creating crash site sandbags:', error);
            console.error('❌ Falling back to no sandbags due to critical error');
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
        // Update all entities
        if (this.player && this.player.update) {
            this.player.update(time, delta);
            
            // Update main player name tag position if it exists
            if (this.player.nameTag) {
                this.player.nameTag.x = this.player.x;
                this.player.nameTag.y = this.player.y - 40;
            }
        }
        
        // Handle input
        this.handleInput();
        
        // Handle zombie spawning
        this.handleZombieSpawning(time, delta);
        
        // Check wave completion
        this.checkWaveCompletion();
        
        // Update depth sorting for proper layering
        this.updateDepthSorting();
        
        // Update sentry guns
        if (this.sentryGunsList) {
            // Update active sentry guns and remove destroyed ones
            this.sentryGunsList = this.sentryGunsList.filter(sentryGun => {
                if (sentryGun && sentryGun.active) {
                    sentryGun.update(time, delta);
                    
                    // Manual collision checking for damage (overlap-based)
                    this.checkSentryGunDamageCollisions(sentryGun);
                    
                    return true; // Keep in list
                } else {
                    return false; // Remove from list
                }
            });
        }
        
        // Update barricades
        if (this.barricadesList) {
            // Update active barricades and remove destroyed ones
            this.barricadesList = this.barricadesList.filter(barricade => {
                if (barricade && barricade.active && barricade.isActive) {
                    barricade.update(time, delta);
                    
                    // Manual collision checking for damage (overlap-based)
                    this.checkBarricadeDamageCollisions(barricade);
                    
                    return true; // Keep in list
                } else {
                    // Barricade was destroyed - remove from list
                    if (barricade) {
                        console.log('🛡️ Removing destroyed barricade from barricadesList');
                    }
                    return false; // Remove from list
                }
            });
        }
        
        // Update sandbags
        if (this.sandbagsList) {
            // Update active sandbags and remove destroyed ones
            this.sandbagsList = this.sandbagsList.filter(sandbag => {
                // Safety check: ensure sandbag is a valid object
                if (!sandbag || typeof sandbag !== 'object') {
                    console.warn('🛡️ Removing invalid sandbag object from sandbagsList');
                    return false; // Remove invalid objects
                }
                
                if (sandbag && sandbag.active && sandbag.isActive) {
                    try {
                        sandbag.update(time, delta);
                        
                        // Manual collision checking for damage (overlap-based)
                        this.checkSandbagDamageCollisions(sandbag);
                        
                        return true; // Keep in list
                    } catch (updateError) {
                        console.error('❌ Error updating sandbag:', updateError);
                        // Remove problematic sandbag from list
                        if (sandbag && sandbag.destroy) {
                            try {
                                sandbag.destroy();
                            } catch (destroyError) {
                                console.error('❌ Error destroying problematic sandbag:', destroyError);
                            }
                        }
                        return false; // Remove from list
                    }
                } else {
                    // Sandbag was destroyed - remove from list
                    if (sandbag) {
                        console.log('🛡️ Removing destroyed sandbag from sandbagsList');
                    }
                    return false; // Remove from list
                }
            });
        }
        
        // Update inventory hotbar
        this.updateInventoryHotbar();
        
        // === PLACEMENT PREVIEW UPDATES ===
        // Update placement preview if showing
        if (this.isShowingPreview && time - this.lastPreviewUpdate > this.previewUpdateInterval) {
            this.updatePlacementPreview();
            this.lastPreviewUpdate = time;
        }
        
        // Clean up effects
        this.cleanupEffects();
        
        // Update debug text
        this.updateDebugText();
        
        // Update squad status in HTML UI
        this.updateHTMLSquadStatus();
        
        // === SQUAD COMMAND CLEANUP ===
        // Clean up ping target if zombie dies
        if (this.pingTarget && (!this.pingTarget.active || this.pingTarget.health <= 0)) {
            console.log('🎯 Ping target destroyed, clearing ping');
            this.clearPing();
        }
        
        // Update ping marker position if following a moving target
        if (this.pingTarget && this.pingTarget.active && this.pingMarker) {
            this.pingMarker.x = this.pingTarget.x;
            this.pingMarker.y = this.pingTarget.y;
        }
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
            
            // Set direction based on movement - support 8 directions including diagonals
            if (velocityX > 0 && velocityY < 0) {
                newDirection = 'up-right';
            } else if (velocityX > 0 && velocityY > 0) {
                newDirection = 'down-right';
            } else if (velocityX < 0 && velocityY < 0) {
                newDirection = 'up-left';
            } else if (velocityX < 0 && velocityY > 0) {
                newDirection = 'down-left';
            } else if (velocityX > 0) {
                newDirection = 'right';
            } else if (velocityX < 0) {
                newDirection = 'left';
            } else if (velocityY < 0) {
                newDirection = 'up';
            } else if (velocityY > 0) {
                newDirection = 'down';
            }
            player.setDirection(newDirection);
        } else {
            player.setMoving(false);
        }
        
        // Enhanced shooting debug
        if (this.wasd.SPACE.isDown) {
            this.handleSpaceKey();
        }
        
        // Number keys for equipment slot switching
        // Try individual key checks to ensure they work
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('ONE'))) {
            console.log('Key 1 pressed');
            this.player.switchToSlot(1);
            this.handleEquipmentChange(); // Update placement preview
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('TWO'))) {
            console.log('Key 2 pressed');
            this.player.switchToSlot(2);
            this.handleEquipmentChange(); // Update placement preview
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('THREE'))) {
            console.log('Key 3 pressed');
            this.player.switchToSlot(3);
            this.handleEquipmentChange(); // Update placement preview
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('FOUR'))) {
            console.log('Key 4 pressed');
            this.player.switchToSlot(4);
            this.handleEquipmentChange(); // Update placement preview
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('FIVE'))) {
            console.log('Key 5 pressed');
            this.player.switchToSlot(5);
            this.handleEquipmentChange(); // Update placement preview
        }
        
        // Reloading (only works for weapons)
        if (Phaser.Input.Keyboard.JustDown(this.wasd.R)) {
            const equipment = this.player.getCurrentSlotEquipment();
            if (equipment && equipment.type === 'weapon') {
                this.player.reload();
            }
        }
        
        // Structure interaction (for future features like entering buildings)
        if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
            // Future: Add interaction with crash site structures
            // Could include searching wreckage, entering buildings, etc.
        }
        
        // Remove F key sentry gun placement - now handled by SPACE with slot 2
        
        // === SQUAD COMMANDS ===
        // Q key - Hold to show command wheel
        const qKey = this.input.keyboard.addKey('Q');
        if (qKey.isDown && !this.qKeyWasDown) {
            // Q just pressed - show command wheel
            if (this.player && this.player.active && this.squadMembers && this.squadMembers.children.size > 0) {
                try {
                    this.showCommandWheel();
                } catch (error) {
                    console.warn('Error showing command wheel:', error);
                }
            }
        } else if (!qKey.isDown && this.qKeyWasDown) {
            // Q just released - hide command wheel
            if (this.commandWheel) {
                this.hideCommandWheel();
            }
        }
        
        // Track Q key state
        this.qKeyWasDown = qKey.isDown;
    }
    
    handleSpaceKey() {
        const equipment = this.player.getCurrentSlotEquipment();
        if (!equipment) return;
        
        if (equipment.type === 'weapon') {
            this.player.shoot();
        } else if (equipment.type === 'placeable') {
            // Handle placement (e.g., sentry gun, barricade)
            if (equipment.id === 'sentryGun') {
                this.placeSentryGun();
            } else if (equipment.id === 'barricade') {
                this.placeBarricade();
            }
        }
    }
    
    placeSentryGun() {
        // Check if player has sentry gun in current slot
        const equipment = this.player.getCurrentSlotEquipment();
        if (!equipment || equipment.type !== 'placeable' || equipment.id !== 'sentryGun' || equipment.count <= 0) {
            console.log('No sentry gun available in current slot');
            return;
        }
        
        // Calculate placement position using shared method
        const { placeX, placeY } = this.calculatePlacementPosition();
        
        // Check if placement location is valid using shared method
        const validPlacement = this.isPlacementValid(placeX, placeY, 'sentryGun');
        
        if (!validPlacement) {
            console.log('Cannot place sentry gun here - too close to other objects');
            // Show visual feedback for invalid placement
            const invalidMarker = this.add.circle(placeX, placeY, 30, 0xFF0000, 0.5);
            invalidMarker.setDepth(1500);
            this.tweens.add({
                targets: invalidMarker,
                alpha: 0,
                duration: 1000,
                onComplete: () => invalidMarker.destroy()
            });
            return;
        }
        
        // Hide placement preview before creating actual item
        this.destroyPlacementPreview();
        
        // Create sentry gun
        const sentryGun = new SentryGun(this, placeX, placeY);
        // Don't add to group manually - just store reference for updates
        if (!this.sentryGunsList) {
            this.sentryGunsList = [];
        }
        this.sentryGunsList.push(sentryGun);
        
        // Set up solid collisions for this sentry gun (blocks movement)
        this.physics.add.collider(this.player, sentryGun, (player, sentry) => {

        });
        this.physics.add.collider(this.squadMembers, sentryGun, (unit, sentry) => {
        });
        this.physics.add.collider(this.zombies, sentryGun, (zombie, sentry) => {
        });
        
        // Add friendly fire protection for this sentry gun (same as squad members)
        this.physics.add.overlap(this.bullets, sentryGun, this.bulletHitSentryGunFriendly, null, this);
        
        console.log('🛡️ Friendly fire protection enabled for sentry gun');
        
        // Debug: Verify collider setup
        console.log(`🎯 Sentry gun colliders set up:`, {
            playerCollider: !!this.physics.world.colliders._active.find(c => 
                (c.object1 === this.player && c.object2 === sentryGun) || 
                (c.object2 === this.player && c.object1 === sentryGun)
            ),
            sentryGunBody: {
                isStatic: sentryGun.body.isStatic,
                moves: sentryGun.body.moves,
                enable: sentryGun.body.enable,
                immovable: sentryGun.body.immovable
            },
            playerBody: {
                enable: this.player.body.enable,
                velocity: { x: this.player.body.velocity.x, y: this.player.body.velocity.y }
            }
        });
        
        // Use item from equipment
        this.player.usePlaceableItem();
        
        // Check if we should show preview again (if player still has more items)
        this.handleEquipmentChange();
        
        // Visual feedback for successful placement
        // Visual feedback for successful placement
        const successMarker = this.add.circle(placeX, placeY, 35, 0x00FF00, 0.5);
        successMarker.setDepth(1500);
        this.tweens.add({
            targets: successMarker,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 1000,
            onComplete: () => successMarker.destroy()
        });
        
        console.log(`Sentry gun placed at (${placeX.toFixed(0)}, ${placeY.toFixed(0)})`);
    }
    
    placeBarricade() {
        try {
            console.log('🛡️ === BARRICADE PLACEMENT DEBUG START ===');
            console.log('🛡️ Attempting to place barricade...');
            
            // Check if player has barricade in current slot
            const equipment = this.player.getCurrentSlotEquipment();
            console.log('🛡️ Equipment check:', {
                equipment: equipment,
                type: equipment ? equipment.type : 'none',
                id: equipment ? equipment.id : 'none',
                count: equipment ? equipment.count : 'none'
            });
            
            if (!equipment || equipment.type !== 'placeable' || equipment.id !== 'barricade' || equipment.count <= 0) {
                console.log('🛡️ No barricade available in current slot');
                return;
            }
            
            console.log('🛡️ Barricade equipment check passed');
            
            // Calculate placement position using shared method
            const { placeX, placeY } = this.calculatePlacementPosition();
            
            console.log(`🛡️ Calculated placement position: ${placeX.toFixed(1)}, ${placeY.toFixed(1)}`);
            
            // Check if placement location is valid using shared method
            const validPlacement = this.isPlacementValid(placeX, placeY, 'barricade');
            
            if (!validPlacement) {
                console.log('Cannot place barricade here - too close to other objects');
                // Show visual feedback for invalid placement
                const invalidMarker = this.add.circle(placeX, placeY, 30, 0xFF0000, 0.5);
                invalidMarker.setDepth(1500);
                this.tweens.add({
                    targets: invalidMarker,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => invalidMarker.destroy()
                });
                return;
            }
            
            console.log('🛡️ Placement validation passed, creating barricade...');
            
            // Hide placement preview before creating actual item
            console.log('🛡️ Preview state before destroy:', {
                isShowingPreview: this.isShowingPreview,
                currentPreviewType: this.currentPreviewType,
                previewExists: !!this.placementPreview
            });
            this.destroyPlacementPreview();
            console.log('🛡️ Preview destroyed, state now:', {
                isShowingPreview: this.isShowingPreview,
                currentPreviewType: this.currentPreviewType,
                previewExists: !!this.placementPreview
            });
            
            // Create barricade
            const barricade = new Barricade(this, placeX, placeY);
            
            // Check if barricade creation was successful
            if (!barricade || !barricade.active) {
                console.error('❌ Failed to create barricade');
                return;
            }
            
            console.log('🛡️ Barricade created, setting up physics and colliders...');
            
            // Don't add to group manually - just store reference for updates
            if (!this.barricadesList) {
                this.barricadesList = [];
            }
            this.barricadesList.push(barricade);
            
            // Set up solid collisions for this barricade (blocks movement)
            try {
                this.physics.add.collider(this.player, barricade, (player, barricade) => {
                });
                
                this.physics.add.collider(this.squadMembers, barricade, (unit, barricade) => {
                });
                
                this.physics.add.collider(this.zombies, barricade, (zombie, barricade) => {
                });
                
                // Add friendly fire protection for this barricade (same as squad members)
                this.physics.add.overlap(this.bullets, barricade, this.bulletHitBarricadeFriendly, null, this);
                
                console.log('✅ Colliders set up successfully');
                
            } catch (colliderError) {
                console.error('❌ Error setting up colliders:', colliderError);
                // Continue anyway - the barricade might still work without some colliders
            }
            
            // Use item from equipment
            console.log('🛡️ Equipment before usePlaceableItem:', {
                count: equipment.count,
                type: equipment.type,
                id: equipment.id
            });
            this.player.usePlaceableItem();
            
            // Check equipment after using item
            const equipmentAfter = this.player.getCurrentSlotEquipment();
            console.log('🛡️ Equipment after usePlaceableItem:', {
                equipment: equipmentAfter,
                count: equipmentAfter ? equipmentAfter.count : 'none',
                type: equipmentAfter ? equipmentAfter.type : 'none',
                id: equipmentAfter ? equipmentAfter.id : 'none'
            });
            
            // Check if we should show preview again (if player still has more items)
            console.log('🛡️ About to call handleEquipmentChange...');
            this.handleEquipmentChange();
            console.log('🛡️ handleEquipmentChange called, preview state now:', {
                isShowingPreview: this.isShowingPreview,
                currentPreviewType: this.currentPreviewType,
                previewExists: !!this.placementPreview
            });
            
            // Visual feedback for successful placement
            const successMarker = this.add.circle(placeX, placeY, 35, 0x00FF00, 0.5);
            successMarker.setDepth(1500);
            this.tweens.add({
                targets: successMarker,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 1000,
                onComplete: () => successMarker.destroy()
            });
            
            console.log(`✅ Barricade placed successfully at (${placeX.toFixed(0)}, ${placeY.toFixed(0)})`);
            console.log('🛡️ === BARRICADE PLACEMENT DEBUG END ===');
            
        } catch (error) {
            console.error('❌ Critical error in placeBarricade:', error);
            console.error('Stack trace:', error.stack);
            console.log('🛡️ === BARRICADE PLACEMENT DEBUG END (ERROR) ===');
        }
    }
    
    handleZombieSpawning(time, delta) {
        if (!this.isWaveActive) {
            return;
        }
        
        this.zombieSpawnTimer += delta;
        
        if (this.zombiesSpawned < this.zombiesInWave && this.zombieSpawnTimer > 500) { // Changed from 2000 to 500 for faster spawning
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
        
        
        const zombie = new Zombie(this, spawnX, spawnY);
        this.zombies.add(zombie);
        
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
        
        // Apply bullet knockback using zombie's new knockback system
        if (bullet.body && zombie.body && zombie.applyKnockback) {
            // Use bullet position as source of knockback with more realistic force
            zombie.applyKnockback(bullet.x, bullet.y, 108, 400); // Reduced knockback force by 40% (was 180)
        }
        
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
        // Skip sandbags - they have friendly fire protection and bullets pass through
        if (structure.structureType === 'sandbags') {
            return; // Let bulletHitStructureFriendly handle sandbags
        }
        
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
    
    bulletHitFriendly(bullet, unit) {
        // Safety check: ensure bullet is valid and has the deactivate method
        if (!bullet || !bullet.active || typeof bullet.deactivate !== 'function') {
            return; // Skip processing invalid bullets
        }
        
        // Friendly fire prevention - bullets pass through friendly units harmlessly
        console.log('🛡️ Friendly fire prevented:', {
            bulletPos: { x: bullet.x.toFixed(2), y: bullet.y.toFixed(2) },
            friendlyName: unit.squadConfig?.name || 'LEADER',
            friendlyPos: { x: unit.x.toFixed(2), y: unit.y.toFixed(2) }
        });
        
        // Create a subtle shield effect to show friendly fire prevention
        const shieldEffect = this.add.circle(unit.x, unit.y, 20, 0x00BFFF, 0.3);
        shieldEffect.setDepth(unit.depth + 1);
        
        this.tweens.add({
            targets: shieldEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => shieldEffect.destroy()
        });
        
        // DO NOT deactivate bullet - let it pass through friendly unit
        // bullet.deactivate(); // REMOVED - this was causing bullets to disappear
        
        console.log('💫 Bullet passed through friendly unit and continues traveling');
    }
    
    bulletHitStructureFriendly(bullet, structure) {
        // Safety check: ensure bullet is valid and has the deactivate method
        if (!bullet || !bullet.active || typeof bullet.deactivate !== 'function') {
            return; // Skip processing invalid bullets
        }
        
        // Only apply friendly fire protection to sandbags - other structures should still stop bullets
        if (structure.structureType !== 'sandbags') {
            // Let other collision handlers deal with non-sandbag structures
            return;
        }
        
        // Sandbag friendly fire prevention - bullets pass through sandbags harmlessly
        console.log('🛡️ Sandbag friendly fire prevented:', {
            bulletPos: { x: bullet.x.toFixed(2), y: bullet.y.toFixed(2) },
            sandbagPos: { x: structure.x.toFixed(2), y: structure.y.toFixed(2) }
        });
        
        // Create small smoke effects when bullet hits sandbag (like dust impact)
        const smokeCount = 3; // Multiple small puffs
        
        for (let i = 0; i < smokeCount; i++) {
            // Random offset around the impact point
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 15;
            
            let puff;
            
            if (this.textures.exists('smoke_puff')) {
                puff = this.add.image(structure.x + offsetX, structure.y + offsetY, 'smoke_puff');
                puff.setScale(0.025); // Very small smoke puffs
            } else {
                // Simple fallback - tiny gray circle
                puff = this.add.circle(structure.x + offsetX, structure.y + offsetY, 1.5, 0x8B7355); // Dusty brown color
            }
            
            puff.setDepth(structure.depth + 50);
            puff.setAlpha(0.05);
            
            // Small upward drift with random spread
            this.tweens.add({
                targets: puff,
                y: puff.y - Phaser.Math.Between(8, 15), // Small upward movement
                x: puff.x + Phaser.Math.Between(-8, 8), // Random horizontal drift
                scaleX: (puff.scaleX || 1) * 1.5, // Small expansion
                scaleY: (puff.scaleY || 1) * 1.5, // Small expansion
                alpha: 0,
                duration: Phaser.Math.Between(800, 1200), // Varying duration
                ease: 'Linear',
                onComplete: () => puff.destroy()
            });
        }
        
        // DO NOT deactivate bullet - let it pass through sandbag
        // bullet.deactivate(); // REMOVED - this was causing bullets to disappear
        
        console.log('💫 Bullet passed through sandbag and continues traveling');
    }
    
    // Line-of-sight checking for NPCs to prevent friendly fire
    checkLineOfSight(shooter, target) {
        if (!shooter || !target || !shooter.active || !target.active) {
            return false; // Invalid units
        }
        
        // Calculate the shooting line from shooter to target
        const shooterX = shooter.x;
        const shooterY = shooter.y;
        const targetX = target.x;
        const targetY = target.y;
        
        // Check if any friendly units are in the line of fire
        const friendlyUnits = [];
        
        // Add main player to check list
        if (this.player && this.player.active && this.player !== shooter) {
            friendlyUnits.push(this.player);
        }
        
        // Add all squad members to check list (except the shooter)
        if (this.squadMembers) {
            this.squadMembers.children.entries.forEach(squadMember => {
                if (squadMember && squadMember.active && squadMember !== shooter) {
                    friendlyUnits.push(squadMember);
                }
            });
        }
        
        // Check for solid structures that block bullets (excluding sandbags which bullets pass through)
        if (this.structures) {
            this.structures.children.entries.forEach(structure => {
                if (structure && structure.active && structure.structureType !== 'sandbags') {
                    // Only check large structures that actually block bullets
                    if (structure.structureType === 'crashed_helicopter' || 
                        structure.structureType === 'concrete_building' ||
                        structure.structureType === 'damaged_building') {
                        
                        const distanceToLine = this.pointToLineDistance(
                            structure.x, structure.y,
                            shooterX, shooterY,
                            targetX, targetY
                        );
                        
                        // Large structures block shots if close to line of fire
                        if (distanceToLine < 60) { // Large blocking radius for buildings
                            const structureDistanceFromShooter = Phaser.Math.Distance.Between(
                                shooterX, shooterY, structure.x, structure.y
                            );
                            const targetDistanceFromShooter = Phaser.Math.Distance.Between(
                                shooterX, shooterY, targetX, targetY
                            );
                            
                            // Only block if structure is between shooter and target
                            if (structureDistanceFromShooter < targetDistanceFromShooter) {
                                return false; // Line of sight blocked by structure
                            }
                        }
                    }
                }
            });
        }
        
        // Check each friendly unit for line-of-sight obstruction
        for (const friendly of friendlyUnits) {
            const distanceToLine = this.pointToLineDistance(
                friendly.x, friendly.y,
                shooterX, shooterY,
                targetX, targetY
            );
            
            // If friendly unit is too close to the line of fire (within 30 pixels)
            // and is between shooter and target, block the shot
            if (distanceToLine < 30) {
                const friendlyDistanceFromShooter = Phaser.Math.Distance.Between(
                    shooterX, shooterY, friendly.x, friendly.y
                );
                const targetDistanceFromShooter = Phaser.Math.Distance.Between(
                    shooterX, shooterY, targetX, targetY
                );
                
                // Only block if friendly is between shooter and target
                if (friendlyDistanceFromShooter < targetDistanceFromShooter) {
                    return false; // Line of sight blocked
                }
            }
        }
        
        return true; // Clear line of sight
    }
    
    // Calculate distance from a point to a line (for line-of-sight checking)
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        const param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
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
        
        // Set zombies per wave - first wave has 25, then increases from there
        if (window.gameState.wave === 1) {
            this.zombiesInWave = 25; // Intense first wave
        } else {
            this.zombiesInWave = 25 + (window.gameState.wave - 1) * 3; // Increase by 3 each wave after first
        }
        
        this.zombiesSpawned = 0;
        this.isWaveActive = true;
        
        
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
        
        // Clean up any orphaned command wheel elements
        this.cleanupCommandSystem();
    }
    
    cleanupCommandSystem() {
        // Safely clean up command wheel elements if they're inactive
        if (this.commandWheelElements) {
            this.commandWheelElements = this.commandWheelElements.filter(element => {
                if (element && !element.active) {
                    return false; // Remove from array
                }
                return true; // Keep in array
            });
            
            // If no elements left, clean up the wheel
            if (this.commandWheelElements.length === 0) {
                this.commandWheel = null;
                this.commandWheelElements = [];
                this.commandWheelBg = null;
                this.currentModeText = null;
                this.commandInstructions = null;
                this.toggleButton = null;
                this.toggleButtonText = null;
            }
        }
        
        // Safely clean up ping markers if they're inactive
        if (this.pingMarker && !this.pingMarker.active) {
            this.pingMarker = null;
        }
        
        if (this.pingTextMarker && !this.pingTextMarker.active) {
            this.pingTextMarker = null;
        }
    }
    
    updateUI() {
        window.updateUI.health(window.gameState.playerHealth, this.player ? this.player.maxHealth : 100);
        window.updateUI.ammo(window.gameState.playerAmmo, window.gameState.maxAmmo);
        window.updateUI.score(window.gameState.score);
        window.updateUI.reloadStatus(window.gameState.isReloading);
    }
    
    gameOver() {
        // Clean up placement preview before transitioning
        this.destroyPlacementPreview();
        
        this.scene.start('GameOverScene', {
            score: window.gameState.score,
            wave: window.gameState.wave,
            zombiesKilled: window.gameState.zombiesKilled
        });
    }
    
    setupCollisions() {
        // Damage-based overlaps (existing)
        this.physics.add.overlap(this.player, this.zombies, this.playerHitZombie, null, this);
        this.physics.add.overlap(this.squadMembers, this.zombies, this.playerHitZombie, null, this);
        this.physics.add.overlap(this.bullets, this.zombies, this.bulletHitZombie, null, this);
        this.physics.add.overlap(this.bullets, this.structures, this.bulletHitStructure, null, this);
        
        // REMOVED: Universal bullet collision detection for friendly fire prevention
        // Bullets now pass through player and squad members completely invisibly
        // this.physics.add.overlap(this.bullets, this.player, this.bulletHitFriendly, null, this);
        // this.physics.add.overlap(this.bullets, this.squadMembers, this.bulletHitFriendly, null, this);
        
        // Sentry gun collisions - handle manually since we're not using physics groups
        // We'll check collisions in the update method instead
        
        // Remove old sentry gun group collision setup
        // this.physics.add.overlap(this.zombies, this.sentryGuns, this.zombieHitSentryGun, null, this);
        // this.physics.add.overlap(this.bullets, this.sentryGuns, this.bulletHitSentryGun, null, this);
        // this.physics.add.collider(this.player, this.sentryGuns);
        // this.physics.add.collider(this.squadMembers, this.sentryGuns);
        
        // Set up solid collisions for sentry guns when they're placed
        // This will be called from placeSentryGun method
        
        // Solid collisions with structures (keep these - important for gameplay)
        this.physics.add.collider(this.player, this.structures);
        this.physics.add.collider(this.squadMembers, this.structures);
        this.physics.add.collider(this.zombies, this.structures, this.zombieHitStructure, null, this);
        
        // Combat collisions - Player vs Zombies (solid collision for knockback)
        this.physics.add.collider(this.player, this.zombies);
        
        // Combat collisions - Squad Members vs Zombies (solid collision for combat dynamics)
        this.physics.add.collider(this.squadMembers, this.zombies);
        
        // Zombie vs Zombie collisions (keep for zombie horde behavior)
        this.physics.add.collider(this.zombies, this.zombies);
        
        // IMPROVED FRIENDLY COLLISIONS - smaller collision bodies, less pushy
        // Use custom collision handlers to reduce bouncing while preventing overlap
        this.physics.add.collider(this.player, this.squadMembers, this.handleFriendlyCollision, null, this);
        this.physics.add.collider(this.squadMembers, this.squadMembers, this.handleSquadCollision, null, this);
        
        // Add friendly fire protection for sandbags - bullets pass through
        this.physics.add.overlap(this.bullets, this.structures, this.bulletHitStructureFriendly, null, this);
    }
    
    // Custom collision handler for player vs squad members
    handleFriendlyCollision(player, squadMember) {
        // SIMPLIFIED: Only separate when VERY close and only apply gentle force
        if (player.body && squadMember.body) {
            const distance = Phaser.Math.Distance.Between(player.x, player.y, squadMember.x, squadMember.y);
            
            // Only intervene when extremely close (reduced from 25 to 15)
            if (distance < 15 && distance > 0) {
                // Calculate separation direction
                const angle = Phaser.Math.Angle.Between(player.x, player.y, squadMember.x, squadMember.y);
                const pushForce = 15; // Much gentler (reduced from 30)
                
                // Only push squad member, don't interfere with player
                const pushX = Math.cos(angle) * pushForce;
                const pushY = Math.sin(angle) * pushForce;
                
                // IMPORTANT: Set velocity instead of adding to it to prevent accumulation
                squadMember.body.setVelocity(pushX, pushY);
                
                // Only apply for a very brief moment
                this.time.delayedCall(50, () => {
                    if (squadMember && squadMember.body && squadMember.active) {
                        // Don't zero velocity - let NPCPlayer logic take over
                        // squadMember.body.setVelocity(0, 0); // REMOVED
                    }
                });
            }
        }
    }
    
    // Custom collision handler for squad member vs squad member
    handleSquadCollision(squadMember1, squadMember2) {
        // SIMPLIFIED: Much less aggressive collision handling
        const distance = Phaser.Math.Distance.Between(squadMember1.x, squadMember1.y, squadMember2.x, squadMember2.y);
        
        // Only separate when extremely close (reduced from 20 to 12)
        if (distance < 12 && distance > 0) {
            // Calculate separation direction
            const angle = Phaser.Math.Angle.Between(squadMember1.x, squadMember1.y, squadMember2.x, squadMember2.y);
            const pushForce = 10; // Much gentler (reduced from 25)
            
            // Apply minimal separation
            const pushX = Math.cos(angle) * pushForce;
            const pushY = Math.sin(angle) * pushForce;
            
            // IMPORTANT: Set velocity instead of modifying it
            squadMember1.body.setVelocity(-pushX * 0.5, -pushY * 0.5);
            squadMember2.body.setVelocity(pushX * 0.5, pushY * 0.5);
            
            // Very brief separation, then let NPCPlayer logic take over
            this.time.delayedCall(30, () => {
                // Don't zero velocities - let NPCPlayer movement logic handle it
            });
        }
    }
    
    updateDebugText() {
        if (this.debugText) {
            const zombieCount = this.zombies ? this.zombies.children.size : 0;
            const squadCount = this.squadMembers ? this.squadMembers.children.size : 0;
            const sentryCount = this.sentryGunsList ? this.sentryGunsList.length : 0;
            const barricadeCount = this.barricadesList ? this.barricadesList.length : 0;
            const sandbagCount = this.sandbagsList ? this.sandbagsList.length : 0;
            const currentEquipment = this.player ? this.player.getCurrentSlotEquipment() : null;
            const equipmentInfo = currentEquipment ? `${currentEquipment.name}${currentEquipment.count !== undefined ? ` (${currentEquipment.count})` : ''}` : 'None';
            
            this.debugText.setText([
                `Zombies: ${zombieCount}`,
                `Squad Members: ${squadCount}`,
                `Sentry Guns: ${sentryCount}`,
                `Barricades: ${barricadeCount}`,
                `Sandbags: ${sandbagCount}`,
                `Slot ${this.player ? this.player.currentSlot : 1}: ${equipmentInfo}`,
                `Wave: ${window.gameState.wave || 1}`,
                `Score: ${window.gameState.score || 0}`,
                '',
                'Press 1: Machine Gun, 2: Sentry Gun, 3: Barricade',
                'Press SPACE to shoot/place (Green=Valid, Red=Invalid)',
                'Placement preview shows where items will be placed'
            ].join('\n'));
        }
    }
    
    createInventoryHotbar() {
        const slotSize = 50;
        const slotCount = 9; // Minecraft style - 9 slots
        const totalWidth = slotCount * slotSize + (slotCount - 1) * 4; // 4px spacing between slots
        const startX = (1024 - totalWidth) / 2; // Center horizontally
        const startY = 768 - 80; // 80px from bottom
        
        // Create inventory slots
        this.inventorySlots = [];
        this.inventoryItems = [];
        this.inventoryTexts = [];
        
        for (let i = 0; i < slotCount; i++) {
            const slotNumber = i + 1;
            const x = startX + i * (slotSize + 4);
            const y = startY;
            
            // Minimalistic slot - just a subtle outline
            const slot = this.add.rectangle(x + slotSize/2, y + slotSize/2, slotSize, slotSize, 0x000000, 0)
                .setDepth(2001)
                .setScrollFactor(0)
                .setStrokeStyle(2, 0x404040, 0.8); // Default border
            
            this.inventorySlots.push(slot);
            
            // Check if this slot has equipment
            const equipment = this.player ? this.player.equipment[slotNumber] : null;
            
            if (equipment) {
                // Add equipment icon
                const icon = this.add.image(x + slotSize/2, y + slotSize/2, equipment.icon)
                    .setDepth(2002)
                    .setScrollFactor(0);
                icon.setDisplaySize(slotSize*0.8, slotSize*0.8);
                this.inventoryItems.push(icon);
                
                // Add count text for placeable items
                if (equipment.type === 'placeable' && equipment.count !== undefined) {
                    const countText = this.add.text(x + slotSize - 5, y + 5, equipment.count.toString(), {
                        fontSize: '10px',
                        fill: '#ffffff',
                        fontFamily: 'Courier New',
                        stroke: '#000000',
                        strokeThickness: 1
                    }).setOrigin(1, 0).setDepth(2004).setScrollFactor(0);
                    this.inventoryTexts.push(countText);
                } else {
                    this.inventoryTexts.push(null);
                }
                
                // Add slot number
                const slotText = this.add.text(x + 5, y + 5, slotNumber.toString(), {
                    fontSize: '8px',
                    fill: '#cccccc',
                    fontFamily: 'Courier New',
                    stroke: '#000000',
                    strokeThickness: 1
                }).setOrigin(0, 0).setDepth(2003).setScrollFactor(0);
            } else {
                this.inventoryItems.push(null);
                this.inventoryTexts.push(null);
                
                // Add slot number for empty slots too
                const slotText = this.add.text(x + 5, y + 5, slotNumber.toString(), {
                    fontSize: '8px',
                    fill: '#666666',
                    fontFamily: 'Courier New',
                    stroke: '#000000',
                    strokeThickness: 1
                }).setOrigin(0, 0).setDepth(2003).setScrollFactor(0);
            }
        }
        
    }
    
    updateInventoryHotbar() {
        // Update selected slot highlighting
        this.inventorySlots.forEach((slot, index) => {
            const slotNumber = index + 1;
            const isSelected = this.player && this.player.currentSlot === slotNumber;
            
            if (isSelected) {
                slot.setStrokeStyle(3, 0xFF69B4, 0.9); // Selected: thicker pink border
            } else {
                slot.setStrokeStyle(2, 0x404040, 0.8); // Unselected: default border
            }
        });
        
        // Update count texts for placeable items
        this.inventoryTexts.forEach((countText, index) => {
            if (countText && countText.active) {
                const slotNumber = index + 1;
                const equipment = this.player ? this.player.equipment[slotNumber] : null;
                
                if (equipment && equipment.type === 'placeable' && equipment.count !== undefined) {
                    countText.setText(equipment.count.toString());
                }
            }
        });
    }

    addHelicopterEffects(x, y) {
        
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
            // Simple fallback fire since small_fire.png is missing
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
        
    }

    createFallbackPlayer() {
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
            const bullet = this.bullets.get();
            if (bullet) {
                bullet.fire(this.player.x, this.player.y - 20, 0, -300);
            }
        };
        this.player.reload = () => console.log('Player reloading (fallback)');
        this.player.update = () => {};
        this.player.setDirection = () => {};
        this.player.setMoving = () => {};
        
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
            
        }
    }

    createSquad() {
        // Create NPC squad members with different configurations
        
        // Squad member configurations
        const squadConfigs = [
            // Front flankers - advance scouts
            {
                name: 'Charlie',
                color: 0x0099ff, // Blue
                formationOffset: { x: -60, y: -20 }, // Front-left flanker
                weapon: 'pistol',
                aggroRange: 280,
                followDistance: 60,
                maxSeparation: 220
            },
            {
                name: 'Delta', 
                color: 0xff3333, // Red
                formationOffset: { x: 60, y: -20 }, // Front-right flanker
                weapon: 'machineGun',
                aggroRange: 320,
                followDistance: 60,
                maxSeparation: 220
            },
            // Mid-line support (original positions)
            {
                name: 'Alpha',
                color: 0x00ff00, // Green
                formationOffset: { x: -50, y: 40 }, // Left-back formation
                weapon: 'pistol',
                aggroRange: 250,
                followDistance: 60,
                maxSeparation: 200
            },
            {
                name: 'Bravo',
                color: 0xff8800, // Orange
                formationOffset: { x: 50, y: 40 }, // Right-back formation
                weapon: 'machineGun',
                aggroRange: 300,
                followDistance: 60,
                maxSeparation: 200
            },
            // // Rear guard - overwatch
            // {
            //     name: 'Echo',
            //     color: 0xaa44ff, // Purple
            //     formationOffset: { x: 0, y: 60 }, // Direct rear guard
            //     weapon: 'pistol',
            //     aggroRange: 270,
            //     followDistance: 65,
            //     maxSeparation: 210
            // }
        ];
        
        // Create each squad member
        squadConfigs.forEach((config, index) => {
            try {
                // Start squad members near the main player
                const startX = this.player.x + config.formationOffset.x;
                const startY = this.player.y + config.formationOffset.y;
                
                const squadMember = new NPCPlayer(this, startX, startY, config);
                this.squadMembers.add(squadMember);
                
            } catch (error) {
                console.error(`Error creating squad member '${config.name}':`, error);
            }
        });
        
    }

    updateHTMLSquadStatus() {
        const squadMembersDiv = document.getElementById('squad-members');
        if (!squadMembersDiv) return; // HTML element not found
        
        // Clear existing content
        squadMembersDiv.innerHTML = '';
        
        // Track names of active squad members to prevent duplicates
        const activeSquadNames = new Set();
        
        // Show active squad members first
        if (this.squadMembers) {
            this.squadMembers.children.entries.forEach((squadMember, index) => {
                if (squadMember) { // Check if exists (active or inactive)
                    const memberDiv = document.createElement('div');
                    memberDiv.className = 'squad-member';
                    
                    const name = squadMember.squadConfig.name;
                    const health = squadMember.active ? Math.ceil(squadMember.health) : 0;
                    const maxHealth = squadMember.maxHealth;
                    const healthPercent = squadMember.active ? (health / maxHealth) : 0;
                    const color = `#${squadMember.squadConfig.color.toString(16).padStart(6, '0')}`;
                    
                    // Add to active names set
                    activeSquadNames.add(name);
                    
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
        }
        
        // Only show destroyed squad members that are NOT currently active (prevent duplicates)
        const destroyedMembers = this.getDestroyedSquadMembers();
        destroyedMembers.forEach(memberInfo => {
            // Skip if this member is currently active
            if (activeSquadNames.has(memberInfo.name)) {
                return; // Don't show duplicate entry
            }
            
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
    
    // === SQUAD COMMAND SYSTEM METHODS ===
    
    createSquadModeUI() {
        // Create squad mode indicator in top-left corner
        this.squadModeText = this.add.text(20, 50, `Squad: ${this.squadMode.toUpperCase()}`, {
            fontSize: '16px',
            fill: '#00ff00',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setDepth(2000).setScrollFactor(0);
        
        // Add instruction text
        this.squadInstructionText = this.add.text(20, 75, 'Hold Q: Command Wheel | Right-Click: Ping Target', {
            fontSize: '12px',
            fill: '#ffff00',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 1,
            backgroundColor: '#000000',
            padding: { x: 6, y: 2 },
            alpha: 0.8
        }).setDepth(2000).setScrollFactor(0);
        
    }
    
    toggleSquadMode() {
        // Safety check before changing squad mode
        if (!this.squadMembers || this.squadMembers.children.size === 0) {
            console.warn('Cannot toggle squad mode: No active squad members');
            return;
        }
        
        // Show command wheel instead of direct toggle
        this.showCommandWheel();
    }
    
    updateSquadModeUI() {
        if (this.squadModeText) {
            this.squadModeText.setText(`Squad: ${this.squadMode.toUpperCase()}`);
            
            // Change color based on mode
            if (this.squadMode === 'follow') {
                this.squadModeText.setFill('#00ff00'); // Green for follow
            } else {
                this.squadModeText.setFill('#ff6600'); // Orange for hold
            }
        }
    }
    
    handleRightClick(pointer) {
        // Convert screen coordinates to world coordinates
        const worldX = this.cameras.main.scrollX + pointer.x;
        const worldY = this.cameras.main.scrollY + pointer.y;
        
        // Check if clicking on a zombie for focus fire
        let targetZombie = null;
        this.zombies.children.entries.forEach(zombie => {
            if (zombie.active) {
                const distance = Phaser.Math.Distance.Between(worldX, worldY, zombie.x, zombie.y);
                if (distance < 50) { // 50 pixel click tolerance
                    targetZombie = zombie;
                }
            }
        });
        
        if (targetZombie) {
            // Ping specific zombie for focus fire
            this.setPingTarget(targetZombie);

        } else {
            // Ping location for movement/positioning
            this.setPingLocation(worldX, worldY);

            
            // If command wheel is open, also show enhanced feedback
            if (this.commandWheel) {

            }
        }
    }
    
    setPingTarget(zombie) {
        this.pingTarget = zombie;
        this.createPingMarker(zombie.x, zombie.y, 'target');
        
        // Notify squad members of new target
        this.updateSquadBehavior();
        
        // Auto-clear ping after 10 seconds or when target dies
        this.time.delayedCall(10000, () => {
            if (this.pingTarget === zombie) {
                this.clearPing();
            }
        });
    }
    
    setPingLocation(x, y) {
        this.pingLocation = { x, y };
        this.createPingMarker(x, y, 'location');
        
        // Notify squad members of new position
        this.updateSquadBehavior();
        
        // Auto-clear ping after 8 seconds
        this.time.delayedCall(8000, () => {
            this.clearPing();
        });
    }
    
    createPingMarker(x, y, type) {
        // Clear existing marker safely
        if (this.pingMarker && this.pingMarker.active) {
            try {
                this.tweens.killTweensOf(this.pingMarker);
                this.pingMarker.destroy();
            } catch (error) {
                console.warn('Error destroying existing ping marker:', error);
            }
            this.pingMarker = null;
        }
        
        // Clear existing text marker safely
        if (this.pingTextMarker && this.pingTextMarker.active) {
            try {
                this.tweens.killTweensOf(this.pingTextMarker);
                this.pingTextMarker.destroy();
            } catch (error) {
                console.warn('Error destroying existing ping text marker:', error);
            }
            this.pingTextMarker = null;
        }
        
        // Create ping visual effect
        const color = type === 'target' ? 0xff0000 : 0x00ffff; // Red for target, cyan for location
        const size = type === 'target' ? 25 : 20;
        
        try {
            this.pingMarker = this.add.circle(x, y, size, color, 0.6);
            this.pingMarker.setDepth(1500);
            this.pingMarker.setStrokeStyle(3, color, 1);
            
            // Pulsing animation with comprehensive safety checks
            if (this.pingMarker && this.pingMarker.active && this.tweens) {
                this.tweens.add({
                    targets: this.pingMarker,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0.2,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    onUpdate: () => {
                        // Safety check during animation
                        if (!this.pingMarker || !this.pingMarker.active) {
                            return false; // Stop the tween
                        }
                    },
                    onComplete: () => {
                        // Safety check when animation completes
                        if (this.pingMarker && this.pingMarker.active) {
                            // Animation completed successfully
                        }
                    }
                });
            }
            
            // Add ping text
            const pingText = type === 'target' ? 'FOCUS FIRE' : 'MOVE HERE';
            this.pingTextMarker = this.add.text(x, y - 40, pingText, {
                fontSize: '12px',
                fill: type === 'target' ? '#ff0000' : '#00ffff',
                fontFamily: 'Courier New',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(1501);
            
            // Fade out text after 3 seconds with comprehensive safety checks
            if (this.pingTextMarker && this.pingTextMarker.active && this.tweens) {
                this.tweens.add({
                    targets: this.pingTextMarker,
                    alpha: 0,
                    duration: 3000,
                    onUpdate: () => {
                        // Safety check during animation
                        if (!this.pingTextMarker || !this.pingTextMarker.active) {
                            return false; // Stop the tween
                        }
                    },
                    onComplete: () => {
                        if (this.pingTextMarker && this.pingTextMarker.active) {
                            this.pingTextMarker.destroy();
                            this.pingTextMarker = null;
                        }
                    }
                });
            }
            
        } catch (error) {
            console.warn('Error creating ping marker:', error);
        }
        
        console.log(`🎯 Ping marker created at (${x}, ${y}) - Type: ${type}`);
    }
    
    clearPing() {
        this.pingTarget = null;
        this.pingLocation = null;
        
        // Safely destroy ping marker
        if (this.pingMarker && this.pingMarker.active) {
            try {
                this.tweens.killTweensOf(this.pingMarker); // Stop any running tweens
                this.pingMarker.destroy();
            } catch (error) {
                console.warn('Error destroying ping marker:', error);
            }
            this.pingMarker = null;
        }
        
        // Safely destroy ping text marker
        if (this.pingTextMarker && this.pingTextMarker.active) {
            try {
                this.tweens.killTweensOf(this.pingTextMarker); // Stop any running tweens
                this.pingTextMarker.destroy();
            } catch (error) {
                console.warn('Error destroying ping text marker:', error);
            }
            this.pingTextMarker = null;
        }
        
        // Update squad behavior to clear ping orders
        this.updateSquadBehavior();
    }
    
    updateSquadBehavior() {
        // Only update if commands are fully initialized
        if (!this.squadCommandsInitialized || !this.squadMembers) return;
        
        this.squadMembers.children.entries.forEach(squadMember => {
            if (squadMember && squadMember.active && !squadMember.isDead && typeof squadMember.updateSquadCommand === 'function') {
                // Update squad member's mode
                squadMember.squadMode = this.squadMode;
                
                // Set ping target/location
                squadMember.pingTarget = this.pingTarget;
                squadMember.pingLocation = this.pingLocation;
                
                // Trigger immediate behavior update with safety check
                try {
                    squadMember.updateSquadCommand();
                } catch (error) {
                    console.warn(`Error updating squad command for ${squadMember.squadConfig?.name || 'unknown'}:`, error);
                }
            }
        });
    }
    
    initializeSquadCommands() {
        // Initialize squad members with default mode without triggering updates
        if (!this.squadMembers) return;
        
        this.squadMembers.children.entries.forEach(squadMember => {
            if (squadMember && squadMember.active && !squadMember.isDead) {
                // Set initial mode directly without calling updateSquadCommand
                squadMember.squadMode = this.squadMode;
                squadMember.pingTarget = null;
                squadMember.pingLocation = null;
                squadMember.holdPosition = null;
                squadMember.isExecutingPing = false;
                
                console.log(`${squadMember.squadConfig.name} initialized with mode: ${this.squadMode}`);
            }
        });
    }
    
    // === COMMAND WHEEL SYSTEM ===
    
    showCommandWheel() {
        // Prevent multiple wheels
        if (this.commandWheel) {
            return;
        }
        
        // Create individual elements directly (not in a container)
        this.commandWheelElements = [];
        
        // Get screen center
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Store center for mouse calculations
        this.commandWheelCenter = { x: centerX, y: centerY };
        this.selectedCommand = null;
        
        // Background circle
        this.commandWheelBg = this.add.circle(centerX, centerY, 120, 0x000000, 0.8);
        this.commandWheelBg.setStrokeStyle(4, 0xffffff);
        this.commandWheelBg.setDepth(3000);
        this.commandWheelBg.setScrollFactor(0);
        this.commandWheelElements.push(this.commandWheelBg);
        
        // Title text
        this.commandTitleText = this.add.text(centerX, centerY - 80, 'RALLY POINT', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.commandTitleText.setOrigin(0.5);
        this.commandTitleText.setDepth(3001);
        this.commandTitleText.setScrollFactor(0);
        this.commandWheelElements.push(this.commandTitleText);
        
        // Create radial command zones with directional indicators
        
        // LEFT - FOLLOW (Green)
        this.followZone = this.add.graphics();
        this.followZone.setDepth(3001);
        this.followZone.setScrollFactor(0);
        this.followZone.fillStyle(0x00ff00, 0.3);
        this.followZone.fillCircle(centerX - 60, centerY, 35);
        this.followZone.lineStyle(2, 0x00ff00, 0.8);
        this.followZone.strokeCircle(centerX - 60, centerY, 35);
        this.commandWheelElements.push(this.followZone);
        
        this.followText = this.add.text(centerX - 60, centerY, 'FOLLOW', {
            fontSize: '10px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.followText.setOrigin(0.5);
        this.followText.setDepth(3002);
        this.followText.setScrollFactor(0);
        this.commandWheelElements.push(this.followText);
        
        // RIGHT - HOLD (Orange)
        this.holdZone = this.add.graphics();
        this.holdZone.setDepth(3001);
        this.holdZone.setScrollFactor(0);
        this.holdZone.fillStyle(0xff6600, 0.3);
        this.holdZone.fillCircle(centerX + 60, centerY, 35);
        this.holdZone.lineStyle(2, 0xff6600, 0.8);
        this.holdZone.strokeCircle(centerX + 60, centerY, 35);
        this.commandWheelElements.push(this.holdZone);
        
        this.holdText = this.add.text(centerX + 60, centerY, 'HOLD', {
            fontSize: '10px',
            fill: '#ff6600',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.holdText.setOrigin(0.5);
        this.holdText.setDepth(3002);
        this.holdText.setScrollFactor(0);
        this.commandWheelElements.push(this.holdText);
        
        // BOTTOM - MOVE (Cyan)
        this.moveZone = this.add.graphics();
        this.moveZone.setDepth(3001);
        this.moveZone.setScrollFactor(0);
        this.moveZone.fillStyle(0x00ffff, 0.3);
        this.moveZone.fillCircle(centerX, centerY + 60, 35);
        this.moveZone.lineStyle(2, 0x00ffff, 0.8);
        this.moveZone.strokeCircle(centerX, centerY + 60, 35);
        this.commandWheelElements.push(this.moveZone);
        
        this.moveText = this.add.text(centerX, centerY + 60, 'MOVE', {
            fontSize: '10px',
            fill: '#00ffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.moveText.setOrigin(0.5);
        this.moveText.setDepth(3002);
        this.moveText.setScrollFactor(0);
        this.commandWheelElements.push(this.moveText);
        
        // Current selection indicator (invisible initially)
        this.selectionIndicator = this.add.circle(centerX, centerY, 40, 0xffffff, 0);
        this.selectionIndicator.setStrokeStyle(4, 0xffffff, 0.8);
        this.selectionIndicator.setDepth(3003);
        this.selectionIndicator.setScrollFactor(0);
        this.commandWheelElements.push(this.selectionIndicator);
        
        // Instructions
        this.commandInstructions = this.add.text(centerX, centerY + 100, 'Move mouse to select • Release Q to confirm', {
            fontSize: '10px',
            fill: '#cccccc',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 1
        });
        this.commandInstructions.setOrigin(0.5);
        this.commandInstructions.setDepth(3001);
        this.commandInstructions.setScrollFactor(0);
        this.commandWheelElements.push(this.commandInstructions);
        
        // Set flag
        this.commandWheel = true;
        
        // Fade in all elements
        this.commandWheelElements.forEach(element => {
            element.setAlpha(0);
            this.tweens.add({
                targets: element,
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        // Start listening for mouse movement
        this.input.on('pointermove', this.updateCommandWheelSelection, this);
        
        console.log('🎯 Radial command wheel opened');
    }
    
    updateCommandWheelSelection(pointer) {
        if (!this.commandWheel || !this.commandWheelCenter) return;
        
        const angle = Phaser.Math.Angle.Between(this.commandWheelCenter.x, this.commandWheelCenter.y, pointer.x, pointer.y);
        const distance = Phaser.Math.Distance.Between(this.commandWheelCenter.x, this.commandWheelCenter.y, pointer.x, pointer.y);
        
        // Only respond to mouse movement within the wheel
        if (distance < 30 || distance > 120) {
            this.selectedCommand = null;
            this.selectionIndicator.setAlpha(0);
            return;
        }
        
        // Convert angle to degrees and normalize to 0-360
        let degrees = Phaser.Math.RadToDeg(angle);
        if (degrees < 0) degrees += 360;
        
        // Determine which command zone the mouse is in
        let newCommand = null;
        let targetX = this.commandWheelCenter.x;
        let targetY = this.commandWheelCenter.y;
        
        if (degrees >= 315 || degrees < 45) {
            // RIGHT - HOLD
            newCommand = 'hold';
            targetX = this.commandWheelCenter.x + 60;
            targetY = this.commandWheelCenter.y;
        } else if (degrees >= 135 && degrees < 225) {
            // LEFT - FOLLOW  
            newCommand = 'follow';
            targetX = this.commandWheelCenter.x - 60;
            targetY = this.commandWheelCenter.y;
        } else if (degrees >= 45 && degrees < 135) {
            // BOTTOM - MOVE
            newCommand = 'move';
            targetX = this.commandWheelCenter.x;
            targetY = this.commandWheelCenter.y + 60;
        }
        
        // Update selection if changed
        if (newCommand && newCommand !== this.selectedCommand) {
            this.selectedCommand = newCommand;
            
            // Move selection indicator to the selected zone
            this.selectionIndicator.setPosition(targetX, targetY);
            this.selectionIndicator.setAlpha(0.6);
            
            // Highlight the selected zone
            this.highlightSelectedZone(newCommand);
            
            console.log(`🎯 Selected command: ${newCommand.toUpperCase()}`);
        }
    }
    
    highlightSelectedZone(command) {
        // Reset all zones to normal
        this.followZone.clear();
        this.followZone.fillStyle(0x00ff00, 0.3);
        this.followZone.fillCircle(this.commandWheelCenter.x - 60, this.commandWheelCenter.y, 35);
        this.followZone.lineStyle(2, 0x00ff00, 0.8);
        this.followZone.strokeCircle(this.commandWheelCenter.x - 60, this.commandWheelCenter.y, 35);
        
        this.holdZone.clear();
        this.holdZone.fillStyle(0xff6600, 0.3);
        this.holdZone.fillCircle(this.commandWheelCenter.x + 60, this.commandWheelCenter.y, 35);
        this.holdZone.lineStyle(2, 0xff6600, 0.8);
        this.holdZone.strokeCircle(this.commandWheelCenter.x + 60, this.commandWheelCenter.y, 35);
        
        this.moveZone.clear();
        this.moveZone.fillStyle(0x00ffff, 0.3);
        this.moveZone.fillCircle(this.commandWheelCenter.x, this.commandWheelCenter.y + 60, 35);
        this.moveZone.lineStyle(2, 0x00ffff, 0.8);
        this.moveZone.strokeCircle(this.commandWheelCenter.x, this.commandWheelCenter.y + 60, 35);
        
        // Highlight selected zone
        if (command === 'follow') {
            this.followZone.clear();
            this.followZone.fillStyle(0x00ff00, 0.6);
            this.followZone.fillCircle(this.commandWheelCenter.x - 60, this.commandWheelCenter.y, 35);
            this.followZone.lineStyle(4, 0x00ff00, 1);
            this.followZone.strokeCircle(this.commandWheelCenter.x - 60, this.commandWheelCenter.y, 35);
        } else if (command === 'hold') {
            this.holdZone.clear();
            this.holdZone.fillStyle(0xff6600, 0.6);
            this.holdZone.fillCircle(this.commandWheelCenter.x + 60, this.commandWheelCenter.y, 35);
            this.holdZone.lineStyle(4, 0xff6600, 1);
            this.holdZone.strokeCircle(this.commandWheelCenter.x + 60, this.commandWheelCenter.y, 35);
        } else if (command === 'move') {
            this.moveZone.clear();
            this.moveZone.fillStyle(0x00ffff, 0.6);
            this.moveZone.fillCircle(this.commandWheelCenter.x, this.commandWheelCenter.y + 60, 35);
            this.moveZone.lineStyle(4, 0x00ffff, 1);
            this.moveZone.strokeCircle(this.commandWheelCenter.x, this.commandWheelCenter.y + 60, 35);
        }
    }
    
    hideCommandWheel() {
        if (!this.commandWheel || !this.commandWheelElements) return;
        
        // Stop listening for mouse movement
        this.input.off('pointermove', this.updateCommandWheelSelection, this);
        
        // If we have a selected command, execute it
        if (this.selectedCommand) {
            // For move command, activate one-shot mode
            if (this.selectedCommand === 'move') {
                this.moveCommandActive = true;
                this.showMoveCursor();
            } else {
                this.hideMoveCursor();
                this.moveCommandActive = false;
            }
            
            // Apply the selected command
            this.applyRadialCommand(this.selectedCommand);
        }
        
        // Fade out and destroy all elements
        this.commandWheelElements.forEach(element => {
            if (element && element.active) {
                this.tweens.add({
                    targets: element,
                    alpha: 0,
                    duration: 150,
                    ease: 'Power2',
                    onComplete: () => {
                        if (element && element.active) {
                            element.destroy();
                        }
                    }
                });
            }
        });
        
        // Clean up references
        this.commandWheel = null;
        this.commandWheelElements = [];
        this.commandWheelBg = null;
        this.commandTitleText = null;
        this.commandInstructions = null;
        this.followZone = null;
        this.followText = null;
        this.holdZone = null;
        this.holdText = null;
        this.moveZone = null;
        this.moveText = null;
        this.selectionIndicator = null;
        this.selectedCommand = null;
        this.commandWheelCenter = null;
        
        console.log('🎯 Radial command wheel closed');
    }
    
    applyRadialCommand(command) {
        const oldMode = this.squadMode;
        this.squadMode = command;
        
        // Clear any existing ping when changing modes
        if (command === 'follow' || command === 'hold') {
            this.clearPing();
        }
        
        // Update squad members' behavior
        this.updateSquadBehavior();
        
        // Update UI
        this.updateSquadModeUI();
        
        console.log(`🎯 Squad mode changed from ${oldMode.toUpperCase()} to ${command.toUpperCase()}`);
    }
    
    selectCommand(mode) {
        if (mode === 'cancel') {
            return;
        }
        
        const oldMode = this.squadMode;
        this.squadMode = mode;
        
        // Clear any existing ping when changing modes
        if (mode === 'follow' || mode === 'hold') {
            this.clearPing();
        }
        
        // Show/hide cursor based on mode
        if (mode === 'move') {
            this.showMoveCursor();
        } else {
            this.hideMoveCursor();
        }
        
        // Update squad members' behavior
        this.updateSquadBehavior();
        
        // Update UI
        this.updateSquadModeUI();
        
        // Update command wheel display if it's open
        this.updateCommandWheelDisplay();
        
        console.log(`🎯 Squad mode changed from ${oldMode.toUpperCase()} to ${mode.toUpperCase()}`);
    }
    
    updateCommandWheelDisplay() {
        if (!this.commandWheel) return;
        
        // Update current mode text
        if (this.currentModeText && this.currentModeText.active) {
            try {
                this.currentModeText.setText(`Current: ${this.squadMode.toUpperCase()}`);
                this.currentModeText.setFill(this.getModeColor(this.squadMode));
                
                // Brief highlight effect
                this.currentModeText.setScale(1.2);
                this.tweens.add({
                    targets: this.currentModeText,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Back.easeOut'
                });
            } catch (error) {
                console.warn('Error updating command wheel text:', error);
            }
        }
        
        // Update button appearances
        this.updateButtonAppearance(this.followButton, this.followButtonText, 'follow', '#00ff00');
        this.updateButtonAppearance(this.holdButton, this.holdButtonText, 'hold', '#ff6600');
        this.updateButtonAppearance(this.moveButton, this.moveButtonText, 'move', '#00ffff');
    }
    
    updateButtonAppearance(button, buttonText, mode, color) {
        if (!button || !button.active || !buttonText || !buttonText.active) return;
        
        const isActive = this.squadMode === mode;
        
        try {
            button.setFillStyle(isActive ? 0x444444 : 0x222222);
            button.setStrokeStyle(2, isActive ? color : 0x666666);
            buttonText.setFill(isActive ? color : '#cccccc');
        } catch (error) {
            console.warn(`Error updating ${mode} button appearance:`, error);
        }
    }
    
    showMoveCursor() {
        // Create crosshair cursor that follows mouse
        if (this.moveCursor) return; // Already showing
        
        this.moveCursor = this.add.group();
        
        // Create crosshair lines
        const crosshairColor = 0x00ffff;
        const crosshairSize = 20;
        
        // Horizontal line
        this.moveCursorH = this.add.rectangle(0, 0, crosshairSize, 2, crosshairColor, 0.8);
        this.moveCursorH.setDepth(4000);
        this.moveCursor.add(this.moveCursorH);
        
        // Vertical line
        this.moveCursorV = this.add.rectangle(0, 0, 2, crosshairSize, crosshairColor, 0.8);
        this.moveCursorV.setDepth(4000);
        this.moveCursor.add(this.moveCursorV);
        
        // Center dot
        this.moveCursorDot = this.add.circle(0, 0, 3, crosshairColor, 0.6);
        this.moveCursorDot.setDepth(4000);
        this.moveCursor.add(this.moveCursorDot);
        
        console.log('🎯 Move cursor activated');
    }
    
    hideMoveCursor() {
        if (this.moveCursor) {
            this.moveCursor.destroy(true);
            this.moveCursor = null;
            this.moveCursorH = null;
            this.moveCursorV = null;
            this.moveCursorDot = null;
            console.log('🎯 Move cursor deactivated');
        }
    }

    handleLeftClickMove(pointer) {
        // Only process left click if move command is active
        if (!this.moveCommandActive) return;
        
        // Convert screen coordinates to world coordinates
        const worldX = this.cameras.main.scrollX + pointer.x;
        const worldY = this.cameras.main.scrollY + pointer.y;
        
        // Send squad to this location
        this.setPingLocation(worldX, worldY);
        console.log(`🎯 Move command: Squad ordered to (${worldX.toFixed(0)}, ${worldY.toFixed(0)})`);
        
        // Create visual feedback for the move command
        this.createMoveCommandFeedback(worldX, worldY);
        
        // Disable move command after one use (one-shot behavior)
        this.moveCommandActive = false;
        this.hideMoveCursor();
        
        // Switch back to follow mode after move command is executed
        this.squadMode = 'follow';
        this.updateSquadModeUI();
        
        // IMPORTANT: Notify squad members of mode change to prevent phantom move commands
        this.updateSquadBehavior();
        
        console.log('🎯 Move command executed, switched back to Follow mode');
    }
    
    updateMoveCursor(pointer) {
        // Only update cursor if move command is active and cursor exists
        if (!this.moveCommandActive || !this.moveCursor) return;
        
        // Convert screen coordinates to world coordinates
        const worldX = this.cameras.main.scrollX + pointer.x;
        const worldY = this.cameras.main.scrollY + pointer.y;
        
        // Update cursor position
        if (this.moveCursorH && this.moveCursorH.active) {
            this.moveCursorH.setPosition(worldX, worldY);
        }
        if (this.moveCursorV && this.moveCursorV.active) {
            this.moveCursorV.setPosition(worldX, worldY);
        }
        if (this.moveCursorDot && this.moveCursorDot.active) {
            this.moveCursorDot.setPosition(worldX, worldY);
        }
    }
    
    createMoveCommandFeedback(x, y) {
        // Create a brief visual indicator where the move command was issued
        const feedback = this.add.circle(x, y, 15, 0x00ffff, 0.5);
        feedback.setDepth(1000);
        feedback.setStrokeStyle(3, 0x00ffff);
        
        // Animate the feedback
        this.tweens.add({
            targets: feedback,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                if (feedback && feedback.active) {
                    feedback.destroy();
                }
            }
        });
        
        // Add text indicator
        const feedbackText = this.add.text(x, y - 30, 'MOVE HERE', {
            fontSize: '12px',
            fill: '#00ffff',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        feedbackText.setOrigin(0.5);
        feedbackText.setDepth(1001);
        
        this.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 20,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                if (feedbackText && feedbackText.active) {
                    feedbackText.destroy();
                }
            }
        });
    }

    zombieHitSentryGun(zombie, sentryGun) {
        // Zombies can damage sentry guns
        if (sentryGun && sentryGun.active && sentryGun.isActive) {
            // Check if zombie can attack (cooldown)
            const currentTime = this.time.now;
            if (!zombie.lastSentryAttackTime) zombie.lastSentryAttackTime = 0;
            
            if (currentTime - zombie.lastSentryAttackTime < 1000) {
                return; // Attack cooldown - prevent spam
            }
            
            const destroyed = sentryGun.takeDamage(15, 'zombie'); // Increased damage
            zombie.lastSentryAttackTime = currentTime;
            
            if (destroyed) {
                console.log('🎯 Sentry gun destroyed by zombie!');
                window.gameState.score -= 10; // Penalty for losing sentry gun
                window.updateUI.score(window.gameState.score);
            }
            
            // Zombie briefly stops to attack with proper animation
            zombie.body.setVelocity(0, 0);
            
            // Visual attack effect
            const attackEffect = this.add.circle(sentryGun.x, sentryGun.y, 8, 0xff0000, 0.6);
            attackEffect.setDepth(1500);
            this.tweens.add({
                targets: attackEffect,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => attackEffect.destroy()
            });
            
            // Resume zombie movement after attack
            this.time.delayedCall(800, () => {
                if (zombie && zombie.body && zombie.active && this.player) {
                    // Resume movement toward player
                    const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, this.player.x, this.player.y);
                    zombie.body.setVelocity(Math.cos(angle) * zombie.speed, Math.sin(angle) * zombie.speed);
                }
            });
        }
    }
    
    bulletHitSentryGun(bullet, sentryGun) {
        // DEPRECATED: This method is no longer used since sentry guns now have friendly fire protection
        // Sentry guns are now protected from friendly bullets like squad members
        // Only zombies can damage sentry guns through zombieHitSentryGun method
        
        console.warn('⚠️ DEPRECATED: bulletHitSentryGun called - sentry guns should have friendly fire protection');
        
        // Legacy code kept for reference but should not be called:
        /*
        if (sentryGun && sentryGun.active && sentryGun.isActive) {
            const destroyed = sentryGun.takeDamage(this.player.damage, 'bullet');
            
            if (destroyed) {
                console.log('Sentry gun destroyed by friendly fire!');
                window.gameState.score -= 10; // Larger penalty for friendly fire
                window.updateUI.score(window.gameState.score);
            } else {
                // Create spark effect for non-lethal hits
                this.createSparkEffect(bullet.x, bullet.y);
            }
        }
        
        // Remove bullet
        bullet.deactivate();
        */
    }
    
    bulletHitSentryGunFriendly(bullet, sentryGun) {
        // Safety check: ensure bullet is valid and has the deactivate method
        if (!bullet || !bullet.active || typeof bullet.deactivate !== 'function') {
            return; // Skip processing invalid bullets
        }
        
        // Friendly fire prevention - bullets pass through sentry guns harmlessly
        console.log('🛡️ Sentry gun friendly fire prevented:', {
            bulletPos: { x: bullet.x.toFixed(2), y: bullet.y.toFixed(2) },
            sentryPos: { x: sentryGun.x.toFixed(2), y: sentryGun.y.toFixed(2) }
        });
        
        // Create a subtle shield effect to show friendly fire prevention
        const shieldEffect = this.add.circle(sentryGun.x, sentryGun.y, 25, 0x00BFFF, 0.3);
        shieldEffect.setDepth(sentryGun.depth + 1);
        
        this.tweens.add({
            targets: shieldEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => shieldEffect.destroy()
        });
        
        // DO NOT deactivate bullet - let it pass through sentry gun
        // bullet.deactivate(); // REMOVED - this was causing bullets to disappear
        
        console.log('💫 Bullet passed through sentry gun and continues traveling');
    }
    
    checkSentryGunDamageCollisions(sentryGun) {
        // Check zombie collisions (for attacking the sentry gun) - overlap only, not blocking
        this.zombies.children.entries.forEach(zombie => {
            if (zombie && zombie.active && zombie.body && sentryGun.body) {
                if (this.physics.overlap(zombie, sentryGun)) {
                    this.zombieHitSentryGun(zombie, sentryGun);
                }
            }
        });
        
        // Bullet collisions removed - sentry guns now have friendly fire protection!
        // Only zombies should be able to damage sentry guns, not friendly bullets
        
        // Note: Solid collision blocking is now handled by proper static body colliders
        // set up in placeSentryGun method using this.physics.add.collider()
    }
    
    checkBarricadeDamageCollisions(barricade) {
        // Check zombie collisions (for attacking the barricade) - overlap only, not blocking
        this.zombies.children.entries.forEach(zombie => {
            if (zombie && zombie.active && zombie.body && barricade.body) {
                if (this.physics.overlap(zombie, barricade)) {
                    this.zombieHitBarricade(zombie, barricade);
                }
            }
        });
        
        // Note: Friendly fire protection for barricades is handled by bulletHitBarricadeFriendly
        // Zombie bullets can damage barricades, but friendly bullets pass through harmlessly
    }
    
    separateBodies(movingBody, staticBody) {
        // This method is no longer needed since we're using proper static body colliders
        // Keeping for compatibility but it shouldn't be called anymore
        console.warn('separateBodies called - this should not happen with proper static body colliders');
    }
    
    /**
     * Debug method to visualize road layout
     * Can be called from console: gameScene.debugRoadLayout()
     */
    debugRoadLayout() {
        console.log('🛣️ ROAD LAYOUT DEBUG');
        console.log('==================');
        
        const tileSize = 64;
        const worldWidth = 2048;
        const worldHeight = 1536;
        
        console.log(`World size: ${worldWidth}x${worldHeight}`);
        console.log(`Tile size: ${tileSize}x${tileSize}`);
        
        // Vertical road bounds
        console.log('\n🟦 VERTICAL ROAD:');
        console.log(`X range: 288 to 416 (width: ${416-288}px = ${(416-288)/tileSize} tiles)`);
        console.log(`Y range: 0 to ${worldHeight} (full height)`);
        console.log('Rotation: 0 degrees (vertical lines - NO rotation needed)');
        
        // Horizontal road bounds  
        console.log('\n🟨 HORIZONTAL ROAD:');
        console.log(`X range: 0 to ${worldWidth} (full width)`);
        console.log(`Y range: 544 to 672 (height: ${672-544}px = ${(672-544)/tileSize} tiles)`);
        console.log('Rotation: 90 degrees (horizontal lines - rotated from vertical)');
        
        // Intersection
        console.log('\n🟩 INTERSECTION:');
        console.log('X range: 288 to 416');
        console.log('Y range: 544 to 672');
        console.log('Note: Intersection uses no rotation (vertical lines)');
        
        console.log('\n🎯 To test: Move player to coordinates (352, 608) for intersection center');
        console.log('🎯 Debug: Run gameScene.debugRoadLayout() anytime to see this info');
    }
    
    /**
     * Enable seamless terrain textures (eliminates gaps completely for all terrain types)
     * Can be called from console: gameScene.enableSeamlessTerrain()
     */
    enableSeamlessTerrain() {
        console.log('🗺️ Generating seamless terrain textures for ALL terrain types...');
        
        try {
            // Generate seamless textures for all terrain types
            TerrainOptimizer.createSeamlessTerrainTextures(this);
            
            console.log('✅ All seamless terrain textures generated!');
            console.log('🔄 Refresh the page to see gap-free terrain everywhere');
            console.log('📝 Available seamless textures:');
            console.log('   - sand_texture_seamless');
            console.log('   - grass_texture_seamless'); 
            console.log('   - crackled_concrete_seamless');
            console.log('   - rubble_seamless');
            console.log('   - dirt_road_seamless_horizontal');
            console.log('   - dirt_road_seamless_vertical');
            console.log('💡 To use by default: Uncomment TerrainOptimizer.createSeamlessTerrainTextures(this) in GameScene.create()');
            
        } catch (error) {
            console.error('Failed to generate seamless terrain:', error);
        }
    }
    
    /**
     * Enable seamless road textures only (legacy method for roads only)
     * Can be called from console: gameScene.enableSeamlessRoads()
     */
    enableSeamlessRoads() {
        console.log('🛣️ Generating seamless road textures...');
        
        try {
            // Generate seamless road textures
            TerrainOptimizer.createSeamlessRoadTextures(this);
            
            console.log('✅ Seamless road textures generated!');
            console.log('🔄 Refresh the page to see seamless roads');
            console.log('💡 For ALL terrain types, use: gameScene.enableSeamlessTerrain()');
            
        } catch (error) {
            console.error('Failed to generate seamless roads:', error);
        }
    }

    zombieHitBarricade(zombie, barricade) {
        // Zombies can damage barricades
        if (barricade && barricade.active && barricade.isActive) {
            // Check if zombie can attack (cooldown)
            const currentTime = this.time.now;
            if (!zombie.lastBarricadeAttackTime) zombie.lastBarricadeAttackTime = 0;
            
            if (currentTime - zombie.lastBarricadeAttackTime < 1200) {
                return; // Attack cooldown - prevent spam
            }
            
            const destroyed = barricade.takeDamage(20, 'zombie'); // Zombies do good damage to wood
            zombie.lastBarricadeAttackTime = currentTime;
            
            if (destroyed) {
                console.log('🛡️ Barricade destroyed by zombie!');
                window.gameState.score -= 5; // Small penalty for losing barricade
                window.updateUI.score(window.gameState.score);
            }
            
            // Zombie briefly stops to attack
            zombie.body.setVelocity(0, 0);
            
            // Visual attack effect
            const attackEffect = this.add.circle(barricade.x, barricade.y, 8, 0xff0000, 0.6);
            attackEffect.setDepth(1500);
            this.tweens.add({
                targets: attackEffect,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => attackEffect.destroy()
            });
            
            // Resume zombie movement after attack
            this.time.delayedCall(800, () => {
                if (zombie && zombie.body && zombie.active && this.player) {
                    // Resume movement toward player
                    const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, this.player.x, this.player.y);
                    zombie.body.setVelocity(Math.cos(angle) * zombie.speed, Math.sin(angle) * zombie.speed);
                }
            });
        }
    }
    
    bulletHitBarricadeFriendly(bullet, barricade) {
        // Safety check: ensure bullet is valid and has the deactivate method
        if (!bullet || !bullet.active || typeof bullet.deactivate !== 'function') {
            return; // Skip processing invalid bullets
        }
        
        // Barricades have friendly fire protection - friendly bullets pass through
        console.log('🛡️ Barricade friendly fire prevented:', {
            bulletPos: { x: bullet.x.toFixed(2), y: bullet.y.toFixed(2) },
            barricadePos: { x: barricade.x.toFixed(2), y: barricade.y.toFixed(2) }
        });
        
        // Create small wood chip effects when bullet hits barricade
        const chipCount = 2;
        
        for (let i = 0; i < chipCount; i++) {
            // Random offset around the impact point
            const offsetX = (Math.random() - 0.5) * 15;
            const offsetY = (Math.random() - 0.5) * 10;
            
            // Small wood chip - brown color
            const chip = this.add.rectangle(
                barricade.x + offsetX, 
                barricade.y + offsetY, 
                1.5, 2, 
                0x8B4513 // Brown wood color
            );
            
            chip.setDepth(barricade.depth + 50);
            chip.setAlpha(0.6);
            
            // Small upward drift with random spread
            this.tweens.add({
                targets: chip,
                y: chip.y - Phaser.Math.Between(6, 12), // Small upward movement
                x: chip.x + Phaser.Math.Between(-6, 6), // Random horizontal drift
                alpha: 0,
                rotation: Math.random() * Math.PI,
                duration: Phaser.Math.Between(600, 1000), // Varying duration
                ease: 'Linear',
                onComplete: () => chip.destroy()
            });
        }
        
        // DO NOT deactivate bullet - let it pass through barricade
        // bullet.deactivate(); // REMOVED - this was causing bullets to disappear
        
        console.log('💫 Bullet passed through barricade and continues traveling');
    }

    zombieHitSandbag(zombie, sandbag) {
        // Comprehensive safety checks
        if (!zombie || !sandbag || !zombie.active || !sandbag.active || !sandbag.isActive) {
            console.warn('⚠️ zombieHitSandbag called with invalid objects:', {
                zombie: !!zombie,
                zombieActive: zombie ? zombie.active : false,
                sandbag: !!sandbag,
                sandbagActive: sandbag ? sandbag.active : false,
                sandbagIsActive: sandbag ? sandbag.isActive : false
            });
            return;
        }
        
        // Zombies can damage sandbags
        if (sandbag && sandbag.active && sandbag.isActive) {
            // Check if zombie can attack (cooldown)
            const currentTime = this.time.now;
            if (!zombie.lastSandbagAttackTime) zombie.lastSandbagAttackTime = 0;
            
            if (currentTime - zombie.lastSandbagAttackTime < 1500) {
                return; // Attack cooldown - prevent spam (longer cooldown than barricades since sandbags are tougher)
            }
            
            try {
                const destroyed = sandbag.takeDamage(25, 'zombie'); // Good damage since sandbags have 4x health
                zombie.lastSandbagAttackTime = currentTime;
                
                if (destroyed) {
                    console.log('🛡️ Sandbag destroyed by zombie!');
                    window.gameState.score -= 15; // Penalty for losing sandbag (more than barricades since they're stronger)
                    window.updateUI.score(window.gameState.score);
                }
                
                // Zombie briefly stops to attack
                if (zombie.body) {
                    zombie.body.setVelocity(0, 0);
                }
                
                // Visual attack effect
                const attackEffect = this.add.circle(sandbag.x, sandbag.y, 8, 0xff0000, 0.6);
                attackEffect.setDepth(1500);
                this.tweens.add({
                    targets: attackEffect,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => attackEffect.destroy()
                });
                
                // Resume zombie movement after attack
                this.time.delayedCall(1000, () => {
                    if (zombie && zombie.body && zombie.active && this.player) {
                        // Resume movement toward player
                        const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, this.player.x, this.player.y);
                        zombie.body.setVelocity(Math.cos(angle) * zombie.speed, Math.sin(angle) * zombie.speed);
                    }
                });
            } catch (damageError) {
                console.error('❌ Error in zombieHitSandbag damage calculation:', damageError);
            }
        }
    }
    
    bulletHitSandbagFriendly(bullet, sandbag) {
        // Safety check: ensure bullet is valid and has the deactivate method
        if (!bullet || !bullet.active || typeof bullet.deactivate !== 'function') {
            return; // Skip processing invalid bullets
        }
        
        // Safety check: ensure sandbag is valid
        if (!sandbag || !sandbag.active || !sandbag.isActive) {
            console.warn('⚠️ Invalid sandbag in bulletHitSandbagFriendly:', {
                sandbag: !!sandbag,
                sandbagActive: sandbag ? sandbag.active : false,
                sandbagIsActive: sandbag ? sandbag.isActive : false
            });
            return; // Skip processing invalid sandbags
        }
        
        // Sandbag friendly fire prevention - bullets pass through sandbags harmlessly
        console.log('🛡️ Sandbag friendly fire prevented:', {
            bulletPos: { x: bullet.x.toFixed(2), y: bullet.y.toFixed(2) },
            sandbagPos: { x: sandbag.x.toFixed(2), y: sandbag.y.toFixed(2) }
        });
        
        try {
            // Create small sand/dust effects when bullet hits sandbag
            const dustCount = 3; // Multiple small puffs
            
            for (let i = 0; i < dustCount; i++) {
                // Random offset around the impact point
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetY = (Math.random() - 0.5) * 15;
                
                let puff;
                
                if (this.textures.exists('smoke_puff')) {
                    puff = this.add.image(sandbag.x + offsetX, sandbag.y + offsetY, 'smoke_puff');
                    puff.setScale(0.025); // Very small sand puffs
                } else {
                    // Simple fallback - tiny sandy circle
                    puff = this.add.circle(sandbag.x + offsetX, sandbag.y + offsetY, 1.5, 0xC2B280); // Sandy brown color
                }
                
                puff.setDepth(sandbag.depth + 50);
                puff.setAlpha(0.05);
                
                // Small upward drift with random spread
                this.tweens.add({
                    targets: puff,
                    y: puff.y - Phaser.Math.Between(8, 15), // Small upward movement
                    x: puff.x + Phaser.Math.Between(-8, 8), // Random horizontal drift
                    scaleX: (puff.scaleX || 1) * 1.5, // Small expansion
                    scaleY: (puff.scaleY || 1) * 1.5, // Small expansion
                    alpha: 0,
                    duration: Phaser.Math.Between(800, 1200), // Varying duration
                    ease: 'Linear',
                    onComplete: () => puff.destroy()
                });
            }
        } catch (effectError) {
            console.error('❌ Error creating sandbag bullet effect:', effectError);
        }
        
        // DO NOT deactivate bullet - let it pass through sandbag
        // bullet.deactivate(); // REMOVED - this was causing bullets to disappear
        
        console.log('💫 Bullet passed through sandbag and continues traveling');
    }
    
    checkSandbagDamageCollisions(sandbag) {
        // Safety check: ensure sandbag is valid
        if (!sandbag || !sandbag.active || !sandbag.isActive || !sandbag.body) {
            return; // Skip invalid sandbags
        }
        
        // Check zombie collisions (for attacking the sandbag) - overlap only, not blocking
        this.zombies.children.entries.forEach(zombie => {
            if (zombie && zombie.active && zombie.body && sandbag.body) {
                try {
                    if (this.physics.overlap(zombie, sandbag)) {
                        this.zombieHitSandbag(zombie, sandbag);
                    }
                } catch (overlapError) {
                    console.error('❌ Error checking zombie-sandbag overlap:', overlapError);
                }
            }
        });
        
        // Note: Friendly fire protection for sandbags is handled by bulletHitSandbagFriendly
        // Zombie bullets can damage sandbags, but friendly bullets pass through harmlessly
    }
    
    // === PLACEMENT PREVIEW SYSTEM ===
    
    createPlacementPreview(equipmentId) {
        console.log('🔨 === CREATE PLACEMENT PREVIEW DEBUG START ===');
        console.log('🔨 Creating preview for:', equipmentId);
        
        // Clean up any existing preview
        console.log('🔨 Existing preview state before cleanup:', {
            isShowingPreview: this.isShowingPreview,
            currentPreviewType: this.currentPreviewType,
            previewExists: !!this.placementPreview
        });
        this.destroyPlacementPreview();
        console.log('🔨 State after cleanup:', {
            isShowingPreview: this.isShowingPreview,
            currentPreviewType: this.currentPreviewType,
            previewExists: !!this.placementPreview
        });
        
        let textureKey = '';
        let useCustomSizing = false;
        let scale = 1;
        
        // Determine which sprite to use for preview
        switch (equipmentId) {
            case 'sentryGun':
                textureKey = 'sentry_gun_right';
                useCustomSizing = true; // SentryGun uses custom sizing approach
                console.log('🔨 Using sentry gun texture:', textureKey);
                break;
            case 'barricade':
                textureKey = 'barricade';
                // Match the exact scaling used in Barricade constructor  
                scale = 0.6; // Barricade uses 0.6 scale after SpriteScaler
                console.log('🔨 Using barricade texture:', textureKey, 'with scale:', scale);
                break;
            default:
                console.warn(`🔨 Unknown equipment type for preview: ${equipmentId}`);
                console.log('🔨 === CREATE PLACEMENT PREVIEW DEBUG END (UNKNOWN TYPE) ===');
                return;
        }
        
        // Check if texture exists
        console.log('🔨 Checking if texture exists:', textureKey);
        if (!this.textures.exists(textureKey)) {
            console.warn(`🔨 Preview texture not found: ${textureKey}`);
            console.log('🔨 Available textures:', Object.keys(this.textures.list).slice(0, 10));
            console.log('🔨 === CREATE PLACEMENT PREVIEW DEBUG END (NO TEXTURE) ===');
            return;
        }
        console.log('🔨 Texture exists, creating sprite...');
        
        // Create preview sprite
        this.placementPreview = this.add.sprite(0, 0, textureKey);
        console.log('🔨 Sprite created:', !!this.placementPreview);
        
        this.placementPreview.setAlpha(0.6); // Semi-transparent
        this.placementPreview.setDepth(1600); // Above most other objects
        console.log('🔨 Alpha and depth set');
        
        // Apply sizing to match the actual item exactly
        try {
            if (useCustomSizing && equipmentId === 'sentryGun') {
                console.log('🔨 Applying custom sizing for sentry gun...');
                // Match SentryGun's exact sizing approach
                SpriteScaler.autoScale(this.placementPreview, textureKey, { maintainAspectRatio: false });
                
                // Force exact size like SentryGun does
                if (this.placementPreview.displayWidth !== 48 || this.placementPreview.displayHeight !== 72) {
                    this.placementPreview.setDisplaySize(48, 72);
                    console.log(`🔨 Forced sentry gun preview size to 48x72 (was ${this.placementPreview.displayWidth}x${this.placementPreview.displayHeight})`);
                }
            } else {
                console.log('🔨 Applying standard scaling for barricade...');
                // Standard scaling approach for other items (like barricade)
                SpriteScaler.autoScale(this.placementPreview, textureKey, { maintainAspectRatio: true });
                // Then apply the additional scale that matches the actual item
                this.placementPreview.setScale(this.placementPreview.scaleX * scale, this.placementPreview.scaleY * scale);
                console.log('🔨 Applied scale:', scale, 'final scale:', this.placementPreview.scaleX, this.placementPreview.scaleY);
            }
        } catch (error) {
            console.warn('🔨 Could not apply SpriteScaler to preview:', error);
            // Fallback to manual scaling if SpriteScaler fails
            if (useCustomSizing && equipmentId === 'sentryGun') {
                this.placementPreview.setDisplaySize(48, 72);
                console.log('🔨 Applied fallback sizing for sentry gun');
            } else {
                this.placementPreview.setScale(scale);
                console.log('🔨 Applied fallback scale for barricade:', scale);
            }
        }
        
        this.isShowingPreview = true;
        this.currentPreviewType = equipmentId; // Track what type of preview we're showing
        
        console.log('🔨 Final preview state:', {
            isShowingPreview: this.isShowingPreview,
            currentPreviewType: this.currentPreviewType,
            previewExists: !!this.placementPreview,
            previewSize: this.placementPreview ? `${this.placementPreview.displayWidth}x${this.placementPreview.displayHeight}` : 'none'
        });
        console.log(`🔨 Created placement preview for ${equipmentId} - final size: ${this.placementPreview.displayWidth}x${this.placementPreview.displayHeight}`);
        console.log('🔨 === CREATE PLACEMENT PREVIEW DEBUG END ===');
    }
    
    updatePlacementPreview() {
        if (!this.placementPreview || !this.isShowingPreview || !this.player) {
            return;
        }
        
        // Get current equipment to verify we should still show preview
        const equipment = this.player.getCurrentSlotEquipment();
        if (!equipment || equipment.type !== 'placeable' || equipment.count <= 0) {
            this.destroyPlacementPreview();
            return;
        }
        
        // Check if equipment type has changed - if so, recreate preview
        if (this.currentPreviewType !== equipment.id) {
            this.createPlacementPreview(equipment.id);
            return; // createPlacementPreview will handle the rest
        }
        
        // Calculate placement position (same logic as in placeSentryGun/placeBarricade)
        const { placeX, placeY } = this.calculatePlacementPosition();
        
        // Update preview position
        this.placementPreview.x = placeX;
        this.placementPreview.y = placeY;
        
        // Check if placement is valid and update preview appearance
        const isValid = this.isPlacementValid(placeX, placeY, equipment.id);
        
        if (isValid) {
            this.placementPreview.setTint(0x00ff00); // Green tint for valid placement
        } else {
            this.placementPreview.setTint(0xff0000); // Red tint for invalid placement
        }
        
        // Add subtle pulsing effect
        const pulseAlpha = 0.6 + Math.sin(this.time.now * 0.005) * 0.2;
        this.placementPreview.setAlpha(pulseAlpha);
    }
    
    calculatePlacementPosition() {
        let offsetX = 0;
        let offsetY = 0;
        const placeDistance = 80; // Distance in front of player
        
        switch (this.player.direction) {
            case 'up':
                offsetY = -placeDistance;
                break;
            case 'down':
                offsetY = placeDistance;
                break;
            case 'left':
                offsetX = -placeDistance;
                break;
            case 'right':
                offsetX = placeDistance;
                break;
            case 'up-left':
                offsetX = -placeDistance * 0.707;
                offsetY = -placeDistance * 0.707;
                break;
            case 'up-right':
                offsetX = placeDistance * 0.707;
                offsetY = -placeDistance * 0.707;
                break;
            case 'down-left':
                offsetX = -placeDistance * 0.707;
                offsetY = placeDistance * 0.707;
                break;
            case 'down-right':
                offsetX = placeDistance * 0.707;
                offsetY = placeDistance * 0.707;
                break;
            default:
                // Default to placing in front (down)
                offsetY = placeDistance;
                break;
        }
        
        return {
            placeX: this.player.x + offsetX,
            placeY: this.player.y + offsetY
        };
    }
    
    isPlacementValid(placeX, placeY, equipmentId) {
        // Check if within world bounds
        if (placeX < 50 || placeX > 1998 || placeY < 50 || placeY > 1486) {
            return false;
        }
        
        // Check collision with structures
        for (let structure of this.structures.children.entries) {
            const distance = Phaser.Math.Distance.Between(placeX, placeY, structure.x, structure.y);
            const minDistance = equipmentId === 'sentryGun' ? 60 : 50;
            if (distance < minDistance) {
                return false;
            }
        }
        
        // Check collision with sentry guns
        if (this.sentryGunsList) {
            for (let sentryGun of this.sentryGunsList) {
                if (sentryGun && sentryGun.active) {
                    const distance = Phaser.Math.Distance.Between(placeX, placeY, sentryGun.x, sentryGun.y);
                    const minDistance = equipmentId === 'sentryGun' ? 80 : 60;
                    if (distance < minDistance) {
                        return false;
                    }
                }
            }
        }
        
        // Check collision with barricades
        if (this.barricadesList) {
            for (let barricade of this.barricadesList) {
                if (barricade && barricade.active) {
                    const distance = Phaser.Math.Distance.Between(placeX, placeY, barricade.x, barricade.y);
                    const minDistance = 50;
                    if (distance < minDistance) {
                        return false;
                    }
                }
            }
        }
        
        // Check collision with sandbags
        if (this.sandbagsList) {
            for (let sandbag of this.sandbagsList) {
                if (sandbag && sandbag.active && sandbag.isActive) {
                    const distance = Phaser.Math.Distance.Between(placeX, placeY, sandbag.x, sandbag.y);
                    const minDistance = 40;
                    if (distance < minDistance) {
                        return false;
                    }
                }
            }
        }
        
        return true; // Placement is valid
    }
    
    destroyPlacementPreview() {
        console.log('💥 === DESTROY PLACEMENT PREVIEW DEBUG START ===');
        console.log('💥 Current state before destroy:', {
            isShowingPreview: this.isShowingPreview,
            currentPreviewType: this.currentPreviewType,
            previewExists: !!this.placementPreview
        });
        
        if (this.placementPreview) {
            console.log('💥 Destroying preview sprite...');
            this.placementPreview.destroy();
            this.placementPreview = null;
            console.log('💥 Preview sprite destroyed');
        } else {
            console.log('💥 No preview sprite to destroy');
        }
        
        this.isShowingPreview = false;
        this.currentPreviewType = null; // Clear the tracked preview type
        
        console.log('💥 Final state after destroy:', {
            isShowingPreview: this.isShowingPreview,
            currentPreviewType: this.currentPreviewType,
            previewExists: !!this.placementPreview
        });
        console.log('💥 === DESTROY PLACEMENT PREVIEW DEBUG END ===');
    }
    
    handleEquipmentChange() {
        console.log('📋 === HANDLE EQUIPMENT CHANGE DEBUG START ===');
        const equipment = this.player.getCurrentSlotEquipment();
        
        console.log('📋 Current equipment:', {
            equipment: equipment,
            type: equipment ? equipment.type : 'none',
            id: equipment ? equipment.id : 'none',
            count: equipment ? equipment.count : 'none'
        });
        
        console.log('📋 Current preview state:', {
            isShowingPreview: this.isShowingPreview,
            currentPreviewType: this.currentPreviewType,
            previewExists: !!this.placementPreview
        });
        
        if (equipment && equipment.type === 'placeable' && equipment.count > 0) {
            console.log('📋 Equipment is placeable with count > 0');
            // Player switched to a placeable item
            const shouldCreatePreview = !this.isShowingPreview || this.currentPreviewType !== equipment.id;
            console.log('📋 Should create preview?', shouldCreatePreview, {
                notShowingPreview: !this.isShowingPreview,
                differentPreviewType: this.currentPreviewType !== equipment.id,
                currentPreviewType: this.currentPreviewType,
                equipmentId: equipment.id
            });
            
            if (shouldCreatePreview) {
                // Create new preview or recreate if equipment type changed
                console.log('📋 Creating placement preview for:', equipment.id);
                this.createPlacementPreview(equipment.id);
                console.log('📋 Preview created, new state:', {
                    isShowingPreview: this.isShowingPreview,
                    currentPreviewType: this.currentPreviewType,
                    previewExists: !!this.placementPreview
                });
            } else {
                console.log('📋 Preview already showing for same equipment type, no action needed');
            }
        } else {
            console.log('📋 Equipment is not placeable or count <= 0, destroying preview');
            // Player switched to weapon or empty slot - hide preview
            if (this.isShowingPreview) {
                console.log('📋 Destroying existing preview');
                this.destroyPlacementPreview();
                console.log('📋 Preview destroyed, new state:', {
                    isShowingPreview: this.isShowingPreview,
                    currentPreviewType: this.currentPreviewType,
                    previewExists: !!this.placementPreview
                });
            } else {
                console.log('📋 No preview to destroy');
            }
        }
        console.log('📋 === HANDLE EQUIPMENT CHANGE DEBUG END ===');
    }
}

// Make GameScene accessible globally for debugging
if (typeof window !== 'undefined') {
    window.GameScene = GameScene;
} 