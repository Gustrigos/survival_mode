export class PlayerSpriteGenerator {
    static generateSprites(scene) {
        console.log('Generating detailed top-down pixel art player sprites...');
        
        this.createPlayerSprites(scene);
        this.createWeaponSprites(scene);
        this.createBullet(scene);
        this.createBloodSplat(scene);
        this.createMuzzleFlash(scene);
        this.createShellCasing(scene);
        
        console.log('Detailed pixel art player sprites generated');
    }
    
    static createPlayerSprites(scene) {
        const width = 24;   // Larger size for more detail
        const height = 24;  // Square format
        const directions = ['up', 'down', 'left', 'right'];
        
        directions.forEach(direction => {
            const graphics = scene.add.graphics();
            
            // Detailed color palette inspired by reference images
            const outline = 0x000000;      // Black outline
            const skinTone = 0xFFDBB5;     // Light skin
            const skinShadow = 0xE6C4A0;   // Skin shadow
            const hairColor = 0x8B4513;    // Brown hair
            const armorColor = 0x708090;   // Gray armor/chainmail
            const armorLight = 0x8A9BA8;   // Light armor
            const armorDark = 0x556B7D;    // Dark armor
            const clothColor = 0x4169E1;   // Blue cloth/tunic
            const clothShadow = 0x1E3A8A;  // Dark blue shadow
            const weaponWood = 0x8B4513;   // Brown weapon handle
            const weaponMetal = 0xC0C0C0;  // Silver metal
            const beltColor = 0x654321;    // Brown belt
            
            // All directions use top-down perspective but with proper character detail
            
            switch(direction) {
                case 'down': // Facing down (towards camera)
                    // Outline
                    graphics.fillStyle(outline);
                    graphics.fillRect(7, 2, 10, 20); // Body outline
                    graphics.fillRect(9, 1, 6, 3); // Head outline
                    
                    // Head and face
                    graphics.fillStyle(skinTone);
                    graphics.fillRect(10, 2, 4, 3); // Head
                    
                    graphics.fillStyle(skinShadow);
                    graphics.fillRect(10, 4, 4, 1); // Face shadow
                    
                    // Hair
                    graphics.fillStyle(hairColor);
                    graphics.fillRect(9, 1, 6, 2); // Hair
                    graphics.fillRect(10, 3, 4, 1); // Hair sides
                    
                    // Eyes
                    graphics.fillStyle(outline);
                    graphics.fillRect(10, 3, 1, 1); // Left eye
                    graphics.fillRect(13, 3, 1, 1); // Right eye
                    
                    // Body armor/chainmail
                    graphics.fillStyle(armorDark);
                    graphics.fillRect(8, 6, 8, 8); // Armor shadow
                    
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(8, 5, 8, 8); // Main armor
                    
                    graphics.fillStyle(armorLight);
                    graphics.fillRect(8, 5, 8, 2); // Armor highlight
                    graphics.fillRect(8, 5, 2, 8); // Left highlight
                    
                    // Tunic/cloth over armor
                    graphics.fillStyle(clothShadow);
                    graphics.fillRect(9, 8, 6, 4); // Cloth shadow
                    
                    graphics.fillStyle(clothColor);
                    graphics.fillRect(9, 7, 6, 4); // Main cloth
                    
                    // Arms with armor
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(6, 6, 2, 6); // Left arm armor
                    graphics.fillRect(16, 6, 2, 6); // Right arm armor
                    
                    graphics.fillStyle(skinTone);
                    graphics.fillRect(6, 11, 2, 2); // Left hand
                    graphics.fillRect(16, 11, 2, 2); // Right hand
                    
                    // Weapon (sword) held vertically
                    graphics.fillStyle(weaponWood);
                    graphics.fillRect(18, 4, 1, 8); // Sword handle
                    
                    graphics.fillStyle(weaponMetal);
                    graphics.fillRect(18, 2, 1, 3); // Sword blade
                    graphics.fillRect(17, 4, 3, 1); // Cross guard
                    
                    // Belt
                    graphics.fillStyle(beltColor);
                    graphics.fillRect(8, 11, 8, 1); // Belt
                    
                    graphics.fillStyle(weaponMetal);
                    graphics.fillRect(11, 11, 2, 1); // Belt buckle
                    
                    // Legs with armor
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(9, 13, 2, 6); // Left leg armor
                    graphics.fillRect(13, 13, 2, 6); // Right leg armor
                    
                    graphics.fillStyle(armorDark);
                    graphics.fillRect(9, 17, 2, 2); // Left leg shadow
                    graphics.fillRect(13, 17, 2, 2); // Right leg shadow
                    
                    // Boots
                    graphics.fillStyle(outline);
                    graphics.fillRect(9, 19, 2, 3); // Left boot
                    graphics.fillRect(13, 19, 2, 3); // Right boot
                    break;
                    
                case 'up': // Facing up (away from camera)
                    // Outline
                    graphics.fillStyle(outline);
                    graphics.fillRect(7, 2, 10, 20); // Body outline
                    graphics.fillRect(9, 1, 6, 3); // Head outline
                    
                    // Head (back view)
                    graphics.fillStyle(hairColor);
                    graphics.fillRect(9, 1, 6, 4); // Hair back
                    
                    // Neck
                    graphics.fillStyle(skinTone);
                    graphics.fillRect(11, 4, 2, 1); // Neck
                    
                    // Body armor (back view)
                    graphics.fillStyle(armorDark);
                    graphics.fillRect(8, 6, 8, 8); // Armor shadow
                    
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(8, 5, 8, 8); // Main armor
                    
                    // Backpack/gear
                    graphics.fillStyle(beltColor);
                    graphics.fillRect(9, 6, 6, 6); // Backpack
                    
                    graphics.fillStyle(weaponMetal);
                    graphics.fillRect(10, 7, 4, 1); // Backpack strap
                    graphics.fillRect(11, 9, 2, 1); // Buckle
                    
                    // Arms
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(6, 6, 2, 6); // Left arm
                    graphics.fillRect(16, 6, 2, 6); // Right arm
                    
                    // Weapon on back
                    graphics.fillStyle(weaponWood);
                    graphics.fillRect(5, 3, 1, 8); // Weapon handle
                    
                    graphics.fillStyle(weaponMetal);
                    graphics.fillRect(5, 1, 1, 3); // Weapon tip
                    
                    // Legs
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(9, 13, 2, 6); // Left leg
                    graphics.fillRect(13, 13, 2, 6); // Right leg
                    
                    // Boots
                    graphics.fillStyle(outline);
                    graphics.fillRect(9, 19, 2, 3); // Left boot
                    graphics.fillRect(13, 19, 2, 3); // Right boot
                    break;
                    
                case 'left': // Moving left
                    // Outline
                    graphics.fillStyle(outline);
                    graphics.fillRect(7, 2, 10, 20); // Body outline
                    graphics.fillRect(9, 1, 6, 3); // Head outline
                    
                    // Head (side view)
                    graphics.fillStyle(skinTone);
                    graphics.fillRect(10, 2, 4, 3); // Head
                    
                    graphics.fillStyle(hairColor);
                    graphics.fillRect(9, 1, 5, 3); // Hair
                    
                    // Eye
                    graphics.fillStyle(outline);
                    graphics.fillRect(11, 3, 1, 1); // Eye
                    
                    // Body armor
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(8, 5, 8, 8); // Main armor
                    
                    graphics.fillStyle(armorLight);
                    graphics.fillRect(8, 5, 2, 8); // Left highlight
                    
                    // Cloth
                    graphics.fillStyle(clothColor);
                    graphics.fillRect(9, 7, 6, 4); // Cloth
                    
                    // Arms (left arm extended with weapon)
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(4, 7, 5, 2); // Left arm extended
                    graphics.fillRect(16, 8, 2, 4); // Right arm
                    
                    graphics.fillStyle(skinTone);
                    graphics.fillRect(3, 7, 2, 2); // Left hand
                    graphics.fillRect(16, 11, 2, 2); // Right hand
                    
                    // Weapon (sword) pointing left
                    graphics.fillStyle(weaponWood);
                    graphics.fillRect(1, 8, 4, 1); // Handle
                    
                    graphics.fillStyle(weaponMetal);
                    graphics.fillRect(0, 8, 2, 1); // Blade
                    graphics.fillRect(2, 7, 1, 3); // Cross guard
                    
                    // Legs
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(9, 13, 2, 6); // Left leg
                    graphics.fillRect(13, 13, 2, 6); // Right leg
                    
                    // Boots
                    graphics.fillStyle(outline);
                    graphics.fillRect(9, 19, 2, 3); // Left boot
                    graphics.fillRect(13, 19, 2, 3); // Right boot
                    break;
                    
                case 'right': // Moving right
                    // Outline
                    graphics.fillStyle(outline);
                    graphics.fillRect(7, 2, 10, 20); // Body outline
                    graphics.fillRect(9, 1, 6, 3); // Head outline
                    
                    // Head (side view)
                    graphics.fillStyle(skinTone);
                    graphics.fillRect(10, 2, 4, 3); // Head
                    
                    graphics.fillStyle(hairColor);
                    graphics.fillRect(10, 1, 5, 3); // Hair
                    
                    // Eye
                    graphics.fillStyle(outline);
                    graphics.fillRect(12, 3, 1, 1); // Eye
                    
                    // Body armor
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(8, 5, 8, 8); // Main armor
                    
                    graphics.fillStyle(armorLight);
                    graphics.fillRect(14, 5, 2, 8); // Right highlight
                    
                    // Cloth
                    graphics.fillStyle(clothColor);
                    graphics.fillRect(9, 7, 6, 4); // Cloth
                    
                    // Arms (right arm extended with weapon)
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(6, 8, 2, 4); // Left arm
                    graphics.fillRect(15, 7, 5, 2); // Right arm extended
                    
                    graphics.fillStyle(skinTone);
                    graphics.fillRect(6, 11, 2, 2); // Left hand
                    graphics.fillRect(19, 7, 2, 2); // Right hand
                    
                    // Weapon (sword) pointing right
                    graphics.fillStyle(weaponWood);
                    graphics.fillRect(19, 8, 4, 1); // Handle
                    
                    graphics.fillStyle(weaponMetal);
                    graphics.fillRect(22, 8, 2, 1); // Blade
                    graphics.fillRect(21, 7, 1, 3); // Cross guard
                    
                    // Legs
                    graphics.fillStyle(armorColor);
                    graphics.fillRect(9, 13, 2, 6); // Left leg
                    graphics.fillRect(13, 13, 2, 6); // Right leg
                    
                    // Boots
                    graphics.fillStyle(outline);
                    graphics.fillRect(9, 19, 2, 3); // Left boot
                    graphics.fillRect(13, 19, 2, 3); // Right boot
                    break;
            }
            
            graphics.generateTexture(`player_${direction}`, width, height);
            graphics.destroy();
            
            console.log(`Detailed top-down player ${direction} sprite created`);
        });
    }
    
    static createWeaponSprites(scene) {
        const directions = ['up', 'down', 'left', 'right'];
        
        directions.forEach(direction => {
            const graphics = scene.add.graphics();
            
            // Weapon colors
            const outline = 0x000000;
            const woodColor = 0x8B4513;
            const metalColor = 0xC0C0C0;
            const bladeColor = 0xE6E6FA;
            
            switch(direction) {
                case 'up':
                case 'down':
                    // Detailed vertical sword
                    graphics.fillStyle(outline);
                    graphics.fillRect(11, 0, 2, 24); // Outline
                    
                    graphics.fillStyle(woodColor);
                    graphics.fillRect(11, 16, 2, 6); // Handle
                    
                    graphics.fillStyle(metalColor);
                    graphics.fillRect(10, 14, 4, 2); // Cross guard
                    
                    graphics.fillStyle(bladeColor);
                    graphics.fillRect(11, 2, 2, 12); // Blade
                    
                    graphics.fillStyle(metalColor);
                    graphics.fillRect(11, 0, 2, 3); // Blade tip
                    break;
                    
                case 'left':
                case 'right':
                    // Detailed horizontal sword
                    graphics.fillStyle(outline);
                    graphics.fillRect(0, 11, 24, 2); // Outline
                    
                    graphics.fillStyle(woodColor);
                    graphics.fillRect(16, 11, 6, 2); // Handle
                    
                    graphics.fillStyle(metalColor);
                    graphics.fillRect(14, 10, 2, 4); // Cross guard
                    
                    graphics.fillStyle(bladeColor);
                    graphics.fillRect(2, 11, 12, 2); // Blade
                    
                    graphics.fillStyle(metalColor);
                    graphics.fillRect(0, 11, 3, 2); // Blade tip
                    break;
            }
            
            graphics.generateTexture(`weapon_${direction}`, 24, 24);
            graphics.destroy();
        });
    }
    
    static createBullet(scene) {
        const graphics = scene.add.graphics();
        
        // Detailed arrow/projectile
        graphics.fillStyle(0x000000); // Outline
        graphics.fillRect(0, 2, 12, 4);
        
        graphics.fillStyle(0x8B4513); // Brown shaft
        graphics.fillRect(3, 3, 6, 2);
        
        graphics.fillStyle(0xC0C0C0); // Metal tip
        graphics.fillRect(0, 3, 3, 2);
        
        graphics.fillStyle(0x654321); // Fletching
        graphics.fillRect(9, 2, 3, 4);
        
        graphics.generateTexture('bullet', 12, 8);
        graphics.destroy();
    }
    
    static createBloodSplat(scene) {
        const graphics = scene.add.graphics();
        
        // Detailed blood splat
        graphics.fillStyle(0x8B0000); // Dark red
        graphics.fillRect(2, 2, 8, 8);
        graphics.fillRect(4, 1, 4, 10);
        graphics.fillRect(1, 4, 10, 4);
        
        graphics.fillStyle(0xDC143C); // Bright red center
        graphics.fillRect(4, 4, 4, 4);
        
        graphics.fillStyle(0x8B0000); // Splatter
        graphics.fillRect(0, 3, 2, 2);
        graphics.fillRect(10, 5, 2, 2);
        graphics.fillRect(3, 0, 2, 2);
        graphics.fillRect(7, 10, 2, 2);
        
        graphics.generateTexture('bloodSplat', 12, 12);
        graphics.destroy();
    }
    
    static createMuzzleFlash(scene) {
        const graphics = scene.add.graphics();
        
        // Detailed flash effect
        graphics.fillStyle(0xFFD700); // Yellow
        graphics.fillRect(2, 2, 8, 8);
        graphics.fillRect(4, 1, 4, 10);
        graphics.fillRect(1, 4, 10, 4);
        
        graphics.fillStyle(0xFFFFFF); // White center
        graphics.fillRect(4, 4, 4, 4);
        
        graphics.fillStyle(0xFF4500); // Orange outer
        graphics.fillRect(0, 3, 2, 2);
        graphics.fillRect(10, 5, 2, 2);
        graphics.fillRect(3, 0, 2, 2);
        graphics.fillRect(7, 10, 2, 2);
        
        graphics.generateTexture('muzzleFlash', 12, 12);
        graphics.destroy();
    }
    
    static createShellCasing(scene) {
        const graphics = scene.add.graphics();
        
        // Detailed casing
        graphics.fillStyle(0x000000); // Outline
        graphics.fillRect(1, 1, 6, 10);
        
        graphics.fillStyle(0xB8860B); // Brass
        graphics.fillRect(2, 2, 4, 8);
        
        graphics.fillStyle(0xDAA520); // Brass highlight
        graphics.fillRect(2, 2, 1, 8);
        
        graphics.generateTexture('shellCasing', 8, 12);
        graphics.destroy();
    }
} 