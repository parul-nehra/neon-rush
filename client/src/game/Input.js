export class Input {
  constructor() {
    this.keys = {
      left: false,
      right: false
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
    });
    
    // Touch controls
    window.addEventListener('touchstart', (e) => {
      const x = e.touches[0].clientX;
      if (x < window.innerWidth / 2) this.keys.left = true;
      else this.keys.right = true;
    });

    window.addEventListener('touchend', () => {
      this.keys.left = false;
      this.keys.right = false;
    });
  }
}
