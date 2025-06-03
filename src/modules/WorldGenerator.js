/**
 * WorldGenerator.js - Procedural world generation system
 * 
 * Features:
 * - Polytopia-style finite maps with configurable sizes
 * - Minecraft-style biome/terrain generation
 * - Random structure placement including helicopter crash sites
 * - Terrain variety and natural formations
 */

export class WorldGenerator {
    constructor() {
        // Available map sizes (Polytopia-style)
        this.mapSizes = {
            small: { width: 1024, height: 768, name: "Small (1024x768)" },
            medium: { width: 2048, height: 1536, name: "Medium (2048x1536)" },
            large: { width: 3072, height: 2304, name: "Large (3072x2304)" },
            huge: { width: 4096, height: 3072, name: "Huge (4096x3072)" }
        };

        // Biome types with their characteristics
        this.biomes = {
            grassland: {
                terrainTypes: ['grass_texture', 'dirt_texture'],
                weights: [0.8, 0.2],
                structureSpawnRate: 0.05,
                zombieSpawnRate: 1.0,
                color: 0x4a7c59
            },
            desert: {
                terrainTypes: ['sand_texture', 'stone_texture'],
                weights: [0.9, 0.1],
                structureSpawnRate: 0.03,
                zombieSpawnRate: 0.8,
                color: 0xc2b280
            },
            urban: {
                terrainTypes: ['crackled_concrete', 'dirt_road'],
                weights: [0.7, 0.3],
                structureSpawnRate: 0.1,
                zombieSpawnRate: 1.2,
                color: 0x666666
            },
            wasteland: {
                terrainTypes: ['rubble', 'crackled_concrete', 'dirt_texture'],
                weights: [0.4, 0.4, 0.2],
                structureSpawnRate: 0.08,
                zombieSpawnRate: 1.1,
                color: 0x4a4a4a
            },
            forest: {
                terrainTypes: ['grass_texture', 'dirt_texture'],
                weights: [0.9, 0.1],
                structureSpawnRate: 0.02,
                zombieSpawnRate: 0.7,
                color: 0x2d5033
            }
        };

        // Structure types that can be randomly placed
        this.structures = {
            helicopter_crash: {
                textureKey: 'crashed_helicopter',
                rarity: 0.003, // Very rare - about 1 per large map section
                minDistance: 400, // Minimum distance between crash sites
                biomePreference: ['wasteland', 'urban'],
                type: 'crashed_helicopter',
                material: 'metal',
                health: 1500,
                destructible: false,
                size: { width: 240, height: 160 }
            },
            building_ruins: {
                textureKey: 'concrete_building',
                rarity: 0.01,
                minDistance: 200,
                biomePreference: ['urban', 'wasteland'],
                type: 'concrete_building',
                material: 'concrete',
                health: 800,
                destructible: true,
                size: { width: 128, height: 128 }
            },
            abandoned_vehicle: {
                textureKey: 'vehicle_wreck',
                rarity: 0.02,
                minDistance: 150,
                biomePreference: ['urban', 'desert', 'wasteland'],
                type: 'vehicle_wreck',
                material: 'metal',
                health: 300,
                destructible: true,
                size: { width: 96, height: 64 }
            }
        };

        // Noise generation for terrain variety
        this.noiseScale = 0.01;
        this.biomeScale = 0.003;
    }

    /**
     * Generate a complete world
     * @param {string} mapSize - Size identifier (small, medium, large, huge)
     * @param {number} seed - Random seed for consistent generation
     * @returns {Object} Generated world data
     */
    generateWorld(mapSize = 'medium', seed = null) {
        if (seed === null) {
            seed = Math.floor(Math.random() * 1000000);
        }

        const worldData = {
            size: this.mapSizes[mapSize],
            seed: seed,
            biomes: new Map(),
            terrain: new Map(),
            structures: [],
            playerStartPosition: null,
            zombieSpawnAreas: []
        };

        console.log(`🌍 Generating ${mapSize} world (${worldData.size.width}x${worldData.size.height}) with seed: ${seed}`);

        // Set up random number generator with seed
        this.rng = this.createSeededRNG(seed);

        // Generate biome map
        this.generateBiomes(worldData);

        // Generate terrain based on biomes
        this.generateTerrain(worldData);

        // Place structures randomly
        this.placeStructures(worldData);

        // Find good player start position
        this.findPlayerStartPosition(worldData);

        // Generate zombie spawn areas
        this.generateZombieSpawnAreas(worldData);

        // Generate roads and paths
        this.generatePaths(worldData);

        console.log(`✅ World generation complete!`);
        console.log(`   - Biomes: ${worldData.biomes.size} regions`);
        console.log(`   - Structures: ${worldData.structures.length} placed`);
        console.log(`   - Helicopter crashes: ${worldData.structures.filter(s => s.type === 'helicopter_crash').length}`);

        return worldData;
    }

    /**
     * Generate biome regions across the map
     */
    generateBiomes(worldData) {
        const { width, height } = worldData.size;
        const tileSize = 64;

        // Create biome map using Voronoi-like regions
        const biomePoints = this.generateBiomeSeeds(width, height);

        for (let x = 0; x < width; x += tileSize) {
            for (let y = 0; y < height; y += tileSize) {
                const biome = this.getBiomeAtPosition(x, y, biomePoints, width, height);
                const key = `${x},${y}`;
                worldData.biomes.set(key, biome);
            }
        }
    }

    /**
     * Generate biome seed points for natural-looking regions
     */
    generateBiomeSeeds(width, height) {
        const biomeTypes = Object.keys(this.biomes);
        const numRegions = Math.max(6, Math.floor((width * height) / (512 * 512))); // Roughly 512x512 per region
        const points = [];

        for (let i = 0; i < numRegions; i++) {
            points.push({
                x: this.rng() * width,
                y: this.rng() * height,
                biome: biomeTypes[Math.floor(this.rng() * biomeTypes.length)]
            });
        }

        return points;
    }

    /**
     * Determine biome at specific position using closest biome point
     */
    getBiomeAtPosition(x, y, biomePoints, width, height) {
        let closestDistance = Infinity;
        let closestBiome = 'grassland';

        for (const point of biomePoints) {
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestBiome = point.biome;
            }
        }

        // Add some noise to create biome blending
        const noise = this.simpleNoise(x * this.biomeScale, y * this.biomeScale);
        if (noise > 0.3) {
            // Chance to blend with neighboring biomes
            const biomeTypes = Object.keys(this.biomes);
            if (this.rng() < 0.2) {
                closestBiome = biomeTypes[Math.floor(this.rng() * biomeTypes.length)];
            }
        }

        return closestBiome;
    }

    /**
     * Generate terrain tiles based on biome distribution
     */
    generateTerrain(worldData) {
        const { width, height } = worldData.size;
        const tileSize = 64;

        for (let x = 0; x < width; x += tileSize) {
            for (let y = 0; y < height; y += tileSize) {
                const key = `${x},${y}`;
                const biome = worldData.biomes.get(key) || 'grassland';
                const biomeData = this.biomes[biome];

                // Select terrain type based on biome weights
                const terrainType = this.selectWeightedTerrain(biomeData);
                
                // Add terrain variation with noise
                const noise = this.simpleNoise(x * this.noiseScale, y * this.noiseScale);
                let finalTerrain = terrainType;

                // Sometimes override with noise-based terrain
                if (noise > 0.6) {
                    finalTerrain = biomeData.terrainTypes[Math.floor(this.rng() * biomeData.terrainTypes.length)];
                }

                worldData.terrain.set(key, {
                    type: finalTerrain,
                    biome: biome,
                    rotation: this.rng() < 0.5 ? 0 : Math.PI / 2 // Random rotation for variety
                });
            }
        }
    }

    /**
     * Select terrain type based on biome weights
     */
    selectWeightedTerrain(biomeData) {
        const rand = this.rng();
        let cumulative = 0;

        for (let i = 0; i < biomeData.terrainTypes.length; i++) {
            cumulative += biomeData.weights[i];
            if (rand <= cumulative) {
                return biomeData.terrainTypes[i];
            }
        }

        return biomeData.terrainTypes[0]; // Fallback
    }

    /**
     * Place structures randomly across the map
     */
    placeStructures(worldData) {
        const { width, height } = worldData.size;
        const tileSize = 64;

        // Track placed structures to ensure minimum distances
        const placedStructures = [];

        // Iterate through potential placement positions
        for (let x = tileSize; x < width - tileSize; x += tileSize) {
            for (let y = tileSize; y < height - tileSize; y += tileSize) {
                const key = `${x},${y}`;
                const biome = worldData.biomes.get(key) || 'grassland';

                // Check each structure type for placement
                for (const [structureId, structureData] of Object.entries(this.structures)) {
                    // Check biome preference
                    const biomeMatch = structureData.biomePreference.includes(biome);
                    const rarityCheck = this.rng() < structureData.rarity;

                    if (biomeMatch && rarityCheck) {
                        // Check minimum distance from other structures of same type
                        const tooClose = placedStructures.some(placed => {
                            if (placed.structureId === structureId) {
                                const distance = Math.sqrt((x - placed.x) ** 2 + (y - placed.y) ** 2);
                                return distance < structureData.minDistance;
                            }
                            return false;
                        });

                        if (!tooClose) {
                            // Place the structure
                            const structure = {
                                x: x,
                                y: y,
                                structureId: structureId,
                                type: structureData.type,
                                textureKey: structureData.textureKey,
                                material: structureData.material,
                                health: structureData.health,
                                destructible: structureData.destructible,
                                size: structureData.size,
                                biome: biome
                            };

                            worldData.structures.push(structure);
                            placedStructures.push({ structureId, x, y });

                            console.log(`📦 Placed ${structureId} at (${x}, ${y}) in ${biome} biome`);
                        }
                    }
                }
            }
        }

        // Ensure at least one helicopter crash site exists (for gameplay)
        const helicopterCrashes = worldData.structures.filter(s => s.structureId === 'helicopter_crash');
        if (helicopterCrashes.length === 0) {
            this.forcePlaceHelicopterCrash(worldData);
        }
    }

    /**
     * Force place at least one helicopter crash site
     */
    forcePlaceHelicopterCrash(worldData) {
        const { width, height } = worldData.size;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Find a good location near center
        const attempts = 20;
        let placed = false;

        for (let i = 0; i < attempts && !placed; i++) {
            const x = centerX + (this.rng() - 0.5) * 400;
            const y = centerY + (this.rng() - 0.5) * 400;
            
            // Round to tile boundaries
            const tileX = Math.floor(x / 64) * 64;
            const tileY = Math.floor(y / 64) * 64;

            // Check if position is valid
            if (tileX > 64 && tileX < width - 64 && tileY > 64 && tileY < height - 64) {
                const structure = {
                    x: tileX,
                    y: tileY,
                    structureId: 'helicopter_crash',
                    type: 'crashed_helicopter',
                    textureKey: 'crashed_helicopter',
                    material: 'metal',
                    health: 1500,
                    destructible: false,
                    size: { width: 240, height: 160 },
                    biome: 'wasteland'
                };

                worldData.structures.push(structure);
                placed = true;
                
                console.log(`🚁 Force-placed helicopter crash at (${tileX}, ${tileY})`);
            }
        }
    }

    /**
     * Find a good starting position for the player
     */
    findPlayerStartPosition(worldData) {
        const { width, height } = worldData.size;
        
        // Try to start in grassland or forest biome, away from structures
        const preferredBiomes = ['grassland', 'forest'];
        const attempts = 50;

        for (let i = 0; i < attempts; i++) {
            const x = 100 + this.rng() * (width - 200);
            const y = 100 + this.rng() * (height - 200);
            
            const key = `${Math.floor(x / 64) * 64},${Math.floor(y / 64) * 64}`;
            const biome = worldData.biomes.get(key) || 'grassland';

            // Check if away from structures
            const tooCloseToStructure = worldData.structures.some(structure => {
                const distance = Math.sqrt((x - structure.x) ** 2 + (y - structure.y) ** 2);
                return distance < 200;
            });

            if (preferredBiomes.includes(biome) && !tooCloseToStructure) {
                worldData.playerStartPosition = { x: Math.floor(x), y: Math.floor(y) };
                console.log(`👤 Player start position: (${worldData.playerStartPosition.x}, ${worldData.playerStartPosition.y}) in ${biome}`);
                return;
            }
        }

        // Fallback to center if no good position found
        worldData.playerStartPosition = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
        console.log(`👤 Player start position (fallback): center of map`);
    }

    /**
     * Generate zombie spawn areas away from player start
     */
    generateZombieSpawnAreas(worldData) {
        const { width, height } = worldData.size;
        const playerPos = worldData.playerStartPosition;
        const minDistanceFromPlayer = 300;

        // Create spawn zones in different biomes
        const spawnZones = 8;
        
        for (let i = 0; i < spawnZones; i++) {
            let attempts = 20;
            let placed = false;

            while (attempts > 0 && !placed) {
                const x = 100 + this.rng() * (width - 200);
                const y = 100 + this.rng() * (height - 200);

                const distanceFromPlayer = Math.sqrt(
                    (x - playerPos.x) ** 2 + (y - playerPos.y) ** 2
                );

                if (distanceFromPlayer >= minDistanceFromPlayer) {
                    worldData.zombieSpawnAreas.push({
                        x: Math.floor(x),
                        y: Math.floor(y),
                        radius: 100 + this.rng() * 100
                    });
                    placed = true;
                }
                attempts--;
            }
        }

        console.log(`🧟 Generated ${worldData.zombieSpawnAreas.length} zombie spawn areas`);
    }

    /**
     * Generate connecting paths between key locations
     */
    generatePaths(worldData) {
        // Create main roads connecting helicopter crashes and spawn areas
        const helicopterCrashes = worldData.structures.filter(s => s.structureId === 'helicopter_crash');
        const playerStart = worldData.playerStartPosition;

        // Create a main road from player start to first helicopter crash
        if (helicopterCrashes.length > 0) {
            this.createRoadBetween(worldData, playerStart, helicopterCrashes[0]);
        }

        // Connect helicopter crashes to each other
        for (let i = 0; i < helicopterCrashes.length - 1; i++) {
            this.createRoadBetween(worldData, helicopterCrashes[i], helicopterCrashes[i + 1]);
        }
    }

    /**
     * Create a road between two points
     */
    createRoadBetween(worldData, point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 64);

        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const x = Math.floor((point1.x + dx * progress) / 64) * 64;
            const y = Math.floor((point1.y + dy * progress) / 64) * 64;
            const key = `${x},${y}`;

            // Set terrain to road
            worldData.terrain.set(key, {
                type: 'dirt_road',
                biome: worldData.biomes.get(key) || 'grassland',
                rotation: Math.abs(dx) > Math.abs(dy) ? Math.PI / 2 : 0
            });
        }
    }

    /**
     * Create seeded random number generator
     */
    createSeededRNG(seed) {
        let currentSeed = seed;
        return function() {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
    }

    /**
     * Simple noise function for terrain variation
     */
    simpleNoise(x, y) {
        return Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1;
    }

    /**
     * Get available map sizes
     */
    getMapSizes() {
        return this.mapSizes;
    }

    /**
     * Get biome information
     */
    getBiomes() {
        return this.biomes;
    }
} 