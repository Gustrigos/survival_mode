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
            zombiesFirstWave: 25,
            zombiesWaveIncrement: 50,
            zombieSpawnDelay: 250,
            zombieHealthMultiplier: 1.0,
            zombieSpeedMultiplier: 1.0,
            squadSize: 6, 
            playerHealthMultiplier: 1.5
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
            zombiesFirstWave: 100,
            zombiesWaveIncrement: 50,
            zombieSpawnDelay: 100,
            zombieHealthMultiplier: 1.0,
            zombieSpeedMultiplier: 1.0,
            squadSize: 9, 
            playerHealthMultiplier: 1.5
        }
    },

    // === CURRENT DIFFICULTY ===
    // Change this to switch difficulty presets, or set to 'custom' for manual settings
    currentDifficulty: 'hard',

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
        maxZombiesPerWave: 1000,   // Cap for very high waves
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
            1: { id: 'machineGun', type: 'weapon', name: 'Machine Gun', icon: 'machine_gun', ammo: 45 },
            2: { id: 'sentryGun', type: 'placeable', name: 'Sentry Gun', icon: 'sentry_gun_right', count: 0 }, // No free sentry guns
            3: { id: 'barricade', type: 'placeable', name: 'Barricade', icon: 'barricade', count: 12 },
            4: { id: 'minigun', type: 'weapon', name: 'Minigun', icon: 'minigun', ammo: 100 },
            5: { id: 'pistol', type: 'weapon', name: 'Pistol', icon: 'pistol', ammo: 15 }
        }
    },

    // === PURCHASING SYSTEM ===
    // Simple points-based purchasing through military crates
    purchasing: {
        enabled: true,
        currency: 'points', // Uses the existing score system
        
        // Items available for purchase
        items: {
            sentryGun: {
                name: 'Sentry Gun',
                cost: 100,  // 100 points = 10 zombie kills
                description: 'Automated defense turret',
                equipmentSlot: 2,
                maxStack: 10
            },
            barricade: {
                name: 'Barricade',
                cost: 25,   // 25 points = 2-3 zombie kills
                description: 'Wooden defensive barrier',
                equipmentSlot: 3,
                maxStack: 20
            },
            healthPack: {
                name: 'Health Pack',
                cost: 50,   // 50 points = 5 zombie kills
                description: 'Restores 50 health to player and 30 health to all squad members',
                type: 'consumable',
                healAmount: 50,        // Amount to heal player
                squadHealAmount: 30,   // Amount to heal each squad member
                healsSquad: true       // Flag to indicate this heals the entire team
            }
        },
        
        // Difficulty-based cost scaling
        costMultipliers: {
            easy: 0.7,      // 30% cheaper
            normal: 1.0,    // Standard cost
            hard: 1.2,      // 20% more expensive
            nightmare: 1.5, // 50% more expensive
            extreme: 1.8,   // 80% more expensive
            apocalypse: 2.0 // Double cost
        }
    },

    // === RANDOM CRATE SPAWNING SYSTEM ===
    // Control over random crates that spawn during waves
    randomCrates: {
        // Master switch - disable this to stop all random crate spawning
        enabled: false,  // DISABLED: Players can only buy from main supply crate
        
        // How many crates spawn per wave (only if enabled)
        cratesPerWave: {
            min: 1,
            max: 3,
            // Formula: Math.min(waveNumber - 1, max)
            scalingFactor: 1  // How much wave number affects crate count
        },
        
        // Control which types of items can appear in random crates
        allowedContents: {
            ammo: false,        // DISABLED: No ammo from random crates
            health: true,       // Health packs still allowed
            barricade: true     // Barricades still allowed
        },
        
        // Spawn timing (only applies if enabled)
        spawnTiming: {
            startFromWave: 2,   // First wave that spawns random crates
            spawnDelay: 0       // Delay in ms after wave starts
        },
        
        // Content weights (higher = more likely to spawn)
        contentWeights: {
            ammo: 30,
            health: 30,
            barricade: 40
        },
        
        // Amount ranges for each content type
        contentAmounts: {
            ammo: { base: 30, bonus: 10 },        // 30-40 bullets
            health: { base: 50, bonus: 10 },      // 50-60 health
            barricade: { base: 2, bonus: 3 }      // 2-5 barricades
        }
    },

    // === CRASH SITE LOOT CRATES ===
    // Control over the free loot crates that spawn at the crash site
    crashSiteLootCrates: {
        // Master switch - disable this to remove free loot crates from crash site
        enabled: false,  // DISABLED: No free loot crates, only supply crate ($)
        
        // Supply crate is always enabled regardless of this setting
        // Players can still buy items from the blue supply crate ($)
        
        // Configuration for loot crates (if enabled)
        cratePositions: [
            { x: -80, y: -120 },  // Relative to helicopter position
            { x: 80, y: 120 }     // Relative to helicopter position
        ],
        
        // Override content generation for crash site crates
        useRandomCrateContentRules: true  // Use same content rules as random crates
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
                weapon: 'machineGun',
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
                weapon: 'machineGun',
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
            fireRate: 600,       
            turnSpeed: 2,        
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
        },
        
        minigun: {
            damage: 40,
            fireRate: 50,       // ms between shots - very fast
            ammo: 100,
            reloadTime: 3000,   // ms - longer reload
            bulletSpeed: 700,
            spread: 0.12        // radians - slightly wider spread due to high fire rate
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
     * Get progressive difficulty scaling based on wave number
     * This makes the game progressively harder regardless of base difficulty
     */
    getProgressiveScaling(waveNumber) {
        // Progressive scaling that increases each wave
        const wave = Math.max(1, waveNumber || 1);
        
        // Progressive multipliers (start at 1.0, increase gradually)
        const healthScaling = 1.0 + (wave - 1) * 0.08; // +8% health per wave
        const speedScaling = 1.0 + (wave - 1) * 0.04; // +4% speed per wave  
        const spawnRateScaling = Math.max(0.5, 1.0 - (wave - 1) * 0.06); // -6% spawn delay per wave (min 50% of original)
        
        // Cap the scaling to prevent it from getting too extreme
        const maxHealthMultiplier = 3.0; // Max 300% health at wave 26+
        const maxSpeedMultiplier = 2.5; // Max 250% speed at wave 38+
        const minSpawnDelayMultiplier = 0.2; // Min 20% spawn delay (5x faster spawning)
        
        return {
            healthMultiplier: Math.min(healthScaling, maxHealthMultiplier),
            speedMultiplier: Math.min(speedScaling, maxSpeedMultiplier),
            spawnDelayMultiplier: Math.max(spawnRateScaling, minSpawnDelayMultiplier),
            waveNumber: wave
        };
    },

    /**
     * Get zombie stats with both difficulty and progressive scaling applied
     */
    getZombieStats(waveNumber = 1) {
        const difficulty = this.getDifficulty();
        const base = this.zombies;
        const progressive = this.getProgressiveScaling(waveNumber);
        
        // Start with base difficulty multipliers (or 1.0 for custom)
        const difficultyHealthMult = difficulty ? difficulty.zombieHealthMultiplier : 1.0;
        const difficultySpeedMult = difficulty ? difficulty.zombieSpeedMultiplier : 1.0;
        
        // Apply progressive scaling on top of difficulty
        const finalHealthMult = difficultyHealthMult * progressive.healthMultiplier;
        const finalSpeedMult = difficultySpeedMult * progressive.speedMultiplier;
        
        const scaledStats = {
            ...base,
            health: Math.round(base.health * finalHealthMult),
            speed: Math.round(base.speed * finalSpeedMult),
            // Store scaling info for debugging
            _scaling: {
                wave: waveNumber,
                baseHealth: base.health,
                baseSpeed: base.speed,
                difficultyHealthMult: difficultyHealthMult,
                difficultySpeedMult: difficultySpeedMult,
                progressiveHealthMult: progressive.healthMultiplier,
                progressiveSpeedMult: progressive.speedMultiplier,
                finalHealth: Math.round(base.health * finalHealthMult),
                finalSpeed: Math.round(base.speed * finalSpeedMult)
            }
        };
        
        return scaledStats;
    },

    /**
     * Get wave settings with progressive spawn rate scaling
     */
    getWaveSettings(waveNumber = 1) {
        const difficulty = this.getDifficulty();
        const base = this.waves;
        const progressive = this.getProgressiveScaling(waveNumber);
        
        if (!difficulty) return base; // Use base values for custom difficulty
        
        // Apply progressive scaling to spawn delay
        const baseSpawnDelay = difficulty.zombieSpawnDelay;
        const scaledSpawnDelay = Math.round(baseSpawnDelay * progressive.spawnDelayMultiplier);
        
        return {
            ...base,
            zombiesFirstWave: difficulty.zombiesFirstWave,
            zombiesWaveIncrement: difficulty.zombiesWaveIncrement,
            zombieSpawnDelay: scaledSpawnDelay,
            // Store scaling info for debugging
            _scaling: {
                wave: waveNumber,
                baseSpawnDelay: baseSpawnDelay,
                spawnDelayMultiplier: progressive.spawnDelayMultiplier,
                finalSpawnDelay: scaledSpawnDelay
            }
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
    },

    /**
     * Debug method: Preview progressive scaling for a specific wave
     * Can be called from console: GameConfig.previewWaveScaling(10)
     */
    previewWaveScaling(waveNumber) {
        const wave = Math.max(1, waveNumber || 1);
        const progressiveScaling = this.getProgressiveScaling(wave);
        const zombieStats = this.getZombieStats(wave);
        const waveSettings = this.getWaveSettings(wave);
        
        console.log(`🌊 WAVE ${wave} PROGRESSIVE SCALING PREVIEW`);
        console.log('='.repeat(50));
        console.log(`🧟 Zombie Stats:`);
        console.log(`  Health: ${zombieStats.health} HP (${progressiveScaling.healthMultiplier.toFixed(2)}x base)`);
        console.log(`  Speed: ${zombieStats.speed} (${progressiveScaling.speedMultiplier.toFixed(2)}x base)`);
        console.log(`  Damage: ${zombieStats.damage} (unchanged)`);
        
        console.log(`\n⏰ Spawn Settings:`);
        console.log(`  Spawn Delay: ${waveSettings.zombieSpawnDelay}ms (${progressiveScaling.spawnDelayMultiplier.toFixed(2)}x base)`);
        console.log(`  Spawn Rate: ${((1 - progressiveScaling.spawnDelayMultiplier) * 100).toFixed(0)}% faster than base`);
        
        console.log(`\n📈 Progressive Multipliers:`);
        console.log(`  Health Increase: +${((progressiveScaling.healthMultiplier - 1) * 100).toFixed(0)}%`);
        console.log(`  Speed Increase: +${((progressiveScaling.speedMultiplier - 1) * 100).toFixed(0)}%`);
        console.log(`  Spawn Rate Increase: +${((1 - progressiveScaling.spawnDelayMultiplier) * 100).toFixed(0)}%`);
        
        console.log(`\n🎯 Base Stats (Wave 1):`);
        const baseStats = this.getZombieStats(1);
        const baseWaveSettings = this.getWaveSettings(1);
        console.log(`  Base Health: ${baseStats.health} HP`);
        console.log(`  Base Speed: ${baseStats.speed}`);
        console.log(`  Base Spawn Delay: ${baseWaveSettings.zombieSpawnDelay}ms`);
        
        return {
            wave: wave,
            zombieStats: zombieStats,
            waveSettings: waveSettings,
            progressiveScaling: progressiveScaling
        };
    },

    /**
     * Debug method: Show progressive scaling curve for multiple waves
     * Can be called from console: GameConfig.showScalingCurve(1, 20)
     */
    showScalingCurve(startWave = 1, endWave = 20) {
        console.log(`🌊 PROGRESSIVE SCALING CURVE (Waves ${startWave}-${endWave})`);
        console.log('='.repeat(70));
        console.log('Wave | Health  | Speed   | Spawn Rate | Health% | Speed% | Spawn%');
        console.log('-'.repeat(70));
        
        for (let wave = startWave; wave <= endWave; wave++) {
            const scaling = this.getProgressiveScaling(wave);
            const zombieStats = this.getZombieStats(wave);
            const waveSettings = this.getWaveSettings(wave);
            
            const healthPercent = ((scaling.healthMultiplier - 1) * 100).toFixed(0);
            const speedPercent = ((scaling.speedMultiplier - 1) * 100).toFixed(0);
            const spawnPercent = ((1 - scaling.spawnDelayMultiplier) * 100).toFixed(0);
            
            console.log(
                `${wave.toString().padStart(4)} | ` +
                `${zombieStats.health.toString().padStart(7)} | ` +
                `${zombieStats.speed.toString().padStart(7)} | ` +
                `${waveSettings.zombieSpawnDelay.toString().padStart(10)}ms | ` +
                `${('+' + healthPercent + '%').padStart(7)} | ` +
                `${('+' + speedPercent + '%').padStart(6)} | ` +
                `${('+' + spawnPercent + '%').padStart(6)}`
            );
        }
        
        console.log('-'.repeat(70));
        console.log('💡 Use GameConfig.previewWaveScaling(wave) for detailed info on specific waves');
    },

    // === PURCHASING SYSTEM METHODS ===

    /**
     * Get the cost of an item with difficulty scaling applied
     */
    getItemCost(itemId) {
        if (!this.purchasing.enabled || !this.purchasing.items[itemId]) {
            return null;
        }

        const item = this.purchasing.items[itemId];
        const baseCost = item.cost;
        const difficulty = this.getDifficulty();
        const multiplier = difficulty ? 
            (this.purchasing.costMultipliers[this.currentDifficulty] || 1.0) : 1.0;

        return Math.round(baseCost * multiplier);
    },

    /**
     * Get all purchasable items with their current costs
     */
    getPurchasableItems() {
        if (!this.purchasing.enabled) return {};

        const items = {};
        Object.keys(this.purchasing.items).forEach(itemId => {
            const item = this.purchasing.items[itemId];
            items[itemId] = {
                ...item,
                currentCost: this.getItemCost(itemId)
            };
        });

        return items;
    },

    /**
     * Check if a player can afford an item
     */
    canAffordItem(itemId, playerPoints) {
        const cost = this.getItemCost(itemId);
        return cost !== null && playerPoints >= cost;
    },

    /**
     * Get purchase info for display
     */
    getPurchaseInfo(itemId) {
        const item = this.purchasing.items[itemId];
        if (!item) return null;

        const cost = this.getItemCost(itemId);
        const difficultyMultiplier = this.purchasing.costMultipliers[this.currentDifficulty] || 1.0;

        return {
            name: item.name,
            description: item.description,
            cost: cost,
            baseCost: item.cost,
            difficultyMultiplier: difficultyMultiplier,
            type: item.type || 'equipment',
            equipmentSlot: item.equipmentSlot
        };
    },

    /**
     * Validate a purchase attempt
     */
    validatePurchase(itemId, playerPoints, playerEquipment) {
        const item = this.purchasing.items[itemId];
        if (!item) {
            return { valid: false, reason: 'Item not found' };
        }

        const cost = this.getItemCost(itemId);
        if (playerPoints < cost) {
            return { valid: false, reason: `Not enough points (need ${cost}, have ${playerPoints})` };
        }

        // Check if player's equipment slot can accept more items
        if (item.equipmentSlot && playerEquipment && playerEquipment[item.equipmentSlot]) {
            const currentCount = playerEquipment[item.equipmentSlot].count || 0;
            const maxStack = item.maxStack || 10;
            
            if (currentCount >= maxStack) {
                return { valid: false, reason: `Equipment slot full (max ${maxStack})` };
            }
        }

        return { valid: true, cost: cost };
    },

    // === RANDOM CRATE SYSTEM METHODS ===

    /**
     * Check if random crate spawning is enabled
     */
    isRandomCrateSpawningEnabled() {
        return this.randomCrates.enabled;
    },

    /**
     * Get how many random crates should spawn for a given wave
     */
    getRandomCrateCount(waveNumber) {
        if (!this.randomCrates.enabled) return 0;
        if (waveNumber < this.randomCrates.spawnTiming.startFromWave) return 0;

        const config = this.randomCrates.cratesPerWave;
        const baseCount = Math.min(waveNumber - 1, config.max);
        return Math.max(config.min, baseCount);
    },

    /**
     * Generate random crate contents respecting the allowed content types
     */
    generateRandomCrateContents() {
        if (!this.randomCrates.enabled) return null;

        // Filter content types to only allowed ones
        const allowedTypes = [];
        Object.keys(this.randomCrates.allowedContents).forEach(type => {
            if (this.randomCrates.allowedContents[type]) {
                allowedTypes.push({
                    type: type,
                    weight: this.randomCrates.contentWeights[type] || 30
                });
            }
        });

        if (allowedTypes.length === 0) {
            console.warn('⚠️ No allowed content types for random crates');
            return null;
        }

        // Select random type based on weights
        const totalWeight = allowedTypes.reduce((sum, content) => sum + content.weight, 0);
        const random = Math.random() * totalWeight;
        
        let weightSum = 0;
        for (const content of allowedTypes) {
            weightSum += content.weight;
            if (random <= weightSum) {
                const amounts = this.randomCrates.contentAmounts[content.type];
                const amount = amounts.base + Math.floor(Math.random() * amounts.bonus);
                
                return {
                    type: content.type,
                    amount: amount
                };
            }
        }

        // Fallback to first allowed type
        const fallbackType = allowedTypes[0].type;
        const amounts = this.randomCrates.contentAmounts[fallbackType];
        return {
            type: fallbackType,
            amount: amounts.base
        };
    },

    /**
     * Toggle random crate spawning on/off
     */
    setRandomCrateSpawning(enabled) {
        this.randomCrates.enabled = enabled;
        console.log(`📦 Random crate spawning ${enabled ? 'ENABLED' : 'DISABLED'}`);
        if (!enabled) {
            console.log('💰 Players can only get supplies from the main supply crate (blue $)');
        }
        return this.randomCrates.enabled;
    },

    /**
     * Toggle specific content types in random crates
     */
    setRandomCrateContent(contentType, allowed) {
        if (this.randomCrates.allowedContents.hasOwnProperty(contentType)) {
            this.randomCrates.allowedContents[contentType] = allowed;
            console.log(`📦 Random crate content '${contentType}' ${allowed ? 'ENABLED' : 'DISABLED'}`);
            return true;
        }
        console.warn(`❌ Unknown content type: ${contentType}`);
        return false;
    },

    /**
     * Get random crate configuration summary
     */
    getRandomCrateStatus() {
        const config = this.randomCrates;
        const enabledContent = Object.keys(config.allowedContents)
            .filter(type => config.allowedContents[type]);
        
        return {
            enabled: config.enabled,
            enabledContent: enabledContent,
            cratesPerWave: config.cratesPerWave,
            startFromWave: config.spawnTiming.startFromWave
        };
    },

    // === CRASH SITE LOOT CRATE METHODS ===

    /**
     * Check if crash site loot crates are enabled
     */
    areCrashSiteLootCratesEnabled() {
        return this.crashSiteLootCrates.enabled;
    },

    /**
     * Toggle crash site loot crates on/off
     */
    setCrashSiteLootCrates(enabled) {
        this.crashSiteLootCrates.enabled = enabled;
        console.log(`📦 Crash site loot crates ${enabled ? 'ENABLED' : 'DISABLED'}`);
        if (!enabled) {
            console.log('💰 Players can only get free supplies from the supply crate ($) using points');
        } else {
            console.log('🎁 Players can collect free loot from brown crates at crash site');
        }
        return this.crashSiteLootCrates.enabled;
    },

    /**
     * Get crash site loot crate positions relative to helicopter
     */
    getCrashSiteLootCratePositions() {
        return this.crashSiteLootCrates.cratePositions;
    },

    /**
     * Get comprehensive crate system status
     */
    getAllCrateStatus() {
        return {
            randomCrates: this.getRandomCrateStatus(),
            crashSiteLootCrates: {
                enabled: this.crashSiteLootCrates.enabled,
                positions: this.crashSiteLootCrates.cratePositions.length,
                useRandomContentRules: this.crashSiteLootCrates.useRandomCrateContentRules
            },
            supplyCrateAlwaysEnabled: true
        };
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
    console.log('  🛒 PURCHASING SYSTEM:');
    console.log('  GameConfig.getPurchasableItems() - Show all purchasable items with costs');
    console.log('  GameConfig.getItemCost("sentryGun") - Get cost of specific item');
    console.log('  GameConfig.canAffordItem("sentryGun", 150) - Check if points are enough');
    console.log('  GameConfig.getPurchaseInfo("sentryGun") - Get detailed purchase info');
    console.log('  📦 RANDOM CRATE SYSTEM:');
    console.log('  GameConfig.setRandomCrateSpawning(true/false) - Enable/disable random crates');
    console.log('  GameConfig.setRandomCrateContent("ammo", false) - Disable ammo in random crates');
    console.log('  GameConfig.getRandomCrateStatus() - Show current random crate settings');
    console.log('  GameConfig.getRandomCrateCount(5) - How many crates spawn on wave 5');
    console.log('  📦 CRASH SITE LOOT CRATES:');
    console.log('  GameConfig.setCrashSiteLootCrates(true/false) - Enable/disable free loot at crash site');
    console.log('  GameConfig.areCrashSiteLootCratesEnabled() - Check if crash site loot enabled');
    console.log('  GameConfig.getAllCrateStatus() - Show all crate system settings');
    console.log('  🌊 PROGRESSIVE SCALING:');
    console.log('  GameConfig.previewWaveScaling(10) - See scaling for specific wave');
    console.log('  GameConfig.showScalingCurve(1, 20) - Show scaling curve for waves 1-20');
    console.log('  GameConfig.getProgressiveScaling(wave) - Get raw scaling data');
    console.log('  ⚙️ CURRENT SETTINGS:');
    console.log('  GameConfig.currentDifficulty =', GameConfig.currentDifficulty);
    console.log('  Current squad size:', GameConfig.getSquadSize(), 'members');
    console.log('  Random crates enabled:', GameConfig.randomCrates.enabled);
    console.log('  Crash site loot crates enabled:', GameConfig.crashSiteLootCrates.enabled);
    console.log('  🎯 Progressive difficulty makes zombies +8% health, +4% speed, +6% spawn rate per wave!');
    console.log('  💰 PRICING: Sentry Gun = 100pts (10 zombies), Barricade = 25pts (3 zombies), Health = 50pts (5 zombies)');
    console.log('  📦 Look for blue supply crates ($) near the crash site to purchase items!');
    console.log('  🚫 All free crates are DISABLED - use the supply crate ($) to buy equipment!');
} 