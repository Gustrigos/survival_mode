# World Generation System Guide

## Overview

Your zombie survival game now features a comprehensive world generation system that combines:
- **Polytopia-style finite maps** with configurable sizes
- **Minecraft-style biome generation** with varied terrain types
- **Random structure placement** including helicopter crash sites as rare discoveries
- **Procedural terrain variety** with natural formations

## Features

### Map Sizes (Polytopia-style)
- **Small**: 1024x768 - Quick games, compact exploration
- **Medium**: 2048x1536 - Balanced gameplay (default)
- **Large**: 3072x2304 - Extended exploration
- **Huge**: 4096x3072 - Epic survival challenges

### Biome Types (Minecraft-style)
1. **Grassland** - Safe starting areas with moderate zombie spawns
2. **Desert** - Open terrain with reduced zombie activity
3. **Urban** - High structure density, increased zombie spawns
4. **Wasteland** - Dangerous areas with mixed terrain
5. **Forest** - Dense cover with reduced zombie spawns

### Structure Generation
- **Helicopter Crashes**: Rare discoveries (0.3% spawn rate)
  - Minimum 400 pixels apart
  - Prefer wasteland/urban biomes
  - No smoke effects (unlike original crash site)
  - Act as strategic landmarks
- **Building Ruins**: Urban structures for cover
- **Abandoned Vehicles**: Scattered obstacles and cover

### Terrain Features
- **Weighted biome generation** - Each biome has preferred terrain types
- **Noise-based variation** - Natural-looking terrain mixing
- **Road networks** - Connect key locations automatically
- **Seamless tiling** - No visual gaps between terrain tiles

## How to Use

### From Menu
1. Start the game and select **"PROCEDURAL WORLD"** from the main menu
2. Choose your preferred map size (Small/Medium/Large/Huge)
3. Optionally set a custom seed for reproducible worlds
4. Click **"START GAME"** to generate and play

### Quick Start
- Select **"QUICK START"** for the original helicopter crash site experience
- Press **SPACE** from the menu for instant classic mode

## Technical Details

### World Generation Process
1. **Biome Seeding** - Creates Voronoi-like regions across the map
2. **Terrain Generation** - Places tiles based on biome preferences
3. **Structure Placement** - Randomly places structures with distance constraints
4. **Player Positioning** - Finds safe starting location away from dangers
5. **Road Creation** - Connects important locations with dirt paths

### Helicopter Crash Sites
- **Rarity**: Very rare (about 1 per large map section)
- **Placement**: Prefers wasteland and urban biomes
- **Spacing**: Minimum 400 pixels between crash sites
- **Guarantee**: At least one crash site per map (forced placement if needed)
- **Visual**: Light smoke effects (much subtler than original)

### Biome Characteristics
```javascript
grassland: {
    terrainTypes: ['grass_texture', 'dirt_texture'],
    weights: [0.8, 0.2],
    structureSpawnRate: 0.05,
    zombieSpawnRate: 1.0
}
```

### Seeded Generation
- Use the same seed number to generate identical worlds
- Seeds are 6-digit numbers (e.g., 123456)
- Perfect for sharing interesting worlds or testing

## Configuration

### Adjusting Rarity
Edit `src/modules/WorldGenerator.js`:
```javascript
helicopter_crash: {
    rarity: 0.003, // Increase for more crashes
    minDistance: 400, // Decrease for closer placement
}
```

### Adding New Biomes
```javascript
newBiome: {
    terrainTypes: ['your_texture'],
    weights: [1.0],
    structureSpawnRate: 0.05,
    zombieSpawnRate: 1.0,
    color: 0x123456
}
```

### Custom Map Sizes
Add to `mapSizes` in WorldGenerator:
```javascript
custom: { 
    width: 1600, 
    height: 1200, 
    name: "Custom (1600x1200)" 
}
```

## Gameplay Impact

### Exploration
- **Discovery-based gameplay** - Find helicopter crashes for strategic advantages
- **Varied terrain** - Different biomes offer different tactical opportunities
- **Natural landmarks** - Roads and structures help with navigation

### Strategy
- **Resource scarcity** - Helicopter crashes are rare and valuable
- **Biome awareness** - Some areas are safer than others
- **Positioning** - Use terrain and structures for defensive advantages

### Replayability
- **Infinite variety** - Each generated world is unique
- **Scalable difficulty** - Larger maps = longer survival challenges
- **Seed sharing** - Share interesting worlds with friends

## Troubleshooting

### Performance
- Large maps (3072x2304+) may impact performance on slower devices
- Consider using Medium (2048x1536) for optimal balance

### Missing Textures
- If terrain appears as colored rectangles, check texture loading
- Fallback colors indicate which textures are missing

### Structure Issues
- Bright pink rectangles indicate missing structure textures
- Check console for specific missing texture names

## Future Enhancements

### Planned Features
- **Resource nodes** - Scattered ammo/health pickups
- **Elevation system** - Hills and valleys for tactical depth
- **Weather effects** - Dynamic environmental challenges
- **Faction bases** - Friendly/hostile NPC settlements

### Modding Support
The system is designed to be easily extensible:
- Add new biomes by editing the `biomes` object
- Create new structures in the `structures` configuration
- Modify terrain types in the biome definitions

## Console Commands

For debugging and testing:
```javascript
// Generate a specific world
gameScene.worldGenerator.generateWorld('large', 123456)

// Check biome at position
gameScene.generatedWorld.biomes.get('128,192')

// List all structures
gameScene.generatedWorld.structures
```

---

**Note**: The original helicopter crash site mode is still available via "Quick Start" for players who prefer the classic experience. 