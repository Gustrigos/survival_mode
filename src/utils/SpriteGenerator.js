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
} 