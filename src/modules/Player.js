import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class Player {
  constructor(game) {
    this.game = game;
    this.speed = 0.3; // pixels per ms
    this.radius = 32;
    
    // Player stats
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.maxAmmo = 30;
    this.ammo = this.maxAmmo;
    this.reloadTime = 2000; // ms
    this.isReloading = false;
    this.lastReload = 0;

    // Create main player sprite
    const playerTexture = this.game.spriteManager.getTexture('player');
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: playerTexture,
      transparent: true
    });
    
    this.sprite = new THREE.Sprite(spriteMaterial);
    this.sprite.scale.set(64, 64, 1);
    this.sprite.position.set(0, 0, 0);
    this.game.scene.add(this.sprite);

    // Muzzle flash effect
    const muzzleTexture = this.game.spriteManager.getTexture('muzzleFlash');
    const muzzleMaterial = new THREE.SpriteMaterial({ 
      map: muzzleTexture,
      transparent: true,
      opacity: 0
    });
    
    this.muzzleFlash = new THREE.Sprite(muzzleMaterial);
    this.muzzleFlash.scale.set(32, 32, 1);
    this.game.scene.add(this.muzzleFlash);

    // Fire control
    this.fireCooldown = 120; // ms
    this.lastShot = 0;
    this.muzzleFlashDuration = 100; // ms
    this.muzzleFlashStart = 0;

    // Animation properties
    this.walkAnimation = 0;
    this.isMoving = false;
    this.walkSpeed = 0.008; // How fast the walking animation plays
    
    // Shell casings
    this.shellCasings = [];
    
    // Movement and aiming directions
    this.moveDirection = new THREE.Vector2(0, 1); // Body faces this direction
    this.aimDirection = new THREE.Vector2(0, 1);  // Weapon aims this direction
    
    // Animation offsets for natural movement
    this.legOffset = 0;
    this.armOffset = 0;
    this.bodyBob = 0;
  }

  update(delta) {
    const input = this.game.input;
    const moveDir = new THREE.Vector2();
    
    // Movement input (WASD) - Fixed Y-axis inversion
    if (input.isKeyDown('KeyW')) moveDir.y += 1; // Changed back to += (up should be positive Y)
    if (input.isKeyDown('KeyS')) moveDir.y -= 1; // Changed back to -= (down should be negative Y)
    if (input.isKeyDown('KeyA')) moveDir.x -= 1;
    if (input.isKeyDown('KeyD')) moveDir.x += 1;

    // Update movement direction and apply movement
    this.isMoving = moveDir.lengthSq() > 0;
    if (this.isMoving) {
      this.moveDirection = moveDir.clone().normalize();
      
      // Apply movement
      this.sprite.position.x += this.moveDirection.x * this.speed * delta;
      this.sprite.position.y += this.moveDirection.y * this.speed * delta;
      
      // Walking animation - subtle leg and body movement
      this.walkAnimation += delta * this.walkSpeed;
      
      // Leg animation (subtle side-to-side sway)
      this.legOffset = Math.sin(this.walkAnimation * 2) * 1.5;
      
      // Arm animation (opposite to legs for natural walking)
      this.armOffset = Math.sin(this.walkAnimation * 2 + Math.PI) * 1;
      
      // Body bobbing (up and down movement)
      this.bodyBob = Math.abs(Math.sin(this.walkAnimation)) * 2;
      
      // Apply the walking effects
      this.sprite.position.z = this.bodyBob;
      
      // Subtle scale variation for walking rhythm
      const scaleVariation = 1 + Math.sin(this.walkAnimation * 2) * 0.02;
      this.sprite.scale.set(64 * scaleVariation, 64, 1);
      
      // Update aim direction to match movement direction
      this.aimDirection = this.moveDirection.clone();
      
    } else {
      // Standing still - gradually return to neutral position
      this.legOffset *= 0.9;
      this.armOffset *= 0.9;
      this.bodyBob *= 0.9;
      this.sprite.position.z = this.bodyBob;
      this.sprite.scale.set(64, 64, 1);
    }

    // Keep player sprite upright - NO rotation
    // this.sprite.material.rotation = 0; // Player always faces the same direction

    // Handle reloading
    if (input.isKeyDown('KeyR') && !this.isReloading && this.ammo < this.maxAmmo) {
      this.startReload();
    }

    if (this.isReloading) {
      if (performance.now() - this.lastReload >= this.reloadTime) {
        this.ammo = this.maxAmmo;
        this.isReloading = false;
        this.game.ui.updateAmmo(this.ammo, this.maxAmmo);
      }
    }

    // Shooting (Spacebar) - shoots in the movement direction
    if (input.isKeyDown('Space') && !this.isReloading && this.ammo > 0 && 
        performance.now() - this.lastShot >= this.fireCooldown) {
      this.shoot(this.aimDirection.clone());
      this.lastShot = performance.now();
      this.ammo--;
      this.game.ui.updateAmmo(this.ammo, this.maxAmmo);
      
      // Auto-reload when empty
      if (this.ammo === 0) {
        this.startReload();
      }
    }

    // Update muzzle flash
    this.updateMuzzleFlash();

    // Update shell casings
    this.updateShellCasings(delta);

    // Update UI
    this.game.ui.updateHealth(this.health, this.maxHealth);
  }

  startReload() {
    this.isReloading = true;
    this.lastReload = performance.now();
  }

  updateMuzzleFlash() {
    if (this.muzzleFlashStart > 0) {
      const elapsed = performance.now() - this.muzzleFlashStart;
      if (elapsed < this.muzzleFlashDuration) {
        // Position muzzle flash at weapon tip using aim direction
        this.muzzleFlash.position.set(
          this.sprite.position.x + this.aimDirection.x * 40,
          this.sprite.position.y + this.aimDirection.y * 40,
          1
        );
        
        // Fade out effect
        const opacity = 1 - (elapsed / this.muzzleFlashDuration);
        this.muzzleFlash.material.opacity = opacity;
      } else {
        this.muzzleFlash.material.opacity = 0;
        this.muzzleFlashStart = 0;
      }
    }
  }

  createShellCasing() {
    const shellTexture = this.game.spriteManager.getTexture('shellCasing');
    const shellMaterial = new THREE.SpriteMaterial({ 
      map: shellTexture,
      transparent: true
    });
    
    const shell = new THREE.Sprite(shellMaterial);
    shell.scale.set(16, 16, 1);
    
    // Position shell at weapon ejection port using aim direction
    // Perpendicular to weapon direction for ejection
    const ejectDir = new THREE.Vector2(-this.aimDirection.y, this.aimDirection.x);
    
    shell.position.set(
      this.sprite.position.x + ejectDir.x * 20,
      this.sprite.position.y + ejectDir.y * 20,
      0
    );
    
    this.game.scene.add(shell);
    
    // Store shell with physics data
    this.shellCasings.push({
      sprite: shell,
      velocity: new THREE.Vector2(
        ejectDir.x * 0.1 + (Math.random() - 0.5) * 0.05,
        ejectDir.y * 0.1 + (Math.random() - 0.5) * 0.05
      ),
      rotation: Math.random() * 0.02,
      life: 5000, // 5 seconds
      created: performance.now()
    });
  }

  updateShellCasings(delta) {
    for (let i = this.shellCasings.length - 1; i >= 0; i--) {
      const shell = this.shellCasings[i];
      const elapsed = performance.now() - shell.created;
      
      if (elapsed > shell.life) {
        this.game.scene.remove(shell.sprite);
        shell.sprite.material.dispose();
        this.shellCasings.splice(i, 1);
      } else {
        // Apply physics
        shell.sprite.position.x += shell.velocity.x * delta;
        shell.sprite.position.y += shell.velocity.y * delta;
        shell.sprite.material.rotation += shell.rotation * delta;
        
        // Slow down over time
        shell.velocity.multiplyScalar(0.995);
        
        // Fade out over time
        const opacity = 1 - (elapsed / shell.life);
        shell.sprite.material.opacity = opacity;
      }
    }
  }

  shoot(direction) {
    const bulletPos = new THREE.Vector2(this.sprite.position.x, this.sprite.position.y);
    this.game.addBullet(bulletPos, direction);
    
    // Trigger muzzle flash
    this.muzzleFlashStart = performance.now();
    this.muzzleFlash.material.opacity = 1;
    
    // Create shell casing
    this.createShellCasing();
    
    // Screen shake effect
    const shakeAmount = 2;
    this.game.camera.position.x += (Math.random() - 0.5) * shakeAmount;
    this.game.camera.position.y += (Math.random() - 0.5) * shakeAmount;
    
    // Reset camera position after shake
    setTimeout(() => {
      this.game.camera.position.x = 0;
      this.game.camera.position.y = 0;
    }, 50);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    
    // Enhanced screen flash effect for damage
    this.game.renderer.domElement.style.filter = 'brightness(1.5) saturate(0) hue-rotate(0deg) contrast(1.5)';
    this.game.renderer.domElement.style.borderColor = '#ff0000';
    this.game.renderer.domElement.style.borderWidth = '3px';
    this.game.renderer.domElement.style.borderStyle = 'solid';
    
    setTimeout(() => {
      this.game.renderer.domElement.style.filter = 'none';
      this.game.renderer.domElement.style.border = 'none';
    }, 150);
    
    if (this.health <= 0) {
      this.game.gameOver();
    }
  }

  dispose() {
    this.game.scene.remove(this.sprite);
    this.game.scene.remove(this.muzzleFlash);
    this.sprite.material.dispose();
    this.muzzleFlash.material.dispose();
    
    // Clean up shell casings
    for (const shell of this.shellCasings) {
      this.game.scene.remove(shell.sprite);
      shell.sprite.material.dispose();
    }
    this.shellCasings = [];
  }
} 