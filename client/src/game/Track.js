import * as THREE from 'three';

export class Track {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.obstacles = [];
    this.collectibles = [];
    
    this.trackWidth = 10;
    this.segmentLength = 50;
    
    this.colors = [0xff00ff, 0x00ffff, 0x9900ff];
    
    this.material = new THREE.MeshStandardMaterial({
      color: 0x111111,
      wireframe: true,
      emissive: 0xff00ff,
      emissiveIntensity: 0.2
    });

    this.obsMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });

    this.colMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.8
    });
    
    // Init initial segments
    for (let i = 0; i < 5; i++) {
      this.createSegment(-i * this.segmentLength);
    }
  }

  createSegment(zOffset) {
    // Ground
    const geo = new THREE.PlaneGeometry(this.trackWidth, this.segmentLength, 10, 20);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.position.z = zOffset;
    this.scene.add(mesh);
    this.segments.push(mesh);

    // Grid lines (retro feel)
    const edges = new THREE.EdgesGeometry(geo);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.3 });
    const lines = new THREE.LineSegments(edges, lineMaterial);
    mesh.add(lines);

    // Spawn obstacles during initialization, leaving the first 30-50 units clear for a 2+ seconds runway
    if (zOffset <= -50) {
      const numObstacles = Math.floor(Math.random() * 3) + 1; // 1 to 3 obstacles
      for (let i = 0; i < numObstacles; i++) {
        this.spawnObstacle(zOffset);
      }
      if (Math.random() > 0.5) {
        this.spawnCollectible(zOffset);
      }
    }
  }

  spawnObstacle(zOffset) {
    const geo = new THREE.BoxGeometry(2, 2, 2);
    const mesh = new THREE.Mesh(geo, this.obsMaterial);
    
    // Random lane
    const xPos = (Math.random() - 0.5) * (this.trackWidth - 2);
    const zPos = zOffset + (Math.random() - 0.5) * this.segmentLength;
    
    mesh.position.set(xPos, 1, zPos);
    this.scene.add(mesh);
    this.obstacles.push(mesh);
  }

  spawnCollectible(zOffset) {
    const geo = new THREE.OctahedronGeometry(0.5);
    const mesh = new THREE.Mesh(geo, this.colMaterial);
    
    const xPos = (Math.random() - 0.5) * (this.trackWidth - 2);
    const zPos = zOffset + (Math.random() - 0.5) * this.segmentLength;
    
    mesh.position.set(xPos, 0.5, zPos);
    this.scene.add(mesh);
    this.collectibles.push({ mesh, active: true });
  }

  update(playerZ, elapsedTime) {
    // Recycle segments that are behind the player
    const firstSegment = this.segments[0];
    if (playerZ < firstSegment.position.z - this.segmentLength) {
      // Move this segment to the front
      const lastSegmentZ = this.segments[this.segments.length - 1].position.z;
      
      // Clean up old obstacles/collectibles on this segment
      this.cleanupEntities(firstSegment.position.z);
      
      firstSegment.position.z = lastSegmentZ - this.segmentLength;
      this.segments.push(this.segments.shift());
      
      // Spawn new stuff on recycled segment
      if (elapsedTime > 2) {
        const numObstacles = Math.floor(Math.random() * 3) + 1; // 1 to 3 obstacles
        for (let i = 0; i < numObstacles; i++) {
          this.spawnObstacle(firstSegment.position.z);
        }
      }
      if (Math.random() > 0.5) {
        this.spawnCollectible(firstSegment.position.z);
      }
    }

    // Animate collectibles
    this.collectibles.forEach(col => {
      if (col.active) {
        col.mesh.rotation.y += 0.05;
        col.mesh.rotation.x += 0.05;
      }
    });
  }

  cleanupEntities(zThreshold) {
    // Remove obstacles behind player
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      if (this.obstacles[i].position.z > zThreshold + this.segmentLength) {
        this.scene.remove(this.obstacles[i]);
        this.obstacles.splice(i, 1);
      }
    }
    // Remove collectibles behind player
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      if (this.collectibles[i].mesh.position.z > zThreshold + this.segmentLength) {
        this.scene.remove(this.collectibles[i].mesh);
        this.collectibles.splice(i, 1);
      }
    }
  }

  reset() {
    this.obstacles.forEach(o => this.scene.remove(o));
    this.collectibles.forEach(c => this.scene.remove(c.mesh));
    this.obstacles = [];
    this.collectibles = [];
    
    this.segments.forEach((seg, i) => {
      seg.position.z = -i * this.segmentLength;
    });
  }
}
