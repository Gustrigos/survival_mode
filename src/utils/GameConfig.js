/**
 * GameConfig.js - Centralized game configuration and settings
 * 
 * This file contains all the main gameplay parameters that can be adjusted
 * to change difficulty, balance, and game behavior without modifying 
 * multiple source files.
 */

export const GameConfig = {
    // === WORLD SETTINGS ===
    world: {
        width: 2048,
        height: 1536,
        tileSize: 64
    },

    // === DIFFICULTY PRESETS ===
    // Use these presets or create custom settings
    difficultyPresets: {
        easy: {
            zombiesFirstWave: 15,
            zombiesWaveIncrement: 2,
            zombieSpawnDelay: 800,
            zombieHealthMultiplier: 0.8,
            zombieSpeedMultiplier: 0.8,
            squadSize: 4,
            playerHealthMultiplier: 1.2
        },
        normal: {
            zombiesFirstWave: 25,
            zombiesWaveIncrement: 3,
            zombieSpawnDelay: 500,
            zombieHealthMultiplier: 1.0,
            zombieSpeedMultiplier: 1.0,
            squadSize: 4,
            playerHealthMultiplier: 1.0
        },
        hard: {
            zombiesFirstWave: 35,
            zombiesWaveIncrement: 5,
            zombieSpawnDelay: 300,
            zombieHealthMultiplier: 1.3,
            zombieSpeedMultiplier: 1.2,
            squadSize: 3,
            playerHealthMultiplier: 0.8
        },
        nightmare: {
            zombiesFirstWave: 50,
            zombiesWaveIncrement: 10,
            zombieSpawnDelay: 200,
            zombieHealthMultiplier: 1.2,
            zombieSpeedMultiplier: 1.0,
            squadSize: 4,
            playerHealthMultiplier: 1.0
        }
    },

    // === CURRENT DIFFICULTY ===
    // Change this to switch difficulty presets, or set to 'custom' for manual settings
    currentDifficulty: 'nightmare',

    // === WAVE SETTINGS ===
    waves: {
        // Base values (will be modified by difficulty preset)
        zombiesFirstWave: 25,
        zombiesWaveIncrement: 3,  // How many more zombies each wave
        maxZombiesPerWave: 100,   // Cap for very high waves
        waveStartDelay: 3000,     // Delay between waves (ms)
        zombieSpawnDelay: 500     // Delay between zombie spawns (ms)
    },

    // === PLAYER SETTINGS ===
    player: {
        health: 100,
        maxHealth: 100,
        damage: 30,
        speed: 200,
        ammo: 30,
        maxAmmo: 30,
        reloadTime: 2000,  // ms
        
        // Equipment starting inventory
        startingEquipment: {
            1: { id: 'machineGun', type: 'weapon', name: 'Machine Gun', icon: 'weapon_icon', ammo: 30 },
            2: { id: 'sentryGun', type: 'placeable', name: 'Sentry Gun', icon: 'sentry_icon', count: 3 },
            3: { id: 'barricade', type: 'placeable', name: 'Barricade', icon: 'barricade_icon', count: 5 }
        }
    },

    // === SQUAD/NPC SETTINGS ===
    squad: {
        // Number of squad members (0-5 recommended)
        size: 4,
        
        // Squad member configurations
        members: [
            {
                name: 'Charlie',
                color: 0x0099ff,
                formationOffset: { x: -60, y: -20 },
                weapon: 'pistol',
                aggroRange: 280,
                followDistance: 60,
                maxSeparation: 220,
                health: 80,
                damage: 25
            },
            {
                name: 'Delta',
                color: 0xff3333,
                formationOffset: { x: 60, y: -20 },
                weapon: 'machineGun',
                aggroRange: 320,
                followDistance: 60,
                maxSeparation: 220,
                health: 80,
                damage: 30
            },
            {
                name: 'Alpha',
                color: 0x00ff00,
                formationOffset: { x: -50, y: 40 },
                weapon: 'pistol',
                aggroRange: 250,
                followDistance: 60,
                maxSeparation: 200,
                health: 80,
                damage: 25
            },
            {
                name: 'Bravo',
                color: 0xff8800,
                formationOffset: { x: 50, y: 40 },
                weapon: 'machineGun',
                aggroRange: 300,
                followDistance: 60,
                maxSeparation: 200,
                health: 80,
                damage: 30
            },
            {
                name: 'Echo',
                color: 0xaa44ff,
                formationOffset: { x: 0, y: 60 },
                weapon: 'pistol',
                aggroRange: 270,
                followDistance: 65,
                maxSeparation: 210,
                health: 80,
                damage: 25
            }
        ]
    },

    // === ZOMBIE SETTINGS ===
    zombies: {
        // Base stats (will be modified by difficulty multipliers)
        health: 75,
        speed: 80,
        speedVariation: 40,  // Random speed +/- this amount
        damage: 20,
        
        // AI Behavior
        directionChangeInterval: 2000,  // ms
        attackCooldown: 1000,           // ms
        aggroRange: 300,                // Distance to start chasing
        
        // Movement behavior
        randomMovementForce: 30,
        knockbackResistance: 0.9,       // 0.1 = very knockable, 1.0 = no knockback
        
        // Obstacle interaction
        barricadeAttackRange: 45,
        barricadeAttackCooldown: 1200,  // ms
        barricadeAttackDamage: 20,
        sandbagAttackRange: 50,
        sandbagAttackCooldown: 1500,    // ms
        sandbagAttackDamage: 25
    },

    // === EQUIPMENT/STRUCTURES SETTINGS ===
    structures: {
        sentryGun: {
            health: 150,
            damage: 40,
            range: 350,
            fireRate: 600,       // ms between shots
            turnSpeed: 2,        // radians per second
            placementDistance: 80,
            collisionRadius: 60
        },
        
        barricade: {
            health: 100,
            placementDistance: 80,
            collisionRadius: 50
        },
        
        sandbag: {
            health: 400,  // 4x barricade health
            placementDistance: 80,
            collisionRadius: 40
        }
    },

    // === WEAPON SETTINGS ===
    weapons: {
        machineGun: {
            damage: 30,
            fireRate: 150,      // ms between shots
            ammo: 30,
            reloadTime: 2000,   // ms
            bulletSpeed: 500,
            spread: 0.1         // radians
        },
        
        pistol: {
            damage: 35,
            fireRate: 300,      // ms between shots
            ammo: 12,
            reloadTime: 1500,   // ms
            bulletSpeed: 600,
            spread: 0.05        // radians
        }
    },

    // === UI/VISUAL SETTINGS ===
    ui: {
        showDebugInfo: true,
        showHitboxes: true, 
        showSquadStatus: true,
        inventorySlots: 9,
        
        // HUD positioning
        hudPadding: 20,
        inventoryBottomOffset: 80
    },

    // === PERFORMANCE SETTINGS ===
    performance: {
        maxBloodSplats: 50,
        maxShellCasings: 30,
        maxParticles: 100,
        bulletPoolSize: 50,
        
        // Terrain optimization
        terrainTileSize: 64,
        useTerrainOptimization: true,
        useSeamlessTextures: false  // Set to true to eliminate gaps
    },

    // === BALANCE MULTIPLIERS ===
    // These are applied on top of base values for fine-tuning
    balance: {
        playerDamageMultiplier: 1.0,
        zombieDamageMultiplier: 1.0,
        structureHealthMultiplier: 1.0,
        experienceMultiplier: 1.0,
        scoreMultiplier: 1.0
    },

    // === SPAWN SETTINGS ===
    spawning: {
        zombieSpawnDistance: 300,  // Minimum distance from player
        zombieSpawnMargin: 150,    // Distance from world edge
        maxSpawnAttempts: 10       // Attempts to find valid spawn point
    },

    // === HELPER METHODS ===
    
    /**
     * Get the active difficulty settings
     */
    getDifficulty() {
        if (this.currentDifficulty === 'custom') {
            return null; // Use manual settings
        }
        return this.difficultyPresets[this.currentDifficulty] || this.difficultyPresets.normal;
    },

    /**
     * Apply difficulty modifiers to base values
     */
    getZombieStats() {
        const difficulty = this.getDifficulty();
        const base = this.zombies;
        
        if (!difficulty) return base; // Use base values for custom difficulty
        
        return {
            ...base,
            health: Math.round(base.health * difficulty.zombieHealthMultiplier),
            speed: Math.round(base.speed * difficulty.zombieSpeedMultiplier)
        };
    },

    /**
     * Get wave settings with difficulty applied
     */
    getWaveSettings() {
        const difficulty = this.getDifficulty();
        const base = this.waves;
        
        if (!difficulty) return base; // Use base values for custom difficulty
        
        return {
            ...base,
            zombiesFirstWave: difficulty.zombiesFirstWave,
            zombiesWaveIncrement: difficulty.zombiesWaveIncrement,
            zombieSpawnDelay: difficulty.zombieSpawnDelay
        };
    },

    /**
     * Get player stats with difficulty applied
     */
    getPlayerStats() {
        const difficulty = this.getDifficulty();
        const base = this.player;
        
        if (!difficulty) return base; // Use base values for custom difficulty
        
        return {
            ...base,
            health: Math.round(base.health * difficulty.playerHealthMultiplier),
            maxHealth: Math.round(base.maxHealth * difficulty.playerHealthMultiplier)
        };
    },

    /**
     * Get squad configuration with difficulty applied
     */
    getSquadConfig() {
        const difficulty = this.getDifficulty();
        const base = this.squad;
        
        if (!difficulty) return base; // Use base values for custom difficulty
        
        // Return only the number of squad members based on difficulty
        return {
            ...base,
            size: Math.min(difficulty.squadSize, base.members.length),
            members: base.members.slice(0, difficulty.squadSize)
        };
    },

    /**
     * Quick difficulty change method
     */
    setDifficulty(difficultyName) {
        if (this.difficultyPresets[difficultyName]) {
            this.currentDifficulty = difficultyName;
            console.log(`🎯 Difficulty changed to: ${difficultyName.toUpperCase()}`);
            return true;
        }
        console.warn(`Unknown difficulty: ${difficultyName}`);
        return false;
    },

    /**
     * Get all available difficulty names
     */
    getDifficultyNames() {
        return Object.keys(this.difficultyPresets);
    }
};

// Make GameConfig available globally for easy console debugging
if (typeof window !== 'undefined') {
    window.GameConfig = GameConfig;
    console.log('🎮 GameConfig loaded! Available commands:');
    console.log('  GameConfig.setDifficulty("easy|normal|hard|nightmare")');
    console.log('  GameConfig.getDifficultyNames()');
    console.log('  GameConfig.currentDifficulty =', GameConfig.currentDifficulty);
} 