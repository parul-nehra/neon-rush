import * as THREE from 'three';
import { Player } from './Player.js';
import { Track } from './Track.js';
import { Input } from './Input.js';
import { PerformanceMonitor } from './Performance.js';

export class Game {
  constructor(container, uiCallbacks) {
    this.container = container;
    this.ui = uiCallbacks;
    
    this.initThree();
    this.player = new Player(this.scene);
    this.track = new Track(this.scene);
    this.input = new Input();
    this.perf = new PerformanceMonitor(this.renderer);
    
    this.score = 0;
    this.multiplier = 1;
    this.health = 100;
    
    this.isRunning = false;
    this.clock = new THREE.Clock();
    
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Start render loop
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
    
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xff00ff, 1);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);
  }

  start() {
    this.player.reset();
    this.track.reset();
    this.score = 0;
    this.multiplier = 1;
    this.health = 100;
    this.isRunning = true;
    this.clock.start();
    this.ui.updateScore(this.score);
    this.ui.updateMultiplier(this.multiplier);
    this.ui.updateHealth(this.health);
  }

  stop() {
    this.isRunning = false;
    this.ui.onGameOver(Math.floor(this.score));
  }

  animate() {
    this.perf.update();
    const dt = this.clock.getDelta();

    if (this.isRunning) {
      this.player.update(dt, this.input);
      this.track.update(this.player.mesh.position.z);
      
      // Camera follow
      this.camera.position.x = this.player.mesh.position.x * 0.5;
      this.camera.position.y = this.player.mesh.position.y + 3;
      this.camera.position.z = this.player.mesh.position.z + 8;
      this.camera.lookAt(
        this.player.mesh.position.x,
        this.player.mesh.position.y,
        this.player.mesh.position.z - 10
      );
      
      this.checkCollisions();
      
      // Update score
      this.score += (this.player.speed * dt) * this.multiplier;
      this.ui.updateScore(Math.floor(this.score));
    }

    // Render skybox/background elements (optional)
    this.renderer.render(this.scene, this.camera);
  }

  checkCollisions() {
    const playerBox = new THREE.Box3().setFromObject(this.player.mesh);
    
    // Check obstacles
    for (const obs of this.track.obstacles) {
      const obsBox = new THREE.Box3().setFromObject(obs);
      if (playerBox.intersectsBox(obsBox)) {
        // Hit obstacle
        this.health -= 20;
        this.ui.updateHealth(this.health);
        this.multiplier = 1;
        this.ui.updateMultiplier(this.multiplier);
        
        // Push obstacle away to avoid multi-hit
        obs.position.y -= 10;
        
        // Shake effect could go here
        
        if (this.health <= 0) {
          this.stop();
        }
      }
    }
    
    // Check collectibles
    for (const col of this.track.collectibles) {
      if (col.active) {
        const colBox = new THREE.Box3().setFromObject(col.mesh);
        if (playerBox.intersectsBox(colBox)) {
          col.active = false;
          col.mesh.visible = false;
          
          this.multiplier++;
          this.ui.updateMultiplier(this.multiplier);
          this.score += 100 * this.multiplier;
        }
      }
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
