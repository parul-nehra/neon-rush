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
    
    this.isRunning = false;
    this.clock = new THREE.Clock();
    this.gameTime = 0;
    
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Start render loop
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0520); // Deep purple/blue synthwave background
    this.scene.fog = new THREE.FogExp2(0x0a0520, 0.012); // Lighter fog so stars show through
    
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

    // Starry background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 15000; // Massively increased star count
    const posArray = new Float32Array(starCount * 3);
    const colorArray = new Float32Array(starCount * 3);
    
    // Synthwave color palette for stars
    const colors = [
      new THREE.Color(0xff00ff), // Magenta
      new THREE.Color(0x00ffff), // Cyan
      new THREE.Color(0xffffff), // White
      new THREE.Color(0x8a2be2)  // Purple
    ];

    for(let i = 0; i < starCount; i++) {
      // Position
      posArray[i * 3] = (Math.random() - 0.5) * 1000;     // x
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 1000; // y
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 1000; // z
      
      // Color
      const c = colors[Math.floor(Math.random() * colors.length)];
      colorArray[i * 3] = c.r;
      colorArray[i * 3 + 1] = c.g;
      colorArray[i * 3 + 2] = c.b;
    }
    
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    const starMat = new THREE.PointsMaterial({
      size: 3.0, 
      vertexColors: true, // Use the colors array
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: false
    });
    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);
  }

  start() {
    this.player.reset();
    this.track.reset();
    this.score = 0;
    this.multiplier = 1;
    this.gameTime = 0;
    this.isRunning = true;
    this.clock.start();
    this.ui.updateScore(this.score);
    this.ui.updateMultiplier(this.multiplier);
  }

  stop() {
    this.isRunning = false;
    this.ui.onGameOver(Math.floor(this.score));
  }

  pause() {
    this.isRunning = false;
  }

  resume() {
    this.isRunning = true;
    this.clock.getDelta(); // Consume time spent paused
  }

  quit() {
    this.isRunning = false;
  }

  animate() {
    this.perf.update();
    const dt = this.clock.getDelta();

    if (this.isRunning) {
      this.gameTime += dt;
      this.player.update(dt, this.input);
      this.track.update(this.player.mesh.position.z, this.gameTime);
      
      // Camera follow
      this.camera.position.x = this.player.mesh.position.x * 0.5;
      this.camera.position.y = this.player.mesh.position.y + 3;
      this.camera.position.z = this.player.mesh.position.z + 8;
      this.camera.lookAt(
        this.player.mesh.position.x,
        this.player.mesh.position.y,
        this.player.mesh.position.z - 10
      );
      
      // Move stars with player to create parallax or keep them around
      this.stars.position.z = this.camera.position.z;

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
        // Hit obstacle - Game over immediately (1 hit)
        this.stop();
        return; // exit loop
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
