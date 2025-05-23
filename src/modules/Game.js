import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { Player } from './Player.js';
import { Zombie } from './Zombie.js';
import { Bullet } from './Bullet.js';
import { InputHandler } from './InputHandler.js';
import { SpriteManager } from './SpriteManager.js';
import { UIManager } from './UIManager.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.isGameOver = false;

    // Initialize sprite manager first
    this.spriteManager = new SpriteManager();
    this.spriteManager.initializeTextures();

    // Three.js scene setup
    this.scene = new THREE.Scene();
    
    // Enhanced background with more detail
    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      new THREE.MeshLambertMaterial({ color: 0x8b7355 }) // darker sandy color
    );
    field.position.set(0, 0, -2);
    this.scene.add(field);

    // Add some environmental details
    this.createEnvironment();

    // Basic lighting for Lambert / Phong materials
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(0, 0, 1);
    this.scene.add(ambient, directional);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Orthographic camera matching the viewport
    this.camera = new THREE.OrthographicCamera();
    this.updateCamera();

    // Initialize UI
    this.ui = new UIManager(this);

    // Entities
    this.player = new Player(this);
    this.zombies = [];
    this.bullets = [];

    // Input
    this.input = new InputHandler();

    // Game state
    this.score = 0;
    this.wave = 1;
    this.zombiesKilled = 0;
    this.zombiesPerWave = 10;

    // Timers
    this.lastSpawn = 0;
    this.spawnInterval = 2000; // ms
    this.waveStartTime = performance.now();

    // Bind update
    this.update = this.update.bind(this);

    // Initialize UI values
    this.ui.updateScore(this.score);
    this.ui.updateWave(this.wave);
    this.ui.updateAmmo(this.player.ammo, this.player.maxAmmo);
    this.ui.updateHealth(this.player.health, this.player.maxHealth);
  }

  createEnvironment() {
    // Burnt helicopter crash mark (larger and more detailed)
    const crash = new THREE.Mesh(
      new THREE.CircleGeometry(150, 32),
      new THREE.MeshBasicMaterial({ color: 0x2a2a2a })
    );
    crash.position.set(0, 0, -1.9);
    this.scene.add(crash);

    // Add some debris around the crash site
    for (let i = 0; i < 8; i++) {
      const debris = new THREE.Mesh(
        new THREE.BoxGeometry(20 + Math.random() * 30, 10 + Math.random() * 20, 5),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      const angle = (i / 8) * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      debris.position.set(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        -1.8
      );
      debris.rotation.z = Math.random() * Math.PI * 2;
      this.scene.add(debris);
    }

    // Add some scattered rocks/obstacles
    for (let i = 0; i < 15; i++) {
      const rock = new THREE.Mesh(
        new THREE.SphereGeometry(15 + Math.random() * 25, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      );
      rock.position.set(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        -1.5
      );
      this.scene.add(rock);
    }
  }

  updateCamera() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.near = -1000;
    this.camera.far = 1000;
    this.camera.updateProjectionMatrix();
  }

  start() {
    window.addEventListener('resize', () => {
      this.updateCamera();
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    // Hide instructions after a few seconds
    setTimeout(() => {
      this.ui.hideInstructions();
    }, 5000);

    requestAnimationFrame(this.update);
  }

  spawnZombie() {
    if (this.isGameOver) return;

    const edge = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
    const buffer = 100;
    let x, y;
    switch (edge) {
      case 0:
        x = (Math.random() - 0.5) * window.innerWidth;
        y = window.innerHeight / 2 + buffer;
        break;
      case 1:
        x = window.innerWidth / 2 + buffer;
        y = (Math.random() - 0.5) * window.innerHeight;
        break;
      case 2:
        x = (Math.random() - 0.5) * window.innerWidth;
        y = -window.innerHeight / 2 - buffer;
        break;
      default:
        x = -window.innerWidth / 2 - buffer;
        y = (Math.random() - 0.5) * window.innerHeight;
    }
    this.zombies.push(new Zombie(this, new THREE.Vector2(x, y)));
  }

  update(time) {
    if (this.isGameOver) return;

    const delta = this.prevTime ? time - this.prevTime : 16;
    this.prevTime = time;

    // Spawn zombies periodically
    if (time - this.lastSpawn > this.spawnInterval && this.zombies.length < this.zombiesPerWave) {
      this.spawnZombie();
      this.lastSpawn = time;
    }

    // Check for wave completion
    if (this.zombies.length === 0 && this.zombiesKilled >= this.zombiesPerWave) {
      this.nextWave();
    }

    // Update entities
    this.player.update(delta);

    for (const bullet of [...this.bullets]) {
      bullet.update(delta);
    }
    for (const zombie of [...this.zombies]) {
      zombie.update(delta);
    }

    // Render
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.update);
  }

  nextWave() {
    this.wave++;
    this.zombiesKilled = 0;
    this.zombiesPerWave = Math.min(20, 10 + this.wave * 2); // Increase zombies per wave
    this.spawnInterval = Math.max(500, 2000 - this.wave * 100); // Faster spawning
    
    // Bonus score for completing wave
    this.addScore(this.wave * 50);
    
    this.ui.updateWave(this.wave);
    
    // Brief pause before next wave
    setTimeout(() => {
      this.waveStartTime = performance.now();
    }, 2000);
  }

  addBullet(position, direction) {
    this.bullets.push(new Bullet(this, position, direction));
  }

  removeBullet(bullet) {
    const idx = this.bullets.indexOf(bullet);
    if (idx !== -1) {
      bullet.dispose();
      this.bullets.splice(idx, 1);
    }
  }

  removeZombie(zombie) {
    const idx = this.zombies.indexOf(zombie);
    if (idx !== -1) {
      zombie.dispose();
      this.zombies.splice(idx, 1);
      this.zombiesKilled++;
    }
  }

  addScore(points) {
    this.score += points;
    this.ui.updateScore(this.score);
  }

  gameOver() {
    this.isGameOver = true;
    this.ui.showGameOver(this.score);
  }
} 