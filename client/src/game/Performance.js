export class PerformanceMonitor {
  constructor(renderer) {
    this.renderer = renderer;
    this.frames = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.tier = 'high'; // high, med, low
    
    this.checkInterval = 2000; // Check every 2 seconds
    this.lastCheck = this.lastTime;
  }

  update() {
    this.frames++;
    const now = performance.now();
    
    if (now - this.lastCheck >= this.checkInterval) {
      this.fps = Math.round((this.frames * 1000) / (now - this.lastCheck));
      this.frames = 0;
      this.lastCheck = now;
      this.adjustTier();
    }
  }

  adjustTier() {
    if (this.fps < 30 && this.tier !== 'low') {
      this.tier = 'low';
      this.renderer.setPixelRatio(1);
      // turn off shadows, reduce resolution
      this.renderer.shadowMap.enabled = false;
    } else if (this.fps >= 30 && this.fps < 50 && this.tier === 'high') {
      this.tier = 'med';
      this.renderer.setPixelRatio(window.devicePixelRatio > 1 ? 1.5 : 1);
    } else if (this.fps >= 55 && this.tier !== 'high') {
      // Keep it as is if it recovered, to avoid flip-flopping too much
    }
  }
}
