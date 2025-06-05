import { Player } from '../entities/Player.js';
import { NPCPlayer } from '../entities/NPCPlayer.js';
import { Zombie } from '../entities/Zombie.js';
import { Bullet } from '../entities/Bullet.js';
import { Structure } from '../entities/Structure.js';
import { Barricade } from '../entities/Barricade.js';
import { Sandbag } from '../entities/Sandbag.js';
import { MilitaryCrate } from '../entities/MilitaryCrate.js';
import { SentryGun } from '../entities/SentryGun.js';
import { SpriteGenerator } from '../utils/SpriteGenerator.js';
import { SWATSpriteManager } from '../utils/SWATSpriteManager.js';
import { TerrainOptimizer } from '../utils/TerrainOptimizer.js';
import { SpriteScaler } from '../utils/SpriteScaler.js';
import { GameConfig } from '../utils/GameConfig.js';
import { SquadGenerator } from '../utils/SquadGenerator.js';
import { WorldGenerator } from '../modules/WorldGenerator.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.worldGenerator = new WorldGenerator();
        this.generatedWorld = null;
        this.useWorldGeneration = false;
        
        // === FOG OF WAR SYSTEM ===
        this.fogGrid = new Map(); // Stores fog tiles by grid coordinates 
        this.exploredTiles = new Set(); // Tracks which tiles have been explored
        this.fogTileSize = 64; // Should match terrain tile size
        this.discoveryRadius = 100; // Increased for slightly more visibility (was 80)
        this.fogDepth = 1800; // Render fog above all game objects but below UI
        
        // === DYNAMIC FOG REGENERATION SYSTEM ===
        this.lastVisitedTimes = new Map(); // Track when each area was last visited
        this.fogDecayTime = 45000; // 45 seconds before areas start to re-fog
        this.fogRegenerationRate = 2000; // Check for regeneration every 2 seconds
        this.lastFogRegenCheck = 0;
        
        // === CLEANUP FLAG ===
        this.cleanupCompleted = false; // Prevent double cleanup execution
    }

    preload() {
        console.log('GameScene preload() called');
        console.log('🎮 Using difficulty:', GameConfig.currentDifficulty.toUpperCase());
        
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
                targetTileSize: GameConfig.performance.terrainTileSize,
                useNearestFilter: true,
                compressLargeTextures: true
            });
            
            // Optional seamless terrain based on config
            if (GameConfig.performance.useSeamlessTextures) {
                TerrainOptimizer.createSeamlessTerrainTextures(this);
            }
            
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
        
        // Expand world bounds using config values
        const worldWidth = GameConfig.world.width;
        const worldHeight = GameConfig.world.height;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        
        // Create groups first
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: GameConfig.performance.bulletPoolSize,
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
        
        // Initialize military crates list
        this.militaryCrateList = [];
        
        this.bloodSplats = this.add.group();
        this.shellCasings = this.add.group();
        
        // === PLACEMENT PREVIEW SYSTEM ===
        this.placementPreview = null; // The preview sprite
        this.isShowingPreview = false; // Whether we're currently showing a preview
        this.lastPreviewUpdate = 0; // Time tracking for preview updates
        this.previewUpdateInterval = 50; // Update preview every 50ms for smooth movement
        
        // Create detailed crash site background and structures
        this.createCrashSiteMap();
        
        // Initialize fog of war system
        this.initializeFogOfWar();
        
        // Create player in appropriate starting area
        console.log('Creating player...');
        try {
            // Determine start position based on world generation mode
            let startX = 900; // Default classic position
            let startY = 650; // Default classic position
            
            if (this.useWorldGeneration && this.playerStartPosition) {
                startX = this.playerStartPosition.x;
                startY = this.playerStartPosition.y;
                console.log(`🏁 Using procedural start position: (${startX}, ${startY})`);
            } else {
                console.log(`🏁 Using classic start position: (${startX}, ${startY})`);
            }
            
            // Check if player textures exist (SWAT or placeholder)
            if (this.textures.exists('swat_player') || this.textures.exists('player_down')) {
                this.player = new Player(this, startX, startY);
                console.log('Player created successfully with sprites');
                console.log('Player texture:', this.player.texture.key);
                console.log('Player using SWAT sprites:', this.player.usingSWATSprites);
            } else {
                console.warn('No player textures found, creating fallback player');
                this.createFallbackPlayer(startX, startY);
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
        
        // Create squad members using config
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
        
        // Game state - use config values
        const waveSettings = GameConfig.getWaveSettings();
        this.zombiesInWave = waveSettings.zombiesFirstWave;
        this.zombiesSpawned = 0;
        this.zombieSpawnTimer = 0;
        this.waveStartDelay = waveSettings.waveStartDelay;
        this.nextWaveTimer = 0;
        this.isWaveActive = false;
        
        // Reset wave to 1 and start properly
        window.gameState.wave = 0; // Will be set to 1 in startWave
        
        // Start first wave
        console.log('Starting first wave...');
        this.startWave();
        
        // Update UI
        this.updateUI();
        
        // Press "H" to toggle collision-box visibility on-the-fly.
        this.input.keyboard.on('keydown-H', () => {
            this.showDebugBodies = !this.showDebugBodies;
            if (this.physics.world.debugGraphic) {
                this.physics.world.debugGraphic.visible = this.showDebugBodies;
            }
            console.log(`Debug hit-box overlay ${this.showDebugBodies ? 'ON' : 'OFF'}`);
        });
        
        // NOW CREATE SANDBAGS - All systems are ready!
        console.log('🛡️ All game systems initialized, now creating sandbags...');
        try {
            this.createCrashSiteSandbags();
            this.createCrashSiteBarricades(); // Add barricades to entrance gaps
            this.createCrashSiteMilitaryCrates();
        } catch (sandbagError) {
            console.error('❌ Error creating sandbags at end of create():', sandbagError);
        }
        
        console.log('GameScene create() completed');
        
        // Make this scene instance accessible for debugging
        if (typeof window !== 'undefined') {
            window.gameScene = this;
            window.NPCPlayer = NPCPlayer; // Make NPCPlayer class available for debugging
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

        // Create a debug graphic once – Phaser will draw all bodies onto this each frame when enabled.
        this.physics.world.createDebugGraphic();

        // Bump the debug graphic above the playfield but below UI text so it is always visible.
        if (this.physics.world.debugGraphic) {
            // Let the graphic scroll with the world (default scrollFactor = 1)
            this.physics.world.debugGraphic.setDepth(1500);
        }

        // Track visibility state - use config setting
        this.showDebugBodies = GameConfig.ui.showHitboxes;
        if (this.physics.world.debugGraphic) {
            this.physics.world.debugGraphic.visible = this.showDebugBodies;
        }

    }

    createCrashSiteMap() {
        console.log('Creating world map...');
        
        // Check if we should use procedural world generation
        const worldGenSettings = this.registry.get('worldGeneration');
        this.useWorldGeneration = worldGenSettings && worldGenSettings.useWorldGeneration;
        
        if (this.useWorldGeneration) {
            console.log('🌍 Using procedural world generation...');
            this.createProceduralWorld(worldGenSettings);
        } else {
            console.log('🚁 Using classic helicopter crash site...');
            this.createClassicCrashSite();
        }
    }

    createProceduralWorld(settings) {
        try {
            // Generate the world data
            this.generatedWorld = this.worldGenerator.generateWorld(settings.mapSize, settings.seed);
            
            // Update world bounds to match generated world
            const { width, height } = this.generatedWorld.size;
            this.physics.world.setBounds(0, 0, width, height);
            
            // Update game config for this session
            GameConfig.world.width = width;
            GameConfig.world.height = height;
            
            // Create terrain from generated data
            this.createProceduralTerrain();
            
            // Place generated structures
            this.createProceduralStructures();
            
            // Set player start position
            if (this.generatedWorld.playerStartPosition) {
                const startPos = this.generatedWorld.playerStartPosition;
                if (this.player) {
                    this.player.setPosition(startPos.x, startPos.y);
                }
                // Store start position for later use if player hasn't been created yet
                this.playerStartPosition = startPos;
            }
            
            console.log(`✅ Procedural world created: ${width}x${height} with seed ${this.generatedWorld.seed}`);
            
        } catch (error) {
            console.error('❌ Error creating procedural world, falling back to classic mode:', error);
            this.createClassicCrashSite();
        }
    }

    createProceduralTerrain() {
        const tileSize = 64;
        const terrainData = this.generatedWorld.terrain;
        
        console.log(`🗺️ Creating procedural terrain with ${terrainData.size} tiles...`);
        
        for (const [posKey, tileData] of terrainData.entries()) {
            const [x, y] = posKey.split(',').map(Number);
            
            let tile;
            if (this.textures.exists(tileData.type)) {
                tile = this.add.image(x + tileSize/2, y + tileSize/2, tileData.type);
                
                // Apply rotation if specified
                if (tileData.rotation) {
                    tile.setRotation(tileData.rotation);
                }
                
                // Handle sprite sizing - oversize to eliminate gaps
                const oversizeMultiplier = 1.25;
                tile.setDisplaySize(tileSize * oversizeMultiplier, tileSize * oversizeMultiplier);
                
                // Apply filtering for pixel-perfect textures
                tile.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
                
            } else {
                // Fallback to colored rectangle
                console.warn(`Texture ${tileData.type} not found, using fallback`);
                
                // Use biome color as fallback
                const biomeData = this.worldGenerator.getBiomes()[tileData.biome];
                const color = biomeData ? biomeData.color : 0xFF00FF;
                
                tile = this.add.rectangle(x + tileSize/2, y + tileSize/2, tileSize, tileSize, color);
            }
            
            tile.setDepth(-10);
        }
    }

    createProceduralStructures() {
        console.log(`📦 Placing ${this.generatedWorld.structures.length} procedural structures...`);
        
        for (const structureData of this.generatedWorld.structures) {
            try {
                let structure;
                
                if (this.textures.exists(structureData.textureKey)) {
                    // Create structure with proper configuration
                    structure = new Structure(this, structureData.x, structureData.y, structureData.textureKey, {
                        type: structureData.type,
                        material: structureData.material,
                        health: structureData.health,
                        destructible: structureData.destructible
                    });
                    
                    // Apply scaling if needed
                    if (structureData.size) {
                        structure.setDisplaySize(structureData.size.width, structureData.size.height);
                    }
                    
                } else {
                    console.warn(`Structure texture ${structureData.textureKey} not found, creating placeholder`);
                    // Create colored rectangle placeholder
                    structure = this.add.rectangle(
                        structureData.x, 
                        structureData.y, 
                        structureData.size.width, 
                        structureData.size.height, 
                        0xFF00FF
                    );
                    
                    this.physics.add.existing(structure, true);
                    structure.body.setImmovable(true);
                }
                
                // Add to structures group
                this.structures.add(structure);
                
                // Special handling for helicopter crashes
                if (structureData.structureId === 'helicopter_crash') {
                    console.log(`🚁 Placed helicopter crash at (${structureData.x}, ${structureData.y}) in ${structureData.biome} biome`);
                    
                    // Add smoke effects to helicopter crashes (but not the original helicopter + smoke)
                    // Since these are now barricades/obstacles, we'll add light smoke effects
                    this.addLightSmokeEffect(structureData.x, structureData.y);
                }
                
            } catch (error) {
                console.error(`❌ Error creating structure at (${structureData.x}, ${structureData.y}):`, error);
            }
        }
    }

    addLightSmokeEffect(x, y) {
        // Add a subtle smoke effect for procedurally placed helicopter crashes
        // Much lighter than the main crash site
        const smokeEmitter = this.add.particles(x, y - 50, 'smoke_puff', {
            scale: { start: 0.1, end: 0.3 },
            alpha: { start: 0.6, end: 0 },
            speed: { min: 10, max: 30 },
            lifespan: { min: 1000, max: 2000 },
            frequency: 800, // Less frequent than main crash
            angle: { min: -100, max: -80 }
        });
        
        smokeEmitter.setDepth(800);
        
        // Create a small fire effect
        if (this.textures.exists('small_fire')) {
            const fire = this.add.image(x - 30, y, 'small_fire');
            fire.setScale(0.3);
            fire.setDepth(750);
            fire.setAlpha(0.7);
        }
    }

    createClassicCrashSite() {
        try {
            // Create base terrain
            this.createTerrain();
            
            // Create crash site structures
            this.createCrashSiteStructures();
            
            // Create sparse vegetation
            this.createUrbanVegetation();
            
            // Create roads and paths
            this.createPaths();
            
            console.log('Classic helicopter crash site map created successfully');
        } catch (error) {
            console.error('Error creating classic crash site map, using fallback:', error);
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
        this.physics.add.existing(crashedHelicopter, true); // true = static body (already immovable)
        crashedHelicopter.body.setSize(200, 120); // Match the collision box from Structure.js
        
        // Add collision for player
        if (this.player && this.player.body) {
            this.physics.add.collider(this.player, crashedHelicopter);
        }
        
        console.log('Fallback background created');
    }
    
    createTerrain() {
        // Terrain Configuration - Use config values
        const terrainConfig = {
            tileSize: GameConfig.world.tileSize,
            worldWidth: GameConfig.world.width,
            worldHeight: GameConfig.world.height,
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
                    
                    // Handle sprite sizing - ALL terrain sprites need to be larger to eliminate gaps
                    // Most sprite files have transparent borders, so we oversize them to ensure seamless tiling
                    const oversizeMultiplier = 1.25; // 25% larger to cover transparent borders
                    tile.setDisplaySize(tileSize * oversizeMultiplier, tileSize * oversizeMultiplier);
                    
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
                    
                    // Create fallback colored rectangles - MAKE THEM BRIGHT PINK FOR DEBUG
                    let color = 0xFF00FF; // BRIGHT PINK to identify missing terrain textures
                    
                    tile = this.add.rectangle(x + tileSize/2, y + tileSize/2, tileSize, tileSize, color);
                    
                    // Add debug label for terrain
                    const terrainLabel = this.add.text(x + tileSize/2, y + tileSize/2, `TERRAIN:\n${terrainType}`, {
                        fontSize: '8px',
                        fill: '#FFFFFF',
                        fontFamily: 'Arial',
                        backgroundColor: '#FF00FF',
                        padding: { x: 1, y: 1 },
                        align: 'center'
                    });
                    terrainLabel.setOrigin(0.5);
                    terrainLabel.setDepth(-5); // Above terrain but below other objects
                    
                    console.warn(`🚨 Missing terrain texture: ${terrainType} at (${x}, ${y})`);
                }
                tile.setDepth(-10);
            }
        }
    }
    
    createCrashSiteStructures() {
        console.log('Creating crash site structures...');
        
        try {
            // Main crashed helicopter at center - SIMPLE VISIBLE PLACEHOLDER instead of invisible fallback
            let helicopter;
            if (this.textures.exists('crashed_helicopter')) {
                // Use actual helicopter texture if available
                helicopter = this.createStructureWithFallback(1000, 750, 'crashed_helicopter', {
                    type: 'crashed_helicopter',
                    material: 'metal',
                    health: 1500,
                    destructible: false
                }, 0x2F4F4F, 240, 160);
            } else {
                // Create simple visible dark gray rectangle placeholder
                console.log('🚁 Creating visible helicopter placeholder (crashed_helicopter texture not found)');
                helicopter = this.add.rectangle(1000, 750, 240, 160, 0x2F4F4F);
                helicopter.setDepth(750);
                helicopter.setAlpha(0.8); // Make it clearly visible
                
                // Add physics body for collision
                this.physics.add.existing(helicopter, true);
                helicopter.body.setImmovable(true);
                helicopter.body.setSize(200, 120);
                
                // Add to structures group
                this.structures.add(helicopter);
            }
            
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
                // DISABLED: const testSandbag = this.add.rectangle(950, 700, 48, 32, 0xC2B280); // Brown rectangle
                // DISABLED: testSandbag.setDepth(700);
                console.log("✅ TEST: Second test sandbag creation disabled (was creating duplicate brown rectangle)");
            } catch (testError) {
                console.error('❌ TEST: Failed to create simple sandbag rectangle:', testError);
            }
            
            
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
                        console.error('❌ Sandbag state:', {
                            exists: !!sandbag,
                            active: sandbag ? sandbag.active : 'N/A',
                            isActive: sandbag ? sandbag.isActive : 'N/A',
                            hasTexture: sandbag && sandbag.texture ? sandbag.texture.key : 'N/A',
                            visible: sandbag ? sandbag.visible : 'N/A',
                            alpha: sandbag ? sandbag.alpha : 'N/A'
                        });
                        return;
                    }
                    
                    // Additional validation: check for invalid/broken sandbag objects
                    const isInvalidSandbag = !sandbag.texture || 
                                           sandbag.texture === null ||
                                           sandbag.visible === false ||
                                           sandbag.alpha === 0 ||
                                           sandbag.displayWidth === 0 ||
                                           sandbag.displayHeight === 0;
                    
                    if (isInvalidSandbag) {
                        console.error('❌ Sandbag failed extended validation - object is broken:', {
                            position: `(${pos.x}, ${pos.y})`,
                            hasTexture: !!sandbag.texture,
                            textureKey: sandbag.texture ? sandbag.texture.key : 'null',
                            visible: sandbag.visible,
                            alpha: sandbag.alpha,
                            displaySize: `${sandbag.displayWidth}x${sandbag.displayHeight}`
                        });
                        
                        // Clean up the broken sandbag
                        if (sandbag.destroy && typeof sandbag.destroy === 'function') {
                            try {
                                sandbag.destroy();
                            } catch (destroyError) {
                                console.error('❌ Error destroying broken sandbag:', destroyError);
                            }
                        }
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
    
    createCrashSiteBarricades() {
        console.log('🛡️ Creating defensive barricades in entrance gaps...');
        
        // Early safety check: ensure all required systems are ready
        if (!this.textures || !this.physics || !this.player) {
            console.error('❌ Required game systems not ready for barricade creation, skipping barricades');
            return;
        }
        
        // Check if barricade texture exists before proceeding
        if (!this.textures.exists('barricade')) {
            console.error('❌ Barricade texture not found, skipping barricade creation');
            return;
        }
        
        console.log('✅ Barricade texture found, proceeding with creation');
        
        try {
            const helicopterX = 1000;
            const helicopterY = 750;
            
            // Create barricades to partially block entrance gaps in the sandbag perimeter
            // These positions correspond to the gaps left in the sandbag layout
            const barricadePositions = [
                // Main northern entrance - place barricades to create a chokepoint but not block completely
                {x: helicopterX - 20, y: helicopterY - 180}, // Left side of northern gap
                {x: helicopterX + 20, y: helicopterY - 180}, // Right side of northern gap
                
                // Southern entrances - create partial blocks
                {x: helicopterX - 90, y: helicopterY + 180}, // Left southern entrance
                {x: helicopterX + 80, y: helicopterY + 180}, // Right southern entrance
                
                // Western entrance - single barricade in center
                {x: helicopterX - 250, y: helicopterY}, // Western entrance center
                
                // Eastern entrance - single barricade in center
                {x: helicopterX + 250, y: helicopterY}, // Eastern entrance center
                
                // Additional tactical positions for better defense
                {x: helicopterX - 40, y: helicopterY - 200}, // Forward left position
                {x: helicopterX + 40, y: helicopterY - 200}, // Forward right position
            ];
            
            console.log(`🛡️ Attempting to create ${barricadePositions.length} entrance barricades...`);
            let successfulBarricades = 0;
            
            barricadePositions.forEach((pos, index) => {
                try {
                    console.log(`🛡️ Creating barricade ${index + 1}/${barricadePositions.length} at (${pos.x}, ${pos.y})`);
                    const barricade = new Barricade(this, pos.x, pos.y);
                    
                    // Check if barricade creation was successful
                    if (!barricade || !barricade.active || !barricade.isActive) {
                        console.error('❌ Barricade creation failed at', pos.x, pos.y);
                        return;
                    }
                    
                    // Add to barricades list for updates
                    if (!this.barricadesList) {
                        this.barricadesList = [];
                    }
                    this.barricadesList.push(barricade);
                    successfulBarricades++;
                    
                    // Set up solid collisions for this barricade (blocks movement) - only if has body
                    if (barricade.body) {
                        try {
                            console.log('🛡️ Setting up colliders for entrance barricade...');
                            
                            // Set up colliders
                            this.physics.add.collider(this.player, barricade, (player, barricadeObj) => {
                                if (player && barricadeObj && player.active && barricadeObj.active) {
                                }
                            });
                            
                            this.physics.add.collider(this.squadMembers, barricade, (unit, barricadeObj) => {
                                if (unit && barricadeObj && unit.active && barricadeObj.active) {
                                }
                            });
                            
                            this.physics.add.collider(this.zombies, barricade, (zombie, barricadeObj) => {
                                if (zombie && barricadeObj && zombie.active && barricadeObj.active) {
                                }
                            });
                            
                            // Add friendly fire protection for this barricade
                            this.physics.add.overlap(this.bullets, barricade, this.bulletHitBarricadeFriendly, null, this);
                            
                            console.log('✅ Colliders set up successfully for entrance barricade');
                            
                        } catch (colliderError) {
                            console.error('❌ Error setting up barricade colliders (keeping barricade anyway):', colliderError);
                        }
                    } else {
                        console.log('🛡️ Skipping collider setup for barricade without physics body');
                    }
                    
                    console.log(`✅ Entrance barricade ${index + 1} placed successfully at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
                    
                } catch (barricadeError) {
                    console.error(`❌ Critical error creating barricade ${index + 1} at`, pos.x, pos.y, ':', barricadeError);
                }
            });
            
            console.log(`🛡️ Entrance barricade creation complete: ${successfulBarricades}/${barricadePositions.length} successful`);
            
            if (successfulBarricades === 0) {
                console.error('❌ No entrance barricades were created successfully!');
            } else {
                console.log(`✅ Created ${successfulBarricades} entrance barricades with strategic positioning:`);
                console.log('   - Northern entrance: Partial chokepoint with side barricades');
                console.log('   - Southern entrances: Individual barricades for each gap');
                console.log('   - Eastern/Western entrances: Central blocking positions');
                console.log('   - Forward positions: Advanced defensive cover');
            }
            
        } catch (error) {
            console.error('Error creating entrance barricades:', error);
            console.error('❌ Falling back to no entrance barricades due to critical error');
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
                console.warn(`🚨 MISSING TEXTURE: ${textureKey} not found at position (${x}, ${y}) - creating BRIGHT PINK fallback to identify it!`);
                // Create a BRIGHT PINK rectangle so we can easily spot which texture is missing
                const fallbackRect = this.add.rectangle(x, y, width, height, 0xFF00FF); // BRIGHT PINK
                fallbackRect.setDepth(y + height);
                
                // MAKE FALLBACK SUPER VISIBLE: Bright pink with full opacity
                fallbackRect.setAlpha(1.0); // Full opacity so it's impossible to miss
                
                // Add text label to identify the missing texture
                const debugLabel = this.add.text(x, y, `MISSING:\n${textureKey}`, {
                    fontSize: '10px',
                    fill: '#FFFFFF',
                    fontFamily: 'Arial',
                    backgroundColor: '#FF00FF',
                    padding: { x: 2, y: 2 },
                    align: 'center'
                });
                debugLabel.setOrigin(0.5);
                debugLabel.setDepth(y + height + 1);
                
                // Add basic physics body for collision
                this.physics.add.existing(fallbackRect, true);
                fallbackRect.body.setSize(width * 0.8, height * 0.8);
                fallbackRect.body.setImmovable(true);
                
                console.warn(`🚨 Created BRIGHT PINK fallback rectangle for missing texture: ${textureKey}`);
                return fallbackRect;
            }
        } catch (error) {
            console.error(`Error creating structure ${textureKey}:`, error);
            // Create minimal fallback
            const fallbackRect = this.add.rectangle(x, y, width || 32, height || 32, 0xFF00FF); // BRIGHT PINK
            fallbackRect.setDepth(y + (height || 32));
            console.warn(`🚨 Created EMERGENCY PINK fallback for failed structure: ${textureKey}`);
            return fallbackRect;
        }
    }
    

    createUrbanVegetation() {
        console.log('Creating sparse urban vegetation...');
        
        try {
            // DISABLED: Sparse palm trees (were creating invisible collision boxes when textures missing)
            // const palmPositions = [
            //     {x: 200, y: 300}, {x: 1800, y: 400}, {x: 300, y: 1200}, {x: 1700, y: 1100}
            // ];
            // 
            // palmPositions.forEach(pos => {
            //     const palmTree = this.createStructureWithFallback(pos.x, pos.y, 'palm_tree', {
            //         type: 'palm_tree',
            //         material: 'wood',
            //         health: 120,
            //         destructible: true
            //     }, 0x8B7355, 48, 80);
            //     
            //     // Trees are automatically scaled in createStructureWithFallback now
            // });
            
            // DISABLED: Dead trees (were creating invisible collision boxes when textures missing)
            // const deadTreePositions = [
            //     {x: 150, y: 800}, {x: 1900, y: 600}, {x: 400, y: 1300}
            // ];
            // 
            // deadTreePositions.forEach(pos => {
            //     const deadTree = this.createStructureWithFallback(pos.x, pos.y, 'dead_tree', {
            //         type: 'dead_tree',
            //         material: 'wood',
            //         health: 60,
            //         destructible: true
            //     }, 0x654321, 32, 64);
            //     
            //     // Trees are automatically scaled in createStructureWithFallback now
            // });
            
            // Scrub bushes (non-collidable decoration) - THESE ARE FINE since they don't use createStructureWithFallback
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
        
        // Update fog of war discovery system
        this.updateFogOfWar();
        
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
        
        // Update military crates
        if (this.militaryCrateList) {
            this.militaryCrateList = this.militaryCrateList.filter(militaryCrate => {
                if (!militaryCrate || typeof militaryCrate !== 'object') {
                    return false;
                }
                
                if (militaryCrate && militaryCrate.active && militaryCrate.isActive) {
                    try {
                        militaryCrate.update(time, delta);
                        return true;
                    } catch (updateError) {
                        console.error('❌ Error updating military crate:', updateError);
                        return false;
                    }
                } else {
                    return false;
                }
            });
        }
        
        // Check for military crate collection
        this.checkMilitaryCrateCollection();
        
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
        
        // Use progressive spawn delay for current wave
        const currentWave = window.gameState.wave || 1;
        const waveSettings = GameConfig.getWaveSettings(currentWave);
        
        if (this.zombiesSpawned < this.zombiesInWave && this.zombieSpawnTimer > waveSettings.zombieSpawnDelay) {
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
        const worldWidth = GameConfig.world.width;
        const worldHeight = GameConfig.world.height;
        
        let spawnX, spawnY;
        const side = Phaser.Math.Between(0, 3);
        const margin = GameConfig.spawning.zombieSpawnMargin;
        const minDistanceFromPlayer = GameConfig.spawning.zombieSpawnDistance;
        
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
        } while (Phaser.Math.Distance.Between(spawnX, spawnY, playerX, playerY) < minDistanceFromPlayer && attempts < GameConfig.spawning.maxSpawnAttempts);
        
        // Get progressive zombie stats for current wave
        const currentWave = window.gameState.wave || 1;
        const zombieStats = GameConfig.getZombieStats(currentWave);
        
        const zombie = new Zombie(this, spawnX, spawnY, zombieStats);
        this.zombies.add(zombie);
        
        // Log progressive scaling info for first zombie of each wave
        if (this.zombiesSpawned === 1) {
            console.log(`🧟 Wave ${currentWave} zombie stats:`, {
                health: zombieStats.health,
                speed: zombieStats.speed,
                scaling: zombieStats._scaling
            });
        }
        
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
        
        // Check for solid structures that block bullets (excluding sandbags and barricades which bullets pass through)
        if (this.structures) {
            this.structures.children.entries.forEach(structure => {
                if (structure && structure.active && 
                   structure.structureType !== 'sandbags' && 
                   structure.structureType !== 'barricade') {
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
        
        // Also check barricades in barricadesList (but allow shooting through them)
        // Note: We don't block line of sight for barricades since bullets pass through them
        // This comment is here for clarity - barricades are intentionally excluded from blocking
        
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
        
        // Set zombies per wave using progressive scaling
        const currentWave = window.gameState.wave;
        const waveSettings = GameConfig.getWaveSettings(currentWave);
        
        if (currentWave === 1) {
            this.zombiesInWave = waveSettings.zombiesFirstWave;
        } else {
            this.zombiesInWave = Math.min(
                waveSettings.zombiesFirstWave + (currentWave - 1) * waveSettings.zombiesWaveIncrement,
                waveSettings.maxZombiesPerWave
            );
        }
        
        this.zombiesSpawned = 0;
        this.isWaveActive = true;
        
        // Get progressive scaling info for display
        const progressiveScaling = GameConfig.getProgressiveScaling(currentWave);
        const zombieStats = GameConfig.getZombieStats(currentWave);
        
        // Log progressive difficulty info
        console.log(`🌊 Wave ${currentWave} Progressive Scaling:`, {
            zombieCount: this.zombiesInWave,
            spawnDelay: `${waveSettings.zombieSpawnDelay}ms (${waveSettings._scaling?.spawnDelayMultiplier.toFixed(2)}x)`,
            zombieHealth: `${zombieStats.health} (${progressiveScaling.healthMultiplier.toFixed(2)}x)`,
            zombieSpeed: `${zombieStats.speed} (${progressiveScaling.speedMultiplier.toFixed(2)}x)`,
            progressiveMultipliers: {
                health: `+${((progressiveScaling.healthMultiplier - 1) * 100).toFixed(0)}%`,
                speed: `+${((progressiveScaling.speedMultiplier - 1) * 100).toFixed(0)}%`,
                spawnRate: `${((1 - progressiveScaling.spawnDelayMultiplier) * 100).toFixed(0)}% faster`
            }
        });
        
        // Spawn random military crates with each wave (after wave 1)
        if (currentWave > 1) {
            const cratesPerWave = Math.min(currentWave - 1, 3); // 1-3 crates per wave
            console.log(`📦 Spawning ${cratesPerWave} random crates for wave ${currentWave}`);
            this.spawnRandomCrates(cratesPerWave);
        }
        
        
        window.updateUI.wave(currentWave);
        window.updateUI.zombiesLeft(this.zombiesInWave);
        
        // Enhanced wave start message with scaling info
        const scalingText = currentWave > 1 ? 
            `\n+${((progressiveScaling.healthMultiplier - 1) * 100).toFixed(0)}% Health, +${((progressiveScaling.speedMultiplier - 1) * 100).toFixed(0)}% Speed` : 
            '';
        
        const waveStartText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 
            `Wave ${currentWave}${scalingText}`, {
            fontSize: currentWave > 1 ? '42px' : '48px',
            fill: currentWave > 1 ? '#ff6600' : '#ff0000',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
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
        
        // Update military crates depth
        if (this.militaryCrateList) {
            this.militaryCrateList.forEach(militaryCrate => {
                if (militaryCrate && militaryCrate.active) {
                    militaryCrate.setDepth(militaryCrate.y);
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
        console.log('🎮 Game Over - Starting cleanup...');
        
        // Comprehensive cleanup before scene transition
        this.cleanupBeforeDestroy();
        
        this.scene.start('GameOverScene', {
            score: window.gameState.score,
            wave: window.gameState.wave,
            zombiesKilled: window.gameState.zombiesKilled
        });
    }
    
    /**
     * Comprehensive cleanup method to prevent destroy errors
     * Called before scene shutdown
     */
    cleanupBeforeDestroy() {
        // Prevent double cleanup execution
        if (this.cleanupCompleted) {
            console.log('🧹 Cleanup already completed, skipping...');
            return;
        }
        
        console.log('🧹 Starting comprehensive scene cleanup...');
        
        try {
            // 1. Clean up placement preview system
            this.destroyPlacementPreview();
            
            // 2. Clean up command wheel system
            this.forceCleanupCommandWheel();
            
            // 3. Clean up ping system
            this.forceCleanupPings();
            
            // 4. Clean up move cursor
            this.hideMoveCursor();
            
            // 5. Clean up squad UI elements
            this.cleanupSquadUI();
            
            // 6. Remove input listeners
            this.removeInputListeners();
            
            // 7. Clean up tweens
            this.cleanupAllTweens();
            
            // 8. Clear object references
            this.clearObjectReferences();
            
            // Mark cleanup as completed
            this.cleanupCompleted = true;
            
            console.log('✅ Scene cleanup completed successfully');
            
        } catch (error) {
            console.warn('⚠️ Error during scene cleanup:', error);
            // Continue with scene transition even if cleanup fails
            this.cleanupCompleted = true;
        }
    }
    
    /**
     * Force cleanup of command wheel elements
     */
    forceCleanupCommandWheel() {
        try {
            // Stop input listeners
            if (this.input) {
                this.input.off('pointermove', this.updateCommandWheelSelection, this);
            }
            
            // Destroy all command wheel elements
            if (this.commandWheelElements && Array.isArray(this.commandWheelElements)) {
                this.commandWheelElements.forEach(element => {
                    if (element && element.active && typeof element.destroy === 'function') {
                        try {
                            if (this.tweens) {
                                this.tweens.killTweensOf(element);
                            }
                            element.destroy();
                        } catch (destroyError) {
                            console.warn('Error destroying command wheel element:', destroyError);
                        }
                    }
                });
            }
            
            // Clear references safely
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
            
        } catch (error) {
            console.warn('Error in forceCleanupCommandWheel:', error);
        }
    }
    
    /**
     * Force cleanup of ping markers and related objects
     */
    forceCleanupPings() {
        try {
            // Clean up ping marker
            if (this.pingMarker) {
                if (this.pingMarker.active && typeof this.pingMarker.destroy === 'function') {
                    if (this.tweens) {
                        this.tweens.killTweensOf(this.pingMarker);
                    }
                    this.pingMarker.destroy();
                }
                this.pingMarker = null;
            }
            
            // Clean up ping text marker
            if (this.pingTextMarker) {
                if (this.pingTextMarker.active && typeof this.pingTextMarker.destroy === 'function') {
                    if (this.tweens) {
                        this.tweens.killTweensOf(this.pingTextMarker);
                    }
                    this.pingTextMarker.destroy();
                }
                this.pingTextMarker = null;
            }
            
            // Clear references safely
            this.pingTarget = null;
            this.pingLocation = null;
            
        } catch (error) {
            console.warn('Error in forceCleanupPings:', error);
        }
    }
    
    /**
     * Clean up squad UI elements
     */
    cleanupSquadUI() {
        try {
            // Clean up squad mode UI elements
            if (this.squadModeText && this.squadModeText.active && typeof this.squadModeText.destroy === 'function') {
                this.squadModeText.destroy();
            }
            this.squadModeText = null;
            
            if (this.squadInstructionText && this.squadInstructionText.active && typeof this.squadInstructionText.destroy === 'function') {
                this.squadInstructionText.destroy();
            }
            this.squadInstructionText = null;
            
        } catch (error) {
            console.warn('Error in cleanupSquadUI:', error);
        }
    }
    
    /**
     * Remove input event listeners
     */
    removeInputListeners() {
        try {
            if (this.input) {
                // Remove any remaining pointermove listeners
                this.input.off('pointermove');
                
                // Remove pointer down listeners
                this.input.off('pointerdown');
            }
            
        } catch (error) {
            console.warn('Error removing input listeners:', error);
        }
    }
    
    /**
     * Clean up all active tweens
     */
    cleanupAllTweens() {
        try {
            if (this.tweens) {
                // Kill all tweens to prevent them from trying to operate on destroyed objects
                this.tweens.killAll();
            }
        } catch (error) {
            console.warn('Error cleaning up tweens:', error);
        }
    }
    
    /**
     * Clear object references to prevent memory leaks
     */
    clearObjectReferences() {
        try {
            // Clear debug references
            this.debugHighlights = null;
            
            // Clear move command references
            this.moveCommandActive = false;
            this.moveCursor = null;
            this.moveCursorH = null;
            this.moveCursorV = null;
            this.moveCursorDot = null;
            
            // Clear fog system references (but don't destroy - let Phaser handle it)
            // Just clear the maps to prevent memory leaks
            if (this.fogGrid) {
                this.fogGrid.clear();
            }
            if (this.exploredTiles) {
                this.exploredTiles.clear();
            }
            if (this.lastVisitedTimes) {
                this.lastVisitedTimes.clear();
            }
            
        } catch (error) {
            console.warn('Error clearing object references:', error);
        }
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
            const militaryCrateCount = this.militaryCrateList ? this.militaryCrateList.length : 0;
            const currentEquipment = this.player ? this.player.getCurrentSlotEquipment() : null;
            const equipmentInfo = currentEquipment ? `${currentEquipment.name}${currentEquipment.count !== undefined ? ` (${currentEquipment.count})` : ''}` : 'None';
            
            this.debugText.setText([
                `Zombies: ${zombieCount}`,
                `Squad Members: ${squadCount}`,
                `Sentry Guns: ${sentryCount}`,
                `Barricades: ${barricadeCount} (including entrance barriers)`,
                `Sandbags: ${sandbagCount}`,
                `Military Crates: ${militaryCrateCount}`,
                `Slot ${this.player ? this.player.currentSlot : 1}: ${equipmentInfo}`,
                `Wave: ${window.gameState.wave || 1}`,
                `Score: ${window.gameState.score || 0}`,
                `Fog: ${this.fogGrid ? this.fogGrid.size : 0} tiles | Explored: ${this.exploredTiles ? this.exploredTiles.size : 0} | Tracked areas: ${this.lastVisitedTimes ? this.lastVisitedTimes.size : 0}`,
                '',
                'Press 1: Machine Gun, 2: Sentry Gun, 3: Barricade',
                'Press SPACE to shoot/place (Green=Valid, Red=Invalid)',
                'Walk into crates to collect ammo, health, or barricades!'
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

    createFallbackPlayer(startX = 900, startY = 650) {
        this.player = this.add.rectangle(startX, startY, 48, 64, 0x00ff00);
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
        // Create NPC squad members using config
        const squadConfig = GameConfig.getSquadConfig();
        
        console.log(`🎖️ Creating squad with ${squadConfig.size} members (difficulty: ${GameConfig.currentDifficulty})`);
        
        // Create each squad member based on config
        for (let i = 0; i < squadConfig.size; i++) {
            const config = squadConfig.members[i];
            if (!config) break; // No more configurations available
            
            try {
                // Start squad members near the main player
                const startX = this.player.x + config.formationOffset.x;
                const startY = this.player.y + config.formationOffset.y;
                
                const squadMember = new NPCPlayer(this, startX, startY, config);
                this.squadMembers.add(squadMember);
                
                console.log(`✅ Created squad member: ${config.name}`);
            } catch (error) {
                console.error(`Error creating squad member '${config.name}':`, error);
            }
        }
        
        console.log(`🎖️ Squad creation complete: ${this.squadMembers.children.size}/${squadConfig.size} members active`);
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
        
        try {
            if (this.placementPreview) {
                console.log('💥 Destroying preview sprite...');
                // Kill any tweens targeting the preview to prevent destroy errors
                if (this.tweens) {
                    this.tweens.killTweensOf(this.placementPreview);
                }
                // Check if the preview is still active before destroying
                if (this.placementPreview.active && typeof this.placementPreview.destroy === 'function') {
                    this.placementPreview.destroy();
                }
                this.placementPreview = null;
                console.log('💥 Preview sprite destroyed');
            } else {
                console.log('💥 No preview sprite to destroy');
            }
        } catch (error) {
            console.warn('💥 Error destroying placement preview:', error);
            // Ensure references are cleared even if destroy fails
            this.placementPreview = null;
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
    
    /**
     * Debug method to find and highlight invisible physics bodies
     * Call from browser console: gameScene.debugInvisibleBodies()
     */
    debugInvisibleBodies() {
        console.log('🔍 DEBUGGING INVISIBLE PHYSICS BODIES');
        console.log('=====================================');
        
        let foundInvisible = 0;
        
        // Check all physics bodies in the world
        this.physics.world.bodies.entries.forEach((body, index) => {
            if (body && body.gameObject) {
                const obj = body.gameObject;
                
                // Check if object has physics but is invisible/transparent
                const isInvisible = obj.alpha === 0 || 
                                  !obj.visible || 
                                  (obj.tint !== undefined && obj.tint === 0x000000) ||
                                  (obj.texture && obj.texture.key === '__MISSING') ||
                                  obj.displayWidth === 0 ||
                                  obj.displayHeight === 0;
                
                const hasNoTexture = obj.texture && (obj.texture.key === '__DEFAULT' || obj.texture.key === '__MISSING');
                
                if (isInvisible || hasNoTexture || obj.alpha < 0.1) {
                    foundInvisible++;
                    
                    console.log(`🚨 FOUND INVISIBLE BODY ${foundInvisible}:`, {
                        position: `(${obj.x.toFixed(1)}, ${obj.y.toFixed(1)})`,
                        size: `${obj.displayWidth}x${obj.displayHeight}`,
                        alpha: obj.alpha,
                        visible: obj.visible,
                        texture: obj.texture ? obj.texture.key : 'none',
                        tint: obj.tint ? `0x${obj.tint.toString(16)}` : 'none',
                        constructor: obj.constructor.name,
                        structureType: obj.structureType || 'unknown',
                        bodyType: body.isStatic ? 'static' : 'dynamic',
                        bodySize: `${body.width}x${body.height}`
                    });
                    
                    // Make it visible with bright yellow highlight
                    const highlight = this.add.rectangle(obj.x, obj.y, body.width, body.height, 0xFFFF00, 0.7);
                    highlight.setDepth(3000);
                    highlight.setStrokeStyle(3, 0xFF0000);
                    
                    // Add debug label
                    const label = this.add.text(obj.x, obj.y, `INVISIBLE:\n${obj.constructor.name}\n${obj.structureType || 'unknown'}\nTexture: ${obj.texture ? obj.texture.key : 'none'}`, {
                        fontSize: '10px',
                        fill: '#000000',
                        fontFamily: 'Arial',
                        backgroundColor: '#FFFF00',
                        padding: { x: 3, y: 2 },
                        align: 'center'
                    });
                    label.setOrigin(0.5);
                    label.setDepth(3001);
                    
                    // Store references for cleanup
                    if (!this.debugHighlights) this.debugHighlights = [];
                    this.debugHighlights.push(highlight, label);
                }
            }
        });
        
        // Also check sandbags list specifically
        if (this.sandbagsList) {
            console.log('\n🛡️ CHECKING SANDBAGS LIST:');
            this.sandbagsList.forEach((sandbag, index) => {
                if (sandbag) {
                    console.log(`Sandbag ${index + 1}:`, {
                        position: `(${sandbag.x}, ${sandbag.y})`,
                        active: sandbag.active,
                        isActive: sandbag.isActive,
                        visible: sandbag.visible,
                        alpha: sandbag.alpha,
                        texture: sandbag.texture ? sandbag.texture.key : 'none',
                        displaySize: `${sandbag.displayWidth}x${sandbag.displayHeight}`,
                        bodyExists: !!sandbag.body,
                        bodySize: sandbag.body ? `${sandbag.body.width}x${sandbag.body.height}` : 'none'
                    });
                    
                    // Highlight problematic sandbags
                    if (sandbag.alpha < 0.1 || !sandbag.visible || sandbag.displayWidth === 0) {
                        const highlight = this.add.rectangle(sandbag.x, sandbag.y, 48, 32, 0x00FFFF, 0.8);
                        highlight.setDepth(3000);
                        highlight.setStrokeStyle(3, 0x0000FF);
                        
                        const label = this.add.text(sandbag.x, sandbag.y, `PROBLEM SANDBAG\nAlpha: ${sandbag.alpha}\nVisible: ${sandbag.visible}`, {
                            fontSize: '9px',
                            fill: '#000000',
                            fontFamily: 'Arial',
                            backgroundColor: '#00FFFF',
                            padding: { x: 2, y: 1 },
                            align: 'center'
                        });
                        label.setOrigin(0.5);
                        label.setDepth(3001);
                        
                        if (!this.debugHighlights) this.debugHighlights = [];
                        this.debugHighlights.push(highlight, label);
                    }
                }
            });
        }
        
        console.log(`\n📊 SUMMARY: Found ${foundInvisible} invisible physics bodies`);
        if (foundInvisible > 0) {
            console.log('🔧 To clear highlights: gameScene.clearDebugHighlights()');
        } else {
            console.log('✅ No invisible physics bodies found!');
        }
    }
    
    /**
     * Clear debug highlights
     */
    clearDebugHighlights() {
        if (this.debugHighlights) {
            this.debugHighlights.forEach(highlight => {
                if (highlight && highlight.destroy) {
                    highlight.destroy();
                }
            });
            this.debugHighlights = [];
            console.log('🧹 Debug highlights cleared');
        }
    }
    
    /**
     * Debug sandbag texture and creation issues
     * Call from browser console: gameScene.debugSandbags()
     */
    debugSandbags() {
        console.log('🛡️ DEBUGGING SANDBAG SYSTEM');
        console.log('============================');
        
        // Check if sandbag texture is loaded
        const sandbagTextureExists = this.textures.exists('sandbags');
        console.log('🖼️ Sandbag texture exists:', sandbagTextureExists);
        
        if (sandbagTextureExists) {
            const texture = this.textures.get('sandbags');
            console.log('📊 Sandbag texture info:', {
                key: texture.key,
                width: texture.source[0].width,
                height: texture.source[0].height,
                hasImage: !!texture.source[0].image
            });
        } else {
            console.error('❌ Sandbag texture is missing!');
        }
        
        // Check sandbags list
        if (this.sandbagsList) {
            console.log(`\n🗂️ Sandbags list contains ${this.sandbagsList.length} items:`);
            
            this.sandbagsList.forEach((sandbag, index) => {
                if (sandbag) {
                    const info = {
                        index: index + 1,
                        position: `(${sandbag.x.toFixed(1)}, ${sandbag.y.toFixed(1)})`,
                        active: sandbag.active,
                        isActive: sandbag.isActive,
                        visible: sandbag.visible,
                        alpha: sandbag.alpha,
                        textureKey: sandbag.texture ? sandbag.texture.key : 'NONE',
                        displaySize: `${sandbag.displayWidth}x${sandbag.displayHeight}`,
                        scaleX: sandbag.scaleX,
                        scaleY: sandbag.scaleY,
                        depth: sandbag.depth,
                        tint: sandbag.tint ? `0x${sandbag.tint.toString(16)}` : 'none',
                        usesFallback: sandbag.usesFallback || false,
                        hasBody: !!sandbag.body,
                        bodyInfo: sandbag.body ? {
                            width: sandbag.body.width,
                            height: sandbag.body.height,
                            x: sandbag.body.x,
                            y: sandbag.body.y,
                            static: sandbag.body.isStatic,
                            immovable: sandbag.body.immovable
                        } : 'NO BODY'
                    };
                    
                    console.log(`Sandbag ${index + 1}:`, info);
                    
                    // Identify potential problems
                    const problems = [];
                    if (!sandbag.active) problems.push('NOT_ACTIVE');
                    if (!sandbag.isActive) problems.push('NOT_IS_ACTIVE');
                    if (!sandbag.visible) problems.push('NOT_VISIBLE');
                    if (sandbag.alpha < 0.1) problems.push('TRANSPARENT');
                    if (sandbag.displayWidth === 0 || sandbag.displayHeight === 0) problems.push('ZERO_SIZE');
                    if (!sandbag.texture || sandbag.texture.key === '__DEFAULT' || sandbag.texture.key === '__MISSING') problems.push('BAD_TEXTURE');
                    if (sandbag.body && (sandbag.body.width === 0 || sandbag.body.height === 0)) problems.push('ZERO_BODY');
                    
                    if (problems.length > 0) {
                        console.warn(`⚠️ Sandbag ${index + 1} has problems:`, problems.join(', '));
                        
                        // Highlight problematic sandbag
                        const highlight = this.add.rectangle(sandbag.x, sandbag.y, 60, 40, 0xFF00FF, 0.8);
                        highlight.setDepth(3000);
                        highlight.setStrokeStyle(4, 0xFFFF00);
                        
                        const label = this.add.text(sandbag.x, sandbag.y, `PROBLEM SANDBAG ${index + 1}\n${problems.join('\n')}`, {
                            fontSize: '8px',
                            fill: '#000000',
                            fontFamily: 'Arial',
                            backgroundColor: '#FF00FF',
                            padding: { x: 2, y: 1 },
                            align: 'center'
                        });
                        label.setOrigin(0.5);
                        label.setDepth(3001);
                        
                        if (!this.debugHighlights) this.debugHighlights = [];
                        this.debugHighlights.push(highlight, label);
                    }
                } else {
                    console.warn(`⚠️ Sandbag ${index + 1} is null/undefined`);
                }
            });
        } else {
            console.log('❌ No sandbags list found');
        }
        
        console.log('\n🔧 To clear highlights: gameScene.clearDebugHighlights()');
        console.log('🔧 To check all invisible bodies: gameScene.debugInvisibleBodies()');
    }
    
    // === MILITARY CRATE SYSTEM ===
    
    checkMilitaryCrateCollection() {
        if (!this.player || !this.militaryCrateList || this.militaryCrateList.length === 0) {
            return;
        }
        
        this.militaryCrateList.forEach(crate => {
            if (crate && crate.active && crate.isCollectable && !crate.isCollected) {
                // Check distance between player and crate
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    crate.x, crate.y
                );
                
                // Collection radius (larger for easier pickup)
                const collectionRadius = 50;
                
                if (distance < collectionRadius) {
                    const collected = crate.collectCrate(this.player);
                    if (collected) {
                        console.log('📦 Successfully collected crate');
                        this.createCrateCollectionEffect(crate.x, crate.y);
                    }
                }
            }
        });
    }
    
    createCrateCollectionEffect(x, y) {
        const effect = this.add.circle(x, y, 30, 0x00FFFF, 0.6);
        effect.setDepth(2000);
        effect.setStrokeStyle(3, 0xFFFFFF, 0.8);
        
        this.tweens.add({
            targets: effect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => effect.destroy()
        });
    }
    
    createCrashSiteMilitaryCrates() {
        console.log('📦 Creating interactive military crates inside crash site...');
        
        if (!this.textures || !this.physics || !this.player) {
            console.error('❌ Required game systems not ready for military crate creation');
            return;
        }
        
        if (!this.textures.exists('military_crate')) {
            console.error('❌ MilitaryCrate texture not found, skipping creation');
            return;
        }
        
        console.log('✅ MilitaryCrate texture found, proceeding with creation');
        
        try {
            const helicopterX = 1000;
            const helicopterY = 750;
            
            const initialCratePositions = [
                {x: helicopterX - 80, y: helicopterY - 120},
                {x: helicopterX + 80, y: helicopterY + 120}
            ];
            
            console.log(`📦 Attempting to create ${initialCratePositions.length} initial interactive crates...`);
            let successfulMilitaryCrates = 0;
            
            initialCratePositions.forEach((pos, index) => {
                try {
                    const militaryCrate = new MilitaryCrate(this, pos.x, pos.y);
                    
                    if (!militaryCrate || !militaryCrate.active || !militaryCrate.isActive) {
                        console.error('❌ MilitaryCrate creation failed at', pos.x, pos.y);
                        return;
                    }
                    
                    this.militaryCrateList.push(militaryCrate);
                    successfulMilitaryCrates++;
                    
                    console.log(`✅ Military crate ${index + 1} placed successfully at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}) with ${militaryCrate.contents.type}`);
                    
                } catch (crateError) {
                    console.error(`❌ Error creating military crate ${index + 1}:`, crateError);
                }
            });
            
            console.log(`📦 Initial crate creation complete: ${successfulMilitaryCrates}/${initialCratePositions.length} successful`);
            
            if (successfulMilitaryCrates > 0) {
                console.log(`✅ Created ${successfulMilitaryCrates} interactive military crates`);
                console.log('📦 Players can walk into these crates to collect ammo, health, or barricades!');
            }
            
        } catch (error) {
            console.error('Error creating crash site military crates:', error);
        }
    }
    
    spawnRandomCrates(count = 2) {
        if (!this.textures.exists('military_crate')) {
            console.warn('❌ Cannot spawn random crates - military_crate texture not found');
            return;
        }
        
        console.log(`📦 Attempting to spawn ${count} random crates...`);
        let successfulSpawns = 0;
        const maxAttempts = 20;
        
        for (let i = 0; i < count; i++) {
            let spawned = false;
            
            for (let attempt = 0; attempt < maxAttempts && !spawned; attempt++) {
                const x = Phaser.Math.Between(200, GameConfig.world.width - 200);
                const y = Phaser.Math.Between(200, GameConfig.world.height - 200);
                
                if (this.isValidCrateSpawnPosition(x, y)) {
                    try {
                        const crate = new MilitaryCrate(this, x, y);
                        
                        if (crate && crate.active && crate.isActive) {
                            this.militaryCrateList.push(crate);
                            successfulSpawns++;
                            spawned = true;
                            
                            console.log(`📦 Spawned random crate at (${x}, ${y}) with ${crate.contents.type}`);
                            this.createCrateSpawnEffect(x, y);
                        }
                    } catch (error) {
                        console.error('❌ Error spawning random crate:', error);
                    }
                }
            }
            
            if (!spawned) {
                console.warn(`⚠️ Failed to spawn random crate ${i + 1} after ${maxAttempts} attempts`);
            }
        }
        
        console.log(`📦 Random crate spawning complete: ${successfulSpawns}/${count} successful`);
        return successfulSpawns;
    }
    
    isValidCrateSpawnPosition(x, y, minDistance = 80) {
        // Check world bounds with margin
        if (x < 100 || x > GameConfig.world.width - 100 || 
            y < 100 || y > GameConfig.world.height - 100) {
            return false;
        }
        
        // Check distance from player
        const playerDistance = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
        if (playerDistance < minDistance) {
            return false;
        }
        
        // Check distance from existing military crates
        if (this.militaryCrateList) {
            for (const crate of this.militaryCrateList) {
                if (crate && crate.active) {
                    const distance = Phaser.Math.Distance.Between(x, y, crate.x, crate.y);
                    if (distance < minDistance) {
                        return false;
                    }
                }
            }
        }
        
        // Check distance from structures
        if (this.structures) {
            for (const structure of this.structures.children.entries) {
                const distance = Phaser.Math.Distance.Between(x, y, structure.x, structure.y);
                if (distance < minDistance) {
                    return false;
                }
            }
        }
        
        // Check distance from sandbags
        if (this.sandbagsList) {
            for (const sandbag of this.sandbagsList) {
                if (sandbag && sandbag.active && sandbag.isActive) {
                    const distance = Phaser.Math.Distance.Between(x, y, sandbag.x, sandbag.y);
                    if (distance < minDistance * 0.8) {
                        return false;
                    }
                }
            }
        }
        
        // Check distance from barricades
        if (this.barricadesList) {
            for (const barricade of this.barricadesList) {
                if (barricade && barricade.active) {
                    const distance = Phaser.Math.Distance.Between(x, y, barricade.x, barricade.y);
                    if (distance < minDistance * 0.7) {
                        return false;
                    }
                }
            }
        }
        
        // Check distance from sentry guns
        if (this.sentryGunsList) {
            for (const sentryGun of this.sentryGunsList) {
                if (sentryGun && sentryGun.active) {
                    const distance = Phaser.Math.Distance.Between(x, y, sentryGun.x, sentryGun.y);
                    if (distance < minDistance) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    createCrateSpawnEffect(x, y) {
        const spawnEffect = this.add.circle(x, y, 40, 0xFFD700, 0.5);
        spawnEffect.setDepth(1500);
        spawnEffect.setStrokeStyle(4, 0xFFD700, 0.8);
        
        this.tweens.add({
            targets: spawnEffect,
            scaleX: 0.2,
            scaleY: 0.2,
            alpha: 0,
            duration: 800,
            ease: 'Back.easeIn',
            onComplete: () => spawnEffect.destroy()
        });
        
        // Add sparkle particles
        for (let i = 0; i < 5; i++) {
            const sparkle = this.add.circle(x, y, 2, 0xFFFFFF);
            sparkle.setDepth(1600);
            
            const angle = (i / 5) * Math.PI * 2;
            const distance = 30;
            
            this.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => sparkle.destroy()
            });
        }
    }
    
    // === FOG OF WAR SYSTEM ===
    
    /**
     * Initialize the fog of war system by placing fog tiles across the world
     */
    initializeFogOfWar() {
        console.log('🌫️ Initializing fog of war system...');
        
        // Check if fog sprite exists
        if (!this.textures.exists('sand_fog')) {
            console.warn('❌ sand_fog.png sprite not found, skipping fog of war');
            return;
        }
        
        console.log('✅ sand_fog.png sprite found, creating fog grid...');
        
        // Generate seamless fog texture for better tiling
        this.generateSeamlessFogTexture();
        
        const worldWidth = GameConfig.world.width;
        const worldHeight = GameConfig.world.height;
        const tileSize = this.fogTileSize;
        
        // Define the safe spawn area around helicopter crash site (no fog)
        const helicopterX = 1000;
        const helicopterY = 750;
        const safeRadius = 250;
        
        let fogTilesCreated = 0;
        
        // Create fog tiles across the entire world
        for (let x = 0; x < worldWidth; x += tileSize) {
            for (let y = 0; y < worldHeight; y += tileSize) {
                const centerX = x + tileSize / 2;
                const centerY = y + tileSize / 2;
                
                // Don't place fog in the initial safe area around crash site
                const distanceFromCrash = Phaser.Math.Distance.Between(
                    centerX, centerY, helicopterX, helicopterY
                );
                
                if (distanceFromCrash > safeRadius) {
                    this.createFogTile(centerX, centerY);
                    fogTilesCreated++;
                } else {
                    // Mark safe area as already explored
                    const gridKey = this.getFogKey(centerX, centerY);
                    this.exploredTiles.add(gridKey);
                }
            }
        }
        
        console.log(`🌫️ Fog of war initialized: ${fogTilesCreated} fog tiles created`);
        console.log(`🌫️ Safe area radius: ${safeRadius}px around helicopter crash site (expanded for better starting area)`);
        console.log(`🌫️ Discovery radius: ${this.discoveryRadius}px`);
        console.log(`🌫️ Enhanced fog with seamless textures and randomization for smooth borders`);
    }
    
    /**
     * Generate a seamless fog texture for better tiling
     */
    generateSeamlessFogTexture() {
        try {
            console.log('🌫️ Generating seamless fog texture...');
            
            // Use TerrainOptimizer to create seamless fog texture
            if (typeof TerrainOptimizer !== 'undefined' && TerrainOptimizer.createSeamlessTexture) {
                const seamlessFogKey = 'sand_fog_seamless';
                
                // Generate seamless version of the fog texture
                TerrainOptimizer.createSeamlessTexture(this, 'sand_fog', seamlessFogKey, {
                    targetSize: this.fogTileSize,
                    seamlessBlendWidth: 8, // Blend 8 pixels on edges for smooth tiling
                    useNearestFilter: false // Use smooth filtering for fog
                });
                
                console.log('✅ Seamless fog texture generated:', seamlessFogKey);
                this.seamlessFogTextureKey = seamlessFogKey;
            } else {
                console.log('⚠️ TerrainOptimizer not available, using original fog texture');
                this.seamlessFogTextureKey = 'sand_fog';
            }
        } catch (error) {
            console.warn('⚠️ Failed to generate seamless fog texture:', error);
            this.seamlessFogTextureKey = 'sand_fog';
        }
    }
    
    /**
     * Create a single fog tile at the specified position
     */
    createFogTile(x, y) {
        try {
            // Use seamless fog texture if available, otherwise fallback to original
            const fogTextureKey = this.seamlessFogTextureKey || 'sand_fog';
            const fogTile = this.add.image(x, y, fogTextureKey);
            
            // Apply scaling using SpriteScaler first
            SpriteScaler.autoScale(fogTile, fogTextureKey, { maintainAspectRatio: false });
            
            // Scale to eliminate transparent borders but slightly overlap for smoother blending
            const oversizeMultiplier = 1.6; // Further reduced for better blending
            fogTile.setDisplaySize(
                this.fogTileSize * oversizeMultiplier, 
                this.fogTileSize * oversizeMultiplier
            );
            
            // Add slight random rotation to break up the grid pattern (very subtle)
            const randomRotation = (Math.random() - 0.5) * 0.05; // ±1.4 degrees
            fogTile.setRotation(randomRotation);
            
            // Add very subtle random offset to break perfect grid alignment
            const offsetVariation = 3; // Increased slightly for better distribution
            const randomOffsetX = (Math.random() - 0.5) * offsetVariation;
            const randomOffsetY = (Math.random() - 0.5) * offsetVariation;
            fogTile.x += randomOffsetX;
            fogTile.y += randomOffsetY;
            
            // Add subtle tint variation for more natural look
            const tintVariation = 0.05; // 5% variation
            const tintValue = 1.0 - (Math.random() * tintVariation);
            const tintColor = Phaser.Display.Color.GetColor(
                Math.floor(255 * tintValue),
                Math.floor(255 * tintValue), 
                Math.floor(255 * tintValue)
            );
            fogTile.setTint(tintColor);
            
            // Set fog tile properties
            fogTile.setDepth(this.fogDepth);
            fogTile.setAlpha(0.98); // Slightly more opaque for better coverage
            
            
            // Store in fog grid for efficient lookup
            const gridKey = this.getFogKey(x, y);
            this.fogGrid.set(gridKey, fogTile);
            
            return fogTile;
        } catch (error) {
            console.error('❌ Error creating fog tile at', x, y, ':', error);
            return null;
        }
    }
    
    /**
     * Update fog of war based on player position (called in update loop)
     */
    updateFogOfWar() {
        if (!this.player || this.fogGrid.size === 0) {
            return;
        }
        
        // Check for new areas to discover around player
        this.discoverArea(this.player.x, this.player.y, this.discoveryRadius);
        
        // Squad members no longer discover fog - only the player can scout
        // Removed squad member fog discovery to make scouting a player-only activity
        // if (this.squadMembers) {
        //     this.squadMembers.children.entries.forEach(squadMember => {
        //         if (squadMember && squadMember.active) {
        //             this.discoverArea(squadMember.x, squadMember.y, this.discoveryRadius * 0.8);
        //         }
        //     });
        // }
        
        // === DYNAMIC FOG REGENERATION ===
        // Gradually re-fog areas that haven't been visited recently
        if (this.time.now - this.lastFogRegenCheck > this.fogRegenerationRate) {
            this.regenerateOldFog();
            this.lastFogRegenCheck = this.time.now;
        }
    }
    
    /**
     * Discover fog tiles within a radius of the given position
     */
    discoverArea(centerX, centerY, radius) {
        const tileSize = this.fogTileSize;
        const tilesInRadius = Math.ceil(radius / tileSize);
        
        // Check tiles in a square around the center position
        for (let dx = -tilesInRadius; dx <= tilesInRadius; dx++) {
            for (let dy = -tilesInRadius; dy <= tilesInRadius; dy++) {
                const tileX = Math.round(centerX / tileSize) * tileSize + (tileSize / 2);
                const tileY = Math.round(centerY / tileSize) * tileSize + (tileSize / 2);
                
                const checkX = tileX + (dx * tileSize);
                const checkY = tileY + (dy * tileSize);
                
                // Check if this tile is within the discovery radius
                const distance = Phaser.Math.Distance.Between(centerX, centerY, checkX, checkY);
                
                if (distance <= radius) {
                    const gridKey = this.getFogKey(checkX, checkY);
                    
                    // === DYNAMIC FOG: Track visit time for regeneration system ===
                    this.lastVisitedTimes.set(gridKey, this.time.now);
                    
                    // Only process if not already explored
                    if (!this.exploredTiles.has(gridKey)) {
                        this.exploredTiles.add(gridKey);
                        
                        // Remove fog tile if it exists
                        const fogTile = this.fogGrid.get(gridKey);
                        if (fogTile && fogTile.active) {
                            this.createDiscoveryEffect(checkX, checkY);
                            
                            // Animate fog removal
                            this.tweens.add({
                                targets: fogTile,
                                alpha: 0,
                                duration: 800,
                                ease: 'Power2.easeOut',
                                onComplete: () => {
                                    if (fogTile && fogTile.active) {
                                        fogTile.destroy();
                                    }
                                    this.fogGrid.delete(gridKey);
                                }
                            });
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Create a visual effect when an area is discovered
     */
    createDiscoveryEffect(x, y) {
        // Subtle but visible discovery effect - expanding circle
        const effect = this.add.circle(x, y, 12, 0xFFFFAA, 0.6);
        effect.setDepth(this.fogDepth + 1);
        
        this.tweens.add({
            targets: effect,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 1000,
            ease: 'Power2.easeOut',
            onComplete: () => {
                if (effect && effect.active) {
                    effect.destroy();
                }
            }
        });
    }
    
    /**
     * Generate a unique key for fog grid based on tile position
     */
    getFogKey(x, y) {
        const tileSize = this.fogTileSize;
        const gridX = Math.round(x / tileSize);
        const gridY = Math.round(y / tileSize);
        return `${gridX},${gridY}`;
    }
    
    /**
     * Clear all fog of war (debug method)
     * Can be called from console: gameScene.clearFogOfWar()
     */
    clearFogOfWar() {
        console.log('🌫️ Clearing all fog of war...');
        
        this.fogGrid.forEach((fogTile, gridKey) => {
            if (fogTile && fogTile.active) {
                this.tweens.add({
                    targets: fogTile,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        if (fogTile && fogTile.active) {
                            fogTile.destroy();
                        }
                    }
                });
            }
        });
        
        this.fogGrid.clear();
        this.exploredTiles.clear();
        
        console.log('✅ All fog cleared');
    }
    
    /**
     * Regenerate fog in areas that haven't been visited recently
     * This prevents players from scouting everything in wave 1
     */
    regenerateOldFog() {
        // Dynamic re-fogging disabled – once an area is explored it will stay clear.
        // If re-fogging is needed again in the future, restore the previous implementation.
    }
    
    /**
     * Phaser lifecycle method - called when scene is shut down
     * This ensures cleanup happens even if gameOver() isn't called
     */
    shutdown() {
        console.log('🔄 Scene shutdown triggered - performing cleanup...');
        
        // Perform the same comprehensive cleanup
        this.cleanupBeforeDestroy();
        
        // Call parent shutdown
        super.shutdown();
    }
}

// Make GameScene accessible globally for debugging
if (typeof window !== 'undefined') {
    window.GameScene = GameScene;
} 