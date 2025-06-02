/**
 * GameConfigExamples.js - Example configurations for different gameplay modes
 * 
 * Copy these configurations into GameConfig.js to quickly set up specific gameplay modes.
 * Remember to set currentDifficulty: 'custom' when using these examples.
 */

export const GameConfigExamples = {
    
    // === SURVIVAL MODE ===
    // Ultra-challenging solo survival
    survivalMode: {
        currentDifficulty: 'custom',
        player: {
            health: 60,
            maxHealth: 60,
            damage: 35, // Slightly higher damage to compensate
        },
        squad: {
            size: 0, // No squad - true solo survival
        },
        zombies: {
            health: 100,
            speed: 95,
            speedVariation: 30,
            damage: 25,
            attackCooldown: 800, // Faster attacks
        },
        waves: {
            zombiesFirstWave: 50,
            zombiesWaveIncrement: 12,
            zombieSpawnDelay: 350,
        },
        structures: {
            sentryGun: {
                health: 100, // Weaker defenses
                damage: 35,
            },
            barricade: {
                health: 60,
            },
            sandbag: {
                health: 200,
            }
        }
    },

    // === CASUAL MODE ===
    // Relaxed gameplay for new players
    casualMode: {
        currentDifficulty: 'custom',
        player: {
            health: 150,
            maxHealth: 150,
            damage: 40,
        },
        squad: {
            size: 5, // Full squad
        },
        zombies: {
            health: 45,
            speed: 60,
            speedVariation: 20,
            damage: 15,
            attackCooldown: 1500, // Slower attacks
        },
        waves: {
            zombiesFirstWave: 12,
            zombiesWaveIncrement: 2,
            zombieSpawnDelay: 800,
        },
        structures: {
            sentryGun: {
                health: 200, // Stronger defenses
                damage: 50,
                range: 400,
            },
            barricade: {
                health: 150,
            },
            sandbag: {
                health: 600,
            }
        }
    },

    // === HORDE MODE ===
    // Massive waves, fast-paced action
    hordeMode: {
        currentDifficulty: 'custom',
        player: {
            health: 120,
            maxHealth: 120,
            damage: 35,
        },
        squad: {
            size: 4,
        },
        zombies: {
            health: 60, // Weaker individual zombies
            speed: 85,
            speedVariation: 25,
            damage: 18,
            attackCooldown: 1000,
        },
        waves: {
            zombiesFirstWave: 80, // Massive first wave
            zombiesWaveIncrement: 20,
            zombieSpawnDelay: 150, // Very fast spawning
            maxZombiesPerWave: 200,
        },
        performance: {
            bulletPoolSize: 100, // More bullets for horde
            maxBloodSplats: 30, // Reduced for performance
        }
    },

    // === TACTICAL MODE ===
    // Slower-paced, strategic gameplay
    tacticalMode: {
        currentDifficulty: 'custom',
        player: {
            health: 80,
            maxHealth: 80,
            damage: 45, // Higher damage per shot
        },
        squad: {
            size: 3,
        },
        zombies: {
            health: 120, // Tougher zombies
            speed: 70, // Slower movement
            speedVariation: 15,
            damage: 30, // High damage
            attackCooldown: 2000, // Slow but deadly
        },
        waves: {
            zombiesFirstWave: 20,
            zombiesWaveIncrement: 4,
            zombieSpawnDelay: 1000, // Slow, deliberate spawning
            waveStartDelay: 5000, // More time between waves
        },
        structures: {
            sentryGun: {
                health: 120,
                damage: 60, // High damage, tactical placement important
                fireRate: 800,
            }
        }
    },

    // === BLITZ MODE ===
    // Fast, intense action
    blitzMode: {
        currentDifficulty: 'custom',
        player: {
            health: 100,
            maxHealth: 100,
            damage: 30,
            speed: 250, // Faster movement
        },
        squad: {
            size: 2, // Small, elite squad
        },
        zombies: {
            health: 50,
            speed: 100, // Fast zombies
            speedVariation: 40,
            damage: 20,
            attackCooldown: 600,
        },
        waves: {
            zombiesFirstWave: 35,
            zombiesWaveIncrement: 8,
            zombieSpawnDelay: 200, // Rapid spawning
            waveStartDelay: 2000, // Quick wave transitions
        },
        weapons: {
            machineGun: {
                fireRate: 100, // Faster shooting
                damage: 28,
            }
        }
    },

    // === BUILDER MODE ===
    // Focus on defensive structures
    builderMode: {
        currentDifficulty: 'custom',
        player: {
            health: 100,
            maxHealth: 100,
            damage: 25,
            startingEquipment: {
                1: { id: 'machineGun', type: 'weapon', name: 'Machine Gun', icon: 'weapon_icon', ammo: 30 },
                2: { id: 'sentryGun', type: 'placeable', name: 'Sentry Gun', icon: 'sentry_icon', count: 8 },
                3: { id: 'barricade', type: 'placeable', name: 'Barricade', icon: 'barricade_icon', count: 12 }
            }
        },
        squad: {
            size: 3,
        },
        zombies: {
            health: 80,
            speed: 70, // Slower to allow building
            speedVariation: 20,
            damage: 22,
            attackCooldown: 1200,
        },
        waves: {
            zombiesFirstWave: 30,
            zombiesWaveIncrement: 5,
            zombieSpawnDelay: 600,
            waveStartDelay: 8000, // Extra time to build
        },
        structures: {
            sentryGun: {
                health: 180,
                damage: 45,
                range: 380,
            },
            barricade: {
                health: 140,
            },
            sandbag: {
                health: 500,
            }
        }
    },

    // === NIGHTMARE MODE ===
    // Extreme difficulty for hardcore players
    nightmareMode: {
        currentDifficulty: 'custom',
        player: {
            health: 50,
            maxHealth: 50,
            damage: 25,
        },
        squad: {
            size: 1, // One ally only
        },
        zombies: {
            health: 140,
            speed: 110,
            speedVariation: 50,
            damage: 35,
            attackCooldown: 700,
            knockbackResistance: 0.7, // Very resistant to knockback
        },
        waves: {
            zombiesFirstWave: 75,
            zombiesWaveIncrement: 20,
            zombieSpawnDelay: 250,
            maxZombiesPerWave: 150,
        },
        structures: {
            sentryGun: {
                health: 80, // Fragile defenses
                damage: 30,
            },
            barricade: {
                health: 50,
            },
            sandbag: {
                health: 200,
            }
        }
    }
};

/**
 * Apply a configuration example to GameConfig
 * Usage: applyConfigExample('survivalMode')
 */
export function applyConfigExample(modeName) {
    if (!GameConfigExamples[modeName]) {
        console.error(`Unknown config example: ${modeName}`);
        console.log('Available examples:', Object.keys(GameConfigExamples));
        return false;
    }

    const exampleConfig = GameConfigExamples[modeName];
    
    // This would need to be implemented to actually apply the config
    console.log(`Configuration example '${modeName}':`, exampleConfig);
    console.log('To apply this config, copy the values into GameConfig.js and refresh the page.');
    
    return true;
}

// Make examples available globally for console use
if (typeof window !== 'undefined') {
    window.GameConfigExamples = GameConfigExamples;
    window.applyConfigExample = applyConfigExample;
    
    console.log('🎮 GameConfig Examples loaded!');
    console.log('Available examples:', Object.keys(GameConfigExamples));
    console.log('Usage: applyConfigExample("survivalMode")');
} 