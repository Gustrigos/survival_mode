/**
 * GameConfig.js - Centralized game configuration and settings
 * 
 * This file contains all the main gameplay parameters that can be adjusted
 * to change difficulty, balance, and game behavior without modifying 
 * multiple source files.
 */

import { SquadGenerator } from './SquadGenerator.js';

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
            squadSize: 6,  // Easy mode gets more squad members
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
            squadSize: 3,  // Hard mode gets fewer squad members
            playerHealthMultiplier: 0.8
        },
        nightmare: {
            zombiesFirstWave: 50,
            zombiesWaveIncrement: 50,
            zombieSpawnDelay: 200,
            zombieHealthMultiplier: 1.2,
            zombieSpeedMultiplier: 1.0,
            squadSize: 5,  // Nightmare gets moderate squad
            playerHealthMultiplier: 1.0
        },
        // New extreme difficulty modes for testing large squads
        extreme: {
            zombiesFirstWave: 75,
            zombiesWaveIncrement: 8,
            zombieSpawnDelay: 150,
            zombieHealthMultiplier: 1.5,
            zombieSpeedMultiplier: 1.3,
            squadSize: 10,  // Large squad for extreme challenge
            playerHealthMultiplier: 0.9
        },
        apocalypse: {
            zombiesFirstWave: 25,
            zombiesWaveIncrement: 25,
            zombieSpawnDelay: 250,
            zombieHealthMultiplier: 1.0,
            zombieSpeedMultiplier: 1.0,
            squadSize: 10, 
            playerHealthMultiplier: 1.5
        }
    },

    // === CURRENT DIFFICULTY ===
    // Change this to switch difficulty presets, or set to 'custom' for manual settings
    currentDifficulty: 'apocalypse',

    // === CUSTOM SQUAD SIZE OVERRIDE ===
    // Set this to override the difficulty-based squad size
    // Useful for testing or personal preference
    // Set to null to use difficulty default, or any number (0-50+)
    customSquadSize: null,

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
            2: { id: 'sentryGun', type: 'placeable', name: 'Sentry Gun', icon: 'sentry_icon', count: 6 },
            3: { id: 'barricade', type: 'placeable', name: 'Barricade', icon: 'barricade_icon', count: 6 }
        }
    },

    // === SQUAD/NPC SETTINGS ===w
    squad: {
        // DYNAMIC SQUAD SYSTEM - No longer requires manual member definitions!
        // Squad size and members are now generated automatically by SquadGenerator
        
        // Enable dynamic squad generation
        useDynamicGeneration: true,
        
        // Base stats for generated squad members (can be overridden by difficulty)
        baseStats: {
            aggroRange: 280,
            followDistance: 60,
            maxSeparation: 220,
            health: 80,
            damage: 25
        },
        
        // Formation preferences
        formationStyle: 'auto', // 'auto', 'line', 'grid', 'diamond'
        
        // Legacy manual squad configuration (kept for compatibility, but not used by default)
        legacyMode: false,
        size: 4,  // Only used if legacyMode is true or SquadGenerator fails
        members: [
            // Original manual configurations (kept as fallback)
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
     * Get squad configuration with dynamic generation or legacy fallback
     */
    getSquadConfig() {
        const difficulty = this.getDifficulty();
        const squadSize = this.getSquadSize();
        
        // Use dynamic generation if enabled and SquadGenerator is available
        if (this.squad.useDynamicGeneration && typeof SquadGenerator !== 'undefined') {
            try {
                console.log(`🎖️ Using dynamic squad generation for ${squadSize} members (${this.currentDifficulty} difficulty)`);
                return SquadGenerator.generateDifficultySquad(this.currentDifficulty, squadSize);
            } catch (error) {
                console.warn('⚠️ Dynamic squad generation failed, falling back to legacy mode:', error);
                return this.getLegacySquadConfig();
            }
        } else {
            return this.getLegacySquadConfig();
        }
    },

    /**
     * Get the effective squad size (considers custom override and difficulty)
     */
    getSquadSize() {
        // Custom override takes highest priority
        if (this.customSquadSize !== null && typeof this.customSquadSize === 'number') {
            return Math.max(0, Math.min(50, this.customSquadSize)); // Clamp between 0-50
        }
        
        // Use difficulty-based size
        const difficulty = this.getDifficulty();
        if (difficulty && difficulty.squadSize !== undefined) {
            return difficulty.squadSize;
        }
        
        // Fallback to base squad size
        return this.squad.size || 4;
    },

    /**
     * Legacy squad configuration (for compatibility)
     */
    getLegacySquadConfig() {
        const difficulty = this.getDifficulty();
        const squadSize = this.getSquadSize();
        const base = this.squad;
        
        console.log(`🎖️ Using legacy squad configuration for ${squadSize} members`);
        
        // Return only the number of squad members available in manual config
        const availableMembers = Math.min(squadSize, base.members.length);
        
        return {
            size: availableMembers,
            members: base.members.slice(0, availableMembers)
        };
    },

    /**
     * Quick difficulty change method
     */
    setDifficulty(difficultyName) {
        if (this.difficultyPresets[difficultyName]) {
            this.currentDifficulty = difficultyName;
            console.log(`🎯 Difficulty changed to: ${difficultyName.toUpperCase()}`);
            const squadSize = this.getSquadSize();
            console.log(`🎖️ Squad size for this difficulty: ${squadSize} members`);
            return true;
        }
        console.warn(`Unknown difficulty: ${difficultyName}`);
        return false;
    },

    /**
     * Set custom squad size (overrides difficulty-based size)
     */
    setCustomSquadSize(size) {
        if (typeof size === 'number' && size >= 0 && size <= 50) {
            this.customSquadSize = size;
            console.log(`🎖️ Custom squad size set to: ${size} members`);
            return true;
        } else if (size === null) {
            this.customSquadSize = null;
            console.log(`🎖️ Custom squad size cleared, using difficulty-based size`);
            return true;
        }
        console.warn(`Invalid squad size: ${size}. Must be 0-50 or null.`);
        return false;
    },

    /**
     * Get all available difficulty names
     */
    getDifficultyNames() {
        return Object.keys(this.difficultyPresets);
    },

    /**
     * Quick squad size preview
     */
    previewSquadFormation(size = null) {
        const squadSize = size || this.getSquadSize();
        if (typeof SquadGenerator !== 'undefined') {
            return SquadGenerator.getFormationPreview(squadSize);
        } else {
            console.warn('SquadGenerator not available for preview');
            return [];
        }
    }
};

// Make GameConfig available globally for easy console debugging
if (typeof window !== 'undefined') {
    window.GameConfig = GameConfig;
    console.log('🎮 GameConfig loaded! Available commands:');
    console.log('  GameConfig.setDifficulty("easy|normal|hard|nightmare|extreme|apocalypse")');
    console.log('  GameConfig.setCustomSquadSize(10) - Set custom squad size');
    console.log('  GameConfig.setCustomSquadSize(null) - Use difficulty default');
    console.log('  GameConfig.previewSquadFormation() - Preview current formation');
    console.log('  GameConfig.previewSquadFormation(15) - Preview specific size');
    console.log('  GameConfig.getDifficultyNames()');
    console.log('  GameConfig.currentDifficulty =', GameConfig.currentDifficulty);
    console.log('  Current squad size:', GameConfig.getSquadSize(), 'members');
} 