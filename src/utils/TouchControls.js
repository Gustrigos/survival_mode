export class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.enabled = false;
        this.joystick = null;
        this.actionButtons = {};
        this.gamepadIndex = -1;
        this.deadZone = 0.2;
        
        // Check if touch device
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Initialize controls based on device
        this.init();
    }
    
    init() {
        // Auto-enable on touch devices
        if (this.isTouchDevice) {
            this.enableTouchControls();
        }
        
        // Enable gamepad support
        this.setupGamepadSupport();
        
        // Add toggle button for desktop users
        this.addToggleButton();
    }
    
    enableTouchControls() {
        this.enabled = true;
        this.createVirtualJoystick();
        this.createActionButtons();
        console.log('Touch controls enabled');
    }
    
    disableTouchControls() {
        this.enabled = false;
        if (this.joystick) {
            this.joystick.destroy();
            this.joystick = null;
        }
        
        Object.values(this.actionButtons).forEach(button => {
            if (button.destroy) button.destroy();
        });
        this.actionButtons = {};
        
        console.log('Touch controls disabled');
    }
    
    createVirtualJoystick() {
        const joystickSize = 120;
        const padding = 30;
        
        // Joystick background
        const joystickBg = this.scene.add.graphics();
        joystickBg.fillStyle(0x333333, 0.6);
        joystickBg.fillCircle(0, 0, joystickSize / 2);
        joystickBg.lineStyle(3, 0x666666, 0.8);
        joystickBg.strokeCircle(0, 0, joystickSize / 2);
        
        // Joystick handle
        const joystickHandle = this.scene.add.graphics();
        joystickHandle.fillStyle(0x666666, 0.8);
        joystickHandle.fillCircle(0, 0, 25);
        joystickHandle.lineStyle(2, 0x999999, 1);
        joystickHandle.strokeCircle(0, 0, 25);
        
        // Position joystick
        const joyX = padding + joystickSize / 2;
        const joyY = this.scene.scale.height - padding - joystickSize / 2;
        
        joystickBg.setPosition(joyX, joyY);
        joystickHandle.setPosition(joyX, joyY);
        
        // Make interactive
        joystickBg.setInteractive(new Phaser.Geom.Circle(0, 0, joystickSize / 2), Phaser.Geom.Circle.Contains);
        
        this.joystick = {
            bg: joystickBg,
            handle: joystickHandle,
            centerX: joyX,
            centerY: joyY,
            radius: joystickSize / 2,
            isDragging: false,
            vector: { x: 0, y: 0 }
        };
        
        // Input events
        joystickBg.on('pointerdown', this.onJoystickStart, this);
        joystickBg.on('pointermove', this.onJoystickMove, this);
        joystickBg.on('pointerup', this.onJoystickEnd, this);
        joystickBg.on('pointerout', this.onJoystickEnd, this);
        
        // Set depth
        joystickBg.setDepth(3000);
        joystickHandle.setDepth(3001);
    }
    
    createActionButtons() {
        const buttonSize = 70;
        const padding = 30;
        const spacing = 20;
        
        // Shoot button
        const shootButton = this.createButton(
            this.scene.scale.width - padding - buttonSize,
            this.scene.scale.height - padding - buttonSize * 2 - spacing,
            buttonSize,
            'SHOOT',
            0xe74c3c
        );
        
        // Reload button  
        const reloadButton = this.createButton(
            this.scene.scale.width - padding - buttonSize,
            this.scene.scale.height - padding - buttonSize,
            buttonSize,
            'R',
            0xf39c12
        );
        
        this.actionButtons = {
            shoot: shootButton,
            reload: reloadButton
        };
        
        // Button events
        shootButton.on('pointerdown', () => this.onActionButton('shoot', true));
        shootButton.on('pointerup', () => this.onActionButton('shoot', false));
        shootButton.on('pointerout', () => this.onActionButton('shoot', false));
        
        reloadButton.on('pointerdown', () => this.onActionButton('reload', true));
        reloadButton.on('pointerup', () => this.onActionButton('reload', false));
        reloadButton.on('pointerout', () => this.onActionButton('reload', false));
    }
    
    createButton(x, y, size, text, color) {
        const button = this.scene.add.graphics();
        button.fillStyle(color, 0.7);
        button.fillCircle(0, 0, size / 2);
        button.lineStyle(3, 0xffffff, 0.8);
        button.strokeCircle(0, 0, size / 2);
        button.setPosition(x, y);
        button.setDepth(3000);
        
        // Add text
        const buttonText = this.scene.add.text(x, y, text, {
            fontSize: `${size * 0.25}px`,
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center'
        });
        buttonText.setOrigin(0.5);
        buttonText.setDepth(3001);
        
        button.setInteractive(new Phaser.Geom.Circle(0, 0, size / 2), Phaser.Geom.Circle.Contains);
        
        button.text = buttonText;
        return button;
    }
    
    onJoystickStart(pointer) {
        this.joystick.isDragging = true;
    }
    
    onJoystickMove(pointer) {
        if (!this.joystick.isDragging) return;
        
        const dx = pointer.x - this.joystick.centerX;
        const dy = pointer.y - this.joystick.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.joystick.radius) {
            this.joystick.handle.setPosition(pointer.x, pointer.y);
            this.joystick.vector.x = dx / this.joystick.radius;
            this.joystick.vector.y = dy / this.joystick.radius;
        } else {
            const angle = Math.atan2(dy, dx);
            const constrainedX = this.joystick.centerX + Math.cos(angle) * this.joystick.radius;
            const constrainedY = this.joystick.centerY + Math.sin(angle) * this.joystick.radius;
            
            this.joystick.handle.setPosition(constrainedX, constrainedY);
            this.joystick.vector.x = Math.cos(angle);
            this.joystick.vector.y = Math.sin(angle);
        }
    }
    
    onJoystickEnd() {
        this.joystick.isDragging = false;
        this.joystick.handle.setPosition(this.joystick.centerX, this.joystick.centerY);
        this.joystick.vector.x = 0;
        this.joystick.vector.y = 0;
    }
    
    onActionButton(action, pressed) {
        // Trigger haptic feedback on mobile
        if (navigator.vibrate && pressed) {
            navigator.vibrate(50);
        }
        
        // Emit events for game to handle
        this.scene.events.emit(`touch_${action}`, pressed);
    }
    
    setupGamepadSupport() {
        // Gamepad connected/disconnected events
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected');
            this.gamepadIndex = -1;
        });
    }
    
    addToggleButton() {
        const toggleButton = document.createElement('button');
        toggleButton.innerHTML = '🎮';
        toggleButton.style.position = 'fixed';
        toggleButton.style.top = '20px';
        toggleButton.style.left = '20px';
        toggleButton.style.zIndex = '4000';
        toggleButton.style.fontSize = '20px';
        toggleButton.style.padding = '10px';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '50%';
        toggleButton.style.backgroundColor = 'rgba(0,0,0,0.7)';
        toggleButton.style.color = 'white';
        toggleButton.style.cursor = 'pointer';
        toggleButton.title = 'Toggle Touch Controls';
        
        toggleButton.onclick = () => {
            if (this.enabled) {
                this.disableTouchControls();
                toggleButton.style.opacity = '0.5';
            } else {
                this.enableTouchControls();
                toggleButton.style.opacity = '1';
            }
        };
        
        document.body.appendChild(toggleButton);
        this.toggleButton = toggleButton;
    }
    
    getMovementInput() {
        let moveX = 0, moveY = 0;
        
        // Touch joystick input
        if (this.enabled && this.joystick) {
            moveX += this.joystick.vector.x;
            moveY += this.joystick.vector.y;
        }
        
        // Gamepad input
        if (this.gamepadIndex >= 0) {
            const gamepad = navigator.getGamepads()[this.gamepadIndex];
            if (gamepad) {
                const leftStickX = gamepad.axes[0];
                const leftStickY = gamepad.axes[1];
                
                if (Math.abs(leftStickX) > this.deadZone) {
                    moveX += leftStickX;
                }
                if (Math.abs(leftStickY) > this.deadZone) {
                    moveY += leftStickY;
                }
            }
        }
        
        return { x: moveX, y: moveY };
    }
    
    getActionInput() {
        let shoot = false, reload = false;
        
        // Gamepad input
        if (this.gamepadIndex >= 0) {
            const gamepad = navigator.getGamepads()[this.gamepadIndex];
            if (gamepad) {
                shoot = gamepad.buttons[0].pressed; // A button
                reload = gamepad.buttons[1].pressed; // B button
            }
        }
        
        return { shoot, reload };
    }
    
    destroy() {
        this.disableTouchControls();
        
        if (this.toggleButton) {
            document.body.removeChild(this.toggleButton);
        }
    }
} 