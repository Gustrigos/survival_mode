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
        
        // Add crash site environment sprites
        this.createCrashSiteSprites(scene);
        
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
    
    static createCrashSiteSprites(scene) {
        console.log('Creating helicopter crash site environment sprites...');
        
        // Crashed helicopter and wreckage
        this.createCrashedHelicopter(scene);
        this.createHelicopterWreckage(scene);
        this.createBurningWreckage(scene);
        this.createSmoke(scene);
        this.createFire(scene);
        
        // NEW: small environmental effects
        this.createSmokePuff(scene);
        this.createSmallFire(scene);
        
        // Create missing terrain textures
        this.createSandTexture(scene);
        this.createDirtRoad(scene);
        this.createCrackledConcrete(scene);
        this.createRubble(scene);
        
        // Somalia-style urban structures
        this.createConcreteBuilding(scene);
        this.createDamagedBuilding(scene);
        this.createCompoundWall(scene);
        this.createSandbags(scene);
        this.createBarricade(scene);
        
        // Military equipment and debris
        this.createMilitaryCrate(scene);
        this.createAmmoCrate(scene);
        this.createDebris(scene);
        this.createMetalScrap(scene);
        
        // Doors and windows for buildings
        this.createDoor(scene);
        this.createWindow(scene);
        this.createDamagedWindow(scene);
        
        // Urban vegetation (sparse)
        this.createPalmTree(scene);
        this.createDeadTree(scene);
        this.createScrubBush(scene);
        
        // Terrain textures
        this.createSandTexture(scene);
        this.createDirtRoad(scene);
        this.createCrackledConcrete(scene);
        this.createRubble(scene);
        
        console.log('Helicopter crash site sprites created successfully');
    }
    
    static createCrashedHelicopter(scene) {
        const graphics = scene.add.graphics();
        
        // ULTRA-REALISTIC BLACK HAWK HELICOPTER (240x160) - Much larger and more detailed
        
        // Ground shadow first (underneath everything)
        graphics.fillStyle(0x000000, 0.2);
        graphics.fillEllipse(120, 140, 180, 30);
        
        // MAIN FUSELAGE - Realistic curved shape
        graphics.fillStyle(0x2F4F4F); // Military gray
        
        // Main body using simple shapes for helicopter silhouette
        graphics.fillRoundedRect(40, 50, 140, 35, 8); // Main fuselage
        graphics.fillEllipse(40, 67, 20, 35); // Rounded nose
        graphics.fillEllipse(180, 67, 20, 28); // Rounded tail
        
        // Fuselage highlight (top lighting)
        graphics.fillStyle(0x4A5A64);
        graphics.fillRoundedRect(42, 52, 136, 8, 4); // Top highlight strip
        
        // Fuselage shadow (bottom)
        graphics.fillStyle(0x1A1A1A);
        graphics.fillRoundedRect(42, 77, 136, 8, 4); // Bottom shadow strip
        
        // COCKPIT - Realistic curved windscreen
        graphics.fillStyle(0x1C1C1C); // Dark interior
        graphics.fillRoundedRect(40, 55, 50, 25, 8); // Cockpit interior
        
        // Windscreen glass with realistic curves
        graphics.fillStyle(0x4A4A4A, 0.8);
        graphics.fillRoundedRect(42, 57, 46, 21, 6); // Main windscreen
        
        // Windscreen frame
        graphics.lineStyle(2, 0x1A1A1A);
        graphics.strokeRoundedRect(42, 57, 46, 21, 6);
        graphics.lineStyle(0); // Reset line style
        
        // CABIN SECTION - Realistic passenger area
        graphics.fillStyle(0x2F4F4F);
        graphics.fillRoundedRect(85, 55, 80, 30, 8);
        
        // Cabin windows (side doors) with realistic curves
        graphics.fillStyle(0x4A4A4A, 0.7);
        graphics.fillRoundedRect(90, 60, 15, 15, 3); // Left window 1
        graphics.fillRoundedRect(110, 60, 15, 15, 3); // Left window 2
        graphics.fillRoundedRect(130, 60, 15, 15, 3); // Right window 1
        graphics.fillRoundedRect(150, 60, 15, 15, 3); // Right window 2
        
        // Window frames
        graphics.lineStyle(1, 0x1A1A1A);
        graphics.strokeRoundedRect(90, 60, 15, 15, 3);
        graphics.strokeRoundedRect(110, 60, 15, 15, 3);
        graphics.strokeRoundedRect(130, 60, 15, 15, 3);
        graphics.strokeRoundedRect(150, 60, 15, 15, 3);
        
        // TAIL BOOM - Realistic tapered shape
        graphics.fillStyle(0x2F4F4F);
        graphics.fillRoundedRect(165, 62, 45, 14, 4); // Tail boom
        
        // TAIL FIN - Realistic vertical stabilizer
        graphics.fillStyle(0x2F4F4F);
        graphics.fillRoundedRect(200, 45, 15, 30, 6); // Vertical fin
        
        // ENGINE HOUSING - Realistic curved engine compartment
        graphics.fillStyle(0x404040);
        graphics.fillEllipse(110, 45, 35, 15);
        
        // Engine intake
        graphics.fillStyle(0x1A1A1A);
        graphics.fillEllipse(105, 42, 12, 8);
        
        // Engine exhaust
        graphics.fillStyle(0x1A1A1A);
        graphics.fillEllipse(125, 48, 10, 6);
        
        // MAIN ROTOR SYSTEM - Much more realistic
        graphics.fillStyle(0x696969);
        graphics.fillCircle(120, 35, 15); // Main hub
        graphics.fillStyle(0x404040);
        graphics.fillCircle(120, 35, 10); // Inner hub
        graphics.fillStyle(0x1A1A1A);
        graphics.fillCircle(120, 35, 5); // Center hub
        
        // Rotor mast
        graphics.fillStyle(0x404040);
        graphics.fillRect(118, 20, 4, 20);
        
        // Main rotor blades (crashed and damaged) - Simplified shapes
        graphics.fillStyle(0x1A1A1A);
        // Blade 1 (bent and drooping)
        graphics.fillRoundedRect(50, 32, 40, 4, 2);
        graphics.fillRoundedRect(45, 40, 20, 4, 2); // Bent section
        
        // Blade 2 (snapped upward)
        graphics.fillRect(118, 10, 4, 30);
        graphics.fillRect(115, 8, 10, 4);
        
        // Blade 3 (hanging down)
        graphics.fillRoundedRect(170, 33, 35, 4, 2);
        graphics.fillRoundedRect(185, 40, 20, 4, 2); // Hanging section
        
        // Blade 4 (broken off short)
        graphics.fillRect(100, 33, 25, 4);
        
        // LANDING GEAR - Realistic skids with proper curves
        graphics.fillStyle(0x404040);
        graphics.fillRoundedRect(50, 95, 120, 6, 3); // Left skid
        graphics.fillRoundedRect(55, 100, 110, 6, 3); // Right skid (bent)
        
        // Skid cross-braces with realistic angles
        graphics.fillStyle(0x2A2A2A);
        for (let i = 0; i < 6; i++) {
            const x = 60 + i * 20;
            graphics.fillRect(x, 88, 2, 12);
            graphics.fillRect(x + 5, 92, 2, 8);
        }
        
        // TAIL ROTOR - Realistic with guard
        graphics.fillStyle(0x1A1A1A);
        graphics.fillCircle(215, 69, 8); // Tail rotor hub
        
        // Tail rotor blades (damaged)
        graphics.fillRect(207, 67, 16, 2); // Horizontal blade
        graphics.fillRect(214, 61, 2, 16); // Vertical blade
        graphics.fillRect(218, 65, 8, 2); // Broken piece
        
        // Tail rotor guard (damaged)
        graphics.lineStyle(2, 0x404040);
        graphics.strokeCircle(215, 69, 12);
        graphics.fillRect(207, 69, 6, 2); // Broken guard piece
        
        // Reset line style
        graphics.lineStyle(0);
        
        // MILITARY MARKINGS - Realistic stenciled text
        graphics.fillStyle(0xFFFFFF, 0.8);
        graphics.fillRect(120, 78, 25, 4); // "ARMY" area
        graphics.fillRect(150, 78, 20, 4); // Number area
        
        // Star insignia
        graphics.fillStyle(0xFFFFFF, 0.9);
        graphics.fillRect(160, 65, 10, 2); // Horizontal bar
        graphics.fillRect(164, 61, 2, 10); // Vertical bar
        
        // BATTLE DAMAGE - Much more realistic
        graphics.fillStyle(0x2D1B1B); // Burn marks
        graphics.fillEllipse(90, 70, 20, 12); // Engine fire damage
        graphics.fillEllipse(50, 75, 15, 10); // Cockpit burn
        graphics.fillEllipse(140, 80, 18, 8); // Cabin burn
        
        // Bullet holes - realistic pattern
        graphics.fillStyle(0x000000);
        const bulletHoles = [
            {x: 60, y: 65}, {x: 75, y: 70}, {x: 95, y: 68}, {x: 110, y: 72},
            {x: 130, y: 75}, {x: 145, y: 68}, {x: 160, y: 73}, {x: 175, y: 70}
        ];
        bulletHoles.forEach(hole => {
            graphics.fillCircle(hole.x, hole.y, 2);
        });
        
        // Large damage holes (RPG hits)
        graphics.fillCircle(125, 78, 5); // Large cabin hole
        graphics.fillCircle(70, 72, 4); // Medium cockpit hole
        
        // Exposed wiring and internals
        graphics.fillStyle(0xFF4500); // Orange wires
        graphics.fillRect(100, 65, 2, 10);
        graphics.fillRect(130, 68, 2, 8);
        graphics.fillRect(155, 70, 2, 6);
        
        graphics.fillStyle(0x0000FF); // Blue wires
        graphics.fillRect(102, 67, 2, 8);
        graphics.fillRect(132, 70, 2, 6);
        
        graphics.fillStyle(0x00FF00); // Green wires
        graphics.fillRect(104, 69, 2, 6);
        
        // Fluid leaks on ground
        graphics.fillStyle(0x8B0000, 0.6); // Hydraulic fluid
        graphics.fillEllipse(110, 110, 20, 8);
        graphics.fillEllipse(140, 115, 15, 6);
        
        graphics.fillStyle(0x1A1A1A, 0.7); // Oil
        graphics.fillEllipse(130, 120, 25, 10);
        graphics.fillEllipse(90, 118, 18, 8);
        
        // Fuel rainbow stains
        graphics.fillStyle(0x4B0082, 0.5); // Indigo fuel
        graphics.fillEllipse(120, 125, 15, 6);
        
        // Scattered debris
        graphics.fillStyle(0x696969);
        graphics.fillRect(30, 120, 8, 5); // Metal fragment
        graphics.fillRect(200, 115, 10, 4); // Metal piece
        graphics.fillRect(60, 125, 6, 4); // Small debris
        
        // Glass shards
        graphics.fillStyle(0x4A4A4A);
        graphics.fillRect(40, 110, 3, 1);
        graphics.fillRect(50, 112, 2, 2);
        graphics.fillRect(190, 108, 3, 1);
        
        graphics.generateTexture('crashed_helicopter', 240, 160);
        graphics.destroy();
        
        console.log('ULTRA-REALISTIC Black Hawk helicopter sprite created (240x160)');
    }
    
    static createHelicopterWreckage(scene) {
        const graphics = scene.add.graphics();
        
        // Scattered helicopter parts (80x60)
        graphics.fillStyle(0x2F4F4F); // Military gray metal
        
        // Large piece of fuselage
        graphics.fillRect(10, 20, 30, 15);
        
        // Twisted rotor blade
        graphics.fillStyle(0x1A1A1A);
        graphics.fillRect(5, 10, 35, 3);
        graphics.fillRect(15, 8, 3, 8); // Bent section
        
        // Engine parts
        graphics.fillStyle(0x404040);
        graphics.fillRect(45, 25, 20, 12);
        graphics.fillRect(50, 22, 10, 6); // Exhaust
        
        // Scattered smaller debris
        graphics.fillStyle(0x696969);
        graphics.fillRect(15, 40, 8, 5);
        graphics.fillRect(35, 45, 6, 4);
        graphics.fillRect(55, 40, 5, 3);
        graphics.fillRect(25, 50, 4, 3);
        
        // Wiring and cables
        graphics.fillStyle(0xFF4500); // Orange wires
        graphics.fillRect(20, 35, 15, 1);
        graphics.fillRect(40, 38, 12, 1);
        graphics.fillStyle(0x0000FF); // Blue wires
        graphics.fillRect(22, 37, 10, 1);
        graphics.fillRect(42, 40, 8, 1);
        
        // Oil stains
        graphics.fillStyle(0x1A1A1A);
        graphics.fillEllipse(30, 55, 12, 6);
        graphics.fillEllipse(50, 50, 8, 4);
        
        // Bullet holes in metal
        graphics.fillStyle(0x000000);
        graphics.fillCircle(25, 28, 1);
        graphics.fillCircle(55, 30, 1);
        graphics.fillCircle(18, 25, 1);
        
        graphics.generateTexture('helicopter_wreckage', 80, 60);
        graphics.destroy();
    }
    
    static createBurningWreckage(scene) {
        const graphics = scene.add.graphics();
        
        // Burning helicopter part (64x48)
        graphics.fillStyle(0x2F4F4F); // Metal base
        graphics.fillRect(10, 25, 40, 20);
        
        // Burn damage
        graphics.fillStyle(0x2D1B1B); // Dark burn marks
        graphics.fillRect(12, 27, 36, 16);
        
        // Active fire
        graphics.fillStyle(0xFF4500); // Orange fire base
        graphics.fillRect(15, 15, 8, 12);
        graphics.fillRect(25, 12, 6, 15);
        graphics.fillRect(35, 18, 7, 10);
        
        // Yellow fire tips
        graphics.fillStyle(0xFFD700);
        graphics.fillRect(17, 15, 4, 6);
        graphics.fillRect(27, 12, 2, 8);
        graphics.fillRect(37, 18, 3, 5);
        
        // White hot spots
        graphics.fillStyle(0xFFFFFF);
        graphics.fillRect(19, 20, 2, 3);
        graphics.fillRect(28, 17, 1, 4);
        graphics.fillRect(38, 22, 2, 2);
        
        // Glowing embers
        graphics.fillStyle(0xFF6600);
        graphics.fillCircle(8, 20, 1);
        graphics.fillCircle(45, 25, 1);
        graphics.fillCircle(20, 10, 1);
        graphics.fillCircle(40, 15, 1);
        
        // Molten metal drips
        graphics.fillStyle(0xFF8C00);
        graphics.fillRect(18, 40, 2, 4);
        graphics.fillRect(30, 42, 2, 3);
        graphics.fillRect(38, 41, 1, 5);
        
        graphics.generateTexture('burning_wreckage', 64, 48);
        graphics.destroy();
    }
    
    static createSmoke(scene) {
        const graphics = scene.add.graphics();
        
        // Thick black smoke (48x80)
        graphics.fillStyle(0x2F2F2F); // Dark gray smoke base
        graphics.fillCircle(24, 60, 20);
        graphics.fillCircle(20, 45, 15);
        graphics.fillCircle(28, 45, 15);
        graphics.fillCircle(24, 30, 12);
        graphics.fillCircle(18, 20, 10);
        graphics.fillCircle(30, 20, 10);
        graphics.fillCircle(24, 10, 8);
        
        // Lighter smoke wisps
        graphics.fillStyle(0x4A4A4A);
        graphics.fillCircle(16, 35, 8);
        graphics.fillCircle(32, 35, 8);
        graphics.fillCircle(20, 15, 6);
        graphics.fillCircle(28, 15, 6);
        graphics.fillCircle(24, 5, 5);
        
        // Very light smoke at top
        graphics.fillStyle(0x696969);
        graphics.fillCircle(22, 8, 4);
        graphics.fillCircle(26, 8, 4);
        graphics.fillCircle(24, 2, 3);
        
        graphics.generateTexture('smoke', 48, 80);
        graphics.destroy();
    }
    
    static createFire(scene) {
        const graphics = scene.add.graphics();
        
        // Large fire (32x48)
        graphics.fillStyle(0xFF4500); // Orange fire base
        graphics.fillRect(8, 30, 16, 18);
        graphics.fillRect(6, 25, 20, 15);
        graphics.fillRect(10, 20, 12, 12);
        
        // Yellow flames
        graphics.fillStyle(0xFFD700);
        graphics.fillRect(10, 28, 12, 12);
        graphics.fillRect(8, 22, 16, 10);
        graphics.fillRect(12, 18, 8, 8);
        
        // White hot core
        graphics.fillStyle(0xFFFFFF);
        graphics.fillRect(14, 32, 4, 8);
        graphics.fillRect(12, 28, 8, 6);
        graphics.fillRect(13, 24, 6, 4);
        
        // Flickering tips
        graphics.fillStyle(0xFF6600);
        graphics.fillRect(10, 15, 3, 8);
        graphics.fillRect(19, 12, 3, 10);
        graphics.fillRect(14, 10, 4, 8);
        
        // Red base glow
        graphics.fillStyle(0xFF0000);
        graphics.fillRect(6, 40, 20, 8);
        
        graphics.generateTexture('fire', 32, 48);
        graphics.destroy();
    }
    
    static createConcreteBuilding(scene) {
        const graphics = scene.add.graphics();
        
        // Somalia-style concrete building (128x96)
        graphics.fillStyle(0xC0C0C0); // Light gray concrete
        graphics.fillRect(0, 32, 128, 64);
        
        // Flat roof
        graphics.fillStyle(0xA0A0A0); // Darker roof
        graphics.fillRect(0, 32, 128, 8);
        
        // Bullet holes and damage
        graphics.fillStyle(0x000000);
        graphics.fillCircle(20, 50, 2);
        graphics.fillCircle(45, 60, 2);
        graphics.fillCircle(80, 55, 2);
        graphics.fillCircle(100, 70, 2);
        graphics.fillCircle(30, 75, 2);
        graphics.fillCircle(70, 45, 2);
        
        // Larger damage/explosion marks
        graphics.fillStyle(0x2D1B1B);
        graphics.fillRect(60, 65, 15, 8);
        graphics.fillRect(25, 80, 12, 6);
        
        // Windows (some broken)
        graphics.fillStyle(0x4A4A4A); // Dark windows
        graphics.fillRect(16, 48, 12, 12); // Intact window
        graphics.fillRect(40, 48, 12, 12); // Intact window
        graphics.fillRect(88, 48, 12, 12); // Intact window
        
        // Broken window
        graphics.fillStyle(0x000000);
        graphics.fillRect(64, 48, 12, 12);
        // Glass shards
        graphics.fillStyle(0x696969);
        graphics.fillRect(66, 50, 2, 3);
        graphics.fillRect(70, 52, 3, 2);
        graphics.fillRect(72, 56, 2, 2);
        
        // Window frames
        graphics.fillStyle(0x808080);
        graphics.strokeRect(16, 48, 12, 12);
        graphics.strokeRect(40, 48, 12, 12);
        graphics.strokeRect(64, 48, 12, 12);
        graphics.strokeRect(88, 48, 12, 12);
        
        // Door
        graphics.fillStyle(0x654321); // Brown door
        graphics.fillRect(56, 72, 16, 24);
        
        // Door damage
        graphics.fillStyle(0x2D1B1B);
        graphics.fillRect(58, 80, 4, 6);
        
        // Concrete texture lines
        graphics.fillStyle(0xB0B0B0);
        for (let y = 40; y < 96; y += 12) {
            graphics.fillRect(0, y, 128, 1);
        }
        
        graphics.generateTexture('concrete_building', 128, 96);
        graphics.destroy();
    }
    
    static createDamagedBuilding(scene) {
        const graphics = scene.add.graphics();
        
        // Heavily damaged building (96x80)
        graphics.fillStyle(0xA0A0A0); // Gray concrete
        graphics.fillRect(0, 20, 96, 60);
        
        // Partial roof collapse
        graphics.fillStyle(0x808080);
        graphics.fillRect(0, 20, 40, 6); // Intact roof section
        graphics.fillRect(60, 20, 36, 6); // Intact roof section
        
        // Rubble from collapsed section
        graphics.fillStyle(0x696969);
        graphics.fillRect(35, 26, 30, 8);
        graphics.fillRect(40, 34, 20, 6);
        graphics.fillRect(45, 40, 10, 4);
        
        // Large hole in wall
        graphics.fillStyle(0x000000);
        graphics.fillRect(20, 45, 25, 20);
        
        // Jagged edges around hole
        graphics.fillStyle(0x808080);
        graphics.fillRect(18, 43, 4, 4);
        graphics.fillRect(43, 43, 4, 4);
        graphics.fillRect(18, 63, 4, 4);
        graphics.fillRect(43, 63, 4, 4);
        
        // Exposed rebar
        graphics.fillStyle(0x654321);
        graphics.fillRect(22, 40, 1, 8);
        graphics.fillRect(30, 38, 1, 10);
        graphics.fillRect(38, 42, 1, 6);
        
        // Remaining windows
        graphics.fillStyle(0x4A4A4A);
        graphics.fillRect(60, 40, 10, 10);
        graphics.fillRect(75, 40, 10, 10);
        
        // Bullet holes
        graphics.fillStyle(0x000000);
        graphics.fillCircle(10, 35, 1);
        graphics.fillCircle(50, 30, 1);
        graphics.fillCircle(80, 35, 1);
        graphics.fillCircle(15, 55, 1);
        graphics.fillCircle(70, 60, 1);
        
        graphics.generateTexture('damaged_building', 96, 80);
        graphics.destroy();
    }
    
    static createCompoundWall(scene) {
        const graphics = scene.add.graphics();
        
        // Concrete compound wall (64x32)
        graphics.fillStyle(0xA0A0A0); // Gray concrete
        graphics.fillRect(0, 8, 64, 24);
        
        // Wall texture lines
        graphics.fillStyle(0x909090);
        graphics.fillRect(0, 16, 64, 1);
        graphics.fillRect(0, 24, 64, 1);
        
        // Bullet holes and damage
        graphics.fillStyle(0x000000);
        graphics.fillCircle(15, 18, 1);
        graphics.fillCircle(35, 22, 1);
        graphics.fillCircle(50, 20, 1);
        graphics.fillCircle(25, 26, 1);
        
        // Larger damage
        graphics.fillStyle(0x2D1B1B);
        graphics.fillRect(40, 15, 8, 4);
        graphics.fillRect(10, 25, 6, 3);
        
        // Concrete chunks missing
        graphics.fillStyle(0x808080);
        graphics.fillRect(42, 12, 4, 3);
        graphics.fillRect(12, 22, 3, 4);
        
        // Barbed wire on top
        graphics.fillStyle(0x696969);
        graphics.fillRect(0, 6, 64, 2);
        // Wire barbs
        graphics.fillStyle(0x404040);
        for (let x = 5; x < 60; x += 8) {
            graphics.fillRect(x, 5, 2, 1);
            graphics.fillRect(x + 1, 7, 2, 1);
        }
        
        graphics.generateTexture('compound_wall', 64, 32);
        graphics.destroy();
    }
    
    static createMilitaryCrate(scene) {
        const graphics = scene.add.graphics();
        
        // Military supply crate (32x32)
        graphics.fillStyle(0x4A5D23); // Olive drab green
        graphics.fillRect(0, 0, 32, 32);
        
        // Metal reinforcement bands
        graphics.fillStyle(0x2F4F4F);
        graphics.fillRect(0, 6, 32, 2);
        graphics.fillRect(0, 24, 32, 2);
        graphics.fillRect(6, 0, 2, 32);
        graphics.fillRect(24, 0, 2, 32);
        
        // Military stencil markings
        graphics.fillStyle(0xFFFFFF); // White stencil
        graphics.fillRect(10, 10, 2, 6); // "U"
        graphics.fillRect(12, 10, 6, 2);
        graphics.fillRect(12, 14, 6, 2);
        graphics.fillRect(16, 10, 2, 6);
        
        graphics.fillRect(20, 10, 2, 6); // "S"
        graphics.fillRect(20, 10, 6, 2);
        graphics.fillRect(20, 12, 6, 2);
        graphics.fillRect(20, 14, 6, 2);
        
        // Warning symbols
        graphics.fillStyle(0xFFD700); // Yellow warning
        graphics.fillRect(8, 20, 6, 2);
        graphics.fillRect(10, 18, 2, 6);
        
        // Bullet holes
        graphics.fillStyle(0x000000);
        graphics.fillCircle(15, 8, 1);
        graphics.fillCircle(25, 18, 1);
        
        // Latches
        graphics.fillStyle(0x1A1A1A);
        graphics.fillRect(2, 14, 4, 4);
        graphics.fillRect(26, 14, 4, 4);
        
        graphics.generateTexture('military_crate', 32, 32);
        graphics.destroy();
    }
    
    static createSandbags(scene) {
        const graphics = scene.add.graphics();
        
        // Sandbag barrier (48x32)
        graphics.fillStyle(0xC2B280); // Sandy beige
        
        // Bottom row of sandbags
        graphics.fillRect(0, 16, 16, 16);
        graphics.fillRect(16, 16, 16, 16);
        graphics.fillRect(32, 16, 16, 16);
        
        // Top row (offset)
        graphics.fillRect(8, 8, 16, 16);
        graphics.fillRect(24, 8, 16, 16);
        
        // Sandbag texture and ties
        graphics.fillStyle(0xA0956F); // Darker sand
        // Bottom row ties
        graphics.fillRect(6, 20, 4, 2);
        graphics.fillRect(22, 20, 4, 2);
        graphics.fillRect(38, 20, 4, 2);
        
        // Top row ties
        graphics.fillRect(14, 12, 4, 2);
        graphics.fillRect(30, 12, 4, 2);
        
        // Sandbag seams
        graphics.fillStyle(0x8B7D6B);
        graphics.fillRect(0, 24, 48, 1);
        graphics.fillRect(16, 16, 1, 16);
        graphics.fillRect(32, 16, 1, 16);
        graphics.fillRect(8, 8, 1, 16);
        graphics.fillRect(24, 8, 1, 16);
        graphics.fillRect(40, 8, 1, 16);
        
        // Bullet holes
        graphics.fillStyle(0x000000);
        graphics.fillCircle(12, 22, 1);
        graphics.fillCircle(28, 18, 1);
        graphics.fillCircle(40, 26, 1);
        
        // Sand spilling out
        graphics.fillStyle(0xF4E4BC);
        graphics.fillRect(15, 30, 3, 2);
        graphics.fillRect(31, 30, 2, 2);
        graphics.fillRect(45, 30, 3, 2);
        
        graphics.generateTexture('sandbags', 48, 32);
        graphics.destroy();
    }
    
    static createBarricade(scene) {
        const graphics = scene.add.graphics();
        
        // Makeshift barricade (64x24)
        graphics.fillStyle(0x8B4513); // Brown wood
        graphics.fillRect(0, 8, 64, 16);
        
        // Metal sheets and debris
        graphics.fillStyle(0x696969);
        graphics.fillRect(10, 6, 20, 4);
        graphics.fillRect(35, 4, 15, 6);
        
        // Barbed wire
        graphics.fillStyle(0x404040);
        graphics.fillRect(0, 6, 64, 1);
        for (let x = 5; x < 60; x += 8) {
            graphics.fillRect(x, 5, 1, 1);
            graphics.fillRect(x + 2, 7, 1, 1);
        }
        
        // Bullet holes
        graphics.fillStyle(0x000000);
        graphics.fillCircle(20, 16, 1);
        graphics.fillCircle(45, 18, 1);
        
        graphics.generateTexture('barricade', 64, 24);
        graphics.destroy();
    }
    
    static createAmmoCrate(scene) {
        const graphics = scene.add.graphics();
        
        // Ammunition crate (24x24)
        graphics.fillStyle(0x4A5D23); // Olive drab
        graphics.fillRect(0, 0, 24, 24);
        
        // Metal bands
        graphics.fillStyle(0x2F4F4F);
        graphics.fillRect(0, 4, 24, 2);
        graphics.fillRect(0, 18, 24, 2);
        graphics.fillRect(4, 0, 2, 24);
        graphics.fillRect(18, 0, 2, 24);
        
        // Ammo symbol
        graphics.fillStyle(0xFFD700);
        graphics.fillRect(8, 8, 8, 2);
        graphics.fillRect(11, 6, 2, 6);
        graphics.fillRect(8, 12, 8, 2);
        graphics.fillRect(8, 16, 8, 2);
        
        graphics.generateTexture('ammo_crate', 24, 24);
        graphics.destroy();
    }
    
    static createDebris(scene) {
        const graphics = scene.add.graphics();
        
        // Scattered debris (32x24)
        graphics.fillStyle(0x696969); // Gray concrete chunks
        graphics.fillRect(2, 8, 8, 6);
        graphics.fillRect(15, 12, 6, 4);
        graphics.fillRect(25, 6, 5, 8);
        
        // Metal pieces
        graphics.fillStyle(0x404040);
        graphics.fillRect(8, 16, 4, 3);
        graphics.fillRect(20, 18, 6, 2);
        
        // Rebar
        graphics.fillStyle(0x654321);
        graphics.fillRect(5, 4, 1, 12);
        graphics.fillRect(22, 8, 1, 8);
        
        graphics.generateTexture('debris', 32, 24);
        graphics.destroy();
    }
    
    static createMetalScrap(scene) {
        const graphics = scene.add.graphics();
        
        // Metal scrap pile (28x20)
        graphics.fillStyle(0x2F4F4F); // Dark metal
        graphics.fillRect(4, 8, 12, 8);
        graphics.fillRect(8, 4, 8, 6);
        graphics.fillRect(12, 12, 10, 6);
        
        // Rust
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(6, 10, 3, 2);
        graphics.fillRect(14, 6, 2, 3);
        graphics.fillRect(18, 14, 3, 2);
        
        graphics.generateTexture('metal_scrap', 28, 20);
        graphics.destroy();
    }
    
    static createDamagedWindow(scene) {
        const graphics = scene.add.graphics();
        
        // Damaged window frame (16x16)
        graphics.fillStyle(0x8B4513); // Brown frame
        graphics.fillRect(0, 0, 16, 16);
        
        // Broken glass
        graphics.fillStyle(0x000000); // Empty space
        graphics.fillRect(2, 2, 12, 12);
        
        // Remaining glass shards
        graphics.fillStyle(0x4A4A4A);
        graphics.fillRect(3, 3, 3, 4);
        graphics.fillRect(10, 5, 4, 3);
        graphics.fillRect(5, 11, 2, 3);
        
        // Glass on ground
        graphics.fillStyle(0x696969);
        graphics.fillRect(1, 14, 2, 1);
        graphics.fillRect(6, 15, 1, 1);
        graphics.fillRect(12, 14, 2, 1);
        
        graphics.generateTexture('damaged_window', 16, 16);
        graphics.destroy();
    }
    
    static createPalmTree(scene) {
        const graphics = scene.add.graphics();
        
        // Palm tree (48x80)
        // Trunk
        graphics.fillStyle(0x8B7355); // Brown trunk
        graphics.fillRect(20, 40, 8, 40);
        
        // Trunk texture
        graphics.fillStyle(0x654321);
        for (let y = 45; y < 75; y += 8) {
            graphics.fillRect(18, y, 12, 2);
        }
        
        // Palm fronds
        graphics.fillStyle(0x228B22); // Green fronds
        graphics.fillRect(8, 20, 32, 4); // Horizontal frond
        graphics.fillRect(22, 8, 4, 32); // Vertical frond
        graphics.fillRect(12, 12, 24, 4); // Diagonal frond 1
        graphics.fillRect(12, 28, 24, 4); // Diagonal frond 2
        
        // Frond details
        graphics.fillStyle(0x32CD32);
        graphics.fillRect(10, 22, 28, 1);
        graphics.fillRect(23, 10, 2, 28);
        
        graphics.generateTexture('palm_tree', 48, 80);
        graphics.destroy();
    }
    
    static createDeadTree(scene) {
        const graphics = scene.add.graphics();
        
        // Dead tree (32x64)
        // Main trunk
        graphics.fillStyle(0x654321); // Dark brown
        graphics.fillRect(12, 32, 8, 32);
        
        // Dead branches
        graphics.fillStyle(0x4A2C2A);
        graphics.fillRect(8, 20, 12, 3); // Left branch
        graphics.fillRect(12, 16, 16, 3); // Right branch
        graphics.fillRect(14, 24, 8, 3); // Small branch
        
        // Branch ends (broken)
        graphics.fillStyle(0x2D1B1B);
        graphics.fillRect(6, 20, 2, 3);
        graphics.fillRect(26, 16, 2, 3);
        
        graphics.generateTexture('dead_tree', 32, 64);
        graphics.destroy();
    }
    
    static createScrubBush(scene) {
        const graphics = scene.add.graphics();
        
        // Sparse scrub bush (24x16)
        graphics.fillStyle(0x6B8E23); // Olive drab green
        graphics.fillCircle(12, 12, 10);
        
        // Sparse foliage
        graphics.fillStyle(0x556B2F);
        graphics.fillCircle(8, 10, 4);
        graphics.fillCircle(16, 8, 4);
        graphics.fillCircle(6, 14, 3);
        graphics.fillCircle(18, 14, 3);
        
        graphics.generateTexture('scrub_bush', 24, 16);
        graphics.destroy();
    }
    
    static createSandTexture(scene) {
        const graphics = scene.add.graphics();
        
        // Sandy terrain tile (64x64)
        graphics.fillStyle(0xF4E4BC); // Light sand color
        graphics.fillRect(0, 0, 64, 64);
        
        // Sand texture variation
        graphics.fillStyle(0xE6D7A3);
        for (let i = 0; i < 25; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillRect(x, y, 3, 3);
        }
        
        // Darker sand patches
        graphics.fillStyle(0xD2C49C);
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillRect(x, y, 2, 2);
        }
        
        // Small rocks and debris
        graphics.fillStyle(0x8B7355);
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillCircle(x, y, 1);
        }
        
        graphics.generateTexture('sand_texture', 64, 64);
        graphics.destroy();
    }
    
    static createDirtRoad(scene) {
        const graphics = scene.add.graphics();
        
        // Dirt road tile (64x64)
        graphics.fillStyle(0xA0956F); // Dusty brown
        graphics.fillRect(0, 0, 64, 64);
        
        // Tire tracks
        graphics.fillStyle(0x8B7D6B);
        graphics.fillRect(15, 0, 4, 64);
        graphics.fillRect(45, 0, 4, 64);
        
        // Road texture
        graphics.fillStyle(0x9A8B6F);
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillRect(x, y, 2, 2);
        }
        
        // Potholes
        graphics.fillStyle(0x6B5B4F);
        graphics.fillCircle(25, 20, 3);
        graphics.fillCircle(40, 45, 2);
        
        graphics.generateTexture('dirt_road', 64, 64);
        graphics.destroy();
    }
    
    static createCrackledConcrete(scene) {
        const graphics = scene.add.graphics();
        
        // Cracked concrete tile (64x64)
        graphics.fillStyle(0xB0B0B0); // Light gray concrete
        graphics.fillRect(0, 0, 64, 64);
        
        // Concrete texture
        graphics.fillStyle(0xA0A0A0);
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillRect(x, y, 4, 4);
        }
        
        // Large cracks
        graphics.fillStyle(0x404040);
        graphics.fillRect(10, 0, 2, 30);
        graphics.fillRect(0, 25, 35, 2);
        graphics.fillRect(40, 15, 2, 49);
        graphics.fillRect(25, 45, 39, 2);
        
        // Small cracks
        graphics.fillStyle(0x606060);
        graphics.fillRect(5, 10, 1, 15);
        graphics.fillRect(50, 5, 1, 20);
        graphics.fillRect(30, 55, 20, 1);
        
        // Debris in cracks
        graphics.fillStyle(0x696969);
        graphics.fillRect(11, 15, 1, 3);
        graphics.fillRect(20, 26, 3, 1);
        graphics.fillRect(41, 35, 1, 2);
        
        graphics.generateTexture('crackled_concrete', 64, 64);
        graphics.destroy();
    }
    
    static createRubble(scene) {
        const graphics = scene.add.graphics();
        
        // Rubble pile tile (64x64)
        graphics.fillStyle(0x8B7355); // Dusty ground
        graphics.fillRect(0, 0, 64, 64);
        
        // Large concrete chunks
        graphics.fillStyle(0x808080);
        graphics.fillRect(10, 15, 12, 8);
        graphics.fillRect(35, 25, 15, 10);
        graphics.fillRect(20, 40, 10, 12);
        graphics.fillRect(45, 45, 8, 6);
        
        // Smaller debris
        graphics.fillStyle(0x696969);
        graphics.fillRect(5, 30, 6, 4);
        graphics.fillRect(55, 20, 4, 6);
        graphics.fillRect(25, 55, 8, 4);
        graphics.fillRect(50, 10, 5, 3);
        
        // Rebar sticking out
        graphics.fillStyle(0x654321);
        graphics.fillRect(15, 10, 1, 8);
        graphics.fillRect(40, 35, 1, 6);
        graphics.fillRect(30, 50, 1, 5);
        
        // Dust and sand
        graphics.fillStyle(0xD2C49C);
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            graphics.fillRect(x, y, 2, 2);
        }
        
        graphics.generateTexture('rubble', 64, 64);
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
    
    static createDoor(scene) {
        const graphics = scene.add.graphics();
        
        // Wooden door background
        graphics.fillStyle(0x8B4513); // Saddle brown
        graphics.fillRect(0, 0, 16, 32);
        
        // Door frame
        graphics.fillStyle(0x654321); // Dark brown frame
        graphics.fillRect(0, 0, 16, 2); // Top frame
        graphics.fillRect(0, 30, 16, 2); // Bottom frame
        graphics.fillRect(0, 0, 2, 32); // Left frame
        graphics.fillRect(14, 0, 2, 32); // Right frame
        
        // Door panels
        graphics.fillStyle(0xA0522D); // Lighter brown panels
        graphics.fillRect(3, 3, 10, 12); // Upper panel
        graphics.fillRect(3, 17, 10, 12); // Lower panel
        
        // Panel borders
        graphics.fillStyle(0x654321);
        graphics.strokeRect(3, 3, 10, 12); // Upper panel border
        graphics.strokeRect(3, 17, 10, 12); // Lower panel border
        
        // Door handle
        graphics.fillStyle(0xFFD700); // Gold handle
        graphics.fillCircle(12, 16, 1.5);
        
        // Wood grain details
        graphics.fillStyle(0x654321);
        graphics.fillRect(4, 6, 8, 1); // Horizontal grain line
        graphics.fillRect(4, 9, 8, 1);
        graphics.fillRect(4, 20, 8, 1);
        graphics.fillRect(4, 23, 8, 1);
        graphics.fillRect(4, 26, 8, 1);
        
        // Vertical grain
        graphics.fillRect(6, 4, 1, 10);
        graphics.fillRect(10, 4, 1, 10);
        graphics.fillRect(6, 18, 1, 10);
        graphics.fillRect(10, 18, 1, 10);
        
        // Door hinges
        graphics.fillStyle(0x2F4F4F); // Dark slate gray
        graphics.fillRect(1, 5, 2, 3); // Top hinge
        graphics.fillRect(1, 24, 2, 3); // Bottom hinge
        
        graphics.generateTexture('wooden_door', 16, 32);
        graphics.destroy();
        
        console.log('Wooden door sprite created');
    }
    
    static createWindow(scene) {
        const graphics = scene.add.graphics();
        
        // Window frame (wood)
        graphics.fillStyle(0x8B4513); // Brown frame
        graphics.fillRect(0, 0, 16, 16);
        
        // Glass area
        graphics.fillStyle(0x87CEEB); // Sky blue glass
        graphics.fillRect(2, 2, 12, 12);
        
        // Window cross frame (dividing the glass)
        graphics.fillStyle(0x654321); // Dark brown
        graphics.fillRect(7, 2, 2, 12); // Vertical divider
        graphics.fillRect(2, 7, 12, 2); // Horizontal divider
        
        // Glass reflection effect
        graphics.fillStyle(0xF0F8FF); // Alice blue (lighter)
        graphics.fillRect(3, 3, 3, 3); // Top-left reflection
        graphics.fillRect(10, 3, 3, 3); // Top-right reflection
        graphics.fillRect(3, 10, 3, 3); // Bottom-left reflection
        graphics.fillRect(10, 10, 3, 3); // Bottom-right reflection
        
        // Window sill
        graphics.fillStyle(0xA0522D); // Lighter brown
        graphics.fillRect(0, 14, 16, 2);
        
        // Frame details
        graphics.fillStyle(0x654321);
        graphics.strokeRect(0, 0, 16, 16); // Outer frame
        graphics.strokeRect(2, 2, 12, 12); // Inner frame
        
        // Small window latch
        graphics.fillStyle(0xFFD700); // Gold latch
        graphics.fillRect(13, 8, 1, 2);
        
        graphics.generateTexture('window', 16, 16);
        graphics.destroy();
        
        console.log('Window sprite created');
    }
    
    // NEW: Small smoke puff (32x32) for ambient smoke
    static createSmokePuff(scene) {
        const graphics = scene.add.graphics();
        
        // Base dark puff
        graphics.fillStyle(0x2F2F2F, 0.8);
        graphics.fillCircle(16, 20, 12);
        
        // Mid gray
        graphics.fillStyle(0x4A4A4A, 0.6);
        graphics.fillCircle(12, 16, 10);
        graphics.fillCircle(20, 17, 9);
        
        // Light gray edges
        graphics.fillStyle(0x696969, 0.4);
        graphics.fillCircle(14, 12, 8);
        graphics.fillCircle(22, 13, 7);
        
        graphics.generateTexture('smoke_puff', 32, 32);
        graphics.destroy();
    }
    
    // NEW: Small fire sprite (16x24) for residual flames
    static createSmallFire(scene) {
        const graphics = scene.add.graphics();
        
        // Base orange flame
        graphics.fillStyle(0xFF4500);
        graphics.fillRect(4, 12, 8, 10);
        graphics.fillRect(6, 8, 6, 12);
        
        // Yellow inner flame
        graphics.fillStyle(0xFFD700);
        graphics.fillRect(6, 12, 4, 8);
        graphics.fillRect(7, 10, 2, 6);
        
        // White hot core
        graphics.fillStyle(0xFFFFFF);
        graphics.fillRect(7, 13, 2, 4);
        
        graphics.generateTexture('small_fire', 16, 24);
        graphics.destroy();
    }
} 