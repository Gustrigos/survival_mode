# Game Configuration Guide

This guide explains how to use the centralized `GameConfig` system to adjust difficulty, balance, and other game settings without modifying multiple source files.

## Overview

The `GameConfig.js` file contains all the main gameplay parameters organized into logical sections. You can adjust these values to change the game experience dramatically.

## Quick Start

### Changing Difficulty

The easiest way to adjust the game is to change the difficulty preset:

```javascript
// In src/utils/GameConfig.js, change this line:
currentDifficulty: 'normal',  // Change to 'easy', 'hard', or 'nightmare'
```

Or in the browser console:
```javascript
GameConfig.setDifficulty('hard');  // Changes to hard mode
```

### Available Difficulty Presets

| Difficulty | First Wave | Wave Increment | Squad Size | Zombie Health | Zombie Speed | Player Health |
|------------|------------|----------------|------------|---------------|---------------|---------------|
| Easy       | 15 zombies | +2 per wave    | 4 members  | 80% normal    | 80% normal    | 120% normal   |
| Normal     | 25 zombies | +3 per wave    | 4 members  | 100% normal   | 100% normal   | 100% normal   |
| Hard       | 35 zombies | +5 per wave    | 3 members  | 130% normal   | 120% normal   | 80% normal    |
| Nightmare  | 50 zombies | +8 per wave    | 2 members  | 150% normal   | 140% normal   | 60% normal    |

## Configuration Sections

### 1. World Settings

```javascript
world: {
    width: 2048,      // World width in pixels
    height: 1536,     // World height in pixels
    tileSize: 64      // Terrain tile size
}
```

### 2. Wave/Zombie Settings

```javascript
waves: {
    zombiesFirstWave: 25,        // Zombies in first wave
    zombiesWaveIncrement: 3,     // Additional zombies each wave
    maxZombiesPerWave: 100,      // Maximum zombies per wave
    waveStartDelay: 3000,        // Delay between waves (ms)
    zombieSpawnDelay: 500        // Delay between zombie spawns (ms)
}
```

### 3. Squad Configuration

```javascript
squad: {
    size: 4,  // Number of squad members (0-5)
    members: [
        {
            name: 'Charlie',
            health: 80,
            damage: 25,
            weapon: 'pistol',
            // ... other settings
        }
        // ... more members
    ]
}
```

### 4. Zombie Settings

```javascript
zombies: {
    health: 75,                    // Base zombie health
    speed: 80,                     // Base zombie speed
    speedVariation: 40,            // Random speed variation
    damage: 20,                    // Zombie attack damage
    attackCooldown: 1000,          // Time between attacks (ms)
    barricadeAttackDamage: 20,     // Damage to barricades
    sandbagAttackDamage: 25        // Damage to sandbags
}
```

## Common Customizations

### Making the Game Easier
```javascript
// Increase these values:
GameConfig.player.health = 150;
GameConfig.squad.size = 5;
GameConfig.zombies.health = 50;
GameConfig.waves.zombieSpawnDelay = 800;
```

### Making the Game Harder
```javascript
// Increase these values:
GameConfig.zombies.health = 100;
GameConfig.zombies.speed = 120;
GameConfig.waves.zombiesFirstWave = 40;
GameConfig.waves.zombieSpawnDelay = 300;

// Decrease these values:
GameConfig.player.health = 75;
GameConfig.squad.size = 2;
```

### Adjusting Squad Size
```javascript
// For a smaller, more challenging squad:
GameConfig.squad.size = 2;

// For a larger squad (up to 5):
GameConfig.squad.size = 5;
```

### Adjusting Wave Difficulty
```javascript
// For longer, more intense waves:
GameConfig.waves.zombiesFirstWave = 50;
GameConfig.waves.zombiesWaveIncrement = 10;

// For faster-paced action:
GameConfig.waves.zombieSpawnDelay = 200;
```

## Performance Settings

```javascript
performance: {
    bulletPoolSize: 50,           // Max bullets on screen
    maxBloodSplats: 50,          // Max blood effects
    useSeamlessTextures: false   // Enable to eliminate terrain gaps
}
```

## Console Commands

Open the browser developer console (F12) and use these commands:

```javascript
// Change difficulty
GameConfig.setDifficulty('hard');

// View current settings
console.log(GameConfig.getZombieStats());
console.log(GameConfig.getWaveSettings());
console.log(GameConfig.getSquadConfig());

// View available difficulties
GameConfig.getDifficultyNames();

// Manual adjustments (refresh required)
GameConfig.zombies.health = 100;
GameConfig.squad.size = 3;
```

## Custom Difficulty

Set `currentDifficulty: 'custom'` to use manual settings instead of presets:

```javascript
// In GameConfig.js:
currentDifficulty: 'custom',

// Then manually adjust any values:
zombies: {
    health: 90,
    speed: 100,
    // ... other custom values
},
waves: {
    zombiesFirstWave: 30,
    zombiesWaveIncrement: 4,
    // ... other custom values
}
```

## Tips

1. **Start Small**: Make one change at a time to see its effect
2. **Test Balance**: Play a few waves to see how changes feel
3. **Save Configurations**: Keep notes of settings you like
4. **Use Console**: Test changes quickly using browser console
5. **Refresh Required**: Most changes require refreshing the page

## Balancing Guidelines

- **Player Health**: 60-150 range works well
- **Squad Size**: 0-5 members (0 = solo challenge, 5 = easy mode)
- **Zombie Health**: 30-120 range for good gameplay
- **First Wave**: 10-60 zombies depending on difficulty
- **Spawn Delay**: 200-1000ms for different pacing

## Example Configurations

### Survival Mode (Very Hard)
```javascript
currentDifficulty: 'custom',
player: { health: 60 },
squad: { size: 1 },
zombies: { health: 120, speed: 100 },
waves: { zombiesFirstWave: 60, zombiesWaveIncrement: 15 }
```

### Casual Mode (Very Easy)
```javascript
currentDifficulty: 'custom',
player: { health: 200 },
squad: { size: 5 },
zombies: { health: 40, speed: 60 },
waves: { zombiesFirstWave: 10, zombiesWaveIncrement: 1 }
```

### Fast Action Mode
```javascript
waves: { 
    zombieSpawnDelay: 200,
    zombiesFirstWave: 30,
    zombiesWaveIncrement: 8
}
``` 