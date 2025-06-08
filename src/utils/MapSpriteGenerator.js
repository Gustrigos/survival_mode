export class MapSpriteGenerator {
    static generateSprites(scene) {
        console.log('Generating simple pixel art environment sprites...');
        
        // Create simple terrain textures
        this.createGrassTexture(scene);
        this.createDirtTexture(scene);
        this.createStoneTexture(scene);
        this.createWaterTexture(scene);
        this.createSandTexture(scene);
        
        // Create missing textures that the game expects
        this.createDirtRoad(scene);
        this.createRubble(scene);
        this.createCrackledConcrete(scene);
        
        // Create simple environment objects
        this.createTree(scene);
        this.createRock(scene);
        this.createBush(scene);
        this.createFlowers(scene);
        
        // Create military/crash site objects
        this.createHelicopterWreckage(scene);
        this.createCrashedHelicopter(scene); // Alias for compatibility
        this.createMilitaryCrate(scene);
        this.createSandbags(scene);
        this.createTent(scene);
        this.createCampfire(scene);
        this.createDebris(scene);
        
        // Create vegetation
        this.createPalmTree(scene);
        this.createDeadTree(scene);
        
        console.log('Simple environment sprites generated');
    }
    
    static createGrassTexture(scene) {
        const graphics = scene.add.graphics();
        
        // Simple grass texture with clear colors
        const grassBase = 0x228B22;      // Forest green base
        const grassLight = 0x32CD32;     // Lime green highlights
        const outline = 0x006400;        // Dark green outline
        
        // Base grass color
        graphics.fillStyle(grassBase);
        graphics.fillRect(0, 0, 32, 32);
        
        // Simple grass pattern
        graphics.fillStyle(grassLight);
        graphics.fillRect(4, 4, 2, 4);
        graphics.fillRect(8, 6, 2, 4);
        graphics.fillRect(12, 2, 2, 4);
        graphics.fillRect(16, 8, 2, 4);
        graphics.fillRect(20, 4, 2, 4);
        graphics.fillRect(24, 6, 2, 4);
        graphics.fillRect(28, 2, 2, 4);
        
        graphics.fillRect(6, 12, 2, 4);
        graphics.fillRect(10, 14, 2, 4);
        graphics.fillRect(14, 10, 2, 4);
        graphics.fillRect(18, 16, 2, 4);
        graphics.fillRect(22, 12, 2, 4);
        graphics.fillRect(26, 14, 2, 4);
        
        graphics.fillRect(2, 20, 2, 4);
        graphics.fillRect(6, 22, 2, 4);
        graphics.fillRect(10, 18, 2, 4);
        graphics.fillRect(14, 24, 2, 4);
        graphics.fillRect(18, 20, 2, 4);
        graphics.fillRect(22, 22, 2, 4);
        graphics.fillRect(26, 18, 2, 4);
        graphics.fillRect(30, 24, 2, 4);
        
        // Simple outline
        graphics.fillStyle(outline);
        graphics.fillRect(0, 0, 32, 1); // Top
        graphics.fillRect(0, 31, 32, 1); // Bottom
        graphics.fillRect(0, 0, 1, 32); // Left
        graphics.fillRect(31, 0, 1, 32); // Right
        
        graphics.generateTexture('grass_texture', 32, 32);
        graphics.destroy();
    }
    
    static createDirtTexture(scene) {
        const graphics = scene.add.graphics();
        
        // Simple dirt texture
        const dirtBase = 0x8B4513;       // Saddle brown
        const dirtLight = 0xA0522D;      // Sienna
        const dirtDark = 0x654321;       // Dark brown
        
        graphics.fillStyle(dirtBase);
        graphics.fillRect(0, 0, 32, 32);
        
        // Simple dirt spots
        graphics.fillStyle(dirtLight);
        graphics.fillRect(4, 4, 4, 4);
        graphics.fillRect(12, 8, 4, 4);
        graphics.fillRect(20, 2, 4, 4);
        graphics.fillRect(8, 16, 4, 4);
        graphics.fillRect(24, 20, 4, 4);
        graphics.fillRect(2, 24, 4, 4);
        graphics.fillRect(16, 28, 4, 4);
        
        graphics.fillStyle(dirtDark);
        graphics.fillRect(8, 2, 2, 2);
        graphics.fillRect(16, 6, 2, 2);
        graphics.fillRect(24, 10, 2, 2);
        graphics.fillRect(4, 14, 2, 2);
        graphics.fillRect(12, 18, 2, 2);
        graphics.fillRect(20, 22, 2, 2);
        graphics.fillRect(28, 26, 2, 2);
        graphics.fillRect(6, 30, 2, 2);
        
        graphics.generateTexture('dirt_texture', 32, 32);
        graphics.destroy();
    }
    
    static createStoneTexture(scene) {
        const graphics = scene.add.graphics();
        
        // Simple stone texture
        const stoneBase = 0x696969;      // Dim gray
        const stoneLight = 0x808080;     // Gray
        const stoneDark = 0x2F2F2F;      // Dark gray
        const outline = 0x000000;       // Black outline
        
        graphics.fillStyle(stoneBase);
        graphics.fillRect(0, 0, 32, 32);
        
        // Simple stone blocks
        graphics.fillStyle(stoneLight);
        graphics.fillRect(2, 2, 12, 12);
        graphics.fillRect(18, 2, 12, 12);
        graphics.fillRect(2, 18, 12, 12);
        graphics.fillRect(18, 18, 12, 12);
        
        graphics.fillStyle(stoneDark);
        graphics.fillRect(4, 4, 8, 8);
        graphics.fillRect(20, 4, 8, 8);
        graphics.fillRect(4, 20, 8, 8);
        graphics.fillRect(20, 20, 8, 8);
        
        // Outline
        graphics.fillStyle(outline);
        graphics.fillRect(0, 0, 32, 1);
        graphics.fillRect(0, 31, 32, 1);
        graphics.fillRect(0, 0, 1, 32);
        graphics.fillRect(31, 0, 1, 32);
        graphics.fillRect(14, 0, 1, 32); // Middle vertical
        graphics.fillRect(0, 14, 32, 1); // Middle horizontal
        
        graphics.generateTexture('stone_texture', 32, 32);
        graphics.destroy();
    }
    
    static createWaterTexture(scene) {
        const graphics = scene.add.graphics();
        
        // Simple water texture
        const waterBase = 0x4169E1;      // Royal blue
        const waterLight = 0x6495ED;     // Cornflower blue
        const waterDark = 0x191970;      // Midnight blue
        
        graphics.fillStyle(waterBase);
        graphics.fillRect(0, 0, 32, 32);
        
        // Simple wave pattern
        graphics.fillStyle(waterLight);
        graphics.fillRect(0, 4, 32, 2);
        graphics.fillRect(0, 12, 32, 2);
        graphics.fillRect(0, 20, 32, 2);
        graphics.fillRect(0, 28, 32, 2);
        
        graphics.fillStyle(waterDark);
        graphics.fillRect(0, 8, 32, 2);
        graphics.fillRect(0, 16, 32, 2);
        graphics.fillRect(0, 24, 32, 2);
        
        graphics.generateTexture('water_texture', 32, 32);
        graphics.destroy();
    }
    
    static createSandTexture(scene) {
        const graphics = scene.add.graphics();
        
        // Simple sand texture
        const sandBase = 0xF4A460;       // Sandy brown
        const sandLight = 0xFFF8DC;      // Cornsilk
        const sandDark = 0xD2B48C;       // Tan
        
        graphics.fillStyle(sandBase);
        graphics.fillRect(0, 0, 32, 32);
        
        // Simple sand spots
        graphics.fillStyle(sandLight);
        graphics.fillRect(4, 2, 1, 1);
        graphics.fillRect(8, 6, 1, 1);
        graphics.fillRect(12, 4, 1, 1);
        graphics.fillRect(16, 8, 1, 1);
        graphics.fillRect(20, 2, 1, 1);
        graphics.fillRect(24, 6, 1, 1);
        graphics.fillRect(28, 4, 1, 1);
        graphics.fillRect(6, 12, 1, 1);
        graphics.fillRect(10, 16, 1, 1);
        graphics.fillRect(14, 14, 1, 1);
        graphics.fillRect(18, 18, 1, 1);
        graphics.fillRect(22, 12, 1, 1);
        graphics.fillRect(26, 16, 1, 1);
        graphics.fillRect(2, 22, 1, 1);
        graphics.fillRect(6, 26, 1, 1);
        graphics.fillRect(10, 24, 1, 1);
        graphics.fillRect(14, 28, 1, 1);
        graphics.fillRect(18, 22, 1, 1);
        graphics.fillRect(22, 26, 1, 1);
        graphics.fillRect(26, 24, 1, 1);
        graphics.fillRect(30, 28, 1, 1);
        
        graphics.fillStyle(sandDark);
        graphics.fillRect(2, 4, 1, 1);
        graphics.fillRect(6, 8, 1, 1);
        graphics.fillRect(10, 6, 1, 1);
        graphics.fillRect(14, 10, 1, 1);
        graphics.fillRect(18, 4, 1, 1);
        graphics.fillRect(22, 8, 1, 1);
        graphics.fillRect(26, 6, 1, 1);
        graphics.fillRect(30, 10, 1, 1);
        graphics.fillRect(4, 14, 1, 1);
        graphics.fillRect(8, 18, 1, 1);
        graphics.fillRect(12, 16, 1, 1);
        graphics.fillRect(16, 20, 1, 1);
        graphics.fillRect(20, 14, 1, 1);
        graphics.fillRect(24, 18, 1, 1);
        graphics.fillRect(28, 16, 1, 1);
        graphics.fillRect(4, 24, 1, 1);
        graphics.fillRect(8, 28, 1, 1);
        graphics.fillRect(12, 26, 1, 1);
        graphics.fillRect(16, 30, 1, 1);
        graphics.fillRect(20, 24, 1, 1);
        graphics.fillRect(24, 28, 1, 1);
        graphics.fillRect(28, 26, 1, 1);
        
        graphics.generateTexture('sand_texture', 32, 32);
        graphics.destroy();
    }
    
    static createTree(scene) {
        const graphics = scene.add.graphics();
        
        // Simple tree with clear outline
        const outline = 0x000000;        // Black outline
        const trunkColor = 0x8B4513;     // Brown trunk
        const foliageColor = 0x228B22;   // Green foliage
        const foliageLight = 0x32CD32;   // Light green
        
        // Outline first
        graphics.fillStyle(outline);
        graphics.fillRect(6, 12, 4, 8); // Trunk outline
        graphics.fillCircle(8, 8, 7); // Foliage outline
        
        // Trunk
        graphics.fillStyle(trunkColor);
        graphics.fillRect(7, 13, 2, 6); // Trunk
        
        // Foliage
        graphics.fillStyle(foliageColor);
        graphics.fillCircle(8, 8, 6); // Main foliage
        
        graphics.fillStyle(foliageLight);
        graphics.fillCircle(6, 6, 2); // Left highlight
        graphics.fillCircle(10, 7, 2); // Right highlight
        
        graphics.generateTexture('tree', 16, 20);
        graphics.destroy();
    }
    
    static createRock(scene) {
        const graphics = scene.add.graphics();
        
        // Simple rock with outline
        const outline = 0x000000;        // Black outline
        const rockColor = 0x696969;      // Gray rock
        const rockLight = 0x808080;      // Light gray
        
        // Outline
        graphics.fillStyle(outline);
        graphics.fillCircle(8, 8, 7);
        
        // Main rock
        graphics.fillStyle(rockColor);
        graphics.fillCircle(8, 8, 6);
        
        // Highlight
        graphics.fillStyle(rockLight);
        graphics.fillCircle(6, 6, 3);
        
        graphics.generateTexture('rock', 16, 16);
        graphics.destroy();
    }
    
    static createBush(scene) {
        const graphics = scene.add.graphics();
        
        // Simple bush with outline
        const outline = 0x000000;        // Black outline
        const bushColor = 0x228B22;      // Green bush
        const bushLight = 0x32CD32;      // Light green
        
        // Outline
        graphics.fillStyle(outline);
        graphics.fillCircle(6, 6, 5);
        graphics.fillCircle(10, 7, 4);
        
        // Main bush
        graphics.fillStyle(bushColor);
        graphics.fillCircle(6, 6, 4);
        graphics.fillCircle(10, 7, 3);
        
        // Highlights
        graphics.fillStyle(bushLight);
        graphics.fillCircle(5, 5, 2);
        graphics.fillCircle(9, 6, 1);
        
        graphics.generateTexture('bush', 16, 12);
        graphics.destroy();
    }
    
    static createFlowers(scene) {
        const graphics = scene.add.graphics();
        
        // Simple flowers with outline
        const outline = 0x000000;        // Black outline
        const stemColor = 0x228B22;      // Green stems
        const flowerRed = 0xFF6347;      // Red flower
        const flowerYellow = 0xFFD700;   // Yellow flower
        
        // Stems
        graphics.fillStyle(stemColor);
        graphics.fillRect(3, 6, 1, 4);
        graphics.fillRect(7, 7, 1, 3);
        graphics.fillRect(11, 6, 1, 4);
        
        // Flower outlines
        graphics.fillStyle(outline);
        graphics.fillCircle(3, 6, 2);
        graphics.fillCircle(7, 7, 2);
        graphics.fillCircle(11, 6, 2);
        
        // Flowers
        graphics.fillStyle(flowerRed);
        graphics.fillCircle(3, 6, 1);
        
        graphics.fillStyle(flowerYellow);
        graphics.fillCircle(7, 7, 1);
        
        graphics.fillStyle(flowerRed);
        graphics.fillCircle(11, 6, 1);
        
        graphics.generateTexture('flowers', 16, 12);
        graphics.destroy();
    }
    
    static createHelicopterWreckage(scene) {
        const graphics = scene.add.graphics();
        
        // Simple helicopter wreckage with clear outline
        const outline = 0x000000;        // Black outline
        const metalColor = 0x2F4F4F;     // Dark metal
        const metalLight = 0x696969;     // Light metal
        const fireColor = 0xFF4500;      // Fire
        
        // Outline
        graphics.fillStyle(outline);
        graphics.fillRect(2, 8, 28, 8); // Main body outline
        graphics.fillRect(4, 4, 8, 6); // Cockpit outline
        graphics.fillRect(14, 2, 4, 4); // Rotor hub outline
        
        // Main fuselage
        graphics.fillStyle(metalColor);
        graphics.fillRect(3, 9, 26, 6); // Main body
        
        // Cockpit
        graphics.fillStyle(metalLight);
        graphics.fillRect(5, 5, 6, 4); // Cockpit
        
        // Rotor hub
        graphics.fillStyle(metalColor);
        graphics.fillRect(15, 3, 2, 2); // Rotor hub
        
        // Broken rotor blades
        graphics.fillRect(8, 4, 4, 1); // Left blade
        graphics.fillRect(18, 4, 6, 1); // Right blade
        
        // Fire effect
        graphics.fillStyle(fireColor);
        graphics.fillRect(20, 7, 2, 2);
        graphics.fillRect(22, 6, 2, 2);
        graphics.fillRect(24, 8, 2, 2);
        
        graphics.generateTexture('helicopter_wreckage', 32, 16);
        graphics.destroy();
    }
    
    static createCrashedHelicopter(scene) {
        const graphics = scene.add.graphics();
        
        // Larger crashed helicopter with simple design
        const outline = 0x000000;        // Black outline
        const metalColor = 0x2F4F4F;     // Dark metal
        const metalLight = 0x696969;     // Light metal
        const glassColor = 0x87CEEB;     // Glass
        const fireColor = 0xFF4500;      // Fire
        
        // Main body outline
        graphics.fillStyle(outline);
        graphics.fillRect(10, 20, 60, 20); // Main fuselage outline
        graphics.fillRect(15, 10, 20, 15); // Cockpit outline
        graphics.fillRect(35, 5, 8, 8); // Rotor hub outline
        graphics.fillRect(70, 22, 25, 8); // Tail boom outline
        
        // Main fuselage
        graphics.fillStyle(metalColor);
        graphics.fillRect(11, 21, 58, 18); // Main body
        
        // Cockpit
        graphics.fillStyle(metalLight);
        graphics.fillRect(16, 11, 18, 13); // Cockpit frame
        
        graphics.fillStyle(glassColor);
        graphics.fillRect(17, 12, 16, 11); // Cockpit glass
        
        // Rotor hub
        graphics.fillStyle(metalColor);
        graphics.fillRect(36, 6, 6, 6); // Rotor hub
        
        // Broken rotor blades
        graphics.fillRect(20, 8, 16, 2); // Left blade
        graphics.fillRect(42, 9, 20, 2); // Right blade
        graphics.fillRect(38, 0, 2, 12); // Vertical blade
        
        // Tail boom
        graphics.fillStyle(metalColor);
        graphics.fillRect(71, 23, 23, 6); // Tail boom
        
        // Tail rotor
        graphics.fillRect(94, 21, 4, 1); // Horizontal tail blade
        graphics.fillRect(95, 19, 1, 4); // Vertical tail blade
        
        // Landing skids
        graphics.fillRect(20, 39, 40, 2); // Left skid
        graphics.fillRect(22, 41, 38, 2); // Right skid
        
        // Fire effects
        graphics.fillStyle(fireColor);
        graphics.fillRect(50, 15, 3, 3);
        graphics.fillRect(55, 17, 3, 3);
        graphics.fillRect(45, 18, 3, 3);
        graphics.fillRect(75, 20, 3, 3);
        graphics.fillRect(80, 22, 3, 3);
        
        graphics.generateTexture('crashed_helicopter', 100, 44);
        graphics.destroy();
    }
    
    static createMilitaryCrate(scene) {
        const graphics = scene.add.graphics();
        
        const outline = 0x000000;
        const crateColor = 0x4A5D23;
        const crateLight = 0x6B8E23;
        
        graphics.fillStyle(outline);
        graphics.fillRect(0, 0, 16, 16);
        
        graphics.fillStyle(crateColor);
        graphics.fillRect(1, 1, 14, 14);
        
        graphics.fillStyle(crateLight);
        graphics.fillRect(1, 1, 14, 2);
        graphics.fillRect(1, 1, 2, 14);
        
        graphics.generateTexture('military_crate', 16, 16);
        graphics.destroy();
    }
    
    static createSandbags(scene) {
        const graphics = scene.add.graphics();
        
        const outline = 0x000000;
        const bagColor = 0xF4E4BC;
        const bagShadow = 0xD2B48C;
        
        graphics.fillStyle(outline);
        graphics.fillRect(0, 4, 24, 8);
        graphics.fillRect(0, 12, 24, 8);
        
        graphics.fillStyle(bagColor);
        graphics.fillRect(1, 5, 22, 6);
        graphics.fillRect(1, 13, 22, 6);
        
        graphics.fillStyle(bagShadow);
        graphics.fillRect(1, 9, 22, 2);
        graphics.fillRect(1, 17, 22, 2);
        
        graphics.generateTexture('sandbags', 24, 20);
        graphics.destroy();
    }
    
    static createTent(scene) {
        const graphics = scene.add.graphics();
        
        const outline = 0x000000;
        const tentColor = 0x4A5D23;
        const tentLight = 0x6B8E23;
        
        graphics.fillStyle(outline);
        graphics.fillRect(4, 8, 24, 16);
        
        graphics.fillStyle(tentColor);
        graphics.fillRect(5, 9, 22, 14);
        
        graphics.fillStyle(tentLight);
        graphics.fillRect(5, 9, 22, 3);
        
        graphics.generateTexture('tent', 32, 24);
        graphics.destroy();
    }
    
    static createCampfire(scene) {
        const graphics = scene.add.graphics();
        
        const outline = 0x000000;
        const woodColor = 0x8B4513;
        const fireColor = 0xFF4500;
        const fireYellow = 0xFFD700;
        
        graphics.fillStyle(outline);
        graphics.fillCircle(8, 12, 7);
        
        graphics.fillStyle(woodColor);
        graphics.fillRect(2, 10, 12, 4);
        graphics.fillRect(6, 6, 4, 12);
        
        graphics.fillStyle(fireColor);
        graphics.fillRect(4, 4, 2, 6);
        graphics.fillRect(6, 2, 2, 8);
        graphics.fillRect(8, 2, 2, 8);
        graphics.fillRect(10, 4, 2, 6);
        
        graphics.fillStyle(fireYellow);
        graphics.fillRect(6, 3, 2, 5);
        graphics.fillRect(8, 3, 2, 5);
        
        graphics.generateTexture('campfire', 16, 16);
        graphics.destroy();
    }
    
    static createDebris(scene) {
        const graphics = scene.add.graphics();
        
        const outline = 0x000000;
        const debrisColor = 0x696969;
        const debrisLight = 0x808080;
        
        graphics.fillStyle(outline);
        graphics.fillRect(0, 8, 16, 8);
        
        graphics.fillStyle(debrisColor);
        graphics.fillRect(1, 9, 14, 6);
        
        graphics.fillStyle(debrisLight);
        graphics.fillRect(1, 9, 14, 2);
        
        graphics.generateTexture('debris', 16, 16);
        graphics.destroy();
    }
    
    static createDirtRoad(scene) {
        const graphics = scene.add.graphics();
        
        const roadColor = 0xA0956F;
        const roadLight = 0xB8A082;
        const roadDark = 0x8B7355;
        
        graphics.fillStyle(roadColor);
        graphics.fillRect(0, 0, 32, 32);
        
        graphics.fillStyle(roadLight);
        graphics.fillRect(0, 4, 32, 2);
        graphics.fillRect(0, 12, 32, 2);
        graphics.fillRect(0, 20, 32, 2);
        graphics.fillRect(0, 28, 32, 2);
        
        graphics.fillStyle(roadDark);
        graphics.fillRect(0, 8, 32, 2);
        graphics.fillRect(0, 16, 32, 2);
        graphics.fillRect(0, 24, 32, 2);
        
        graphics.generateTexture('dirt_road', 32, 32);
        graphics.destroy();
    }
    
    static createRubble(scene) {
        const graphics = scene.add.graphics();
        
        const outline = 0x000000;
        const rubbleColor = 0x8B7355;
        const rubbleLight = 0xA0956F;
        const rubbleDark = 0x654321;
        
        graphics.fillStyle(rubbleColor);
        graphics.fillRect(0, 0, 32, 32);
        
        graphics.fillStyle(rubbleLight);
        graphics.fillRect(4, 4, 6, 6);
        graphics.fillRect(14, 8, 6, 6);
        graphics.fillRect(22, 2, 6, 6);
        graphics.fillRect(2, 16, 6, 6);
        graphics.fillRect(12, 20, 6, 6);
        graphics.fillRect(24, 18, 6, 6);
        
        graphics.fillStyle(rubbleDark);
        graphics.fillRect(8, 2, 4, 4);
        graphics.fillRect(18, 6, 4, 4);
        graphics.fillRect(26, 12, 4, 4);
        graphics.fillRect(4, 14, 4, 4);
        graphics.fillRect(14, 18, 4, 4);
        graphics.fillRect(22, 26, 4, 4);
        
        graphics.generateTexture('rubble', 32, 32);
        graphics.destroy();
    }
    
    static createCrackledConcrete(scene) {
        const graphics = scene.add.graphics();
        
        const concreteColor = 0xB0B0B0;
        const concreteLight = 0xD3D3D3;
        const concreteDark = 0x696969;
        const crackColor = 0x2F2F2F;
        
        graphics.fillStyle(concreteColor);
        graphics.fillRect(0, 0, 32, 32);
        
        graphics.fillStyle(concreteLight);
        graphics.fillRect(2, 2, 12, 12);
        graphics.fillRect(18, 2, 12, 12);
        graphics.fillRect(2, 18, 12, 12);
        graphics.fillRect(18, 18, 12, 12);
        
        graphics.fillStyle(concreteDark);
        graphics.fillRect(4, 4, 8, 8);
        graphics.fillRect(20, 4, 8, 8);
        graphics.fillRect(4, 20, 8, 8);
        graphics.fillRect(20, 20, 8, 8);
        
        graphics.fillStyle(crackColor);
        graphics.fillRect(8, 0, 1, 32);
        graphics.fillRect(24, 0, 1, 32);
        graphics.fillRect(0, 8, 32, 1);
        graphics.fillRect(0, 24, 32, 1);
        
        graphics.generateTexture('crackled_concrete', 32, 32);
        graphics.destroy();
    }
    
    static createPalmTree(scene) {
        const graphics = scene.add.graphics();
        
        const outline = 0x000000;
        const trunkColor = 0x8B4513;
        const leafColor = 0x228B22;
        const leafLight = 0x32CD32;
        
        graphics.fillStyle(outline);
        graphics.fillRect(6, 8, 4, 16);
        
        graphics.fillStyle(trunkColor);
        graphics.fillRect(7, 9, 2, 14);
        
        graphics.fillStyle(outline);
        graphics.fillRect(0, 4, 16, 2);
        graphics.fillRect(0, 6, 16, 2);
        graphics.fillRect(2, 2, 12, 2);
        graphics.fillRect(2, 8, 12, 2);
        
        graphics.fillStyle(leafColor);
        graphics.fillRect(1, 5, 14, 1);
        graphics.fillRect(1, 7, 14, 1);
        graphics.fillRect(3, 3, 10, 1);
        graphics.fillRect(3, 9, 10, 1);
        
        graphics.fillStyle(leafLight);
        graphics.fillRect(1, 5, 3, 1);
        graphics.fillRect(12, 5, 3, 1);
        graphics.fillRect(1, 7, 3, 1);
        graphics.fillRect(12, 7, 3, 1);
        
        graphics.generateTexture('palm_tree', 16, 24);
        graphics.destroy();
    }
    
    static createDeadTree(scene) {
        const graphics = scene.add.graphics();
        
        const outline = 0x000000;
        const trunkColor = 0x654321;
        const branchColor = 0x2F2F2F;
        
        graphics.fillStyle(outline);
        graphics.fillRect(6, 8, 4, 16);
        
        graphics.fillStyle(trunkColor);
        graphics.fillRect(7, 9, 2, 14);
        
        graphics.fillStyle(outline);
        graphics.fillRect(2, 4, 12, 2);
        graphics.fillRect(4, 2, 8, 2);
        graphics.fillRect(0, 6, 6, 2);
        graphics.fillRect(10, 6, 6, 2);
        
        graphics.fillStyle(branchColor);
        graphics.fillRect(3, 5, 10, 1);
        graphics.fillRect(5, 3, 6, 1);
        graphics.fillRect(1, 7, 4, 1);
        graphics.fillRect(11, 7, 4, 1);
        
        graphics.generateTexture('dead_tree', 16, 24);
        graphics.destroy();
    }
} 