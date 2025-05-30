export class TerrainOptimizer {
    /**
     * Optimize terrain textures for better performance and visual quality
     * @param {Phaser.Scene} scene - The game scene
     * @param {Object} config - Configuration options
     */
    static optimizeTextures(scene, config = {}) {
        const defaultConfig = {
            targetTileSize: 64,        // Target display size
            generateMipmaps: true,     // Generate multiple sizes for different zoom levels
            useNearestFilter: true,    // Pixel-perfect scaling
            compressLargeTextures: true // Automatically resize large textures
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        
        console.log('Optimizing terrain textures...');
        
        // List of terrain textures to optimize
        const terrainTextures = [
            'sand_texture', 'grass_texture', 'crackled_concrete',
            'dirt_road', 'dirt_texture', 'rubble', 
            'stone_texture', 'water_texture'
        ];
        
        terrainTextures.forEach(textureName => {
            if (scene.textures.exists(textureName)) {
                this.optimizeTexture(scene, textureName, finalConfig);
            }
        });
        
        console.log('Terrain texture optimization complete');
    }
    
    /**
     * Optimize a single texture
     * @param {Phaser.Scene} scene - The game scene
     * @param {string} textureName - Name of the texture to optimize
     * @param {Object} config - Configuration options
     */
    static optimizeTexture(scene, textureName, config) {
        const texture = scene.textures.get(textureName);
        if (!texture) return;
        
        const source = texture.getSourceImage();
        const originalWidth = source.width || source.naturalWidth;
        const originalHeight = source.height || source.naturalHeight;
        
        console.log(`Optimizing ${textureName}: ${originalWidth}x${originalHeight}`);
        
        // Apply nearest neighbor filter for pixel-perfect scaling
        if (config.useNearestFilter) {
            texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        
        // If texture is much larger than target size, suggest creating optimized versions
        const targetSize = config.targetTileSize;
        if (config.compressLargeTextures && 
            (originalWidth > targetSize * 4 || originalHeight > targetSize * 4)) {
            
            console.log(`⚠️  ${textureName} is ${originalWidth}x${originalHeight} but displayed at ${targetSize}x${targetSize}`);
            console.log(`   Consider creating a ${targetSize}x${targetSize} version for better performance`);
        }
    }
    
    /**
     * Generate optimized terrain textures programmatically
     * This creates 64x64 versions of terrain types for optimal performance
     * @param {Phaser.Scene} scene - The game scene
     */
    static generateOptimizedTextures(scene) {
        console.log('Generating optimized 64x64 terrain textures...');
        
        // Create optimized sand texture
        this.createOptimizedSandTexture(scene);
        this.createOptimizedGrassTexture(scene);
        this.createOptimizedConcreteTexture(scene);
        
        console.log('Optimized terrain textures generated');
    }
    
    /**
     * Create an optimized 64x64 sand texture
     */
    static createOptimizedSandTexture(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Sand colors
        const sandBase = 0xF4A460;     // Sandy brown
        const sandLight = 0xFFF8DC;    // Cornsilk
        const sandDark = 0xD2B48C;     // Tan
        
        graphics.fillStyle(sandBase);
        graphics.fillRect(0, 0, size, size);
        
        // Add detailed sand texture with random spots
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const spotSize = Math.random() * 3 + 1;
            const color = Math.random() > 0.5 ? sandLight : sandDark;
            
            graphics.fillStyle(color);
            graphics.fillCircle(x, y, spotSize);
        }
        
        graphics.generateTexture('sand_texture_optimized', size, size);
        graphics.destroy();
    }
    
    /**
     * Create an optimized 64x64 grass texture
     */
    static createOptimizedGrassTexture(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Grass colors
        const grassBase = 0x228B22;     // Forest green
        const grassLight = 0x32CD32;    // Lime green
        const grassDark = 0x006400;     // Dark green
        
        graphics.fillStyle(grassBase);
        graphics.fillRect(0, 0, size, size);
        
        // Add grass blade patterns
        for (let x = 0; x < size; x += 4) {
            for (let y = 0; y < size; y += 4) {
                if (Math.random() > 0.3) {
                    const bladeColor = Math.random() > 0.5 ? grassLight : grassDark;
                    graphics.fillStyle(bladeColor);
                    graphics.fillRect(x + Math.random() * 2, y + Math.random() * 2, 1, 3);
                }
            }
        }
        
        graphics.generateTexture('grass_texture_optimized', size, size);
        graphics.destroy();
    }
    
    /**
     * Create an optimized 64x64 concrete texture
     */
    static createOptimizedConcreteTexture(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Concrete colors
        const concreteBase = 0xA0A0A0;   // Light gray
        const concreteLight = 0xC0C0C0;  // Silver
        const concreteDark = 0x808080;   // Gray
        const concreteCrack = 0x606060;  // Dark gray
        
        graphics.fillStyle(concreteBase);
        graphics.fillRect(0, 0, size, size);
        
        // Add concrete blocks pattern
        const blockSize = 16;
        for (let x = 0; x < size; x += blockSize) {
            for (let y = 0; y < size; y += blockSize) {
                // Block outline
                graphics.fillStyle(concreteDark);
                graphics.fillRect(x, y, blockSize, blockSize);
                
                // Block fill
                graphics.fillStyle(concreteBase);
                graphics.fillRect(x + 1, y + 1, blockSize - 2, blockSize - 2);
                
                // Random highlights and cracks
                if (Math.random() > 0.5) {
                    graphics.fillStyle(concreteLight);
                    graphics.fillRect(x + 2, y + 2, blockSize - 4, 2);
                }
                
                if (Math.random() > 0.7) {
                    graphics.fillStyle(concreteCrack);
                    graphics.fillRect(x + Math.random() * blockSize, y + Math.random() * blockSize, 1, blockSize/2);
                }
            }
        }
        
        graphics.generateTexture('crackled_concrete_optimized', size, size);
        graphics.destroy();
    }
    
    /**
     * Get recommended tile size based on texture dimensions and performance
     * @param {number} textureWidth - Original texture width
     * @param {number} textureHeight - Original texture height
     * @param {Object} options - Configuration options
     * @returns {number} Recommended tile size
     */
    static getRecommendedTileSize(textureWidth, textureHeight, options = {}) {
        const maxSize = Math.max(textureWidth, textureHeight);
        
        // Common tile sizes in order of preference
        const tileSizes = [32, 64, 128, 256, 512];
        
        // If texture is larger than 256px, recommend downscaling
        if (maxSize >= 1024) {
            return options.performanceMode ? 64 : 128;
        } else if (maxSize >= 512) {
            return options.performanceMode ? 64 : 128;
        } else if (maxSize >= 256) {
            return options.performanceMode ? 64 : 128;
        } else if (maxSize >= 128) {
            return 64;
        } else if (maxSize >= 64) {
            return 64;
        } else {
            return 32;
        }
    }
} 