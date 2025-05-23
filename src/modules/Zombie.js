import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class Zombie {
  constructor(game, position) {
    this.game = game;
    this.speed = 0.06; // pixels per ms
    this.radius = 32;
    this.health = 100;
    this.maxHealth = 100;
    this.damage = 20;
    this.attackCooldown = 1000; // ms
    this.lastAttack = 0;

    // Create sprite-based zombie
    const zombieTexture = this.game.spriteManager.getTexture('zombie0');
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: zombieTexture,
      transparent: true
    });
    
    this.sprite = new THREE.Sprite(spriteMaterial);
    this.sprite.scale.set(64, 64, 1);
    this.sprite.position.set(position.x, position.y, 0);
    
    // Add some visual variety
    this.zombieVariant = Math.floor(Math.random() * 3);
    this.addVariety();
    
    this.game.scene.add(this.sprite);

    // Animation properties
    this.walkAnimation = Math.random() * Math.PI * 2; // Random start phase
    this.originalScale = 64;
    this.speedVariation = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x speed
    this.speed *= this.speedVariation;
    this.walkSpeed = 0.003 + Math.random() * 0.002; // Slower, more shambling
    
    // Blood effect when hit
    this.bloodEffects = [];
    
    // Groaning sound timer (visual representation)
    this.groanTimer = Math.random() * 3000;
    
    // Animation offsets for shambling movement
    this.shambleOffset = 0;
    this.bodyBob = 0;
    this.limbSway = 0;
  }

  addVariety() {
    // Add some visual variety to zombies
    switch(this.zombieVariant) {
      case 0: // Normal zombie
        break;
      case 1: // Slightly larger zombie
        this.sprite.scale.set(70, 70, 1);
        this.originalScale = 70;
        this.health = 120;
        this.maxHealth = 120;
        this.damage = 25;
        this.speed *= 0.9; // Slightly slower
        this.walkSpeed *= 0.8; // Slower shambling
        break;
      case 2: // Faster zombie
        this.sprite.scale.set(58, 58, 1);
        this.originalScale = 58;
        this.health = 80;
        this.maxHealth = 80;
        this.damage = 15;
        this.speed *= 1.3; // Much faster
        this.walkSpeed *= 1.5; // Faster shambling
        // Tint slightly different
        this.sprite.material.color.setHex(0xdddddd);
        break;
    }
  }

  update(delta) {
    // Move toward player
    const playerPos = this.game.player.sprite.position;
    const zombiePos = new THREE.Vector2(this.sprite.position.x, this.sprite.position.y);
    const playerPos2D = new THREE.Vector2(playerPos.x, playerPos.y);
    const dir = playerPos2D.sub(zombiePos);

    if (dir.lengthSq() > 0.0001) {
      dir.normalize();
      
      // Apply movement with slight randomness for more natural movement
      const randomOffset = (Math.random() - 0.5) * 0.1;
      this.sprite.position.x += (dir.x + randomOffset) * this.speed * delta;
      this.sprite.position.y += (dir.y + randomOffset) * this.speed * delta;
      
      // Rotate zombie to face movement direction
      const angle = Math.atan2(dir.y, dir.x) + Math.PI / 2;
      this.sprite.material.rotation = -angle;
      
      // Shambling animation - more erratic and zombie-like
      this.walkAnimation += delta * this.walkSpeed;
      
      // Shambling side-to-side movement (more pronounced than player)
      this.shambleOffset = Math.sin(this.walkAnimation * 1.5) * 3;
      
      // Irregular body bobbing (zombies don't walk smoothly)
      this.bodyBob = Math.abs(Math.sin(this.walkAnimation * 0.8)) * 3 + 
                    Math.sin(this.walkAnimation * 2.3) * 1;
      
      // Limb sway (arms and legs moving awkwardly)
      this.limbSway = Math.sin(this.walkAnimation * 1.2 + Math.PI/3) * 2;
      
      // Apply shambling effects
      this.sprite.position.z = this.bodyBob;
      
      // Irregular scale variation for shambling effect (more pronounced)
      const scaleVariationX = 1 + Math.sin(this.walkAnimation * 1.3) * 0.05;
      const scaleVariationY = 1 + Math.sin(this.walkAnimation * 0.9) * 0.03;
      this.sprite.scale.set(
        this.originalScale * scaleVariationX, 
        this.originalScale * scaleVariationY, 
        1
      );
      
      // Add slight position offset for shambling
      const tempX = this.sprite.position.x;
      const tempY = this.sprite.position.y;
      this.sprite.position.x += Math.sin(this.walkAnimation * 2) * 0.5;
      this.sprite.position.y += Math.cos(this.walkAnimation * 1.7) * 0.3;
      
    } else {
      // Standing still - gradually return to neutral but keep some zombie twitching
      this.shambleOffset *= 0.95;
      this.bodyBob *= 0.95;
      this.limbSway *= 0.95;
      
      // Even when standing, zombies have slight twitching
      this.walkAnimation += delta * this.walkSpeed * 0.3;
      const twitch = Math.sin(this.walkAnimation * 3) * 0.5;
      this.sprite.position.z = this.bodyBob + twitch;
      
      // Slight scale variation even when standing
      const idleScale = 1 + Math.sin(this.walkAnimation) * 0.01;
      this.sprite.scale.set(this.originalScale * idleScale, this.originalScale * idleScale, 1);
    }

    // Update groan timer (visual effect)
    this.groanTimer -= delta;
    if (this.groanTimer <= 0) {
      this.groanTimer = 2000 + Math.random() * 3000;
      // Visual groan effect - slight color flash
      this.sprite.material.color.setHex(0xffaaaa);
      setTimeout(() => {
        this.sprite.material.color.setHex(this.zombieVariant === 2 ? 0xdddddd : 0xffffff);
      }, 200);
    }

    // Check collision with player
    const distSq = this.sprite.position.distanceToSquared(playerPos);
    const radii = this.radius + this.game.player.radius;
    if (distSq <= radii * radii) {
      // Attack player
      if (performance.now() - this.lastAttack >= this.attackCooldown) {
        this.attackPlayer();
        this.lastAttack = performance.now();
      }
    }

    // Update blood effects
    this.updateBloodEffects(delta);
  }

  attackPlayer() {
    this.game.player.takeDamage(this.damage);
    
    // Enhanced visual feedback for attack
    this.sprite.material.color.setHex(0xff4444);
    
    // Scale up slightly during attack
    const attackScale = this.originalScale * 1.2;
    this.sprite.scale.set(attackScale, attackScale, 1);
    
    setTimeout(() => {
      this.sprite.material.color.setHex(0xffffff);
      this.sprite.scale.set(this.originalScale, this.originalScale, 1);
    }, 300);
  }

  takeDamage(amount) {
    this.health -= amount;
    
    // Create blood splat effect
    this.createBloodEffect();
    
    // Enhanced flash when hit
    this.sprite.material.color.setHex(0xff0000);
    
    // Scale down slightly when hit
    const hitScale = this.originalScale * 0.9;
    this.sprite.scale.set(hitScale, hitScale, 1);
    
    setTimeout(() => {
      this.sprite.material.color.setHex(0xffffff);
      this.sprite.scale.set(this.originalScale, this.originalScale, 1);
    }, 150);
    
    // Enhanced knockback effect
    const playerPos = this.game.player.sprite.position;
    const zombiePos = new THREE.Vector2(this.sprite.position.x, this.sprite.position.y);
    const playerPos2D = new THREE.Vector2(playerPos.x, playerPos.y);
    const knockbackDir = zombiePos.sub(playerPos2D).normalize();
    
    const knockbackForce = 15 + Math.random() * 10;
    this.sprite.position.x += knockbackDir.x * knockbackForce;
    this.sprite.position.y += knockbackDir.y * knockbackForce;
    
    if (this.health <= 0) {
      this.die();
    }
  }

  createBloodEffect() {
    const bloodTexture = this.game.spriteManager.getTexture('bloodSplat');
    const bloodMaterial = new THREE.SpriteMaterial({ 
      map: bloodTexture,
      transparent: true,
      opacity: 0.8
    });
    
    const bloodSprite = new THREE.Sprite(bloodMaterial);
    bloodSprite.scale.set(32, 32, 1);
    bloodSprite.position.set(
      this.sprite.position.x + (Math.random() - 0.5) * 30,
      this.sprite.position.y + (Math.random() - 0.5) * 30,
      -0.5
    );
    
    // Random rotation for variety
    bloodSprite.material.rotation = Math.random() * Math.PI * 2;
    
    this.game.scene.add(bloodSprite);
    
    // Store blood effect for cleanup
    this.bloodEffects.push({
      sprite: bloodSprite,
      life: 8000, // 8 seconds
      created: performance.now()
    });
  }

  updateBloodEffects(delta) {
    for (let i = this.bloodEffects.length - 1; i >= 0; i--) {
      const blood = this.bloodEffects[i];
      const elapsed = performance.now() - blood.created;
      
      if (elapsed > blood.life) {
        this.game.scene.remove(blood.sprite);
        blood.sprite.material.dispose();
        this.bloodEffects.splice(i, 1);
      } else {
        // Fade out over time
        const opacity = 0.8 * (1 - elapsed / blood.life);
        blood.sprite.material.opacity = opacity;
      }
    }
  }

  die() {
    // Add to score with bonus for zombie type
    let scoreBonus = 100;
    switch(this.zombieVariant) {
      case 1: scoreBonus = 150; break; // Larger zombie
      case 2: scoreBonus = 200; break; // Fast zombie
    }
    this.game.addScore(scoreBonus);
    
    // Create multiple blood splats for death
    this.createBloodEffect();
    this.createBloodEffect();
    if (this.zombieVariant === 1) {
      this.createBloodEffect(); // Extra blood for larger zombie
    }
    
    // Remove from game
    this.game.removeZombie(this);
  }

  dispose() {
    this.game.scene.remove(this.sprite);
    this.sprite.material.dispose();
    
    // Clean up blood effects
    for (const blood of this.bloodEffects) {
      this.game.scene.remove(blood.sprite);
      blood.sprite.material.dispose();
    }
    this.bloodEffects = [];
  }
} 