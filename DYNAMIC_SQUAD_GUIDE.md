# Dynamic Squad System Guide

The new Dynamic Squad System makes it incredibly easy to create squads of any size without manually defining each member. You can now easily scale from 5 squad members in nightmare mode to 20+ members in apocalypse mode with just a single configuration change.

## 🎖️ Quick Start

### Method 1: Change Difficulty (Easiest)
```javascript
// Set difficulty to get predefined squad sizes
GameConfig.setDifficulty("easy");      // 6 squad members
GameConfig.setDifficulty("normal");    // 4 squad members  
GameConfig.setDifficulty("hard");      // 3 squad members
GameConfig.setDifficulty("nightmare"); // 5 squad members
GameConfig.setDifficulty("extreme");   // 10 squad members
GameConfig.setDifficulty("apocalypse"); // 20 squad members
```

### Method 2: Custom Squad Size (Most Flexible)
```javascript
// Override difficulty with custom squad size
GameConfig.setCustomSquadSize(15);  // 15 squad members
GameConfig.setCustomSquadSize(25);  // 25 squad members
GameConfig.setCustomSquadSize(3);   // Small 3-member squad
GameConfig.setCustomSquadSize(null); // Back to difficulty default
```

### Method 3: Direct Configuration (Advanced)
```javascript
// In GameConfig.js, change the customSquadSize value:
customSquadSize: 12,  // Set to 12 members, or null for difficulty default
```

## 🔧 Console Commands

Once the game is loaded, you can use these commands in the browser console:

### Basic Squad Control
```javascript
// Change squad size on the fly
GameConfig.setCustomSquadSize(10);
GameConfig.setCustomSquadSize(20);
GameConfig.setCustomSquadSize(null); // Use difficulty default

// Change difficulty (affects squad size and other settings)
GameConfig.setDifficulty("apocalypse"); // 20 members
GameConfig.setDifficulty("extreme");    // 10 members
GameConfig.setDifficulty("nightmare");  // 5 members
```

### Squad Preview & Testing
```javascript
// Preview formations without creating squads
GameConfig.previewSquadFormation();    // Current size
GameConfig.previewSquadFormation(15);  // Preview 15 members
SquadGenerator.getFormationPreview(25); // Preview 25 members

// Test squad generation
SquadGenerator.test(10);  // Test 10-member squad generation
SquadGenerator.test(30);  // Test 30-member squad generation
```

### Advanced Squad Generation
```javascript
// Generate custom squad with specific difficulty modifiers
SquadGenerator.generateDifficultySquad("nightmare", 15);
SquadGenerator.generateSquadConfig(20, {
    health: 100,
    damage: 35,
    aggroRange: 350
});
```

## 📋 Configuration Options

### Difficulty Presets
| Difficulty | Squad Size | Description |
|------------|------------|-------------|
| Easy       | 6          | More squad members, stronger stats |
| Normal     | 4          | Balanced squad size |
| Hard       | 3          | Fewer squad members, weaker stats |
| Nightmare  | 5          | Moderate squad, challenging |
| Extreme    | 10         | Large squad for intense battles |
| Apocalypse | 20         | Massive squad for ultimate chaos |

### Formation Types
The system automatically chooses the best formation based on squad size:

- **1-4 members**: Diamond/Square formation
- **5-8 members**: Extended line formation  
- **9-16 members**: V-formation with multiple rows
- **17+ members**: Grid formation for maximum organization

## 🎯 Examples

### Example 1: Small Elite Squad (3 members)
```javascript
GameConfig.setDifficulty("hard");
// Creates: Charlie, Delta, Alpha with higher individual stats
```

### Example 2: Standard Squad (5 members)  
```javascript
GameConfig.setDifficulty("nightmare");
// Creates: Alpha, Bravo, Charlie, Delta, Echo in diamond formation
```

### Example 3: Large Squad (10 members)
```javascript
GameConfig.setDifficulty("extreme");
// Creates: Alpha through Juliet in V-formation
```

### Example 4: Massive Army (20 members)
```javascript
GameConfig.setDifficulty("apocalypse");
// Creates: Alpha through Tango in organized grid formation
```

### Example 5: Custom Size with Any Difficulty
```javascript
// Want nightmare difficulty settings but with 15 squad members?
GameConfig.setDifficulty("nightmare");
GameConfig.setCustomSquadSize(15);
// Gets nightmare zombie/wave settings but 15 squad members
```

## 🛠️ Technical Details

### Automatic Features
- **Names**: Uses NATO phonetic alphabet, then military callsigns, then Unit-01, Unit-02, etc.
- **Colors**: Cycles through 30 distinct colors for easy identification
- **Positions**: Smart formation positioning that scales with squad size
- **Stats**: Automatic stat variation (±15%) plus rank bonuses for variety
- **Weapons**: Alternates between pistol and machine gun
- **Balance**: Higher-ranked members (earlier in formation) get small stat bonuses

### Customization Options
```javascript
// In GameConfig.js, modify these for global changes:
squad: {
    useDynamicGeneration: true,  // Enable/disable dynamic system
    formationStyle: 'auto',     // 'auto', 'line', 'grid', 'diamond'
    baseStats: {
        aggroRange: 280,
        followDistance: 60,
        maxSeparation: 220,
        health: 80,
        damage: 25
    }
}
```

## 🚨 Important Notes

1. **Game Restart**: Changes take effect immediately for testing, but may require a game restart for full effect
2. **Performance**: Large squads (20+ members) may impact performance on slower devices
3. **Balance**: Larger squads make the game easier - adjust zombie difficulty accordingly
4. **Compatibility**: Falls back to legacy system if SquadGenerator fails to load

## 🎮 Quick Setup Examples

### For Testing Large Squads
```javascript
// Open browser console and run:
GameConfig.setCustomSquadSize(15);
// Refresh page to see 15 squad members in action
```

### For Balanced Gameplay
```javascript
// Use built-in difficulty presets:
GameConfig.setDifficulty("extreme"); // 10 members, harder zombies
```

### For Maximum Chaos
```javascript
// Apocalypse mode with even more members:
GameConfig.setDifficulty("apocalypse");
GameConfig.setCustomSquadSize(30);
// 30 squad members vs massive zombie hordes!
```

## 🔄 Migration from Old System

The old system required manually defining each squad member like this:
```javascript
// OLD WAY (tedious for large squads)
members: [
    { name: 'Charlie', color: 0x0099ff, formationOffset: { x: -60, y: -20 }, ... },
    { name: 'Delta', color: 0xff3333, formationOffset: { x: 60, y: -20 }, ... },
    // ... repeat for every single member
]
```

Now you just set a number:
```javascript
// NEW WAY (super easy!)
GameConfig.setCustomSquadSize(20); // Done! 20 squad members automatically generated
```

The new system generates all names, colors, positions, and stats automatically while maintaining balance and variety. 