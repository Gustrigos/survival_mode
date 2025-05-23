export class UIManager {
  constructor(game) {
    this.game = game;
    this.createUI();
  }

  createUI() {
    // Create UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.id = 'game-ui';
    this.uiContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: 'Orbitron', 'Courier New', monospace;
      color: white;
    `;
    document.body.appendChild(this.uiContainer);

    // Health bar container
    this.healthContainer = document.createElement('div');
    this.healthContainer.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      width: 250px;
      height: 30px;
      background: linear-gradient(145deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
      border: 2px solid #444;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.5);
    `;
    
    this.healthBar = document.createElement('div');
    this.healthBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #ff0000 0%, #ff4444 25%, #ffaa00 50%, #44ff44 75%, #00ff00 100%);
      transition: width 0.3s ease;
      border-radius: 13px;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.2);
    `;
    
    this.healthText = document.createElement('div');
    this.healthText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 14px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      color: white;
      z-index: 1;
    `;
    
    // Health label
    this.healthLabel = document.createElement('div');
    this.healthLabel.textContent = 'HEALTH';
    this.healthLabel.style.cssText = `
      position: absolute;
      top: -5px;
      left: 10px;
      font-size: 10px;
      font-weight: bold;
      color: #ccc;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    `;
    
    this.healthContainer.appendChild(this.healthBar);
    this.healthContainer.appendChild(this.healthText);
    this.healthContainer.appendChild(this.healthLabel);
    this.uiContainer.appendChild(this.healthContainer);

    // Ammo counter
    this.ammoDisplay = document.createElement('div');
    this.ammoDisplay.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 30px;
      font-size: 28px;
      font-weight: bold;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
      background: linear-gradient(145deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
      padding: 15px 25px;
      border-radius: 10px;
      border: 2px solid #444;
      box-shadow: 0 4px 8px rgba(0,0,0,0.5);
      color: #ffdd44;
    `;
    this.uiContainer.appendChild(this.ammoDisplay);

    // Ammo label
    this.ammoLabel = document.createElement('div');
    this.ammoLabel.textContent = 'AMMUNITION';
    this.ammoLabel.style.cssText = `
      position: absolute;
      bottom: 85px;
      right: 30px;
      font-size: 12px;
      font-weight: bold;
      color: #ccc;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    this.uiContainer.appendChild(this.ammoLabel);

    // Score display
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
      background: linear-gradient(145deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
      padding: 15px 25px;
      border-radius: 10px;
      border: 2px solid #444;
      box-shadow: 0 4px 8px rgba(0,0,0,0.5);
      color: #44ff44;
    `;
    this.uiContainer.appendChild(this.scoreDisplay);

    // Wave display
    this.waveDisplay = document.createElement('div');
    this.waveDisplay.style.cssText = `
      position: absolute;
      top: 80px;
      right: 20px;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
      background: linear-gradient(145deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
      padding: 12px 20px;
      border-radius: 10px;
      border: 2px solid #444;
      box-shadow: 0 4px 8px rgba(0,0,0,0.5);
      color: #ff4444;
    `;
    this.uiContainer.appendChild(this.waveDisplay);

    // Crosshair enhancement (hidden for keyboard controls)
    this.crosshair = document.createElement('div');
    this.crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1001;
      display: none;
    `;
    
    this.crosshair.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 0;
        width: 8px;
        height: 2px;
        background: #ff0000;
        transform: translateY(-50%);
        box-shadow: 0 0 4px rgba(255,0,0,0.8);
      "></div>
      <div style="
        position: absolute;
        top: 50%;
        right: 0;
        width: 8px;
        height: 2px;
        background: #ff0000;
        transform: translateY(-50%);
        box-shadow: 0 0 4px rgba(255,0,0,0.8);
      "></div>
      <div style="
        position: absolute;
        left: 50%;
        top: 0;
        width: 2px;
        height: 8px;
        background: #ff0000;
        transform: translateX(-50%);
        box-shadow: 0 0 4px rgba(255,0,0,0.8);
      "></div>
      <div style="
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 2px;
        height: 8px;
        background: #ff0000;
        transform: translateX(-50%);
        box-shadow: 0 0 4px rgba(255,0,0,0.8);
      "></div>
    `;
    this.uiContainer.appendChild(this.crosshair);

    // Game over screen
    this.gameOverScreen = document.createElement('div');
    this.gameOverScreen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(20,0,0,0.9));
      display: none;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      pointer-events: auto;
      backdrop-filter: blur(5px);
    `;
    
    this.gameOverTitle = document.createElement('h1');
    this.gameOverTitle.textContent = 'GAME OVER';
    this.gameOverTitle.style.cssText = `
      font-size: 64px;
      color: #ff0000;
      margin-bottom: 30px;
      text-shadow: 4px 4px 8px rgba(0,0,0,0.8);
      animation: pulse 2s infinite;
      font-weight: 900;
    `;
    
    this.finalScore = document.createElement('div');
    this.finalScore.style.cssText = `
      font-size: 28px;
      margin-bottom: 40px;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
      color: #ffdd44;
      font-weight: bold;
    `;
    
    this.restartButton = document.createElement('button');
    this.restartButton.textContent = 'RESTART MISSION';
    this.restartButton.style.cssText = `
      font-size: 22px;
      padding: 20px 40px;
      background: linear-gradient(145deg, #ff0000, #cc0000);
      color: white;
      border: 2px solid #fff;
      border-radius: 10px;
      cursor: pointer;
      font-family: 'Orbitron', 'Courier New', monospace;
      font-weight: bold;
      transition: all 0.3s ease;
      box-shadow: 0 4px 8px rgba(0,0,0,0.5);
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    this.restartButton.onmouseover = () => {
      this.restartButton.style.background = 'linear-gradient(145deg, #cc0000, #990000)';
      this.restartButton.style.transform = 'scale(1.05)';
    };
    this.restartButton.onmouseout = () => {
      this.restartButton.style.background = 'linear-gradient(145deg, #ff0000, #cc0000)';
      this.restartButton.style.transform = 'scale(1)';
    };
    this.restartButton.onclick = () => window.location.reload();
    
    this.gameOverScreen.appendChild(this.gameOverTitle);
    this.gameOverScreen.appendChild(this.finalScore);
    this.gameOverScreen.appendChild(this.restartButton);
    this.uiContainer.appendChild(this.gameOverScreen);

    // Instructions
    this.instructions = document.createElement('div');
    this.instructions.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 30px;
      font-size: 14px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      background: linear-gradient(145deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9));
      padding: 15px 20px;
      border-radius: 10px;
      border: 2px solid #444;
      max-width: 300px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.5);
      color: #ccc;
    `;
    this.instructions.innerHTML = `
      <div style="color: #ffdd44; font-weight: bold; margin-bottom: 8px;">MISSION CONTROLS:</div>
      <div>WASD - Move & Aim</div>
      <div>Spacebar - Fire</div>
      <div>R - Reload Weapon</div>
      <div style="color: #ff4444; font-weight: bold; margin-top: 8px;">SURVIVE THE HORDE!</div>
    `;
    this.uiContainer.appendChild(this.instructions);

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .fade-in {
        animation: fadeIn 0.5s ease-out;
      }
    `;
    document.head.appendChild(style);
  }

  updateHealth(health, maxHealth) {
    const percentage = (health / maxHealth) * 100;
    this.healthBar.style.width = `${percentage}%`;
    this.healthText.textContent = `${health}/${maxHealth}`;
    
    // Change color based on health
    if (percentage < 25) {
      this.healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
      this.healthContainer.style.animation = 'pulse 1s infinite';
    } else if (percentage < 50) {
      this.healthBar.style.background = 'linear-gradient(90deg, #ff4444, #ffaa00)';
      this.healthContainer.style.animation = 'none';
    } else {
      this.healthBar.style.background = 'linear-gradient(90deg, #ff0000 0%, #ff4444 25%, #ffaa00 50%, #44ff44 75%, #00ff00 100%)';
      this.healthContainer.style.animation = 'none';
    }
  }

  updateAmmo(current, max) {
    this.ammoDisplay.textContent = `${current}/${max}`;
    
    // Change color based on ammo
    if (current === 0) {
      this.ammoDisplay.style.color = '#ff0000';
      this.ammoDisplay.style.animation = 'pulse 1s infinite';
    } else if (current < max * 0.3) {
      this.ammoDisplay.style.color = '#ffaa00';
      this.ammoDisplay.style.animation = 'none';
    } else {
      this.ammoDisplay.style.color = '#ffdd44';
      this.ammoDisplay.style.animation = 'none';
    }
  }

  updateScore(score) {
    this.scoreDisplay.textContent = `SCORE: ${score.toLocaleString()}`;
  }

  updateWave(wave) {
    this.waveDisplay.textContent = `WAVE ${wave}`;
    this.waveDisplay.classList.add('fade-in');
    setTimeout(() => {
      this.waveDisplay.classList.remove('fade-in');
    }, 500);
  }

  showGameOver(finalScore) {
    this.finalScore.textContent = `Final Score: ${finalScore.toLocaleString()}`;
    this.gameOverScreen.style.display = 'flex';
  }

  hideInstructions() {
    this.instructions.style.opacity = '0';
    this.instructions.style.transition = 'opacity 1s ease-out';
    setTimeout(() => {
      this.instructions.style.display = 'none';
    }, 1000);
  }
} 