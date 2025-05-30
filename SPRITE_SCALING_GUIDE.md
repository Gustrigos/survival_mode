# Sprite Scaling Guide

## Overview
The new `SpriteScaler` utility automatically resizes all sprites to appropriate sizes for your game. This fixes the issue of oversized sprites and provides consistent scaling across all game objects.

## ✅ **What's Been Fixed:**

1. **Helicopter Size**: Reduced from 2x scale to proper size (120x80 pixels)
2. **Automatic Structure Scaling**: All structures now automatically scale to appropriate sizes
3. **Global Sprite Detection**: System detects and warns about oversized sprites
4. **Configurable Sizes**: Easy to adjust target sizes for any sprite type

## 🎮 **Sprite Size Configuration**

### Current Target Sizes:
```javascript
// Characters
player: 32x48 pixels
zombie: 32x48 pixels

// Vehicles  
helicopter: 120x80 pixels (was 2x too large)
helicopter_wreckage: 60x40 pixels

// Buildings
building: 96x72 pixels
wall: 64x32 pixels
door: 32x48 pixels

// Environment
tree: 48x64 pixels
palm_tree: 48x80 pixels
rock: 32x24 pixels
bush: 32x24 pixels

// Military Equipment
military_crate: 32x32 pixels
sandbags: 48x24 pixels
tent: 64x48 pixels

// Weapons & Effects
bullet: 4x8 pixels
smoke_puff: 24x24 pixels
small_fire: 16x20 pixels
```

## 🔧 **How to Adjust Sprite Sizes**

### Option 1: Update Global Configuration
Edit `src/utils/SpriteScaler.js` to change target sizes:
```javascript
static spriteConfig = {
    helicopter: { targetWidth: 150, targetHeight: 100 }, // Make helicopter larger
    zombie: { targetWidth: 40, targetHeight: 60 },       // Make zombies larger
    // ... other sprites
};
```

### Option 2: Per-Sprite Scaling
For individual sprites, use:
```javascript
// Scale a specific sprite
SpriteScaler.autoScale(mySprite, 'helicopter', { 
    scaleFactor: 1.5,           // 1.5x larger than target
    maintainAspectRatio: true   // Keep proportions
});

// Create a properly scaled sprite
const helicopter = SpriteScaler.createScaledImage(scene, x, y, 'helicopter_texture', 'helicopter');
```

### Option 3: Update Configuration at Runtime
```javascript
// Update helicopter size during gameplay
SpriteScaler.updateSpriteConfig('helicopter', { 
    targetWidth: 180, 
    targetHeight: 120 
});
```

## 🚀 **Advanced Options**

### Scaling Modes:
```javascript
// Exact size (default) - stretches to exact dimensions
SpriteScaler.autoScale(sprite, 'helicopter', { 
    maintainAspectRatio: false 
});

// Proportional scaling - maintains original proportions
SpriteScaler.autoScale(sprite, 'helicopter', { 
    maintainAspectRatio: true 
});

// Custom scale factor
SpriteScaler.autoScale(sprite, 'helicopter', { 
    scaleFactor: 0.8,  // 80% of target size
    maxScale: 2.0,     // Don't scale larger than 2x
    minScale: 0.5      // Don't scale smaller than 0.5x
});
```

### Group Scaling:
```javascript
// Scale all sprites in a group
SpriteScaler.autoScaleGroup(this.zombies, 'zombie');
SpriteScaler.autoScaleGroup(this.structures, 'building');
```

## 📊 **Performance Impact**

### Before:
- ❌ Helicopter: 2x scale (inefficient)
- ❌ Mixed sprite sizes caused visual inconsistency
- ❌ Large textures wasted memory

### After:
- ✅ Helicopter: Properly sized for gameplay
- ✅ Consistent sprite scaling across all objects
- ✅ Automatic detection of oversized assets
- ✅ Better performance with appropriately sized sprites

## 🛠️ **For Developers**

### Adding New Sprite Types:
1. Add to `SpriteScaler.spriteConfig` in `src/utils/SpriteScaler.js`
2. Or let the system auto-detect based on sprite name patterns

### Automatic Pattern Detection:
The system automatically detects sprite types:
- `*player*` → 32x48 pixels
- `*zombie*` → 32x48 pixels  
- `*helicopter*` → 120x80 pixels
- `*building*` → 96x72 pixels
- `*tree*` → 48x64 pixels
- `*weapon*` → 20x12 pixels
- Unknown sprites → 48x48 pixels (default)

### Integration Points:
- `GameScene.create()`: Global sprite analysis
- `createStructureWithFallback()`: Automatic structure scaling
- `createUrbanVegetation()`: Tree and bush scaling

## 🎯 **Quick Fixes**

### Make All Sprites Smaller:
```javascript
// In SpriteScaler.js, multiply all target sizes by 0.8
helicopter: { targetWidth: 96, targetHeight: 64 }, // 80% of original
zombie: { targetWidth: 26, targetHeight: 38 },     // 80% of original
```

### Make Specific Sprites Larger:
```javascript
// Just for helicopter
SpriteScaler.updateSpriteConfig('helicopter', { 
    targetWidth: 180, 
    targetHeight: 120 
});
```

### Debug Sprite Sizes:
Check the browser console for messages like:
```
⚠️  crashed_helicopter may be oversized. Original: 512x512, Target: 120x80
Scaled crashed_helicopter to 120x80
```

## 🔄 **Testing Your Changes**

1. Open the game in your browser
2. Check the console for scaling messages
3. Look for oversized sprite warnings
4. Verify helicopter and other sprites are properly sized
5. Adjust configurations as needed

The system is now active and will automatically scale all new sprites to appropriate sizes! 