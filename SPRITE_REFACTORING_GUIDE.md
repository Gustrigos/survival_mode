# Sprite Refactoring Guide

## Overview
This guide documents the refactoring from programmatically generated sprites to PNG asset loading in your Zombie Survival game.

## What Was Changed

### Before
- Sprites were generated using Canvas graphics commands in:
  - `PlayerSpriteGenerator.js`
  - `ZombieSpriteGenerator.js` 
  - `MapSpriteGenerator.js`
- All sprites created at runtime using `graphics.generateTexture()`

### After
- Sprites are loaded from PNG files using `scene.load.image()`
- New `SpriteLoader.js` handles all PNG loading
- `SpriteGenerator.js` now uses `SpriteLoader` instead of individual generators
- **NEW**: SWAT spritesheet integration for professional player sprites

## SWAT Spritesheet Integration

### SWAT Sprite Features
- **File**: `src/assets/sprites/player/swat_sprite.png`
- **Format**: 3x2 grid spritesheet (6 frames total)
- **Total Size**: 1024x1024 pixels
- **Frame Size**: 341x512 pixels each (1024÷3 × 1024÷2)
- **Characters**: Multiple SWAT team members in tactical gear

### Frame Mapping
The SWAT spritesheet uses the following frame mapping:
- **Frame 0**: Down/Front-facing SWAT officer
- **Frame 1**: Left/Side-facing SWAT officer  
- **Frame 2**: Up/Back-facing SWAT officer
- **Frame 3**: Right-facing SWAT officer
- **Frame 4**: Additional idle pose
- **Frame 5**: Additional action pose

### How It Works
1. **SpriteLoader** loads the SWAT spritesheet as `swat_player`
2. **SWATSpriteManager** handles frame mapping and animations
3. **Player class** automatically detects and uses SWAT sprites if available
4. **Fallback system** uses placeholder sprites if SWAT spritesheet isn't found

### Files Added/Modified
- ✅ `src/utils/SWATSpriteManager.js` - New utility for SWAT sprite management
- ✅ `src/utils/SpriteLoader.js` - Updated to load SWAT spritesheet
- ✅ `src/entities/Player.js` - Updated to use SWAT sprites with fallback
- ✅ `src/scenes/GameScene.js` - Updated to handle SWAT spritesheet loading

## Benefits of This Refactoring

1. **Performance**: PNG loading is faster than runtime generation
2. **Quality**: Professional pixel art can be created in dedicated tools
3. **Flexibility**: Easy to swap sprites without code changes
4. **Maintainability**: Artists can work independently of developers
5. **File Size**: PNG compression can be more efficient
6. **Professional Look**: SWAT spritesheet provides high-quality character graphics

## Directory Structure

```
src/assets/sprites/
├── player/           # Player character sprites (24x24 + SWAT spritesheet)
│   ├── swat_sprite.png    # 🆕 Professional SWAT spritesheet (3x2 grid)
│   ├── player_up.png      # Fallback placeholder sprites
│   ├── player_down.png
│   ├── player_left.png
│   └── player_right.png
├── zombies/          # Zombie sprites (24x24)
├── weapons/          # Weapon sprites (24x24)
├── effects/          # Game effects (various sizes)
├── environment/      # Environmental objects (various sizes)
├── terrain/          # Terrain textures (32x32)
└── buildings/        # Building components (various sizes)
```

## Required PNG Files

### Player Sprites

#### Primary: SWAT Spritesheet ⭐
- `swat_sprite.png` (1024x1024 pixels - 3x2 grid of 341x512 frames)

#### Fallback: Individual Sprites (24x24 pixels)
- `player_up.png`
- `player_down.png`
- `player_left.png`
- `player_right.png`

### Zombie Sprites (24x24 pixels)
- `zombie_up.png`
- `zombie_down.png`
- `zombie_left.png`
- `zombie_right.png`

### Weapon Sprites (24x24 pixels)
- `weapon_up.png`
- `weapon_down.png`
- `weapon_left.png`
- `weapon_right.png`

### Effect Sprites
- `bullet.png` (12x8)
- `bloodSplat.png` (12x12)
- `muzzleFlash.png` (12x12)
- `shellCasing.png` (8x12)

### Terrain Sprites (32x32 pixels)
- `grass_texture.png`
- `dirt_texture.png`
- `stone_texture.png`
- `water_texture.png`
- `sand_texture.png`
- `dirt_road.png`
- `rubble.png`
- `crackled_concrete.png`

### Environment Sprites (various sizes)
- `tree.png` (16x20)
- `rock.png` (16x16)
- `bush.png` (16x12)
- `flowers.png` (16x12)
- `palm_tree.png` (16x24)
- `dead_tree.png` (16x24)
- `crashed_helicopter.png` (100x44)
- `helicopter_wreckage.png` (32x16)
- `military_crate.png` (16x16)
- `sandbags.png` (24x20)
- `tent.png` (32x24)
- `campfire.png` (16x16)
- `debris.png` (16x16)

### Building Sprites
- `wall.png` (32x32)
- `door.png` (16x24)
- `window.png` (16x16)
- `roof.png` (32x24)

## Testing the Refactoring

1. **SWAT Sprites Active**: Your game now uses the professional SWAT spritesheet by default
2. **Fallback System**: If SWAT sprites fail to load, placeholder sprites are used automatically
3. **Console Logging**: Check browser console for sprite loading status
4. **Visual Verification**: SWAT character should appear scaled appropriately in-game

## How the SWAT System Works

```javascript
// Automatic detection in Player.js
const usingSWAT = scene.textures.exists('swat_player');

// Frame selection in SWATSpriteManager.js
const frame = SWATSpriteManager.getFrameForDirection('down'); // Returns 0

// Spritesheet loading in SpriteLoader.js
scene.load.spritesheet('swat_player', 'src/assets/sprites/player/swat_sprite.png', {
    frameWidth: 341,
    frameHeight: 512,
    startFrame: 0,
    endFrame: 5
});
```

## Important Notes

- **SWAT Priority**: SWAT spritesheet is loaded and used first if available
- **Automatic Fallback**: System automatically falls back to placeholder sprites if SWAT sprites fail
- **Scaling**: SWAT sprites are automatically scaled to 0.15x for the large frames (341x512 -> ~51x77)
- **Frame Dimensions**: SWAT spritesheet uses 341x512 pixel frames
- **Collision Boxes**: Physics bodies are automatically adjusted for SWAT sprite dimensions

## Customizing SWAT Sprites

To modify the SWAT spritesheet integration:

1. **Frame Mapping**: Edit `SWATSpriteManager.frameMap` to change which frames are used for each direction
2. **Scaling**: Modify the scale factor in `Player.js` constructor (currently 0.15 for large sprites)
3. **Collision Box**: Adjust `body.setSize()` and `body.setOffset()` values
4. **Frame Count**: Update `endFrame` in `SpriteLoader.js` if you add more frames

## Console Output

When working correctly, you should see:
```
✓ SWAT spritesheet loaded successfully
Player created successfully with sprites
Player texture: swat_player
Player using SWAT sprites: true
```