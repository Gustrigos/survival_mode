export class SpriteGenerator {
    static generateSprites(scene) {
        console.log('Generating simple colored sprites...');
        
        // Create simple colored rectangles for all sprites
        this.createPlayerSprites(scene);
        this.createZombieSprites(scene);
        this.createWeaponSprites(scene);
        this.createBullet(scene);
        this.createBloodSplat(scene);
        this.createMuzzleFlash(scene);
        this.createShellCasing(scene);
        
        // Add farm environment sprites
        this.createFarmSprites(scene);
        
        console.log('All simple sprites generated');
    }
    
    static createPlayerSprites(scene) {
        const width = 48;  // Slimmer width
        const height = 64; // Keep height
        const directions = ['up', 'down', 'left', 'right'];
        
        directions.forEach(direction => {
            const graphics = scene.add.graphics();
            
            // No background - transparent
            
            // Body armor/vest (main torso)
            graphics.fillStyle(0x2d3748); // Dark blue-gray armor
            graphics.fillRect(8, 20, 32, 32);
            
            // Armor plates and details
            graphics.fillStyle(0x1a1a2e); // Darker armor sections
            graphics.fillRect(10, 22, 28, 6); // Upper chest plate
            graphics.fillRect(10, 30, 28, 6); // Lower chest plate
            graphics.fillRect(10, 38, 28, 6); // Abdomen plate
            
            // Tactical vest straps
            graphics.fillStyle(0x4a5568);
            graphics.fillRect(12, 20, 4, 32); // Left strap
            graphics.fillRect(32, 20, 4, 32); // Right strap
            
            // Head and hair (no helmet) - improved styling
            graphics.fillStyle(0x4a3728); // Better dark brown hair color
            graphics.fillRect(14, 4, 20, 10); // Main hair area (better proportions)
            graphics.fillStyle(0x3d2914); // Hair highlights
            graphics.fillRect(16, 5, 16, 6); // Hair top layer
            graphics.fillStyle(0x2d1f0a); // Hair shadows/depth
            graphics.fillRect(15, 8, 3, 4); // Left hair shadow
            graphics.fillRect(30, 8, 3, 4); // Right hair shadow
            graphics.fillRect(18, 6, 2, 2); // Hair texture detail
            graphics.fillRect(28, 6, 2, 2); // Hair texture detail
            
            // Face area (cleaner skin)
            graphics.fillStyle(0xffeaa7); // Better skin tone
            graphics.fillRect(16, 10, 16, 10); // Face area
            
            // Bigger, more detailed eyes
            graphics.fillStyle(0xffffff); // Eye whites
            graphics.fillRect(18, 12, 4, 3); // Left eye (bigger)
            graphics.fillRect(26, 12, 4, 3); // Right eye (bigger)
            graphics.fillStyle(0x4a90e2); // Blue iris
            graphics.fillRect(19, 13, 2, 2); // Left iris
            graphics.fillRect(27, 13, 2, 2); // Right iris
            graphics.fillStyle(0x2d2d2d); // Pupils
            graphics.fillRect(20, 13, 1, 1); // Left pupil
            graphics.fillRect(28, 13, 1, 1); // Right pupil
            
            // Facial features
            graphics.fillStyle(0xe6d7c3); // Nose
            graphics.fillRect(23, 16, 2, 2);
            graphics.fillStyle(0xd4a574); // Mouth
            graphics.fillRect(22, 18, 4, 1);
            
            // Subtle battle wear (less messy)
            graphics.fillStyle(0xd4a574); // Light scar
            graphics.fillRect(19, 11, 2, 1); // Small forehead mark
            graphics.fillStyle(0xc9b037); // Dirt (subtle)
            graphics.fillRect(29, 15, 1, 1); // Small dirt spot
            
            // Tactical gear details
            graphics.fillStyle(0x4a5568); // Gray gear
            // Shoulder pads with details
            graphics.fillStyle(0x3a4558);
            graphics.fillRect(4, 18, 6, 12);
            graphics.fillRect(38, 18, 6, 12);
            graphics.fillStyle(0x5a6578); // Highlights
            graphics.fillRect(4, 18, 6, 2);
            graphics.fillRect(38, 18, 6, 2);
            
            // Utility belt with pouches
            graphics.fillStyle(0x2d2d2d);
            graphics.fillRect(10, 36, 28, 6);
            // Belt pouches
            graphics.fillStyle(0x1a1a1a);
            graphics.fillRect(12, 37, 4, 4);
            graphics.fillRect(18, 37, 4, 4);
            graphics.fillRect(26, 37, 4, 4);
            graphics.fillRect(32, 37, 4, 4);
            
            // Weapon positioning based on direction - much more realistic gun
            graphics.fillStyle(0x2d2d2d); // Gun metal gray
            switch(direction) {
                case 'up':
                    // Realistic pistol held upward - much more gun-like
                    graphics.fillRect(20, 22, 8, 4); // Main gun body/slide
                    graphics.fillRect(22, 18, 4, 6); // Barrel (prominent and long)
                    graphics.fillRect(21, 26, 6, 4); // Grip handle
                    
                    // Gun frame and details
                    graphics.fillStyle(0x1a1a1a); // Dark gun parts
                    graphics.fillRect(23, 24, 2, 2); // Trigger guard opening
                    graphics.fillRect(23, 27, 2, 1); // Trigger
                    graphics.fillRect(22, 22, 4, 1); // Slide top
                    
                    // Gun highlights for realism
                    graphics.fillStyle(0x666666); // Metal highlights
                    graphics.fillRect(21, 19, 1, 4); // Barrel left edge
                    graphics.fillRect(25, 19, 1, 4); // Barrel right edge
                    graphics.fillRect(21, 23, 6, 1); // Slide highlight
                    
                    // Front sight
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(23, 18, 2, 1); // Clear front sight
                    
                    // Magazine visible
                    graphics.fillStyle(0x404040);
                    graphics.fillRect(22, 28, 4, 2); // Magazine base
                    break;
                    
                case 'down':
                    // Realistic pistol in ready position
                    graphics.fillRect(20, 32, 8, 4); // Main gun body
                    graphics.fillRect(22, 34, 4, 6); // Barrel pointing down
                    graphics.fillRect(21, 28, 6, 4); // Grip handle
                    
                    // Gun details
                    graphics.fillStyle(0x1a1a1a);
                    graphics.fillRect(23, 30, 2, 2); // Trigger guard
                    graphics.fillRect(23, 29, 2, 1); // Trigger
                    graphics.fillRect(22, 32, 4, 1); // Slide top
                    
                    // Highlights
                    graphics.fillStyle(0x666666);
                    graphics.fillRect(21, 35, 1, 4); // Barrel left
                    graphics.fillRect(25, 35, 1, 4); // Barrel right
                    graphics.fillRect(21, 33, 6, 1); // Slide highlight
                    
                    // Front sight
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(23, 38, 2, 1);
                    
                    // Magazine
                    graphics.fillStyle(0x404040);
                    graphics.fillRect(22, 27, 4, 2);
                    
                    // Enhanced face for down direction
                    graphics.fillStyle(0xffffff); // Eye whites
                    graphics.fillRect(18, 12, 4, 3); // Left eye
                    graphics.fillRect(26, 12, 4, 3); // Right eye
                    graphics.fillStyle(0x4a90e2); // Blue iris
                    graphics.fillRect(19, 13, 2, 2); // Left iris
                    graphics.fillRect(27, 13, 2, 2); // Right iris
                    graphics.fillStyle(0x2d2d2d); // Pupils
                    graphics.fillRect(20, 13, 1, 1);
                    graphics.fillRect(28, 13, 1, 1);
                    break;
                    
                case 'left':
                    // Side view pistol - very gun-like profile
                    graphics.fillRect(8, 30, 10, 4); // Main body/slide
                    graphics.fillRect(4, 31, 6, 2); // Barrel extending left
                    graphics.fillRect(16, 30, 4, 6); // Grip handle
                    
                    // Gun details
                    graphics.fillStyle(0x1a1a1a);
                    graphics.fillRect(12, 31, 4, 2); // Trigger guard area
                    graphics.fillRect(14, 32, 2, 1); // Trigger
                    graphics.fillRect(9, 30, 6, 1); // Slide top
                    
                    // Highlights
                    graphics.fillStyle(0x666666);
                    graphics.fillRect(4, 31, 5, 1); // Barrel top
                    graphics.fillRect(4, 32, 5, 1); // Barrel bottom
                    graphics.fillRect(9, 31, 6, 1); // Body highlight
                    
                    // Front sight
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(4, 31, 1, 1);
                    
                    // Magazine
                    graphics.fillStyle(0x404040);
                    graphics.fillRect(17, 33, 2, 3);
                    
                    // Side profile eye
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(18, 12, 3, 3);
                    graphics.fillStyle(0x4a90e2);
                    graphics.fillRect(19, 13, 2, 2);
                    graphics.fillStyle(0x2d2d2d);
                    graphics.fillRect(20, 13, 1, 1);
                    break;
                    
                case 'right':
                    // Side view pistol pointing right
                    graphics.fillRect(30, 30, 10, 4); // Main body
                    graphics.fillRect(38, 31, 6, 2); // Barrel extending right
                    graphics.fillRect(28, 30, 4, 6); // Grip handle
                    
                    // Gun details
                    graphics.fillStyle(0x1a1a1a);
                    graphics.fillRect(32, 31, 4, 2); // Trigger guard
                    graphics.fillRect(32, 32, 2, 1); // Trigger
                    graphics.fillRect(33, 30, 6, 1); // Slide top
                    
                    // Highlights
                    graphics.fillStyle(0x666666);
                    graphics.fillRect(39, 31, 5, 1); // Barrel top
                    graphics.fillRect(39, 32, 5, 1); // Barrel bottom
                    graphics.fillRect(33, 31, 6, 1); // Body highlight
                    
                    // Front sight
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(43, 31, 1, 1);
                    
                    // Magazine
                    graphics.fillStyle(0x404040);
                    graphics.fillRect(29, 33, 2, 3);
                    
                    // Side profile eye
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(27, 12, 3, 3);
                    graphics.fillStyle(0x4a90e2);
                    graphics.fillRect(27, 13, 2, 2);
                    graphics.fillStyle(0x2d2d2d);
                    graphics.fillRect(27, 13, 1, 1);
                    break;
            }
            
            // Arms with detailed sleeves
            graphics.fillStyle(0x1a1a2e); // Dark uniform sleeves
            if (direction === 'down') {
                graphics.fillRect(6, 32, 8, 14); // Left arm
                graphics.fillRect(34, 32, 8, 14); // Right arm
                // Gloves
                graphics.fillStyle(0x0f0f0f);
                graphics.fillRect(6, 44, 8, 4);
                graphics.fillRect(34, 44, 8, 4);
            } else {
                graphics.fillRect(6, 32, 8, 14);
                graphics.fillRect(34, 32, 8, 14);
                graphics.fillStyle(0x0f0f0f);
                graphics.fillRect(6, 44, 8, 4);
                graphics.fillRect(34, 44, 8, 4);
            }
            
            // Legs (tactical pants with cargo pockets)
            graphics.fillStyle(0x2c3e50);
            graphics.fillRect(14, 52, 8, 12);
            graphics.fillRect(26, 52, 8, 12);
            
            // Cargo pockets
            graphics.fillStyle(0x1a2332);
            graphics.fillRect(12, 54, 4, 6); // Left pocket
            graphics.fillRect(32, 54, 4, 6); // Right pocket
            
            // Tactical boots with details
            graphics.fillStyle(0x0f0f0f);
            graphics.fillRect(12, 58, 10, 6);
            graphics.fillRect(26, 58, 10, 6);
            // Boot laces
            graphics.fillStyle(0x2a2a2a);
            graphics.fillRect(15, 59, 1, 4);
            graphics.fillRect(17, 59, 1, 4);
            graphics.fillRect(29, 59, 1, 4);
            graphics.fillRect(31, 59, 1, 4);
            
            // Knee pads with straps
            graphics.fillStyle(0x4a5568);
            graphics.fillRect(14, 48, 8, 6);
            graphics.fillRect(26, 48, 8, 6);
            graphics.fillStyle(0x2a2a2a); // Straps
            graphics.fillRect(13, 50, 10, 1);
            graphics.fillRect(25, 50, 10, 1);
            
            // Generate texture
            graphics.generateTexture(`player_${direction}`, width, height);
            graphics.destroy();
            
            console.log(`Detailed SWAT player ${direction} sprite created`);
        });
    }
    
    static createZombieSprites(scene) {
        const width = 48;  // Slimmer width
        const height = 64; // Keep height
        const directions = ['up', 'down', 'left', 'right'];
        
        directions.forEach(direction => {
            const graphics = scene.add.graphics();
            
            // No background - transparent
            
            // Head/face with detailed skin
            graphics.fillStyle(0x8a9481); // Sickly green-gray skin
            graphics.fillRect(12, 6, 24, 24);
            
            // Skin discoloration and decay
            graphics.fillStyle(0x7a8471); // Darker decay spots
            graphics.fillRect(14, 8, 4, 6);
            graphics.fillRect(30, 12, 4, 8);
            graphics.fillRect(16, 24, 6, 4);
            
            // Messy/patchy hair with more detail
            graphics.fillStyle(0x2d2d1d);
            graphics.fillRect(10, 4, 28, 8);
            // Hair gaps/bald spots with scalp showing
            graphics.fillStyle(0x8a9481);
            graphics.fillRect(14, 6, 5, 4);
            graphics.fillRect(29, 6, 5, 4);
            graphics.fillRect(18, 8, 3, 2);
            graphics.fillStyle(0x7a7a6a); // Scalp discoloration
            graphics.fillRect(15, 7, 2, 2);
            graphics.fillRect(30, 7, 2, 2);
            
            // Torn clothing base with more detail
            graphics.fillStyle(0x4a4a3a); // Dirty shirt
            graphics.fillRect(10, 22, 28, 30);
            
            // Multiple tears and holes
            graphics.fillStyle(0x3a3a2a); // Darker tears
            graphics.fillRect(12, 26, 3, 8);
            graphics.fillRect(33, 30, 4, 6);
            graphics.fillRect(18, 44, 6, 4);
            graphics.fillRect(24, 28, 2, 4);
            graphics.fillRect(15, 38, 4, 3);
            
            // Exposed skin through tears
            graphics.fillStyle(0x7a8471);
            graphics.fillRect(13, 28, 2, 4);
            graphics.fillRect(34, 32, 2, 3);
            graphics.fillRect(19, 45, 3, 2);
            
            // Facial features based on direction
            switch(direction) {
                case 'up':
                    // Top of head view
                    graphics.fillStyle(0xff4444); // Bloodshot
                    graphics.fillRect(18, 12, 2, 2);
                    graphics.fillRect(28, 12, 2, 2);
                    // Scalp wounds
                    graphics.fillStyle(0x8b0000);
                    graphics.fillRect(20, 8, 3, 1);
                    graphics.fillRect(25, 10, 4, 1);
                    break;
                case 'down':
                    // Full face view with detailed decay
                    // Sunken, bloodshot eyes
                    graphics.fillStyle(0x1a1a1a); // Dark eye sockets
                    graphics.fillRect(16, 14, 5, 4);
                    graphics.fillRect(27, 14, 5, 4);
                    graphics.fillStyle(0xff4444); // Red eyes
                    graphics.fillRect(18, 15, 2, 2);
                    graphics.fillRect(29, 15, 2, 2);
                    graphics.fillStyle(0xaa2222); // Darker red centers
                    graphics.fillRect(18, 15, 1, 1);
                    graphics.fillRect(29, 15, 1, 1);
                    
                    // Decaying nose
                    graphics.fillStyle(0x6a7461);
                    graphics.fillRect(22, 18, 4, 3);
                    graphics.fillStyle(0x5a6451); // Nostril shadows
                    graphics.fillRect(23, 19, 1, 1);
                    graphics.fillRect(25, 19, 1, 1);
                    
                    // Decaying mouth with detailed teeth
                    graphics.fillStyle(0x2d1a1a); // Dark mouth
                    graphics.fillRect(20, 22, 8, 4);
                    graphics.fillStyle(0xffffff); // Teeth
                    graphics.fillRect(21, 23, 1, 2);
                    graphics.fillRect(23, 23, 1, 2);
                    graphics.fillRect(25, 23, 1, 2);
                    graphics.fillRect(27, 23, 1, 2);
                    // Missing/broken teeth
                    graphics.fillStyle(0x8b0000); // Blood/gaps
                    graphics.fillRect(22, 23, 1, 2);
                    graphics.fillRect(26, 23, 1, 2);
                    
                    // Facial wounds and scratches
                    graphics.fillStyle(0x8b0000);
                    graphics.fillRect(14, 18, 6, 1);
                    graphics.fillRect(30, 20, 4, 1);
                    graphics.fillRect(17, 26, 3, 1);
                    graphics.fillRect(28, 24, 4, 1);
                    break;
                case 'left':
                    // Side profile with decay
                    graphics.fillStyle(0xff4444);
                    graphics.fillRect(16, 15, 2, 2); // Eye
                    graphics.fillStyle(0x6a7461);
                    graphics.fillRect(12, 18, 3, 2); // Nose profile
                    graphics.fillStyle(0x2d1a1a);
                    graphics.fillRect(12, 22, 6, 3); // Mouth
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(13, 23, 1, 1); // Visible teeth
                    graphics.fillRect(15, 23, 1, 1);
                    // Wounds on side
                    graphics.fillStyle(0x8b0000);
                    graphics.fillRect(14, 18, 4, 1);
                    graphics.fillRect(13, 26, 3, 1);
                    break;
                case 'right':
                    // Side profile with decay
                    graphics.fillStyle(0xff4444);
                    graphics.fillRect(30, 15, 2, 2); // Eye
                    graphics.fillStyle(0x6a7461);
                    graphics.fillRect(33, 18, 3, 2); // Nose profile
                    graphics.fillStyle(0x2d1a1a);
                    graphics.fillRect(30, 22, 6, 3); // Mouth
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(32, 23, 1, 1); // Visible teeth
                    graphics.fillRect(34, 23, 1, 1);
                    // Wounds on side
                    graphics.fillStyle(0x8b0000);
                    graphics.fillRect(30, 18, 4, 1);
                    graphics.fillRect(32, 26, 3, 1);
                    break;
            }
            
            // Arms with detailed decay and reaching pose
            graphics.fillStyle(0x7a8471); // Zombie skin
            if (direction === 'down') {
                // Arms reaching forward menacingly
                graphics.fillRect(4, 28, 10, 16); // Left arm
                graphics.fillRect(34, 28, 10, 16); // Right arm
                
                // Arm wounds and decay
                graphics.fillStyle(0x6a7461);
                graphics.fillRect(6, 30, 2, 4);
                graphics.fillRect(36, 32, 2, 4);
                graphics.fillStyle(0x8b0000); // Blood/wounds
                graphics.fillRect(5, 34, 3, 1);
                graphics.fillRect(37, 36, 3, 1);
                
                // Clawed hands with detailed fingers
                graphics.fillStyle(0x6a7461);
                graphics.fillRect(2, 40, 6, 6);
                graphics.fillRect(40, 40, 6, 6);
                // Individual fingers/claws
                graphics.fillStyle(0x5a6451);
                graphics.fillRect(1, 42, 2, 3); // Thumb
                graphics.fillRect(3, 41, 1, 4); // Index
                graphics.fillRect(5, 41, 1, 4); // Middle
                graphics.fillRect(7, 42, 1, 3); // Ring
                graphics.fillRect(41, 42, 2, 3); // Thumb
                graphics.fillRect(43, 41, 1, 4); // Index
                graphics.fillRect(45, 41, 1, 4); // Middle
                graphics.fillRect(47, 42, 1, 3); // Ring
                
                // Fingernails/claws
                graphics.fillStyle(0x4a4a3a);
                graphics.fillRect(0, 42, 1, 2);
                graphics.fillRect(3, 40, 1, 1);
                graphics.fillRect(5, 40, 1, 1);
                graphics.fillRect(43, 40, 1, 1);
                graphics.fillRect(45, 40, 1, 1);
            } else {
                // Arms at sides with decay
                graphics.fillRect(6, 32, 8, 14);
                graphics.fillRect(34, 32, 8, 14);
                graphics.fillStyle(0x6a7461);
                graphics.fillRect(7, 34, 2, 4);
                graphics.fillRect(35, 36, 2, 4);
            }
            
            // Legs with torn pants and exposed skin
            graphics.fillStyle(0x3a3a2a); // Torn pants
            graphics.fillRect(14, 52, 8, 12);
            graphics.fillRect(26, 52, 8, 12);
            
            // Holes in pants showing skin
            graphics.fillStyle(0x7a8471);
            graphics.fillRect(16, 54, 3, 4);
            graphics.fillRect(28, 56, 3, 4);
            
            // Bare/decaying feet with detailed decay
            graphics.fillStyle(0x6a7461);
            graphics.fillRect(12, 58, 10, 6);
            graphics.fillRect(26, 58, 10, 6);
            
            // Toe details and decay
            graphics.fillStyle(0x5a6451);
            graphics.fillRect(13, 59, 2, 2); // Big toe
            graphics.fillRect(15, 60, 1, 1); // Toes
            graphics.fillRect(17, 60, 1, 1);
            graphics.fillRect(19, 60, 1, 1);
            graphics.fillRect(27, 59, 2, 2); // Big toe
            graphics.fillRect(29, 60, 1, 1); // Toes
            graphics.fillRect(31, 60, 1, 1);
            graphics.fillRect(33, 60, 1, 1);
            
            // Wounds on legs and feet
            graphics.fillStyle(0x8b0000);
            graphics.fillRect(16, 54, 4, 1);
            graphics.fillRect(28, 56, 4, 1);
            graphics.fillRect(14, 60, 2, 1);
            graphics.fillRect(28, 62, 3, 1);
            
            // Generate texture
            graphics.generateTexture(`zombie_${direction}`, width, height);
            graphics.destroy();
            
            console.log(`Detailed zombie ${direction} sprite created`);
        });
    }
    
    static createWeaponSprites(scene) {
        const directions = ['up', 'down', 'left', 'right'];
        
        directions.forEach(direction => {
            const graphics = scene.add.graphics();
            
            // Create much more realistic, detailed pistol based on direction
            switch(direction) {
                case 'up':
                    // Realistic pistol pointing up - clear gun shape
                    graphics.fillStyle(0x2d2d2d); // Gun metal gray
                    graphics.fillRect(8, 6, 6, 10); // Main gun body/frame
                    graphics.fillRect(9, 2, 4, 6); // Barrel (long and prominent)
                    graphics.fillRect(8, 14, 6, 6); // Grip handle
                    
                    // Realistic gun details
                    graphics.fillStyle(0x1a1a1a); // Dark gun parts
                    graphics.fillRect(10, 12, 2, 4); // Trigger guard (realistic opening)
                    graphics.fillRect(10, 15, 2, 1); // Trigger
                    graphics.fillRect(9, 6, 4, 1); // Slide serrations
                    
                    // Gun highlights and realistic details
                    graphics.fillStyle(0x666666); // Metal highlights
                    graphics.fillRect(8, 3, 1, 4); // Barrel left highlight
                    graphics.fillRect(13, 3, 1, 4); // Barrel right highlight
                    graphics.fillRect(8, 7, 6, 1); // Slide top highlight
                    graphics.fillRect(9, 8, 4, 1); // Frame highlight
                    
                    // Front sight (very visible)
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(10, 2, 2, 1); // Clear white front sight
                    
                    // Magazine
                    graphics.fillStyle(0x404040); // Dark magazine
                    graphics.fillRect(9, 17, 4, 3); // Magazine extending from grip
                    
                    // Rear sight
                    graphics.fillStyle(0x666666);
                    graphics.fillRect(10, 16, 2, 1);
                    break;
                    
                case 'down':
                    // Realistic pistol pointing down
                    graphics.fillStyle(0x2d2d2d); // Gun metal
                    graphics.fillRect(8, 6, 6, 10); // Main gun body
                    graphics.fillRect(9, 14, 4, 6); // Barrel pointing down
                    graphics.fillRect(8, 2, 6, 6); // Grip handle
                    
                    // Gun details
                    graphics.fillStyle(0x1a1a1a);
                    graphics.fillRect(10, 6, 2, 4); // Trigger guard
                    graphics.fillRect(10, 5, 2, 1); // Trigger
                    graphics.fillRect(9, 10, 4, 1); // Slide serrations
                    
                    // Highlights
                    graphics.fillStyle(0x666666);
                    graphics.fillRect(8, 15, 1, 4); // Barrel left
                    graphics.fillRect(13, 15, 1, 4); // Barrel right
                    graphics.fillRect(8, 11, 6, 1); // Slide highlight
                    graphics.fillRect(9, 12, 4, 1); // Frame highlight
                    
                    // Front sight
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(10, 19, 2, 1); // Clear front sight
                    
                    // Magazine
                    graphics.fillStyle(0x404040);
                    graphics.fillRect(9, 1, 4, 3); // Magazine at top
                    
                    // Rear sight
                    graphics.fillStyle(0x666666);
                    graphics.fillRect(10, 4, 2, 1);
                    break;
                    
                case 'left':
                    // Side view pistol - very clear gun profile
                    graphics.fillStyle(0x2d2d2d); // Gun metal
                    graphics.fillRect(6, 9, 10, 4); // Main body/slide (side profile)
                    graphics.fillRect(2, 10, 6, 2); // Barrel extending left
                    graphics.fillRect(14, 9, 4, 8); // Grip handle
                    
                    // Realistic side details
                    graphics.fillStyle(0x1a1a1a);
                    graphics.fillRect(10, 10, 4, 2); // Trigger guard area
                    graphics.fillRect(12, 11, 2, 1); // Trigger
                    graphics.fillRect(7, 9, 2, 1); // Slide serrations
                    
                    // Gun highlights
                    graphics.fillStyle(0x666666);
                    graphics.fillRect(2, 10, 5, 1); // Barrel top highlight
                    graphics.fillRect(2, 11, 5, 1); // Barrel bottom highlight
                    graphics.fillRect(7, 10, 6, 1); // Body top highlight
                    graphics.fillRect(15, 10, 2, 1); // Grip highlight
                    
                    // Front sight
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(2, 10, 1, 2); // Clear front sight
                    
                    // Magazine
                    graphics.fillStyle(0x404040);
                    graphics.fillRect(15, 14, 2, 3); // Magazine at grip bottom
                    
                    // Rear sight
                    graphics.fillStyle(0x666666);
                    graphics.fillRect(15, 9, 1, 1);
                    break;
                    
                case 'right':
                    // Side view pistol pointing right
                    graphics.fillStyle(0x2d2d2d); // Gun metal
                    graphics.fillRect(6, 9, 10, 4); // Main body (side profile)
                    graphics.fillRect(14, 10, 6, 2); // Barrel extending right
                    graphics.fillRect(4, 9, 4, 8); // Grip handle
                    
                    // Gun details
                    graphics.fillStyle(0x1a1a1a);
                    graphics.fillRect(8, 10, 4, 2); // Trigger guard
                    graphics.fillRect(8, 11, 2, 1); // Trigger
                    graphics.fillRect(13, 9, 2, 1); // Slide serrations
                    
                    // Highlights
                    graphics.fillStyle(0x666666);
                    graphics.fillRect(15, 10, 5, 1); // Barrel top
                    graphics.fillRect(15, 11, 5, 1); // Barrel bottom
                    graphics.fillRect(9, 10, 6, 1); // Body highlight
                    graphics.fillRect(5, 10, 2, 1); // Grip highlight
                    
                    // Front sight
                    graphics.fillStyle(0xffffff);
                    graphics.fillRect(19, 10, 1, 2); // Clear front sight
                    
                    // Magazine
                    graphics.fillStyle(0x404040);
                    graphics.fillRect(5, 14, 2, 3); // Magazine at grip bottom
                    
                    // Rear sight
                    graphics.fillStyle(0x666666);
                    graphics.fillRect(6, 9, 1, 1);
                    break;
            }
            
            // Generate texture
            graphics.generateTexture(`pistol_${direction}`, 22, 22);
            graphics.destroy();
            
            console.log(`Much more realistic pistol ${direction} sprite created`);
        });
    }
    
    static createBullet(scene) {
        const graphics = scene.add.graphics();
        
        // Bullet casing (brass colored)
        graphics.fillStyle(0xb8860b); // Dark golden rod
        graphics.fillRect(4, 2, 8, 12);
        
        // Bullet tip (lead colored)
        graphics.fillStyle(0x708090); // Slate gray
        graphics.fillRect(6, 0, 4, 4);
        
        // Highlight on casing
        graphics.fillStyle(0xdaa520); // Brighter gold
        graphics.fillRect(5, 3, 3, 8);
        
        graphics.generateTexture('bullet', 16, 16);
        graphics.destroy();
        
        console.log('Bullet sprite created (detailed bullet)');
    }
    
    static createBloodSplat(scene) {
        const graphics = scene.add.graphics();
        
        // Main blood pool
        graphics.fillStyle(0x8b0000); // Dark red
        graphics.fillCircle(16, 16, 12);
        
        // Smaller splatter drops
        graphics.fillStyle(0xa00000); // Slightly brighter red
        graphics.fillCircle(8, 12, 4);
        graphics.fillCircle(24, 8, 3);
        graphics.fillCircle(6, 24, 3);
        graphics.fillCircle(26, 22, 4);
        
        // Darker center
        graphics.fillStyle(0x660000);
        graphics.fillCircle(16, 16, 6);
        
        graphics.generateTexture('bloodSplat', 32, 32);
        graphics.destroy();
        
        console.log('Blood splat sprite created (detailed splatter)');
    }
    
    static createMuzzleFlash(scene) {
        const graphics = scene.add.graphics();
        
        // Outer flash (orange)
        graphics.fillStyle(0xff6600);
        graphics.fillCircle(12, 12, 10);
        
        // Middle flash (yellow)
        graphics.fillStyle(0xffaa00);
        graphics.fillCircle(12, 12, 7);
        
        // Inner flash (bright yellow/white)
        graphics.fillStyle(0xffff88);
        graphics.fillCircle(12, 12, 4);
        
        // Hot center
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(12, 12, 2);
        
        graphics.generateTexture('muzzleFlash', 24, 24);
        graphics.destroy();
        
        console.log('Muzzle flash sprite created (detailed flash)');
    }
    
    static createShellCasing(scene) {
        const graphics = scene.add.graphics();
        
        // Shell casing body (brass)
        graphics.fillStyle(0xb8860b);
        graphics.fillRect(2, 2, 4, 8);
        
        // Shell rim (slightly darker)
        graphics.fillStyle(0x9a7209);
        graphics.fillRect(1, 8, 6, 2);
        
        // Highlight
        graphics.fillStyle(0xdaa520);
        graphics.fillRect(2, 2, 2, 6);
        
        graphics.generateTexture('shellCasing', 8, 12);
        graphics.destroy();
        
        console.log('Shell casing sprite created (detailed casing)');
    }
    
    static createFarmSprites(scene) {
        console.log('Generating farm environment sprites...');
        
        // Farm structures
        this.createFarmhouse(scene);
        this.createBarn(scene);
        this.createSilo(scene);
        this.createWell(scene);
        this.createTractor(scene);
        
        // Fencing and barriers
        this.createWoodenFence(scene);
        this.createStoneFence(scene);
        this.createGate(scene);
        this.createWoodenCrate(scene);
        this.createHayBale(scene);
        
        // Vegetation and crops
        this.createCropField(scene);
        this.createCornField(scene);
        this.createAppleTree(scene);
        this.createOakTree(scene);
        this.createBush(scene);
        this.createGrass(scene);
        this.createFlowers(scene);
        
        // Ground textures
        this.createDirtPath(scene);
        this.createGrassTexture(scene);
        this.createFarmyard(scene);
        
        console.log('Farm sprites generated');
    }
    
    static createFarmhouse(scene) {
        const graphics = scene.add.graphics();
        
        // Main house structure (128x96)
        graphics.fillStyle(0x8B4513); // Brown wood walls
        graphics.fillRect(0, 32, 128, 64);
        
        // Roof
        graphics.fillStyle(0x654321); // Dark brown roof
        graphics.fillTriangle(0, 32, 64, 0, 128, 32);
        
        // Roof shingles detail
        graphics.fillStyle(0x5D4037);
        for (let y = 8; y < 32; y += 6) {
            for (let x = 8; x < 120; x += 12) {
                graphics.fillRect(x, y, 8, 4);
            }
        }
        
        // Chimney
        graphics.fillStyle(0x8D6E63);
        graphics.fillRect(96, 4, 16, 28);
        graphics.fillStyle(0x5D4037);
        graphics.fillRect(94, 2, 20, 4);
        
        // Windows
        graphics.fillStyle(0x87CEEB); // Sky blue glass
        graphics.fillRect(16, 48, 16, 16); // Left window
        graphics.fillRect(96, 48, 16, 16); // Right window
        
        // Window frames
        graphics.fillStyle(0x654321);
        graphics.strokeRect(14, 46, 20, 20);
        graphics.strokeRect(94, 46, 20, 20);
        
        // Window cross frames
        graphics.fillRect(23, 46, 2, 20);
        graphics.fillRect(14, 55, 20, 2);
        graphics.fillRect(103, 46, 2, 20);
        graphics.fillRect(94, 55, 20, 2);
        
        // Door
        graphics.fillStyle(0x5D4037); // Dark brown door
        graphics.fillRect(56, 64, 16, 32);
        
        // Door handle
        graphics.fillStyle(0xFFD700); // Gold handle
        graphics.fillCircle(68, 80, 2);
        
        // Door panels
        graphics.fillStyle(0x4A2C2A);
        graphics.fillRect(58, 68, 12, 12);
        graphics.fillRect(58, 82, 12, 12);
        
        // Foundation
        graphics.fillStyle(0x696969);
        graphics.fillRect(0, 94, 128, 4);
        
        // Porch
        graphics.fillStyle(0x8B7355);
        graphics.fillRect(48, 88, 32, 8);
        
        // Porch posts
        graphics.fillStyle(0x654321);
        graphics.fillRect(50, 72, 4, 24);
        graphics.fillRect(74, 72, 4, 24);
        
        graphics.generateTexture('farmhouse', 128, 96);
        graphics.destroy();
    }
    
    static createBarn(scene) {
        const graphics = scene.add.graphics();
        
        // Main barn structure (160x120)
        graphics.fillStyle(0xB22222); // Classic red barn
        graphics.fillRect(0, 40, 160, 80);
        
        // Roof
        graphics.fillStyle(0x8B0000); // Dark red roof
        graphics.fillTriangle(0, 40, 80, 0, 160, 40);
        
        // Roof ridge
        graphics.fillStyle(0x654321);
        graphics.fillRect(76, 0, 8, 40);
        
        // Weather vane
        graphics.fillStyle(0xFFD700);
        graphics.fillRect(78, -8, 4, 12);
        graphics.fillTriangle(74, -8, 82, -8, 78, -16);
        
        // Large barn doors
        graphics.fillStyle(0x8B4513); // Brown doors
        graphics.fillRect(60, 80, 40, 40);
        
        // Door panels and hardware
        graphics.fillStyle(0x654321);
        graphics.fillRect(62, 82, 18, 36);
        graphics.fillRect(82, 82, 18, 36);
        
        // Door hinges
        graphics.fillStyle(0x2F4F4F);
        graphics.fillRect(60, 85, 4, 6);
        graphics.fillRect(60, 105, 4, 6);
        graphics.fillRect(96, 85, 4, 6);
        graphics.fillRect(96, 105, 4, 6);
        
        // Hay loft window
        graphics.fillStyle(0x4A4A4A);
        graphics.fillRect(70, 20, 20, 16);
        
        // Side windows
        graphics.fillStyle(0x4A4A4A);
        graphics.fillRect(20, 60, 12, 12);
        graphics.fillRect(128, 60, 12, 12);
        
        // Barn siding lines
        graphics.fillStyle(0xA0522D);
        for (let y = 45; y < 120; y += 8) {
            graphics.fillRect(0, y, 160, 2);
        }
        
        // Foundation
        graphics.fillStyle(0x696969);
        graphics.fillRect(0, 118, 160, 4);
        
        graphics.generateTexture('barn', 160, 120);
        graphics.destroy();
    }
    
    static createSilo(scene) {
        const graphics = scene.add.graphics();
        
        // Main silo cylinder (48x120)
        graphics.fillStyle(0xC0C0C0); // Silver metal
        graphics.fillRect(0, 20, 48, 100);
        
        // Silo bands
        graphics.fillStyle(0x808080);
        for (let y = 25; y < 115; y += 15) {
            graphics.fillRect(0, y, 48, 3);
        }
        
        // Dome top
        graphics.fillStyle(0xA0A0A0);
        graphics.fillEllipse(24, 20, 48, 40);
        
        // Ladder
        graphics.fillStyle(0x654321);
        graphics.fillRect(20, 30, 3, 90);
        for (let y = 35; y < 115; y += 10) {
            graphics.fillRect(17, y, 9, 2);
        }
        
        // Chute
        graphics.fillStyle(0x808080);
        graphics.fillRect(40, 100, 20, 8);
        graphics.fillRect(56, 108, 8, 12);
        
        graphics.generateTexture('silo', 48, 120);
        graphics.destroy();
    }
    
    static createWell(scene) {
        const graphics = scene.add.graphics();
        
        // Well base (64x64)
        graphics.fillStyle(0x696969); // Stone
        graphics.fillCircle(32, 32, 30);
        
        // Inner well
        graphics.fillStyle(0x000080); // Dark blue water
        graphics.fillCircle(32, 32, 20);
        
        // Well posts
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(8, 8, 6, 32);
        graphics.fillRect(50, 8, 6, 32);
        
        // Roof
        graphics.fillStyle(0x654321);
        graphics.fillTriangle(4, 8, 32, -8, 60, 8);
        
        // Rope and bucket
        graphics.fillStyle(0xD2691E);
        graphics.fillRect(31, 10, 2, 20);
        graphics.fillRect(28, 28, 8, 6);
        
        graphics.generateTexture('well', 64, 64);
        graphics.destroy();
    }
    
    static createTractor(scene) {
        const graphics = scene.add.graphics();
        
        // Tractor body (96x64)
        graphics.fillStyle(0x228B22); // Green body
        graphics.fillRect(16, 24, 64, 32);
        
        // Engine hood
        graphics.fillStyle(0x32CD32);
        graphics.fillRect(16, 24, 32, 20);
        
        // Cabin
        graphics.fillStyle(0x4A4A4A);
        graphics.fillRect(48, 16, 24, 24);
        
        // Windows
        graphics.fillStyle(0x87CEEB);
        graphics.fillRect(50, 18, 8, 8);
        graphics.fillRect(62, 18, 8, 8);
        
        // Large rear wheels
        graphics.fillStyle(0x2F4F4F);
        graphics.fillCircle(72, 48, 16);
        graphics.fillStyle(0x000000);
        graphics.fillCircle(72, 48, 12);
        
        // Small front wheels
        graphics.fillStyle(0x2F4F4F);
        graphics.fillCircle(24, 48, 10);
        graphics.fillStyle(0x000000);
        graphics.fillCircle(24, 48, 7);
        
        // Exhaust pipe
        graphics.fillStyle(0x2F4F4F);
        graphics.fillRect(20, 8, 4, 16);
        
        graphics.generateTexture('tractor', 96, 64);
        graphics.destroy();
    }
    
    static createWoodenFence(scene) {
        const graphics = scene.add.graphics();
        
        // Fence section (64x32)
        graphics.fillStyle(0x8B4513); // Brown wood
        
        // Fence posts
        graphics.fillRect(0, 8, 8, 24);
        graphics.fillRect(56, 8, 8, 24);
        
        // Horizontal rails
        graphics.fillRect(8, 12, 48, 4);
        graphics.fillRect(8, 20, 48, 4);
        graphics.fillRect(8, 28, 48, 4);
        
        // Wood grain texture
        graphics.fillStyle(0x654321);
        graphics.fillRect(1, 10, 6, 1);
        graphics.fillRect(2, 15, 4, 1);
        graphics.fillRect(57, 10, 6, 1);
        graphics.fillRect(58, 15, 4, 1);
        
        graphics.generateTexture('wooden_fence', 64, 32);
        graphics.destroy();
    }
    
    static createStoneFence(scene) {
        const graphics = scene.add.graphics();
        
        // Stone fence section (64x24)
        graphics.fillStyle(0x696969); // Gray stone
        
        // Stone blocks
        for (let x = 0; x < 64; x += 16) {
            for (let y = 8; y < 24; y += 8) {
                graphics.fillRect(x, y, 14, 6);
                graphics.fillStyle(0x808080);
                graphics.fillRect(x, y, 14, 2);
                graphics.fillStyle(0x696969);
            }
        }
        
        graphics.generateTexture('stone_fence', 64, 24);
        graphics.destroy();
    }
    
    static createGate(scene) {
        const graphics = scene.add.graphics();
        
        // Gate (64x32)
        graphics.fillStyle(0x8B4513); // Brown wood
        
        // Gate posts
        graphics.fillRect(0, 8, 8, 24);
        graphics.fillRect(56, 8, 8, 24);
        
        // Gate frame
        graphics.fillRect(8, 12, 48, 4);
        graphics.fillRect(8, 28, 48, 4);
        graphics.fillRect(8, 12, 4, 20);
        graphics.fillRect(52, 12, 4, 20);
        
        // Diagonal brace
        graphics.fillRect(12, 16, 36, 2);
        graphics.fillRect(16, 20, 28, 2);
        graphics.fillRect(20, 24, 20, 2);
        
        // Hinges
        graphics.fillStyle(0x2F4F4F);
        graphics.fillRect(6, 14, 4, 3);
        graphics.fillRect(6, 26, 4, 3);
        
        graphics.generateTexture('gate', 64, 32);
        graphics.destroy();
    }
    
    static createWoodenCrate(scene) {
        const graphics = scene.add.graphics();
        
        // Wooden crate (32x32)
        graphics.fillStyle(0xD2691E); // Orange-brown wood
        graphics.fillRect(0, 0, 32, 32);
        
        // Wood planks
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(0, 0, 32, 4);
        graphics.fillRect(0, 8, 32, 4);
        graphics.fillRect(0, 16, 32, 4);
        graphics.fillRect(0, 24, 32, 4);
        
        // Metal bands
        graphics.fillStyle(0x2F4F4F);
        graphics.fillRect(0, 6, 32, 2);
        graphics.fillRect(0, 22, 32, 2);
        graphics.fillRect(6, 0, 2, 32);
        graphics.fillRect(24, 0, 2, 32);
        
        // Nails
        graphics.fillStyle(0x000000);
        graphics.fillCircle(8, 4, 1);
        graphics.fillCircle(24, 4, 1);
        graphics.fillCircle(8, 28, 1);
        graphics.fillCircle(24, 28, 1);
        
        graphics.generateTexture('wooden_crate', 32, 32);
        graphics.destroy();
    }
    
    static createHayBale(scene) {
        const graphics = scene.add.graphics();
        
        // Hay bale (48x32)
        graphics.fillStyle(0xDAA520); // Golden hay
        graphics.fillRect(0, 8, 48, 24);
        
        // Hay texture
        graphics.fillStyle(0xB8860B);
        for (let x = 2; x < 46; x += 4) {
            for (let y = 10; y < 30; y += 3) {
                graphics.fillRect(x, y, 2, 1);
            }
        }
        
        // Binding straps
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(12, 8, 3, 24);
        graphics.fillRect(33, 8, 3, 24);
        
        graphics.generateTexture('hay_bale', 48, 32);
        graphics.destroy();
    }
    
    static createCropField(scene) {
        const graphics = scene.add.graphics();
        
        // Crop field tile (32x32)
        graphics.fillStyle(0x8B4513); // Brown soil
        graphics.fillRect(0, 0, 32, 32);
        
        // Crop rows
        graphics.fillStyle(0x228B22); // Green crops
        for (let x = 4; x < 28; x += 8) {
            for (let y = 4; y < 28; y += 6) {
                graphics.fillRect(x, y, 4, 4);
                graphics.fillRect(x + 1, y - 2, 2, 2);
            }
        }
        
        graphics.generateTexture('crop_field', 32, 32);
        graphics.destroy();
    }
    
    static createCornField(scene) {
        const graphics = scene.add.graphics();
        
        // Corn field tile (32x32)
        graphics.fillStyle(0x8B4513); // Brown soil
        graphics.fillRect(0, 0, 32, 32);
        
        // Corn stalks
        graphics.fillStyle(0x228B22); // Green stalks
        for (let x = 6; x < 26; x += 10) {
            graphics.fillRect(x, 8, 3, 20);
            graphics.fillRect(x + 1, 4, 1, 8);
            
            // Corn ears
            graphics.fillStyle(0xFFD700);
            graphics.fillRect(x - 1, 12, 2, 6);
            graphics.fillRect(x + 3, 16, 2, 6);
            graphics.fillStyle(0x228B22);
        }
        
        graphics.generateTexture('corn_field', 32, 32);
        graphics.destroy();
    }
    
    static createAppleTree(scene) {
        const graphics = scene.add.graphics();
        
        // Apple tree (64x80)
        // Trunk
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(26, 40, 12, 40);
        
        // Tree crown
        graphics.fillStyle(0x228B22);
        graphics.fillCircle(32, 32, 28);
        
        // Apples
        graphics.fillStyle(0xFF0000);
        graphics.fillCircle(20, 25, 3);
        graphics.fillCircle(35, 20, 3);
        graphics.fillCircle(45, 30, 3);
        graphics.fillCircle(25, 40, 3);
        graphics.fillCircle(40, 35, 3);
        
        // Tree texture
        graphics.fillStyle(0x32CD32);
        for (let i = 0; i < 20; i++) {
            const x = 10 + Math.random() * 44;
            const y = 10 + Math.random() * 44;
            graphics.fillCircle(x, y, 2);
        }
        
        graphics.generateTexture('apple_tree', 64, 80);
        graphics.destroy();
    }
    
    static createOakTree(scene) {
        const graphics = scene.add.graphics();
        
        // Oak tree (80x96)
        // Trunk
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(34, 48, 16, 48);
        
        // Large crown
        graphics.fillStyle(0x228B22);
        graphics.fillCircle(40, 40, 35);
        
        // Branch details
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(20, 35, 12, 6);
        graphics.fillRect(52, 30, 12, 6);
        graphics.fillRect(15, 45, 10, 5);
        graphics.fillRect(60, 40, 10, 5);
        
        // Darker foliage for depth
        graphics.fillStyle(0x006400);
        graphics.fillCircle(25, 30, 15);
        graphics.fillCircle(55, 35, 15);
        graphics.fillCircle(40, 20, 18);
        
        graphics.generateTexture('oak_tree', 80, 96);
        graphics.destroy();
    }
    
    static createBush(scene) {
        const graphics = scene.add.graphics();
        
        // Bush (32x24)
        graphics.fillStyle(0x228B22);
        graphics.fillCircle(16, 16, 14);
        
        // Bush texture
        graphics.fillStyle(0x32CD32);
        graphics.fillCircle(10, 12, 6);
        graphics.fillCircle(22, 10, 6);
        graphics.fillCircle(8, 20, 5);
        graphics.fillCircle(24, 20, 5);
        
        // Some berries
        graphics.fillStyle(0x8B0000);
        graphics.fillCircle(12, 14, 1);
        graphics.fillCircle(20, 12, 1);
        graphics.fillCircle(18, 18, 1);
        
        graphics.generateTexture('bush', 32, 24);
        graphics.destroy();
    }
    
    static createGrass(scene) {
        const graphics = scene.add.graphics();
        
        // Grass tile (64x64)
        graphics.fillStyle(0x228B22); // Base green
        graphics.fillRect(0, 0, 64, 64);
        
        // Grass texture variation
        graphics.fillStyle(0x32CD32);
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillRect(x, y, 2, 4);
        }
        
        // Darker grass patches
        graphics.fillStyle(0x006400);
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillRect(x, y, 3, 3);
        }
        
        graphics.generateTexture('grass', 64, 64);
        graphics.destroy();
    }
    
    static createFlowers(scene) {
        const graphics = scene.add.graphics();
        
        // Flower patch (32x32)
        graphics.fillStyle(0x228B22); // Grass base
        graphics.fillRect(0, 0, 32, 32);
        
        // Various flowers
        const colors = [0xFF69B4, 0xFFD700, 0xFF4500, 0x9370DB, 0xFF1493];
        for (let i = 0; i < 8; i++) {
            const x = 4 + Math.random() * 24;
            const y = 4 + Math.random() * 24;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            graphics.fillStyle(color);
            graphics.fillCircle(x, y, 2);
            graphics.fillStyle(0x228B22);
            graphics.fillRect(x - 0.5, y + 1, 1, 4);
        }
        
        graphics.generateTexture('flowers', 32, 32);
        graphics.destroy();
    }
    
    static createDirtPath(scene) {
        const graphics = scene.add.graphics();
        
        // Dirt path tile (64x64)
        graphics.fillStyle(0x8B7355); // Light brown dirt
        graphics.fillRect(0, 0, 64, 64);
        
        // Path texture
        graphics.fillStyle(0x654321);
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillRect(x, y, 2, 2);
        }
        
        // Small stones
        graphics.fillStyle(0x696969);
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillCircle(x, y, 1);
        }
        
        graphics.generateTexture('dirt_path', 64, 64);
        graphics.destroy();
    }
    
    static createGrassTexture(scene) {
        const graphics = scene.add.graphics();
        
        // Enhanced grass texture (64x64)
        graphics.fillStyle(0x4a7c59); // Base grass color
        graphics.fillRect(0, 0, 64, 64);
        
        // Grass variation
        graphics.fillStyle(0x5a8c69);
        for (let i = 0; i < 25; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillRect(x, y, 3, 3);
        }
        
        graphics.fillStyle(0x3a6c49);
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillRect(x, y, 2, 2);
        }
        
        graphics.generateTexture('grass_texture', 64, 64);
        graphics.destroy();
    }
    
    static createFarmyard(scene) {
        const graphics = scene.add.graphics();
        
        // Farmyard ground (64x64)
        graphics.fillStyle(0x8B7355); // Packed dirt
        graphics.fillRect(0, 0, 64, 64);
        
        // Hay scattered around
        graphics.fillStyle(0xDAA520);
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * 60 + 2;
            const y = Math.random() * 60 + 2;
            graphics.fillRect(x, y, 3, 2);
        }
        
        // Wheel tracks
        graphics.fillStyle(0x654321);
        graphics.fillRect(10, 0, 4, 64);
        graphics.fillRect(50, 0, 4, 64);
        
        graphics.generateTexture('farmyard', 64, 64);
        graphics.destroy();
    }
} 