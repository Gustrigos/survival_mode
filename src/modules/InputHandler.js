export class InputHandler {
  constructor() {
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      down: false,
    };

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      
      // Prevent spacebar from scrolling the page
      if (e.code === 'Space') {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      
      // Prevent spacebar from scrolling the page
      if (e.code === 'Space') {
        e.preventDefault();
      }
    });

    window.addEventListener('mousedown', (e) => {
      this.mouse.down = true;
    });
    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX - window.innerWidth / 2;
      this.mouse.y = -(e.clientY - window.innerHeight / 2);
    });
  }

  isKeyDown(keyCode) {
    return !!this.keys[keyCode];
  }
} 