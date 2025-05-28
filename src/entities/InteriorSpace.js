export class InteriorSpace extends Phaser.GameObjects.Zone {
    constructor(scene, x, y, width, height, config = {}) {
        super(scene, x, y, width, height);
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
        
        this.scene = scene;
        this.spaceType = config.type || 'generic';
        this.isInside = false;
        this.entrances = config.entrances || [];
        this.furniture = [];
        this.walls = [];
        
        // Interior properties
        this.lightLevel = config.lightLevel || 0.8; // Slightly darker inside
        this.safeZone = config.safeZone || false; // Whether zombies can enter
        
        console.log(`Created interior space: ${this.spaceType} at ${x}, ${y}`);
    }
    
    createInterior() {
        // Override in subclasses
    }
    
    enterSpace(player) {
        if (this.isInside) return;
        
        this.isInside = true;
        console.log(`Player entered ${this.spaceType}`);
        
        // Darken the area slightly
        if (this.scene.cameras.main.postFX) {
            this.scene.cameras.main.postFX.addColorMatrix().brightness(this.lightLevel);
        }
        
        // Show interior elements
        this.showInterior();
        
        // Hide exterior elements temporarily
        this.hideExterior();
    }
    
    exitSpace(player) {
        if (!this.isInside) return;
        
        this.isInside = false;
        console.log(`Player exited ${this.spaceType}`);
        
        // Restore normal lighting
        if (this.scene.cameras.main.postFX) {
            this.scene.cameras.main.postFX.clear();
        }
        
        // Hide interior elements
        this.hideInterior();
        
        // Show exterior elements
        this.showExterior();
    }
    
    showInterior() {
        // Show furniture and interior walls
        this.furniture.forEach(item => {
            if (item.setVisible) item.setVisible(true);
        });
        
        this.walls.forEach(wall => {
            if (wall.setVisible) wall.setVisible(true);
        });
    }
    
    hideInterior() {
        // Hide furniture and interior walls
        this.furniture.forEach(item => {
            if (item.setVisible) item.setVisible(false);
        });
        
        this.walls.forEach(wall => {
            if (wall.setVisible) wall.setVisible(false);
        });
    }
    
    showExterior() {
        // Show exterior structures (implemented by subclasses)
    }
    
    hideExterior() {
        // Hide exterior structures (implemented by subclasses)
    }
    
    addFurniture(x, y, width, height, color, config = {}) {
        const furniture = this.scene.add.rectangle(x, y, width, height, color);
        furniture.setDepth(y + height);
        furniture.setVisible(this.isInside);
        
        // Add physics if needed
        if (config.collision) {
            this.scene.physics.add.existing(furniture, true);
            furniture.body.setImmovable(true);
            
            // Add collision with player
            if (this.scene.player && this.scene.player.body) {
                this.scene.physics.add.collider(this.scene.player, furniture);
            }
        }
        
        this.furniture.push(furniture);
        return furniture;
    }
    
    addWall(x, y, width, height, color = 0x8B4513) {
        const wall = this.scene.add.rectangle(x, y, width, height, color);
        wall.setDepth(y + height);
        wall.setVisible(this.isInside);
        
        // Add physics
        this.scene.physics.add.existing(wall, true);
        wall.body.setImmovable(true);
        
        // Add collision with player
        if (this.scene.player && this.scene.player.body) {
            this.scene.physics.add.collider(this.scene.player, wall);
        }
        
        this.walls.push(wall);
        return wall;
    }
    
    checkPlayerProximity(player) {
        const distance = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
        return distance < 100; // Within 100 pixels
    }
    
    destroy() {
        // Clean up furniture and walls
        this.furniture.forEach(item => {
            if (item.destroy) item.destroy();
        });
        
        this.walls.forEach(wall => {
            if (wall.destroy) wall.destroy();
        });
        
        super.destroy();
    }
} 