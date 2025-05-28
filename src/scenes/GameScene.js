import { Player } from '../entities/Player.js';
import { Zombie } from '../entities/Zombie.js';
import { Bullet } from '../entities/Bullet.js';
import { Structure } from '../entities/Structure.js';
import { SpriteGenerator } from '../utils/SpriteGenerator.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        console.log('GameScene preload() called');
        
        // Generate sprites using canvas
        try {
            SpriteGenerator.generateSprites(this);
            console.log('Sprites generated successfully');
        } catch (error) {
            console.error('Error generating sprites:', error);
        }
        
        // Log available textures for debugging
        console.log('Available textures:', Object.keys(this.textures.list));
        
        // Specifically check for helicopter texture
        if (this.textures.exists('crashed_helicopter')) {
            console.log('✓ Crashed helicopter texture exists and is ready');
        } else {
            console.error('✗ Crashed helicopter texture missing!');
        }
        
        // Check if specific textures exist
        const requiredTextures = ['player_down', 'player_up', 'player_left', 'player_right', 
                                 'zombie_down', 'zombie_up', 'zombie_left', 'zombie_right', 'bullet'];
        requiredTextures.forEach(texture => {
            if (this.textures.exists(texture)) {
                console.log(`✓ Texture '${texture}' exists`);
            } else {
                console.error(`✗ Texture '${texture}' missing!`);
            }
        });
    }

    create() {
        console.log('GameScene create() called');
        
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
            // Check if player textures exist
            if (this.textures.exists('player_down')) {
                this.player = new Player(this, 900, 650); // Start closer to helicopter crash site
                console.log('Player created successfully with textures');
            } else {
                console.warn('Player textures not found, creating fallback player');
                // Create a simple colored rectangle as player
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
                this.player.canTakeDamage = () => true;
                this.player.takeDamage = (amount) => {
                    this.player.health -= amount;
                    window.gameState.playerHealth = this.player.health;
                    window.updateUI.health(this.player.health, this.player.maxHealth);
                };
                this.player.shoot = () => {
                    console.log('Player shooting (fallback)');
                    // Create a simple bullet
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
            
            // Make sure player is visible and properly positioned
            this.player.setVisible(true);
            this.player.setActive(true);
            this.player.setDepth(1000); // High depth to stay on top
            this.player.setAlpha(1);
            this.player.setScale(1);
            
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
            this.player.damage = 30;
            this.player.canTakeDamage = () => true;
            this.player.takeDamage = () => {};
            this.player.shoot = () => {};
            this.player.reload = () => {};
            this.player.update = () => {};
            this.player.setDirection = () => {};
            this.player.setMoving = () => {};
            
            console.log('Created minimal fallback player');
        }
        
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
        const tileSize = 64;
        const worldWidth = 2048;
        const worldHeight = 1536;
        
        console.log('Creating Somalia-style terrain...');
        
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
                else if (Math.random() < 0.03) { // 3% chance instead of 15%
                    terrainType = 'rubble';
                }
                
                // Check if texture exists, fallback to simple colored rectangle
                let tile;
                if (this.textures.exists(terrainType)) {
                    tile = this.add.image(x + tileSize/2, y + tileSize/2, terrainType);
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
        
        console.log('Somalia-style terrain created successfully');
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
            
            // >>> NEW: enlarge the fuselage and adjust its collision box
            const heliScale = 2; // make helicopter huge – fits ~6 players horizontally
            helicopter.setScale(heliScale);
            if (helicopter.body && helicopter.body.setSize) {
                helicopter.body.setSize(200 * heliScale, 120 * heliScale);
                helicopter.body.setOffset(20 * heliScale, 20 * heliScale);
            }
            
            // >>> NEW: detached tail section using the existing helicopter_wreckage texture
            const tail = this.createStructureWithFallback(1130, 780, 'helicopter_wreckage', {
                type: 'helicopter_tail',
                material: 'metal',
                health: 200,
                destructible: true
            }, 0x2F4F4F, 80, 60);
            // Add a slight rotation for realism
            if (tail.setRotation) tail.setRotation(0.4);
            
            // Extra smoke & flame effects near both parts
            this.addHelicopterEffects(tail.x, tail.y);
            
            // Add a bright marker above the helicopter to help locate it
            const helicopterMarker = this.add.circle(1000, 650, 20, 0xff0000, 0.8);
            helicopterMarker.setDepth(2000);
            helicopterMarker.setStrokeStyle(4, 0xffffff);
            
            // Add pulsing animation to the marker
            this.tweens.add({
                targets: helicopterMarker,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0.3,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Add text label
            const helicopterLabel = this.add.text(1000, 620, 'HELICOPTER', {
                fontSize: '16px',
                fill: '#ffffff',
                fontFamily: 'Courier New',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(2001);
            
            console.log('Helicopter marker added at position 1000, 750');
            
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
        console.log('Creating urban barriers...');
        
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
    }
    
    createUrbanVegetation() {
        console.log('Creating sparse urban vegetation...');
        
        try {
            // Sparse palm trees
            const palmPositions = [
                {x: 200, y: 300}, {x: 1800, y: 400}, {x: 300, y: 1200}, {x: 1700, y: 1100}
            ];
            
            palmPositions.forEach(pos => {
                this.createStructureWithFallback(pos.x, pos.y, 'palm_tree', {
                    type: 'palm_tree',
                    material: 'wood',
                    health: 120,
                    destructible: true
                }, 0x8B7355, 48, 80);
            });
            
            // Dead trees
            const deadTreePositions = [
                {x: 150, y: 800}, {x: 1900, y: 600}, {x: 400, y: 1300}
            ];
            
            deadTreePositions.forEach(pos => {
                this.createStructureWithFallback(pos.x, pos.y, 'dead_tree', {
                    type: 'dead_tree',
                    material: 'wood',
                    health: 60,
                    destructible: true
                }, 0x654321, 32, 64);
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
    }
    
    handleInput() {
        const player = this.player;
        
        // Movement
        let velocityX = 0;
        let velocityY = 0;
        const speed = 200;
        
        if (this.wasd.A.isDown) velocityX = -speed;
        if (this.wasd.D.isDown) velocityX = speed;
        if (this.wasd.W.isDown) velocityY = -speed;
        if (this.wasd.S.isDown) velocityY = speed;
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        player.setVelocity(velocityX, velocityY);
        
        // Update player direction and animation
        if (velocityX !== 0 || velocityY !== 0) {
            player.setMoving(true);
            
            // Set direction based on movement
            if (Math.abs(velocityX) > Math.abs(velocityY)) {
                player.setDirection(velocityX > 0 ? 'right' : 'left');
            } else {
                player.setDirection(velocityY > 0 ? 'down' : 'up');
            }
        } else {
            player.setMoving(false);
        }
        
        // Shooting
        if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)) {
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
            console.log(`Spawning zombie ${this.zombiesSpawned + 1} of ${this.zombiesInWave}`);
            this.spawnZombie();
            this.zombieSpawnTimer = 0;
            this.zombiesSpawned++;
        } else if (this.zombiesSpawned < this.zombiesInWave) {
            // Still waiting to spawn
            console.log(`Waiting to spawn zombie. Timer: ${this.zombieSpawnTimer}, Spawned: ${this.zombiesSpawned}/${this.zombiesInWave}`);
        }
    }
    
    spawnZombie() {
        console.log('Spawning zombie...');
        
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
        
        console.log(`Spawning zombie at position: ${spawnX}, ${spawnY}`);
        
        const zombie = new Zombie(this, spawnX, spawnY);
        this.zombies.add(zombie);
        
        console.log('Zombie created:', zombie);
        console.log('Total zombies:', this.zombies.children.size);
        
        window.updateUI.zombiesLeft(this.zombiesInWave - this.zombies.children.size);
    }
    
    bulletHitZombie(bullet, zombie) {
        // Create blood splat
        this.createBloodSplat(zombie.x, zombie.y);
        
        // Damage zombie
        const killed = zombie.takeDamage(this.player.damage);
        
        if (killed) {
            window.gameState.score += 10;
            window.gameState.zombiesKilled++;
            window.updateUI.score(window.gameState.score);
        }
        
        // Remove bullet
        bullet.setActive(false);
        bullet.setVisible(false);
        
        // Screen shake
        this.cameras.main.shake(50, 0.005);
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
        
        // Remove bullet
        bullet.setActive(false);
        bullet.setVisible(false);
    }
    
    createSparkEffect(x, y) {
        const sparkCount = 5;
        
        for (let i = 0; i < sparkCount; i++) {
            const spark = this.add.rectangle(x, y, 2, 2, 0xFFD700);
            spark.setDepth(1000);
            
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
        if (player.canTakeDamage()) {
            player.takeDamage(20);
            
            // Knockback effect
            const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, player.x, player.y);
            player.body.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
            
            // Stop knockback after short time
            this.time.delayedCall(100, () => {
                if (player.body) {
                    player.body.setVelocity(0, 0);
                }
            });
            
            if (player.health <= 0) {
                this.gameOver();
            }
        }
    }
    
    zombieHitStructure(zombie, structure) {
        // Zombies attack wooden structures
        if (structure.material === 'wood' && structure.isDestructible) {
            const destroyed = structure.zombieAttack(5); // Zombies do less damage than bullets
            
            if (destroyed) {
                console.log(`Structure ${structure.structureType} destroyed by zombie!`);
            }
            
            // Zombie briefly stops to attack
            zombie.body.setVelocity(0, 0);
            this.time.delayedCall(500, () => {
                if (zombie.body) {
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
        this.player.setDepth(this.player.y);
        
        this.zombies.children.entries.forEach(zombie => {
            zombie.setDepth(zombie.y);
        });
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
        window.updateUI.health(window.gameState.playerHealth, 100);
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
        
        // Bullets vs zombies
        this.physics.add.overlap(this.bullets, this.zombies, this.bulletHitZombie, null, this);
        
        // Player vs structures
        this.physics.add.collider(this.player, this.structures);
        
        // Bullets vs structures
        this.physics.add.overlap(this.bullets, this.structures, this.bulletHitStructure, null, this);
        
        // Zombies vs structures
        this.physics.add.collider(this.zombies, this.structures, this.zombieHitStructure, null, this);
        
        console.log('Collisions set up with structures');
    }
    
    updateDebugText() {
        if (this.debugText) {
            const playerPos = this.player ? `${this.player.x}, ${this.player.y}` : 'No player';
            const zombieCount = this.zombies ? this.zombies.children.size : 0;
            this.debugText.setText([
                `Player: ${playerPos}`,
                `Zombies: ${zombieCount}`,
                `Camera: ${this.cameras.main.scrollX}, ${this.cameras.main.scrollY}`,
                `World: ${this.physics.world.bounds.width}x${this.physics.world.bounds.height}`
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
                slot.setStrokeStyle(3, 0xffffff, 0.9); // Thicker white border for selection
            }
            
            this.inventorySlots.push(slot);
            
            // Add weapon to first slot
            if (i === 0) {
                const weaponIcon = this.add.image(x + slotSize/2, y + slotSize/2, 'pistol_down')
                    .setDepth(2002)
                    .setScrollFactor(0)
                    .setScale(0.8); // Scale down to fit in slot
                
                this.inventoryItems.push(weaponIcon);
                
                // Add weapon name text below hotbar - more subtle
                this.weaponNameText = this.add.text(x + slotSize/2, y + slotSize + 10, 'Pistol', {
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
                slot.setStrokeStyle(3, 0xffffff, 0.9); // Selected: thicker white border
            } else {
                slot.setStrokeStyle(2, 0x404040, 0.8); // Unselected: thicker darker grey border
            }
        });
        
        // Update weapon name text
        if (this.weaponNameText && this.player) {
            const weaponName = this.player.getCurrentWeaponName();
            this.weaponNameText.setText(weaponName.charAt(0).toUpperCase() + weaponName.slice(1));
        }
    }

    addHelicopterEffects(x, y) {
        // Positions relative to helicopter center for smoke puffs (engine & tail)
        const smokeOffsets = [
            { dx: 50, dy: -30 }, // Engine top
            { dx: -60, dy: -20 } // Cockpit top-left
        ];
        
        smokeOffsets.forEach(offset => {
            this.time.addEvent({
                delay: Phaser.Math.Between(600, 1200),
                loop: true,
                callback: () => {
                    const puff = this.add.image(x + offset.dx, y + offset.dy, 'smoke_puff');
                    puff.setDepth(y);
                    const startScale = Phaser.Math.FloatBetween(0.8, 1.2);
                    puff.setScale(startScale);
                    puff.setAlpha(0.7);
                    this.tweens.add({
                        targets: puff,
                        y: puff.y - 40,
                        scaleX: startScale * 1.6,
                        scaleY: startScale * 1.6,
                        alpha: 0,
                        duration: 3000,
                        ease: 'Sine.easeOut',
                        onComplete: () => puff.destroy()
                    });
                }
            });
        });
        
        // Static small fires on wreckage
        const fireOffsets = [
            { dx: -20, dy: 30 },
            { dx: 40, dy: 25 }
        ];
        fireOffsets.forEach(offset => {
            const flame = this.add.image(x + offset.dx, y + offset.dy, 'small_fire');
            flame.setDepth(y);
            flame.setAlpha(0.9);
            // Flicker animation
            this.tweens.add({
                targets: flame,
                scaleX: { from: 0.9, to: 1.1 },
                scaleY: { from: 0.9, to: 1.1 },
                alpha: { from: 0.7, to: 1 },
                yoyo: true,
                repeat: -1,
                duration: Phaser.Math.Between(200, 350)
            });
        });
    }
} 