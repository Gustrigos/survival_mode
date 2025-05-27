import { Player } from '../entities/Player.js';
import { Zombie } from '../entities/Zombie.js';
import { Bullet } from '../entities/Bullet.js';
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
        
        // World bounds - make smaller for testing
        this.physics.world.setBounds(0, 0, 1024, 768);
        
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
        
        this.bloodSplats = this.add.group();
        this.shellCasings = this.add.group();
        
        // Create simple background first
        this.add.rectangle(512, 384, 1024, 768, 0x4a7c59); // Simple grass color
        
        // Create player
        console.log('Creating player...');
        try {
            this.player = new Player(this, 512, 384);
            console.log('Player created successfully:', this.player);
            console.log('Player texture key:', this.player.texture.key);
            console.log('Player visible:', this.player.visible);
            console.log('Player alpha:', this.player.alpha);
            console.log('Player depth:', this.player.depth);
            console.log('Player world position:', this.player.x, this.player.y);
            console.log('Player display size:', this.player.displayWidth, this.player.displayHeight);
            console.log('Player in display list:', this.children.exists(this.player));
            console.log('Player active:', this.player.active);
            
            // Make sure player is visible and properly positioned
            this.player.setVisible(true);
            this.player.setActive(true);
            this.player.setPosition(512, 384);
            this.player.setDepth(100);
            this.player.setAlpha(1);
            this.player.setScale(1);
            
            console.log('Player final position:', this.player.x, this.player.y);
            console.log('Player final depth:', this.player.depth);
            console.log('Player final scale:', this.player.scaleX, this.player.scaleY);
            console.log('Player final visible:', this.player.visible);
            console.log('Player final alpha:', this.player.alpha);
        } catch (error) {
            console.error('Error creating player:', error);
            // Create a simple placeholder if player creation fails
            this.player = this.add.rectangle(512, 384, 64, 64, 0x00ff00);
            this.player.setDepth(100);
            console.log('Created placeholder player');
        }
        
        // Camera setup - no zoom, no following for now
        this.cameras.main.setBounds(0, 0, 1024, 768);
        this.cameras.main.setZoom(1);
        console.log('Camera bounds set to:', this.cameras.main.getBounds());
        console.log('Camera zoom:', this.cameras.main.zoom);
        
        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE,R');
        
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
        console.log('World bounds:', this.physics.world.bounds);
        console.log('Camera position:', this.cameras.main.scrollX, this.cameras.main.scrollY);
        
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

    createBackground() {
        // Create a tiled grass background
        const tileSize = 64;
        const worldWidth = 2048;
        const worldHeight = 1536;
        
        for (let x = 0; x < worldWidth; x += tileSize) {
            for (let y = 0; y < worldHeight; y += tileSize) {
                const grassTile = this.add.image(x + tileSize/2, y + tileSize/2, 'grass');
                grassTile.setDepth(-10);
            }
        }
        
        // Add some trees and rocks for cover
        this.addEnvironmentObjects();
    }
    
    addEnvironmentObjects() {
        const objects = [
            { sprite: 'tree', count: 15 },
            { sprite: 'rock', count: 10 },
            { sprite: 'bush', count: 20 }
        ];
        
        objects.forEach(obj => {
            for (let i = 0; i < obj.count; i++) {
                const x = Phaser.Math.Between(100, 1948);
                const y = Phaser.Math.Between(100, 1436);
                
                // Make sure not too close to player spawn
                if (Phaser.Math.Distance.Between(x, y, 512, 384) > 150) {
                    const envObj = this.physics.add.staticSprite(x, y, obj.sprite);
                    envObj.setDepth(y); // Depth sorting for Pokemon-style layering
                    
                    // Add collision for trees and rocks - FIXED: Only if player exists and has body
                    if ((obj.sprite === 'tree' || obj.sprite === 'rock') && this.player && this.player.body) {
                        envObj.body.setSize(envObj.width * 0.6, envObj.height * 0.3);
                        envObj.body.setOffset(envObj.width * 0.2, envObj.height * 0.7);
                        
                        try {
                            this.physics.add.collider(this.player, envObj);
                            console.log(`Added collision for ${obj.sprite} at ${x}, ${y}`);
                        } catch (error) {
                            console.error(`Error adding collision for ${obj.sprite}:`, error);
                        }
                    }
                }
            }
        });
    }

    update(time, delta) {
        // Update player
        this.player.update(time, delta);
        
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
        
        // Spawn zombie near the edges of the screen, but visible
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        let spawnX, spawnY;
        const side = Phaser.Math.Between(0, 3);
        const margin = 100; // Distance from edge
        
        switch (side) {
            case 0: // Top
                spawnX = Phaser.Math.Between(margin, 1024 - margin);
                spawnY = margin;
                break;
            case 1: // Right
                spawnX = 1024 - margin;
                spawnY = Phaser.Math.Between(margin, 768 - margin);
                break;
            case 2: // Bottom
                spawnX = Phaser.Math.Between(margin, 1024 - margin);
                spawnY = 768 - margin;
                break;
            case 3: // Left
                spawnX = margin;
                spawnY = Phaser.Math.Between(margin, 768 - margin);
                break;
        }
        
        console.log(`Spawning zombie at position: ${spawnX}, ${spawnY}`);
        
        const zombie = new Zombie(this, spawnX, spawnY);
        this.zombies.add(zombie);
        
        console.log('Zombie created:', zombie);
        console.log('Zombie position:', zombie.x, zombie.y);
        console.log('Zombie visible:', zombie.visible);
        console.log('Zombie scale:', zombie.scaleX, zombie.scaleY);
        console.log('Zombie texture:', zombie.texture.key);
        console.log('Total zombies:', this.zombies.children.size);
        
        window.updateUI.zombiesLeft(this.zombiesInWave - this.zombies.children.size);
    }
    
    bulletHitZombie(bullet, zombie) {
        // Create blood splat
        this.createBloodSplat(zombie.x, zombie.y);
        
        // Damage zombie
        zombie.takeDamage(25);
        
        if (zombie.health <= 0) {
            // Zombie died
            window.gameState.score += 100;
            window.gameState.zombiesKilled++;
            zombie.destroy();
        }
        
        // Deactivate bullet for reuse
        bullet.deactivate();
        
        this.updateUI();
    }
    
    playerHitZombie(player, zombie) {
        if (player.canTakeDamage()) {
            player.takeDamage(20);
            
            // Knockback effect
            const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, player.x, player.y);
            player.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
            
            this.updateUI();
            
            if (window.gameState.playerHealth <= 0) {
                this.gameOver();
            }
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
        console.log('Setting up collisions...');
        
        // Only set up collisions if player has a physics body
        if (this.player && this.player.body) {
            console.log('Player body:', this.player.body);
            console.log('Bullets group:', this.bullets);
            console.log('Zombies group:', this.zombies);
            
            // Bullet hits zombie
            this.physics.add.overlap(this.bullets, this.zombies, this.bulletHitZombie, null, this);
            console.log('Bullet-zombie collision set up');
            
            // Player hits zombie
            this.physics.add.overlap(this.player, this.zombies, this.playerHitZombie, null, this);
            console.log('Player-zombie collision set up');
        } else {
            console.error('Cannot set up collisions - player or player body missing');
        }
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
} 