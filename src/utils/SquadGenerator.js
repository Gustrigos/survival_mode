/**
 * SquadGenerator.js - Dynamic squad member generation system
 * 
 * This utility generates squad member configurations on-demand for any number
 * of squad members without requiring manual configuration for each one.
 */

export class SquadGenerator {
    // Pool of military-style names for automatic assignment
    static namePool = [
        // NATO phonetic alphabet (primary names)
        'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
        'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
        'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'Xray', 'Yankee', 'Zulu',
        
        // Military callsigns (secondary names)
        'Viper', 'Eagle', 'Falcon', 'Hawk', 'Raven', 'Wolf', 'Tiger', 'Lion', 'Bear', 'Shark',
        'Storm', 'Thunder', 'Lightning', 'Fire', 'Ice', 'Steel', 'Iron', 'Stone', 'Phantom', 'Ghost',
        'Shadow', 'Blade', 'Arrow', 'Bullet', 'Rocket', 'Laser', 'Plasma', 'Nova', 'Comet', 'Meteor',
        
        // Squad numbers (fallback for very large squads)
        'Unit-01', 'Unit-02', 'Unit-03', 'Unit-04', 'Unit-05', 'Unit-06', 'Unit-07', 'Unit-08', 'Unit-09', 'Unit-10',
        'Unit-11', 'Unit-12', 'Unit-13', 'Unit-14', 'Unit-15', 'Unit-16', 'Unit-17', 'Unit-18', 'Unit-19', 'Unit-20'
    ];

    // Color pool for squad member identification
    static colorPool = [
        0x0099ff, // Blue
        0xff3333, // Red  
        0x00ff00, // Green
        0xff8800, // Orange
        0xaa44ff, // Purple
        0x00ffff, // Cyan
        0xff0099, // Pink
        0xffff00, // Yellow
        0x9933ff, // Violet
        0x33ff99, // Mint
        0xff6633, // Red-Orange
        0x3366ff, // Blue-Purple
        0x66ff33, // Lime Green
        0xff3366, // Hot Pink
        0x33ffff, // Light Cyan
        0xffaa00, // Amber
        0x9900ff, // Deep Purple
        0x00ff66, // Spring Green
        0xff0066, // Rose
        0x6600ff, // Indigo
        0x00cc99, // Teal
        0xff9900, // Dark Orange
        0x9999ff, // Light Purple
        0x99ff00, // Bright Lime
        0xff0033, // Crimson
        0x0066ff, // Royal Blue
        0x66ff99, // Aqua Green
        0xff6600, // Burnt Orange
        0x3300ff, // Electric Blue
        0xcc00ff  // Magenta
    ];

    // Weapon pool for automatic assignment
    static weaponPool = ['pistol', 'machineGun'];

    /**
     * Generate formation positions for any number of squad members
     * Creates tactical formations that scale with squad size
     */
    static generateFormationPositions(squadSize) {
        const positions = [];
        
        if (squadSize <= 4) {
            // Small squad: Diamond/Square formation
            positions.push(
                { x: -60, y: -20 }, // Left front
                { x: 60, y: -20 },  // Right front
                { x: -50, y: 40 },  // Left back
                { x: 50, y: 40 }    // Right back
            );
        } else if (squadSize <= 8) {
            // Medium squad: Extended line formation
            const spacing = 45;
            const frontRow = Math.ceil(squadSize / 2);
            const backRow = squadSize - frontRow;
            
            // Front row
            for (let i = 0; i < frontRow; i++) {
                const offsetX = (i - (frontRow - 1) / 2) * spacing;
                positions.push({ x: offsetX, y: -20 });
            }
            
            // Back row
            for (let i = 0; i < backRow; i++) {
                const offsetX = (i - (backRow - 1) / 2) * spacing;
                positions.push({ x: offsetX, y: 40 });
            }
        } else if (squadSize <= 16) {
            // Large squad: V-formation with multiple rows
            const rowSize = 4;
            const rows = Math.ceil(squadSize / rowSize);
            let memberIndex = 0;
            
            for (let row = 0; row < rows && memberIndex < squadSize; row++) {
                const membersInRow = Math.min(rowSize, squadSize - memberIndex);
                const spacing = 50;
                const yOffset = -30 + (row * 35);
                
                for (let i = 0; i < membersInRow; i++) {
                    const offsetX = (i - (membersInRow - 1) / 2) * spacing;
                    positions.push({ x: offsetX, y: yOffset });
                    memberIndex++;
                }
            }
        } else {
            // Massive squad: Grid formation
            const columns = Math.ceil(Math.sqrt(squadSize));
            const rows = Math.ceil(squadSize / columns);
            const spacingX = 45;
            const spacingY = 35;
            
            for (let i = 0; i < squadSize; i++) {
                const col = i % columns;
                const row = Math.floor(i / columns);
                
                const offsetX = (col - (columns - 1) / 2) * spacingX;
                const offsetY = -40 + (row * spacingY);
                
                positions.push({ x: offsetX, y: offsetY });
            }
        }
        
        return positions.slice(0, squadSize);
    }

    /**
     * Generate squad member configurations dynamically
     */
    static generateSquadConfig(squadSize, difficultyModifiers = {}) {
        if (squadSize <= 0) {
            return { size: 0, members: [] };
        }

        const members = [];
        const positions = this.generateFormationPositions(squadSize);
        
        // Default stats that can be modified by difficulty
        const baseStats = {
            aggroRange: 280,
            followDistance: 60,
            maxSeparation: 220,
            health: 80,
            damage: 25,
            ...difficultyModifiers // Apply any difficulty-specific modifiers
        };

        for (let i = 0; i < squadSize; i++) {
            // Get name from pool, with fallback
            const name = this.namePool[i] || `Soldier-${String(i + 1).padStart(2, '0')}`;
            
            // Get color from pool, cycling through if needed
            const color = this.colorPool[i % this.colorPool.length];
            
            // Alternate weapon types for variety
            const weapon = this.weaponPool[i % this.weaponPool.length];
            
            // Adjust stats slightly for variety
            const statVariation = 0.15; // 15% variation
            const healthVariation = Math.random() * statVariation * 2 - statVariation; // -15% to +15%
            const damageVariation = Math.random() * statVariation * 2 - statVariation;
            const rangeVariation = Math.random() * statVariation * 2 - statVariation;
            
            // Higher rank members (earlier in formation) get slightly better stats
            const rankBonus = (squadSize - i) / squadSize * 0.1; // 0-10% bonus for higher ranks
            
            const memberConfig = {
                name: name,
                color: color,
                formationOffset: positions[i] || { x: 0, y: 60 + (i * 20) }, // Fallback position
                weapon: weapon,
                aggroRange: Math.round(baseStats.aggroRange * (1 + rangeVariation + rankBonus)),
                followDistance: baseStats.followDistance,
                maxSeparation: baseStats.maxSeparation,
                health: Math.round(baseStats.health * (1 + healthVariation + rankBonus)),
                damage: Math.round(baseStats.damage * (1 + damageVariation + rankBonus))
            };

            members.push(memberConfig);
        }

        return {
            size: squadSize,
            members: members
        };
    }

    /**
     * Generate squad configuration with difficulty-based scaling
     */
    static generateDifficultySquad(difficultyName, customSize = null) {
        const difficultyConfigs = {
            easy: {
                size: customSize || 6,
                modifiers: {
                    health: 90,  // Slightly more health
                    damage: 28,  // Slightly more damage
                    aggroRange: 300
                }
            },
            normal: {
                size: customSize || 4,
                modifiers: {
                    health: 80,
                    damage: 25,
                    aggroRange: 280
                }
            },
            hard: {
                size: customSize || 3,
                modifiers: {
                    health: 70,  // Less health
                    damage: 22,  // Less damage
                    aggroRange: 260
                }
            },
            nightmare: {
                size: customSize || 5,
                modifiers: {
                    health: 85,
                    damage: 30,  // More damage to compensate
                    aggroRange: 320
                }
            }
        };

        const config = difficultyConfigs[difficultyName] || difficultyConfigs.normal;
        return this.generateSquadConfig(config.size, config.modifiers);
    }

    /**
     * Generate formation preview for debugging/visualization
     */
    static getFormationPreview(squadSize) {
        const positions = this.generateFormationPositions(squadSize);
        console.log(`🎖️ Formation Preview for ${squadSize} squad members:`);
        console.log('==========================================');
        
        positions.forEach((pos, index) => {
            const name = this.namePool[index] || `Soldier-${String(index + 1).padStart(2, '0')}`;
            const color = `#${this.colorPool[index % this.colorPool.length].toString(16).padStart(6, '0')}`;
            console.log(`${index + 1}. ${name} at (${pos.x}, ${pos.y}) - Color: ${color}`);
        });
        
        return positions;
    }

    /**
     * Quick test method for console debugging
     */
    static test(squadSize = 10) {
        console.log(`🧪 Testing squad generation with ${squadSize} members:`);
        const config = this.generateSquadConfig(squadSize);
        console.log('Generated config:', config);
        this.getFormationPreview(squadSize);
        return config;
    }
}

// Make SquadGenerator available globally for debugging
if (typeof window !== 'undefined') {
    window.SquadGenerator = SquadGenerator;
    console.log('🎖️ SquadGenerator loaded! Available commands:');
    console.log('  SquadGenerator.test(10) - Test with 10 members');
    console.log('  SquadGenerator.getFormationPreview(15) - Preview formation');
    console.log('  SquadGenerator.generateDifficultySquad("nightmare", 20) - Custom size');
} 