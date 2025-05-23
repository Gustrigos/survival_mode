import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class SpriteManager {
  constructor() {
    this.textures = new Map();
    this.loader = new THREE.TextureLoader();
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  // Create detailed Boxhead-style player sprite
  createPlayerTexture() {
    this.canvas.width = 64;
    this.canvas.height = 64;
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, 64, 64);
    
    // Draw detailed player sprite (Boxhead style)
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(18, 58, 28, 4);
    
    // Boots
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(20, 54, 8, 8);
    ctx.fillRect(36, 54, 8, 8);
    
    // Boot highlights
    ctx.fillStyle = '#333';
    ctx.fillRect(21, 55, 2, 6);
    ctx.fillRect(37, 55, 2, 6);
    
    // Legs (dark green pants)
    ctx.fillStyle = '#2c4016';
    ctx.fillRect(22, 38, 6, 18);
    ctx.fillRect(36, 38, 6, 18);
    
    // Leg highlights
    ctx.fillStyle = '#3d5520';
    ctx.fillRect(22, 38, 2, 16);
    ctx.fillRect(36, 38, 2, 16);
    
    // Belt
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(20, 36, 24, 4);
    ctx.fillStyle = '#daa520';
    ctx.fillRect(30, 37, 4, 2);
    
    // Torso (military vest)
    ctx.fillStyle = '#4a5d23';
    ctx.fillRect(20, 20, 24, 18);
    
    // Vest details
    ctx.fillStyle = '#5c7029';
    ctx.fillRect(21, 21, 22, 2);
    ctx.fillRect(21, 25, 22, 2);
    ctx.fillRect(21, 29, 22, 2);
    
    // Vest pockets
    ctx.fillStyle = '#3d4f1c';
    ctx.fillRect(22, 30, 6, 6);
    ctx.fillRect(36, 30, 6, 6);
    
    // Arms
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(12, 22, 8, 14);
    ctx.fillRect(44, 22, 8, 14);
    
    // Arm shadows
    ctx.fillStyle = '#e6c499';
    ctx.fillRect(12, 22, 2, 14);
    ctx.fillRect(50, 22, 2, 14);
    
    // Sleeves
    ctx.fillStyle = '#4a5d23';
    ctx.fillRect(12, 22, 8, 6);
    ctx.fillRect(44, 22, 8, 6);
    
    // Hands
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(14, 36, 4, 6);
    ctx.fillRect(46, 36, 4, 6);
    
    // Weapon (assault rifle)
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(52, 28, 10, 4);
    ctx.fillRect(58, 26, 4, 2);
    ctx.fillRect(54, 30, 2, 8);
    
    // Weapon highlights
    ctx.fillStyle = '#444';
    ctx.fillRect(52, 28, 10, 1);
    ctx.fillRect(58, 26, 4, 1);
    
    // Neck
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(28, 16, 8, 6);
    
    // Head
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(24, 6, 16, 16);
    
    // Head shadow
    ctx.fillStyle = '#e6c499';
    ctx.fillRect(24, 6, 2, 16);
    ctx.fillRect(24, 20, 16, 2);
    
    // Hair
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(24, 6, 16, 8);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(25, 7, 14, 6);
    
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(27, 12, 3, 2);
    ctx.fillRect(34, 12, 3, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(28, 12, 1, 2);
    ctx.fillRect(35, 12, 1, 2);
    
    // Nose
    ctx.fillStyle = '#e6c499';
    ctx.fillRect(31, 15, 2, 1);
    
    // Mouth
    ctx.fillStyle = '#000';
    ctx.fillRect(30, 17, 4, 1);
    
    // Create a new canvas for each texture to avoid conflicts
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 64;
    textureCanvas.height = 64;
    const textureCtx = textureCanvas.getContext('2d');
    textureCtx.drawImage(this.canvas, 0, 0);
    
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    
    console.log('Player texture created:', texture);
    this.textures.set('player', texture);
    return texture;
  }

  createZombieTexture(frame = 0) {
    this.canvas.width = 64;
    this.canvas.height = 64;
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, 64, 64);
    
    // Draw detailed zombie sprite with walking animation
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(18, 58, 28, 4);
    
    // Feet positioning based on frame
    if (frame === 0) {
      // Standing/neutral position
      // Bare feet (pale/rotting)
      ctx.fillStyle = '#7a8a70';
      ctx.fillRect(20, 54, 8, 8);
      ctx.fillRect(36, 54, 8, 8);
      
      // Foot decay
      ctx.fillStyle = '#5a6a50';
      ctx.fillRect(22, 56, 2, 4);
      ctx.fillRect(38, 58, 2, 2);
      
      // Legs (torn pants)
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(22, 38, 6, 18);
      ctx.fillRect(36, 38, 6, 18);
    } else if (frame === 1) {
      // Walking frame 1 - shambling left foot forward
      // Left foot (forward, dragging)
      ctx.fillStyle = '#7a8a70';
      ctx.fillRect(18, 56, 10, 6);
      ctx.fillStyle = '#5a6a50';
      ctx.fillRect(20, 57, 2, 3);
      
      // Right foot (back)
      ctx.fillStyle = '#7a8a70';
      ctx.fillRect(36, 54, 8, 8);
      ctx.fillStyle = '#5a6a50';
      ctx.fillRect(38, 58, 2, 2);
      
      // Left leg (forward, slightly bent)
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(20, 40, 6, 18);
      
      // Right leg (back)
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(36, 38, 6, 18);
    } else {
      // Walking frame 2 - shambling right foot forward
      // Left foot (back)
      ctx.fillStyle = '#7a8a70';
      ctx.fillRect(20, 54, 8, 8);
      ctx.fillStyle = '#5a6a50';
      ctx.fillRect(22, 56, 2, 4);
      
      // Right foot (forward, dragging)
      ctx.fillStyle = '#7a8a70';
      ctx.fillRect(36, 56, 10, 6);
      ctx.fillStyle = '#5a6a50';
      ctx.fillRect(42, 57, 2, 3);
      
      // Left leg (back)
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(22, 38, 6, 18);
      
      // Right leg (forward, slightly bent)
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(38, 40, 6, 18);
    }
    
    // Torn fabric (same for all frames)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(22, 42, 2, 4);
    ctx.fillRect(24, 48, 2, 2);
    ctx.fillRect(38, 44, 2, 6);
    
    // Exposed skin on legs
    ctx.fillStyle = '#7a8a70';
    ctx.fillRect(24, 42, 2, 4);
    ctx.fillRect(38, 44, 2, 6);
    
    // Torso (torn shirt)
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(20, 20, 24, 18);
    
    // Shirt tears and stains
    ctx.fillStyle = '#4a2f15';
    ctx.fillRect(22, 22, 4, 6);
    ctx.fillRect(38, 24, 3, 8);
    ctx.fillRect(26, 30, 6, 4);
    
    // Exposed ribs/chest
    ctx.fillStyle = '#7a8a70';
    ctx.fillRect(22, 22, 4, 6);
    ctx.fillRect(38, 24, 3, 8);
    
    // Rib details
    ctx.fillStyle = '#5a6a50';
    ctx.fillRect(23, 23, 2, 1);
    ctx.fillRect(23, 25, 2, 1);
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(39, 26, 1, 4);
    
    // Arms (pale/rotting) - slight movement based on frame
    if (frame === 1) {
      // Left arm slightly forward
      ctx.fillStyle = '#7a8a70';
      ctx.fillRect(10, 24, 8, 14);
      ctx.fillRect(44, 22, 8, 14);
    } else if (frame === 2) {
      // Right arm slightly forward
      ctx.fillStyle = '#7a8a70';
      ctx.fillRect(12, 22, 8, 14);
      ctx.fillRect(46, 24, 8, 14);
    } else {
      // Neutral position
      ctx.fillStyle = '#7a8a70';
      ctx.fillRect(12, 22, 8, 14);
      ctx.fillRect(44, 22, 8, 14);
    }
    
    // Arm decay and wounds
    ctx.fillStyle = '#5a6a50';
    ctx.fillRect(12, 24, 2, 8);
    ctx.fillRect(48, 26, 2, 6);
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(14, 28, 2, 2);
    ctx.fillRect(46, 30, 2, 2);
    
    // Hands (clawed)
    ctx.fillStyle = '#7a8a70';
    ctx.fillRect(14, 36, 4, 6);
    ctx.fillRect(46, 36, 4, 6);
    
    // Claws
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(13, 40, 1, 3);
    ctx.fillRect(15, 41, 1, 2);
    ctx.fillRect(17, 40, 1, 3);
    ctx.fillRect(45, 40, 1, 3);
    ctx.fillRect(47, 41, 1, 2);
    ctx.fillRect(49, 40, 1, 3);
    
    // Neck (pale)
    ctx.fillStyle = '#7a8a70';
    ctx.fillRect(28, 16, 8, 6);
    
    // Head
    ctx.fillStyle = '#7a8a70';
    ctx.fillRect(24, 6, 16, 16);
    
    // Head decay
    ctx.fillStyle = '#5a6a50';
    ctx.fillRect(24, 6, 2, 8);
    ctx.fillRect(38, 8, 2, 6);
    
    // Hair (patchy/falling out)
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(26, 6, 4, 4);
    ctx.fillRect(32, 7, 3, 3);
    ctx.fillRect(36, 6, 3, 4);
    
    // Eyes (glowing red)
    ctx.fillStyle = '#000';
    ctx.fillRect(26, 12, 4, 3);
    ctx.fillRect(34, 12, 4, 3);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(27, 13, 2, 1);
    ctx.fillRect(35, 13, 2, 1);
    
    // Dark eye sockets
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(26, 11, 4, 1);
    ctx.fillRect(34, 11, 4, 1);
    
    // Nose (partially missing)
    ctx.fillStyle = '#5a6a50';
    ctx.fillRect(31, 15, 1, 2);
    
    // Mouth (open/snarling)
    ctx.fillStyle = '#000';
    ctx.fillRect(29, 17, 6, 3);
    
    // Teeth
    ctx.fillStyle = '#fff';
    ctx.fillRect(30, 18, 1, 1);
    ctx.fillRect(32, 18, 1, 1);
    ctx.fillRect(34, 18, 1, 1);
    
    // Blood around mouth
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(28, 19, 2, 1);
    ctx.fillRect(34, 19, 2, 1);
    
    // Create a new canvas for each texture to avoid conflicts
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 64;
    textureCanvas.height = 64;
    const textureCtx = textureCanvas.getContext('2d');
    textureCtx.drawImage(this.canvas, 0, 0);
    
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    
    console.log(`Zombie texture frame ${frame} created:`, texture);
    this.textures.set(`zombie${frame}`, texture);
    return texture;
  }

  createMuzzleFlashTexture() {
    this.canvas.width = 32;
    this.canvas.height = 32;
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, 32, 32);
    
    // Create more detailed muzzle flash
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, '#ffff88');
    gradient.addColorStop(0.4, '#ff8844');
    gradient.addColorStop(0.7, '#ff4422');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    // Add some spark effects
    ctx.fillStyle = '#ffff88';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = 16 + Math.cos(angle) * 12;
      const y = 16 + Math.sin(angle) * 12;
      ctx.fillRect(x, y, 2, 2);
    }
    
    // Create a new canvas for each texture to avoid conflicts
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 32;
    textureCanvas.height = 32;
    const textureCtx = textureCanvas.getContext('2d');
    textureCtx.drawImage(this.canvas, 0, 0);
    
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    
    this.textures.set('muzzleFlash', texture);
    return texture;
  }

  createBloodSplatTexture() {
    this.canvas.width = 32;
    this.canvas.height = 32;
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, 32, 32);
    
    // Create more realistic blood splat
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(16, 16, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Add irregular splatter
    ctx.fillStyle = '#a00000';
    ctx.beginPath();
    ctx.arc(16, 16, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Add smaller drops around main splat
    ctx.fillStyle = '#8b0000';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const distance = 10 + Math.random() * 6;
      const x = 16 + Math.cos(angle) * distance;
      const y = 16 + Math.sin(angle) * distance;
      const size = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add darker center
    ctx.fillStyle = '#660000';
    ctx.beginPath();
    ctx.arc(16, 16, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Create a new canvas for each texture to avoid conflicts
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 32;
    textureCanvas.height = 32;
    const textureCtx = textureCanvas.getContext('2d');
    textureCtx.drawImage(this.canvas, 0, 0);
    
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    
    this.textures.set('bloodSplat', texture);
    return texture;
  }

  // Create bullet shell casing texture
  createShellCasingTexture() {
    this.canvas.width = 16;
    this.canvas.height = 16;
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, 16, 16);
    
    // Brass casing
    ctx.fillStyle = '#daa520';
    ctx.fillRect(6, 4, 4, 8);
    
    // Casing highlight
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(6, 4, 1, 8);
    
    // Casing shadow
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(9, 4, 1, 8);
    
    // Create a new canvas for each texture to avoid conflicts
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 16;
    textureCanvas.height = 16;
    const textureCtx = textureCanvas.getContext('2d');
    textureCtx.drawImage(this.canvas, 0, 0);
    
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    
    this.textures.set('shellCasing', texture);
    return texture;
  }

  // Create player body texture (torso and head)
  createPlayerBodyTexture() {
    this.canvas.width = 64;
    this.canvas.height = 64;
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, 64, 64);
    
    // Belt
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(20, 36, 24, 4);
    ctx.fillStyle = '#daa520';
    ctx.fillRect(30, 37, 4, 2);
    
    // Torso (military vest)
    ctx.fillStyle = '#4a5d23';
    ctx.fillRect(20, 20, 24, 18);
    
    // Vest details
    ctx.fillStyle = '#5c7029';
    ctx.fillRect(21, 21, 22, 2);
    ctx.fillRect(21, 25, 22, 2);
    ctx.fillRect(21, 29, 22, 2);
    
    // Vest pockets
    ctx.fillStyle = '#3d4f1c';
    ctx.fillRect(22, 30, 6, 6);
    ctx.fillRect(36, 30, 6, 6);
    
    // Neck
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(28, 16, 8, 6);
    
    // Head
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(24, 6, 16, 16);
    
    // Head shadow
    ctx.fillStyle = '#e6c499';
    ctx.fillRect(24, 6, 2, 16);
    ctx.fillRect(24, 20, 16, 2);
    
    // Hair
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(24, 6, 16, 8);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(25, 7, 14, 6);
    
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(27, 12, 3, 2);
    ctx.fillRect(34, 12, 3, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(28, 12, 1, 2);
    ctx.fillRect(35, 12, 1, 2);
    
    // Nose
    ctx.fillStyle = '#e6c499';
    ctx.fillRect(31, 15, 2, 1);
    
    // Mouth
    ctx.fillStyle = '#000';
    ctx.fillRect(30, 17, 4, 1);
    
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 64;
    textureCanvas.height = 64;
    const textureCtx = textureCanvas.getContext('2d');
    textureCtx.drawImage(this.canvas, 0, 0);
    
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    
    this.textures.set('playerBody', texture);
    return texture;
  }

  // Create player legs texture (frame 1 - standing)
  createPlayerLegsTexture(frame = 0) {
    this.canvas.width = 64;
    this.canvas.height = 64;
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, 64, 64);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(18, 58, 28, 4);
    
    if (frame === 0) {
      // Standing position
      // Boots
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(20, 54, 8, 8);
      ctx.fillRect(36, 54, 8, 8);
      
      // Boot highlights
      ctx.fillStyle = '#333';
      ctx.fillRect(21, 55, 2, 6);
      ctx.fillRect(37, 55, 2, 6);
      
      // Legs (dark green pants)
      ctx.fillStyle = '#2c4016';
      ctx.fillRect(22, 38, 6, 18);
      ctx.fillRect(36, 38, 6, 18);
      
      // Leg highlights
      ctx.fillStyle = '#3d5520';
      ctx.fillRect(22, 38, 2, 16);
      ctx.fillRect(36, 38, 2, 16);
    } else if (frame === 1) {
      // Walking frame 1 - left leg forward
      // Left boot (forward)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(20, 56, 8, 6);
      ctx.fillStyle = '#333';
      ctx.fillRect(21, 57, 2, 4);
      
      // Right boot (back)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(36, 54, 8, 8);
      ctx.fillStyle = '#333';
      ctx.fillRect(37, 55, 2, 6);
      
      // Left leg (forward)
      ctx.fillStyle = '#2c4016';
      ctx.fillRect(22, 40, 6, 18);
      ctx.fillStyle = '#3d5520';
      ctx.fillRect(22, 40, 2, 16);
      
      // Right leg (back)
      ctx.fillStyle = '#2c4016';
      ctx.fillRect(36, 38, 6, 18);
      ctx.fillStyle = '#3d5520';
      ctx.fillRect(36, 38, 2, 16);
    } else {
      // Walking frame 2 - right leg forward
      // Left boot (back)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(20, 54, 8, 8);
      ctx.fillStyle = '#333';
      ctx.fillRect(21, 55, 2, 6);
      
      // Right boot (forward)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(36, 56, 8, 6);
      ctx.fillStyle = '#333';
      ctx.fillRect(37, 57, 2, 4);
      
      // Left leg (back)
      ctx.fillStyle = '#2c4016';
      ctx.fillRect(22, 38, 6, 18);
      ctx.fillStyle = '#3d5520';
      ctx.fillRect(22, 38, 2, 16);
      
      // Right leg (forward)
      ctx.fillStyle = '#2c4016';
      ctx.fillRect(36, 40, 6, 18);
      ctx.fillStyle = '#3d5520';
      ctx.fillRect(36, 40, 2, 16);
    }
    
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 64;
    textureCanvas.height = 64;
    const textureCtx = textureCanvas.getContext('2d');
    textureCtx.drawImage(this.canvas, 0, 0);
    
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    
    this.textures.set(`playerLegs${frame}`, texture);
    return texture;
  }

  // Create player weapon/arms texture
  createPlayerWeaponTexture() {
    this.canvas.width = 64;
    this.canvas.height = 64;
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, 64, 64);
    
    // Arms
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(12, 22, 8, 14);
    ctx.fillRect(44, 22, 8, 14);
    
    // Arm shadows
    ctx.fillStyle = '#e6c499';
    ctx.fillRect(12, 22, 2, 14);
    ctx.fillRect(50, 22, 2, 14);
    
    // Sleeves
    ctx.fillStyle = '#4a5d23';
    ctx.fillRect(12, 22, 8, 6);
    ctx.fillRect(44, 22, 8, 6);
    
    // Hands
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(14, 36, 4, 6);
    ctx.fillRect(46, 36, 4, 6);
    
    // Weapon (assault rifle)
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(52, 28, 10, 4);
    ctx.fillRect(58, 26, 4, 2);
    ctx.fillRect(54, 30, 2, 8);
    
    // Weapon highlights
    ctx.fillStyle = '#444';
    ctx.fillRect(52, 28, 10, 1);
    ctx.fillRect(58, 26, 4, 1);
    
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 64;
    textureCanvas.height = 64;
    const textureCtx = textureCanvas.getContext('2d');
    textureCtx.drawImage(this.canvas, 0, 0);
    
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    
    this.textures.set('playerWeapon', texture);
    return texture;
  }

  getTexture(name) {
    return this.textures.get(name);
  }

  initializeTextures() {
    this.createPlayerTexture();
    this.createZombieTexture(0);
    this.createZombieTexture(1);
    this.createZombieTexture(2);
    this.createMuzzleFlashTexture();
    this.createBloodSplatTexture();
    this.createShellCasingTexture();
    this.createPlayerBodyTexture();
    this.createPlayerLegsTexture(0);
    this.createPlayerLegsTexture(1);
    this.createPlayerLegsTexture(2);
    this.createPlayerWeaponTexture();
  }
} 