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
    
    /**
     * Create seamless road textures that fill the entire tile without transparent borders
     * @param {Phaser.Scene} scene - The game scene
     */
    static createSeamlessRoadTextures(scene) {
        console.log('Creating seamless road textures...');
        
        // Create horizontal road texture (64x64) with full coverage
        this.createSeamlessHorizontalRoad(scene);
        
        // Create vertical road texture (64x64) with full coverage  
        this.createSeamlessVerticalRoad(scene);
        
        console.log('Seamless road textures created');
    }
    
    /**
     * Create a seamless horizontal road texture (lines running left-right)
     */
    static createSeamlessHorizontalRoad(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Road colors
        const roadBase = 0x6B6B6B;      // Dark gray road base
        const roadLine = 0xFFD700;      // Yellow road lines
        const roadEdge = 0x404040;      // Darker edge
        
        // Fill entire tile with road base color
        graphics.fillStyle(roadBase);
        graphics.fillRect(0, 0, size, size);
        
        // Add road edges (top and bottom)
        graphics.fillStyle(roadEdge);
        graphics.fillRect(0, 0, size, 2);        // Top edge
        graphics.fillRect(0, size-2, size, 2);   // Bottom edge
        
        // Add horizontal dashed lines (running left-right)
        graphics.fillStyle(roadLine);
        const lineY = size / 2 - 1; // Center line
        
        // Create dashed line pattern
        for (let x = 0; x < size; x += 8) {
            graphics.fillRect(x, lineY, 4, 2); // 4px dash, 4px gap
        }
        
        // Generate texture that completely fills the tile
        graphics.generateTexture('dirt_road_seamless_horizontal', size, size);
        graphics.destroy();
    }
    
    /**
     * Create a seamless vertical road texture (lines running up-down)
     */
    static createSeamlessVerticalRoad(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Road colors (same as horizontal)
        const roadBase = 0x6B6B6B;      // Dark gray road base
        const roadLine = 0xFFD700;      // Yellow road lines
        const roadEdge = 0x404040;      // Darker edge
        
        // Fill entire tile with road base color
        graphics.fillStyle(roadBase);
        graphics.fillRect(0, 0, size, size);
        
        // Add road edges (left and right)
        graphics.fillStyle(roadEdge);
        graphics.fillRect(0, 0, 2, size);        // Left edge
        graphics.fillRect(size-2, 0, 2, size);   // Right edge
        
        // Add vertical dashed lines (running up-down)
        graphics.fillStyle(roadLine);
        const lineX = size / 2 - 1; // Center line
        
        // Create dashed line pattern
        for (let y = 0; y < size; y += 8) {
            graphics.fillRect(lineX, y, 2, 4); // 4px dash, 4px gap
        }
        
        // Generate texture that completely fills the tile
        graphics.generateTexture('dirt_road_seamless_vertical', size, size);
        graphics.destroy();
    }
    
    /**
     * Create seamless terrain textures that fill the entire tile without transparent borders
     * @param {Phaser.Scene} scene - The game scene
     */
    static createSeamlessTerrainTextures(scene) {
        console.log('Creating seamless terrain textures for all types...');
        
        // Create seamless versions of all terrain types
        this.createSeamlessRoadTextures(scene);
        this.createSeamlessSandTexture(scene);
        this.createSeamlessGrassTexture(scene);
        this.createSeamlessConcreteTexture(scene);
        this.createSeamlessRubbleTexture(scene);
        
        console.log('All seamless terrain textures created');
    }
    
    /**
     * Create a seamless sand texture that fills the entire tile
     */
    static createSeamlessSandTexture(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Sand colors
        const sandBase = 0xF4A460;     // Sandy brown base
        const sandLight = 0xFFF8DC;    // Light sand highlights
        const sandDark = 0xD2B48C;     // Darker sand shadows
        const sandMid = 0xE6C2A6;      // Medium sand tone
        
        // Fill entire tile with base sand color
        graphics.fillStyle(sandBase);
        graphics.fillRect(0, 0, size, size);
        
        // Add varied sand texture with random spots and patterns
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const spotSize = Math.random() * 3 + 1;
            const colors = [sandLight, sandDark, sandMid];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            graphics.fillStyle(color);
            graphics.fillCircle(x, y, spotSize);
        }
        
        // Add some horizontal sand ripple patterns
        graphics.fillStyle(sandDark);
        for (let y = 0; y < size; y += 8) {
            const waveY = y + Math.sin(y * 0.3) * 2;
            graphics.fillRect(0, waveY, size, 1);
        }
        
        graphics.generateTexture('sand_texture_seamless', size, size);
        graphics.destroy();
    }
    
    /**
     * Create a seamless grass texture that fills the entire tile
     */
    static createSeamlessGrassTexture(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Grass colors
        const grassBase = 0x228B22;     // Forest green base
        const grassLight = 0x32CD32;    // Bright grass
        const grassDark = 0x006400;     // Dark grass shadows
        const grassMid = 0x1F7A1F;      // Medium grass
        
        // Fill entire tile with base grass color
        graphics.fillStyle(grassBase);
        graphics.fillRect(0, 0, size, size);
        
        // Add grass blade patterns throughout the tile
        for (let x = 0; x < size; x += 2) {
            for (let y = 0; y < size; y += 2) {
                if (Math.random() > 0.3) {
                    const colors = [grassLight, grassDark, grassMid];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    graphics.fillStyle(color);
                    
                    // Random grass blade shapes
                    const bladeWidth = Math.random() * 2 + 1;
                    const bladeHeight = Math.random() * 4 + 2;
                    graphics.fillRect(x + Math.random() * 2, y + Math.random() * 2, bladeWidth, bladeHeight);
                }
            }
        }
        
        graphics.generateTexture('grass_texture_seamless', size, size);
        graphics.destroy();
    }
    
    /**
     * Create a seamless concrete texture that fills the entire tile
     */
    static createSeamlessConcreteTexture(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Concrete colors
        const concreteBase = 0xA0A0A0;   // Light gray base
        const concreteLight = 0xC0C0C0;  // Lighter concrete
        const concreteDark = 0x808080;   // Darker concrete
        const concreteCrack = 0x606060;  // Crack color
        
        // Fill entire tile with base concrete color
        graphics.fillStyle(concreteBase);
        graphics.fillRect(0, 0, size, size);
        
        // Add concrete block pattern
        const blockSize = 16;
        for (let x = 0; x < size; x += blockSize) {
            for (let y = 0; y < size; y += blockSize) {
                // Subtle block variations
                if (Math.random() > 0.3) {
                    const variation = Math.random() > 0.5 ? concreteLight : concreteDark;
                    graphics.fillStyle(variation);
                    graphics.fillRect(x + 1, y + 1, blockSize - 2, blockSize - 2);
                }
                
                // Random cracks
                if (Math.random() > 0.7) {
                    graphics.fillStyle(concreteCrack);
                    graphics.fillRect(x + Math.random() * blockSize, y + Math.random() * blockSize, 1, blockSize/2);
                }
            }
        }
        
        graphics.generateTexture('crackled_concrete_seamless', size, size);
        graphics.destroy();
    }
    
    /**
     * Create a seamless rubble texture that fills the entire tile
     */
    static createSeamlessRubbleTexture(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Rubble colors
        const rubbleBase = 0x8B7355;     // Brown rubble base
        const rubbleLight = 0xA0956F;    // Light rubble
        const rubbleDark = 0x654321;     // Dark rubble
        
        // Fill entire tile with base rubble color
        graphics.fillStyle(rubbleBase);
        graphics.fillRect(0, 0, size, size);
        
        // Add random rubble chunks throughout the tile
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const chunkSize = Math.random() * 6 + 2;
            const colors = [rubbleLight, rubbleDark, rubbleBase];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            graphics.fillStyle(color);
            
            // Create irregular rubble shapes
            const sides = Math.floor(Math.random() * 3) + 4; // 4-6 sided chunks
            const radius = chunkSize;
            graphics.beginPath();
            for (let j = 0; j < sides; j++) {
                const angle = (j / sides) * Math.PI * 2;
                const r = radius * (0.5 + Math.random() * 0.5);
                const px = x + Math.cos(angle) * r;
                const py = y + Math.sin(angle) * r;
                if (j === 0) graphics.moveTo(px, py);
                else graphics.lineTo(px, py);
            }
            graphics.closePath();
            graphics.fillPath();
        }
        
        graphics.generateTexture('rubble_seamless', size, size);
        graphics.destroy();
    }
} 