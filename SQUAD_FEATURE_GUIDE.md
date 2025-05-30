# SWAT Squad Feature Guide

## Overview
The game now features AI-controlled SWAT team members that help the main player survive against zombie waves. Squad members use the same SWAT sprites but have distinct name tags and colors for identification.

## Squad Members

### Main Player
- **Name Tag**: "LEADER" (Blue color - #00BFFF)
- **Controlled by**: Player input (WASD keys)
- **Special**: Manual shooting (SPACE), reload (R)

### NPC Squad Members

#### Alpha (Green)
- **Name Tag**: "Alpha" (Green color - #00ff00)
- **Weapon**: Pistol
- **Position**: Left-back formation (80 units left, 60 units back)
- **Aggro Range**: 250 units
- **Behavior**: Defensive, follows main player

#### Bravo (Orange)
- **Name Tag**: "Bravo" (Orange color - #ff8800)  
- **Weapon**: Machine Gun
- **Position**: Right-back formation (80 units right, 60 units back)
- **Aggro Range**: 300 units
- **Behavior**: Aggressive, longer range engagement

## AI Behavior

### Formation Following
- Squad members maintain formation relative to the main player
- They follow at a distance when no enemies are present
- Automatic collision avoidance with structures

### Combat AI
- **Target Scanning**: Scans for zombies every 500ms within aggro range
- **Auto-Aiming**: Automatically faces target and shoots
- **Engagement Rules**: Stops following to engage zombies, resumes following when clear
- **Weapon Management**: Auto-reload, different firing rates per weapon type

### Visual Feedback
- **Name Tags**: Subtle text above each squad member for identification
- **HTML Squad Status**: Squad health shown in HTML UI panel below player health/ammo
- **Red Health Theme**: All health bars use red gradient matching main UI design
- **Damage Indicators**: Name tags flash red when taking damage  
- **Health Color Coding**: Bright red (healthy), Dark red (injured), Very dark red (critical)
- **Collision Debug**: Press 'H' to toggle collision box visualization

## Health Monitoring System

### Main Player Health
- **Location**: HTML UI in top-left corner (existing red health bar)
- **Display**: Health/Ammo bars with exact numbers
- **Updates**: Only when main player takes damage (not NPCs)
- **Style**: Red gradient health bar, orange ammo bar

### Squad Status Panel  
- **Location**: HTML UI panel directly below player Health/Ammo, above Controls
- **Shows**: Only NPC squad members (Alpha, Bravo, etc.)
- **Integration**: Part of the HTML overlay UI, not rendered in-game
- **NPC Health**: Individual health bars with exact numbers and colored names
- **Real-time Updates**: Updates automatically when NPCs take damage
- **Styling**: Matches main UI theme with red health bars and proper spacing

### UI Layout Order (Top to Bottom)
1. **Player Health/Ammo** (existing HTML UI)
2. **Squad Status** (new HTML panel)
3. **Game Screen** (Phaser canvas)
4. **Controls** (bottom-left HTML UI)
5. **Score/Wave** (top-right HTML UI)

### UI Separation Logic
- **Main Player**: Uses existing HTML health/ammo bars (never changes when NPCs take damage)
- **NPCs Only**: Squad panel shows only NPC health status in HTML UI
- **HTML Integration**: All UI elements are now part of the HTML overlay for consistency
- **No In-Game UI**: Squad status removed from game screen for cleaner gameplay
- **Independent Updates**: Each UI updates only for its respective player type
- **Clean Interface**: No duplicate or conflicting health displays

### Game Over Logic
- **Main Player Only**: Game only ends when the main player (LEADER) dies
- **Squad Survivability**: Game continues even if all NPCs are eliminated
- **Strategic Depth**: Main player can use squad members as tactical shields

## Technical Features

### Physics & Collisions
- Squad members have same collision detection as main player
- Can take damage from zombies (20 damage per hit)
- Collision with structures and world bounds
- Proper bullet collision with zombies

### Performance
- Efficient target scanning with configurable intervals
- Formation updates every 100ms to maintain smooth movement
- Proper cleanup when squad members are eliminated
- Real-time health monitoring with minimal performance impact
- Smart UI updates only when health changes occur

## Controls
- **WASD**: Move main player (squad follows automatically)
- **SPACE**: Main player shoots (squad shoots automatically)
- **R**: Main player reload (squad auto-reloads)
- **H**: Toggle collision debug overlay

## Future Expansion
The squad system is designed to easily add more members:
1. Add new config to `squadConfigs` array in `createSquad()`
2. Customize name, color, weapon, and formation position
3. Each member gets full AI behavior automatically

## Debug Information
- Top-left debug text shows squad member count
- Console logs detailed squad member creation and behavior
- Collision debug mode shows hit boxes for all characters

---

**File Locations:**
- Squad AI: `src/entities/NPCPlayer.js`
- Squad Creation: `src/scenes/GameScene.js` (createSquad method)
- Visual Styling: Name tags with different colors per member 