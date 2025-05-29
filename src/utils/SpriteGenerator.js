import { SpriteLoader } from './SpriteLoader.js';

export class SpriteGenerator {
    static generateSprites(scene) {
        console.log('Loading all sprite assets...');
        
        // Use the new PNG sprite loader instead of programmatic generation
        SpriteLoader.loadSprites(scene);
        
        console.log('All sprite assets loaded successfully');
    }
} 