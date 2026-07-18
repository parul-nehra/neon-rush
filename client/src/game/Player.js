import * as THREE from 'three';

export class Player {
  constructor(scene) {
    this.scene = scene;
    
    // Create spaceship mesh
    const geometry = new THREE.ConeGeometry(0.5, 2, 4);
    geometry.rotateX(Math.PI / 2); // point forward
    
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0.5, 5); // Start position
    this.scene.add(this.mesh);

    this.speed = 10;
    this.lateralSpeed = 15;
    this.velocity = new THREE.Vector3(0, 0, -this.speed);
    
    // Create engine trail
    this.createTrail();
  }

  createTrail() {
    // Simple particle system or trailing effect could go here
    // For now we just add a point light to the ship
    this.light = new THREE.PointLight(0x00ffff, 1, 10);
    this.light.position.set(0, 0, 1);
    this.mesh.add(this.light);
  }

  update(deltaTime, input) {
    // Forward movement (increasing speed over time)
    this.speed += deltaTime * 0.2;
    this.velocity.z = -this.speed;

    // Lateral movement
    if (input.keys.left) {
      this.mesh.position.x -= this.lateralSpeed * deltaTime;
      this.mesh.rotation.z = Math.min(this.mesh.rotation.z + deltaTime * 5, 0.5);
    } else if (input.keys.right) {
      this.mesh.position.x += this.lateralSpeed * deltaTime;
      this.mesh.rotation.z = Math.max(this.mesh.rotation.z - deltaTime * 5, -0.5);
    } else {
      // return to center rotation
      this.mesh.rotation.z -= this.mesh.rotation.z * deltaTime * 5;
    }

    // Clamp position to track width
    const trackLimit = 4;
    if (this.mesh.position.x > trackLimit) this.mesh.position.x = trackLimit;
    if (this.mesh.position.x < -trackLimit) this.mesh.position.x = -trackLimit;

    // Apply forward velocity
    this.mesh.position.addScaledVector(this.velocity, deltaTime);
  }

  reset() {
    this.mesh.position.set(0, 0.5, 5);
    this.speed = 10;
    this.velocity.z = -this.speed;
    this.mesh.rotation.z = 0;
  }
}
