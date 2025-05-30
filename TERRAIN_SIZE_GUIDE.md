# Terrain Size Optimization Guide

## Current Status
Your game currently uses a mix of terrain texture sizes:
- **Large textures (1024x1024)**: `sand_texture.png`, `grass_texture.png`, `crackled_concrete.png`
- **Small textures (32x32)**: `dirt_road.png`, `dirt_texture.png`, `rubble.png`, `stone_texture.png`, `water_texture.png`
- **Display size**: All textures are displayed at 64x64 pixels

## Recent Improvements
✅ Added automatic texture scaling with `setDisplaySize()`  
✅ Added nearest-neighbor filtering for pixel-perfect scaling  
✅ Created `TerrainOptimizer` utility for texture management  
✅ Added configurable terrain system in `GameScene.js`  

## Quick Size Adjustments

### Option 1: Change Tile Size (Easiest)
Edit `src/scenes/GameScene.js`, line ~245:
```javascript
const terrainConfig = {
    tileSize: 32,    // Change from 64 to 32, 48, 96, or 128
    // ... rest of config
};
```

Common tile sizes:
- `32`: Retro pixel art style, good performance
- `48`: Balanced size, detailed but not too large  
- `64`: Current size, good balance (recommended)
- `96`: Larger tiles, more detail visible
- `128`: Large tiles, high detail, lower performance

### Option 2: Optimize Large Textures
Your 1024x1024 textures are unnecessarily large. Options:

#### A) Use Generated Optimized Textures
Add this to `GameScene.create()`:
```javascript
// Generate optimized 64x64 versions
TerrainOptimizer.generateOptimizedTextures(this);
```

#### B) Create New 64x64 PNG Files
1. Open your 1024x1024 textures in an image editor
2. Resize to 64x64 pixels
3. Use "Nearest Neighbor" scaling to maintain pixel art style
4. Save with same filenames

#### C) Use Different Tile Sizes for Different Textures
Edit the `terrainConfig.terrainTypes` in `GameScene.js`:
```javascript
terrainTypes: {
    sand_texture: { 
        displaySize: 128,  // Use larger size for high-detail textures
        sourceSize: 1024,
        tiling: true 
    },
    rubble: { 
        displaySize: 32,   // Use smaller size for simple textures
        sourceSize: 32, 
        tiling: false 
    }
}
```

### Option 3: Performance Modes
For different performance levels:

#### High Performance (Mobile/Low-end)
```javascript
const terrainConfig = {
    tileSize: 32,
    useNearestFilter: true,
    // ... 
};
```

#### Balanced (Desktop)
```javascript
const terrainConfig = {
    tileSize: 64,  // Current setting
    useNearestFilter: true,
    // ...
};
```

#### High Quality (High-end Desktop)
```javascript
const terrainConfig = {
    tileSize: 96,
    useNearestFilter: false,  // Smoother scaling
    // ...
};
```

## Visual Style Options

### Pixel Art Style (Sharp, Retro)
```javascript
useNearestFilter: true,
tileSize: 32 or 64
```

### Smooth Modern Style
```javascript
useNearestFilter: false,
tileSize: 64 or 96
```

### High Detail Style
```javascript
useNearestFilter: false,
tileSize: 128,
// Use original 1024x1024 textures
```

## File Structure
```
src/assets/sprites/terrain/
├── sand_texture.png      (1024x1024 → consider 64x64)
├── grass_texture.png     (1024x1024 → consider 64x64)  
├── crackled_concrete.png (1024x1024 → consider 64x64)
├── dirt_road.png         (32x32 ✓ good size)
├── dirt_texture.png      (32x32 ✓ good size)
├── rubble.png            (32x32 ✓ good size)
├── stone_texture.png     (32x32 ✓ good size)
└── water_texture.png     (32x32 ✓ good size)
```

## Recommended Next Steps

1. **Test current optimizations**: The game now uses proper scaling
2. **Choose a consistent tile size**: Pick 32, 64, or 96 pixels
3. **Optimize large textures**: Either resize files or use generated versions
4. **Consider tilesets**: For better performance, combine multiple terrain types into a single tileset image

## Tools for Texture Creation
- **Piskel**: Online pixel art editor (piskelapp.com)
- **Aseprite**: Professional pixel art software
- **GIMP**: Free image editor with nearest-neighbor scaling
- **Photoshop**: Use "Nearest Neighbor" when resizing

## Performance Notes
- **32x32 textures**: Best performance, retro style
- **64x64 textures**: Good balance of quality and performance (recommended)
- **96x96+ textures**: Higher quality but may impact mobile performance
- **1024x1024 textures**: Overkill for tile-based games, use only for backgrounds 