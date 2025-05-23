import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class Bullet {
  constructor(game, position, direction) {
    this.game = game;
    this.speed = 0.7; // pixels per ms
    this.life = 2500; // ms
    this.birth = performance.now();
    this.damage = 50; // Damage per hit

    this.radius = 3;

    // Create a small yellow bullet sprite
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 10, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0xffdd55 });
    this.mesh = new THREE.Mesh(geometry, material);

    // Orient cylinder along direction (local Y axis)
    const angle = Math.atan2(direction.y, direction.x);
    this.mesh.rotation.z = angle;

    this.mesh.position.set(position.x, position.y, 0);
    this.game.scene.add(this.mesh);

    this.dir = direction.clone();
  }

  update(delta) {
    this.mesh.position.x += this.dir.x * this.speed * delta;
    this.mesh.position.y += this.dir.y * this.speed * delta;

    // Lifetime removal
    if (performance.now() - this.birth > this.life) {
      this.game.removeBullet(this);
      return;
    }

    // Check collisions with zombies
    for (const zombie of [...this.game.zombies]) {
      const distSq = this.mesh.position.distanceToSquared(zombie.sprite.position);
      const radii = this.radius + zombie.radius;
      if (distSq <= radii * radii) {
        // Deal damage instead of instant kill
        zombie.takeDamage(this.damage);
        this.game.removeBullet(this);
        return;
      }
    }

    // Check if bullet is off-screen (optimization)
    const pos = this.mesh.position;
    const margin = 100;
    if (pos.x < -window.innerWidth/2 - margin || 
        pos.x > window.innerWidth/2 + margin ||
        pos.y < -window.innerHeight/2 - margin || 
        pos.y > window.innerHeight/2 + margin) {
      this.game.removeBullet(this);
    }
  }

  dispose() {
    this.game.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
} 