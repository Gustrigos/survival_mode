export class SWATSpriteManager {
    // Frame mapping for the SWAT spritesheet
    // Based on the sprite sheet image: 3x2 grid (6 total frames)
    static frameMap = {
        // Top row: different character angles/directions
        'down': 0,   // Front-facing character (middle top)
        'left': 1,   // Side-facing character (right top) 
        'up': 3,     // Back-facing character (was frame 2)
        // Bottom row: additional poses/characters
        'right': 1,  // Reuse side-facing frame, will flip horizontally
        'idle': 4,   // Additional pose
        'action': 5  // Additional action pose
    };
    
    static setupAnimations(scene) {
        // Only set up animations if the spritesheet is loaded
        if (!scene.textures.exists('swat_player')) {
            console.warn('SWAT spritesheet not loaded, skipping animations');
            return;
        }
        
        // Create animations for each direction
        Object.keys(this.frameMap).forEach(direction => {
            const animKey = `swat_${direction}`;
            
            // Check if animation already exists
            if (!scene.anims.exists(animKey)) {
                scene.anims.create({
                    key: animKey,
                    frames: scene.anims.generateFrameNumbers('swat_player', { 
                        start: this.frameMap[direction], 
                        end: this.frameMap[direction] 
                    }),
                    frameRate: 8,
                    repeat: -1
                });
            }
        });
    }
    
    static getFrameForDirection(direction) {
        return this.frameMap[direction] || this.frameMap['down'];
    }
    
    static getTextureAndFrame(direction) {
        return {
            texture: 'swat_player',
            frame: this.getFrameForDirection(direction)
        };
    }
} 