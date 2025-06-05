# Zombie Survival Game

A web-based zombie survival game built with Phaser 3. Fight waves of zombies, manage your squad, and survive as long as possible!

## Features

- **Wave-based Zombie Combat**: Face increasingly difficult waves of zombies
- **Dynamic Squad System**: Command AI squad members with different formations
- **Equipment System**: Use weapons, place defensive structures, and manage inventory
- **Progressive Difficulty**: Zombies get stronger each wave with scaling health and speed
- **🆕 Purchasing System**: Earn points by killing zombies and spend them at supply crates
- **Defensive Structures**: Build barricades, place sentry guns, and create defensive positions
- **Fog of War**: Explore the world and reveal areas as you move

## 🛒 New Purchasing System

### How It Works
- **Earn Points**: Get 10 points for each zombie killed
- **Find Supply Crates**: Look for blue crates with "$" symbols near the crash site
- **Purchase Items**: Walk up to supply crates and click on items to buy them

### Available Items
- **Sentry Gun**: 100 points (10 zombie kills) - Automated defense turret
- **Barricade**: 25 points (3 zombie kills) - Wooden defensive barrier  
- **Health Pack**: 50 points (5 zombie kills) - Instantly restores 50 health

### Difficulty Scaling
- **Easy**: 30% cheaper items
- **Normal**: Standard pricing
- **Hard/Nightmare/Extreme/Apocalypse**: Increasingly expensive items

### Starting Changes
- **No Free Sentry Guns**: Players now start with 0 sentry guns instead of 12
- **Earn Your Defense**: Must kill zombies to earn points for purchasing defensive equipment
- **Strategic Decisions**: Choose between offensive firepower and defensive structures

## Controls

- **WASD**: Move player
- **SPACE**: Shoot current weapon / Place selected item
- **R**: Reload weapon
- **1-5**: Switch equipment slots
- **ESC**: Close purchasing interface

## Equipment Slots

1. **Machine Gun** - Primary automatic weapon
2. **Sentry Gun** - Must be purchased from supply crates
3. **Barricade** - Wooden defensive barriers (12 free + can purchase more)
4. **Minigun** - Heavy automatic weapon
5. **Pistol** - Secondary weapon

## Difficulty Levels

Choose from 6 difficulty levels, each affecting zombie stats, squad size, and item costs:
- **Easy**: Fewer, weaker zombies; larger squad; cheaper items
- **Normal**: Balanced gameplay
- **Hard**: More challenging zombies
- **Nightmare**: Significantly tougher enemies
- **Extreme**: Very difficult with large squad
- **Apocalypse**: Maximum difficulty

## Console Commands

Open browser console (F12) for debugging commands:
- `GameConfig.setDifficulty("apocalypse")` - Change difficulty
- `GameConfig.getPurchasableItems()` - Show current item costs
- `GameConfig.getItemCost("sentryGun")` - Check specific item price
- `GameConfig.previewWaveScaling(10)` - See zombie stats for wave 10

## Files

- `index.html` - Main game file
- `src/utils/GameConfig.js` - Game settings and purchasing system
- `src/entities/MilitaryCrate.js` - Supply crate and purchasing interface
- `src/scenes/GameScene.js` - Main game logic

## Getting Started

1. Open `index.html` in a web browser
2. Start killing zombies to earn points
3. Find the blue supply crate near the crash site
4. Purchase sentry guns and other equipment to survive longer waves!

---

**Tip**: Sentry guns are now precious! Use them strategically and protect them from zombie attacks to maximize their value. 