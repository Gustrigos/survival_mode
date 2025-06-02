export class ZombieSpriteGenerator {
    static generateSprites(scene) {
        
        this.createZombieSprites(scene);
        
    }
    
    static createZombieSprites(scene) {
        const width = 24;   // Match player sprite size
        const height = 24;  // Square format
        const directions = ['up', 'down', 'left', 'right'];
        
        directions.forEach(direction => {
            const graphics = scene.add.graphics();
            
            // Detailed zombie color palette
            const outline = 0x000000;        // Black outline
            const zombieSkin = 0x8FBC8F;     // Sickly green
            const zombieSkinDark = 0x6B8E23;  // Darker green
            const decayedSkin = 0x556B2F;    // Very dark decay
            const rottenFlesh = 0x2F4F2F;    // Rotten areas
            const bloodColor = 0x8B0000;     // Dark blood
            const bloodBright = 0xDC143C;    // Bright blood
            const clothingColor = 0x696969;  // Gray tattered clothing
            const clothingDark = 0x2F2F2F;   // Dark clothing tears
            const hairColor = 0x2F2F2F;      // Dark patchy hair
            const boneColor = 0xF5F5DC;      // Exposed bone
            
            switch(direction) {
                case 'down': // Facing down (towards camera)
                    // Outline
                    graphics.fillStyle(outline);
                    graphics.fillRect(7, 2, 10, 20); // Body outline
                    graphics.fillRect(9, 1, 6, 3); // Head outline
                    
                    // Head with decay
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(10, 2, 4, 3); // Head
                    
                    graphics.fillStyle(zombieSkinDark);
                    graphics.fillRect(10, 4, 4, 1); // Face shadow
                    
                    // Decay spots on head
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(9, 2, 1, 1); // Left decay
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(14, 3, 1, 1); // Right decay
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(11, 4, 2, 1); // Jaw decay
                    
                    // Patchy hair
                    graphics.fillStyle(hairColor);
                    graphics.fillRect(9, 1, 3, 2); // Left hair patch
                    graphics.fillRect(12, 1, 3, 2); // Right hair patch
                    // Missing hair in middle
                    
                    // Eyes (one missing)
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(10, 3, 1, 1); // Left eye socket
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(13, 3, 1, 1); // Right eye missing
                    
                    // Mouth with exposed teeth
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(11, 4, 2, 1); // Bloody mouth
                    graphics.fillStyle(boneColor);
                    graphics.fillRect(11, 4, 1, 1); // Exposed tooth
                    
                    // Body with tattered clothing
                    graphics.fillStyle(clothingDark);
                    graphics.fillRect(8, 6, 8, 8); // Clothing shadow
                    
                    graphics.fillStyle(clothingColor);
                    graphics.fillRect(8, 5, 8, 8); // Main clothing
                    
                    // Large tears in clothing
                    graphics.fillStyle(clothingDark);
                    graphics.fillRect(9, 7, 2, 3); // Left tear
                    graphics.fillRect(13, 8, 2, 2); // Right tear
                    
                    // Exposed decayed skin through tears
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(9, 8, 2, 2); // Left exposed skin
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(10, 8, 1, 1); // Deep decay
                    
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(13, 9, 2, 1); // Right exposed skin
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(14, 9, 1, 1); // Decay spot
                    
                    // Arms with decay
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(6, 6, 2, 6); // Left arm
                    graphics.fillRect(16, 6, 2, 6); // Right arm
                    
                    graphics.fillStyle(zombieSkinDark);
                    graphics.fillRect(6, 10, 2, 2); // Left arm shadow
                    graphics.fillRect(16, 10, 2, 2); // Right arm shadow
                    
                    // Arm decay and wounds
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(6, 8, 1, 1); // Left arm decay
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(17, 9, 1, 1); // Right arm deep decay
                    
                    // Clawed hands
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(6, 11, 2, 2); // Left hand
                    graphics.fillRect(16, 11, 2, 2); // Right hand
                    
                    graphics.fillStyle(zombieSkinDark);
                    graphics.fillRect(6, 12, 2, 1); // Hand shadows
                    graphics.fillRect(16, 12, 2, 1);
                    
                    // Claws
                    graphics.fillStyle(outline);
                    graphics.fillRect(5, 12, 1, 1); // Left claw
                    graphics.fillRect(8, 12, 1, 1); // Left claw
                    graphics.fillRect(15, 12, 1, 1); // Right claw
                    graphics.fillRect(18, 12, 1, 1); // Right claw
                    
                    // Blood on hands
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(7, 11, 1, 1); // Left hand blood
                    graphics.fillRect(17, 11, 1, 1); // Right hand blood
                    
                    // Legs with torn pants
                    graphics.fillStyle(clothingColor);
                    graphics.fillRect(9, 13, 2, 6); // Left leg clothing
                    graphics.fillRect(13, 13, 2, 6); // Right leg clothing
                    
                    graphics.fillStyle(clothingDark);
                    graphics.fillRect(9, 17, 2, 2); // Left leg shadow
                    graphics.fillRect(13, 17, 2, 2); // Right leg shadow
                    
                    // Holes in pants
                    graphics.fillStyle(clothingDark);
                    graphics.fillRect(9, 15, 1, 2); // Left hole
                    graphics.fillRect(14, 16, 1, 1); // Right hole
                    
                    // Exposed decayed leg skin
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(9, 16, 1, 1); // Left leg skin
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(14, 16, 1, 1); // Right leg skin
                    
                    // Bare decayed feet
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(9, 19, 2, 3); // Left foot
                    graphics.fillRect(13, 19, 2, 3); // Right foot
                    
                    graphics.fillStyle(zombieSkinDark);
                    graphics.fillRect(9, 21, 2, 1); // Foot shadows
                    graphics.fillRect(13, 21, 2, 1);
                    
                    // Missing toes and bone exposure
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(9, 20, 1, 1); // Left foot decay
                    graphics.fillStyle(boneColor);
                    graphics.fillRect(14, 21, 1, 1); // Exposed toe bone
                    
                    // Blood stains
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(12, 4, 1, 1); // Blood on face
                    graphics.fillRect(10, 9, 1, 1); // Blood on chest
                    graphics.fillRect(15, 15, 1, 1); // Blood on leg
                    break;
                    
                case 'up': // Facing up (away from camera)
                    // Outline
                    graphics.fillStyle(outline);
                    graphics.fillRect(7, 2, 10, 20); // Body outline
                    graphics.fillRect(9, 1, 6, 3); // Head outline
                    
                    // Head (back view) with decay
                    graphics.fillStyle(hairColor);
                    graphics.fillRect(9, 1, 6, 3); // Hair back (patchy)
                    
                    // Bald spots and scalp decay
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(11, 2, 2, 1); // Bald spot 1
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(13, 3, 1, 1); // Scalp decay
                    
                    // Neck with decay
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(11, 4, 2, 1); // Neck
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(11, 4, 1, 1); // Neck decay
                    
                    // Body (back view) with torn clothing
                    graphics.fillStyle(clothingColor);
                    graphics.fillRect(8, 5, 8, 8); // Main clothing back
                    
                    graphics.fillStyle(clothingDark);
                    graphics.fillRect(8, 11, 8, 2); // Clothing shadow
                    
                    // Large tears in back
                    graphics.fillStyle(clothingDark);
                    graphics.fillRect(10, 7, 2, 3); // Back tear
                    graphics.fillRect(14, 8, 1, 2); // Side tear
                    
                    // Exposed decayed skin
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(10, 8, 2, 2); // Back skin showing
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(11, 8, 1, 1); // Deep back decay
                    
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(14, 9, 1, 1); // Side skin showing
                    
                    // Arms with decay
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(6, 6, 2, 6); // Left arm
                    graphics.fillRect(16, 6, 2, 6); // Right arm
                    
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(7, 8, 1, 1); // Left arm decay
                    graphics.fillRect(16, 9, 1, 1); // Right arm decay
                    
                    // Legs and feet
                    graphics.fillStyle(clothingColor);
                    graphics.fillRect(9, 13, 2, 6); // Left leg
                    graphics.fillRect(13, 13, 2, 6); // Right leg
                    
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(9, 19, 2, 3); // Left foot
                    graphics.fillRect(13, 19, 2, 3); // Right foot
                    
                    // Blood stains on back
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(12, 9, 1, 1); // Blood on back
                    graphics.fillRect(15, 11, 1, 1); // Blood on back
                    break;
                    
                case 'left': // Moving left
                    // Outline
                    graphics.fillStyle(outline);
                    graphics.fillRect(7, 2, 10, 20); // Body outline
                    graphics.fillRect(9, 1, 6, 3); // Head outline
                    
                    // Head (side view) with extensive decay
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(10, 2, 4, 3); // Head
                    
                    graphics.fillStyle(zombieSkinDark);
                    graphics.fillRect(13, 3, 1, 2); // Face shadow
                    
                    // Extensive decay on face profile
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(10, 3, 2, 1); // Forehead decay
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(11, 4, 1, 1); // Deep cheek decay
                    
                    // Hair profile (very patchy)
                    graphics.fillStyle(hairColor);
                    graphics.fillRect(9, 1, 3, 2); // Front hair
                    graphics.fillRect(12, 2, 2, 1); // Back hair patch
                    
                    // Eye profile with decay
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(11, 3, 1, 1); // Eye socket
                    
                    // Body with detailed tears
                    graphics.fillStyle(clothingColor);
                    graphics.fillRect(8, 5, 8, 8); // Torso
                    
                    graphics.fillStyle(clothingDark);
                    graphics.fillRect(14, 5, 2, 8); // Right shadow
                    
                    // Large clothing tears
                    graphics.fillStyle(clothingDark);
                    graphics.fillRect(10, 7, 3, 2); // Large tear
                    graphics.fillRect(13, 10, 2, 2); // Side tear
                    
                    // Exposed decayed skin
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(10, 8, 2, 1); // Torso skin
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(11, 8, 1, 1); // Deep torso decay
                    
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(13, 11, 2, 1); // Side skin
                    
                    // Arms with reaching pose and decay
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(4, 7, 5, 2); // Left arm reaching
                    graphics.fillRect(16, 8, 2, 4); // Right arm
                    
                    graphics.fillStyle(zombieSkinDark);
                    graphics.fillRect(4, 8, 5, 1); // Arm shadow
                    
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(6, 7, 2, 1); // Arm decay
                    graphics.fillRect(17, 9, 1, 1); // Right arm decay
                    
                    // Clawed hand with detail
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(3, 7, 2, 2); // Hand
                    
                    graphics.fillStyle(outline);
                    graphics.fillRect(2, 8, 1, 1); // Claw
                    graphics.fillRect(2, 7, 1, 1); // Claw
                    
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(3, 8, 1, 1); // Blood on hand
                    
                    // Legs with decay
                    graphics.fillStyle(clothingColor);
                    graphics.fillRect(9, 13, 2, 6); // Left leg
                    graphics.fillRect(13, 13, 2, 6); // Right leg
                    
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(10, 15, 1, 1); // Leg decay
                    
                    // Foot with decay
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(9, 19, 2, 3); // Left foot
                    graphics.fillRect(13, 19, 2, 3); // Right foot
                    
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(10, 20, 1, 1); // Foot decay
                    graphics.fillStyle(boneColor);
                    graphics.fillRect(14, 21, 1, 1); // Exposed toe bone
                    
                    // Blood stains
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(12, 4, 1, 1); // Blood on face
                    graphics.fillRect(11, 10, 1, 1); // Blood on shirt
                    break;
                    
                case 'right': // Moving right
                    // Outline
                    graphics.fillStyle(outline);
                    graphics.fillRect(7, 2, 10, 20); // Body outline
                    graphics.fillRect(9, 1, 6, 3); // Head outline
                    
                    // Head (side view) with decay
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(10, 2, 4, 3); // Head
                    
                    graphics.fillStyle(zombieSkinDark);
                    graphics.fillRect(10, 3, 1, 2); // Face shadow
                    
                    // Decay on face
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(12, 3, 2, 1); // Forehead decay
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(12, 4, 1, 1); // Deep decay
                    
                    // Hair profile
                    graphics.fillStyle(hairColor);
                    graphics.fillRect(12, 1, 3, 2); // Hair
                    graphics.fillRect(10, 2, 2, 1); // Hair back
                    
                    // Eye profile
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(12, 3, 1, 1); // Eye socket
                    
                    // Body with tears
                    graphics.fillStyle(clothingColor);
                    graphics.fillRect(8, 5, 8, 8); // Torso
                    
                    graphics.fillStyle(clothingDark);
                    graphics.fillRect(8, 5, 2, 8); // Left shadow
                    
                    // Clothing tears
                    graphics.fillStyle(clothingDark);
                    graphics.fillRect(11, 7, 3, 2); // Tear
                    graphics.fillRect(9, 10, 2, 2); // Tear
                    
                    // Exposed skin
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(12, 8, 2, 1); // Skin
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(12, 8, 1, 1); // Deep decay
                    
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(9, 11, 2, 1); // Skin
                    
                    // Arms with decay
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(6, 8, 2, 4); // Left arm
                    graphics.fillRect(15, 7, 5, 2); // Right arm reaching
                    
                    graphics.fillStyle(zombieSkinDark);
                    graphics.fillRect(15, 8, 5, 1); // Arm shadow
                    
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(7, 9, 1, 1); // Left arm decay
                    graphics.fillRect(17, 7, 2, 1); // Right arm decay
                    
                    // Clawed hand
                    graphics.fillStyle(zombieSkin);
                    graphics.fillRect(19, 7, 2, 2); // Hand
                    
                    graphics.fillStyle(outline);
                    graphics.fillRect(21, 8, 1, 1); // Claw
                    graphics.fillRect(21, 7, 1, 1); // Claw
                    
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(20, 8, 1, 1); // Blood on hand
                    
                    // Legs and foot
                    graphics.fillStyle(clothingColor);
                    graphics.fillRect(9, 13, 2, 6); // Left leg
                    graphics.fillRect(13, 13, 2, 6); // Right leg
                    
                    graphics.fillStyle(decayedSkin);
                    graphics.fillRect(9, 19, 2, 3); // Left foot
                    graphics.fillRect(13, 19, 2, 3); // Right foot
                    
                    graphics.fillStyle(rottenFlesh);
                    graphics.fillRect(10, 20, 1, 1); // Foot decay
                    graphics.fillStyle(boneColor);
                    graphics.fillRect(9, 21, 1, 1); // Exposed bone
                    
                    // Blood stains
                    graphics.fillStyle(bloodColor);
                    graphics.fillRect(11, 4, 1, 1); // Blood on face
                    graphics.fillRect(13, 10, 1, 1); // Blood on shirt
                    break;
            }
            
            graphics.generateTexture(`zombie_${direction}`, width, height);
            graphics.destroy();
            
        });
    }
} 