import { SpriteScaler } from '../utils/SpriteScaler.js';
import { GameConfig } from '../utils/GameConfig.js';

export class MilitaryCrate extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, contents = null, isSupplyCrate = false) {
        let usesFallback = false;
        
        // Check if crate texture exists
        if (!scene.textures.exists('military_crate')) {
            console.warn('⚠️ Crate texture not found! Creating fallback crate.');
            console.warn('⚠️ Expected texture: military_crate');
            console.warn('⚠️ Available textures:', Object.keys(scene.textures.list).filter(key => key.includes('crate')));
            
            // Create a fallback texture instead of returning early
            const fallbackKey = `crate_fallback_${x}_${y}`;
            
            try {
                // Create a simple colored rectangle as a texture
                const canvas = scene.textures.createCanvas(fallbackKey, 48, 32);
                const ctx = canvas.getContext();
                
                // Different color for supply crates vs loot crates
                const baseColor = isSupplyCrate ? '#4169E1' : '#8B4513'; // Blue for supply, brown for loot
                ctx.fillStyle = baseColor;
                ctx.fillRect(0, 0, 48, 32);
                
                // Add some texture lines to look like a crate
                ctx.strokeStyle = isSupplyCrate ? '#1E3A8A' : '#654321';
                ctx.lineWidth = 2;
                // Vertical lines
                for (let i = 12; i < 48; i += 12) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, 32);
                    ctx.stroke();
                }
                // Horizontal lines
                for (let i = 8; i < 32; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(0, i);
                    ctx.lineTo(48, i);
                    ctx.stroke();
                }
                
                canvas.refresh();
                
                // Use the fallback texture
                super(scene, x, y, fallbackKey);
                usesFallback = true;
                
                console.log(`✅ Created fallback ${isSupplyCrate ? 'supply' : 'loot'} crate texture`);
            } catch (fallbackError) {
                console.error('❌ Failed to create fallback crate texture:', fallbackError);

                const invalidCrate = {
                    active: false,
                    scene: scene,
                    x: x,
                    y: y,
                    destroy: () => {},
                    isActive: false,
                    body: null,
                    visible: false,
                    alpha: 0,
                    texture: null
                };
                
                // Don't inherit from Crate prototype if we failed
                console.warn('⚠️ Returning invalid crate object - should be filtered out in GameScene');
                return invalidCrate;
            }
        } else {
            // Use normal texture
            super(scene, x, y, 'military_crate');
        }
        
        try {
            const crateType = isSupplyCrate ? 'supply' : 'loot';
            console.log(`📦 Creating ${crateType} crate at`, x, y, usesFallback ? '(using fallback texture)' : '(using military_crate texture)');
            
            scene.add.existing(this);
            scene.physics.add.existing(this, false); // Dynamic body for collection detection
            
            this.scene = scene;
            this.usesFallback = usesFallback;
            this.isSupplyCrate = isSupplyCrate;
            
            // Structure properties
            this.structureType = isSupplyCrate ? 'supply_crate' : 'military_crate';
            this.material = 'metal';
            this.isDestructible = false;
            this.isCollectable = true;
            
            // Loot properties
            this.contents = contents || this.generateRandomContents();
            this.isCollected = false;
            
            // Supply crate properties
            if (this.isSupplyCrate) {
                this.purchaseItems = GameConfig.getPurchasableItems();
                this.selectedItem = 'sentryGun'; // Default selected item
                this.isShoppingMode = false; // Whether the shopping interface is active
            }
            
            // Visual effect properties
            this.originalScale = { x: 1, y: 1 };
            this.baseY = y; // Store the original Y position
            this.pulsePhase = Math.random() * Math.PI * 2; // Random starting phase
            
            // Apply sprite scaling to match current crate sizing
            try {
                // First apply SpriteScaler.autoScale like crates currently do
                SpriteScaler.autoScale(this, 'military_crate', { maintainAspectRatio: true });
                
                // Then apply additional scaling like crates (0.8x for better visibility)
                const visibility_scale = 0.8; // Slightly larger than before for better visibility
                this.setScale(this.scaleX * visibility_scale, this.scaleY * visibility_scale);
                
                // Store original scale for effects
                this.originalScale.x = this.scaleX;
                this.originalScale.y = this.scaleY;
                
            } catch (error) {
                console.error('❌ Error scaling crate sprite:', error);
                this.originalScale.x = this.scaleX;
                this.originalScale.y = this.scaleY;
            }
            
            // Set depth for proper layering (higher than terrain but below UI)
            this.setDepth(1200);
            
            // Setup physics body for collision detection
            this.setupPhysicsBody();
            
            // Create visual effects
            this.createVisualEffects();
            
            this.isActive = true;
            
            console.log(`📦 Loot crate created with contents: ${this.contents.type} (${this.contents.amount})`);
            
        } catch (error) {
            console.error('❌ Error creating loot crate:', error);
            
            // If we get here, super() was called but something else failed
            // Clean up and mark as inactive
            if (this.scene) {
                this.scene = null;
            }
            this.active = false;
            this.isActive = false;
            
            // Return the broken object so it can be detected and handled
            return this;
        }
    }
    
    generateRandomContents() {
        // Randomly choose between ammo, health, and barricades
        const contentTypes = [
            { type: 'ammo', amount: 30, weight: 30 },        // 30% chance for ammo
            { type: 'health', amount: 50, weight: 30 },      // 30% chance for health
            { type: 'barricade', amount: 2, weight: 40 }     // 40% chance for barricades
        ];
        
        const totalWeight = contentTypes.reduce((sum, content) => sum + content.weight, 0);
        const random = Math.random() * totalWeight;
        
        let weightSum = 0;
        for (const content of contentTypes) {
            weightSum += content.weight;
            if (random <= weightSum) {
                return {
                    type: content.type,
                    amount: content.amount + Math.floor(Math.random() * 10) // Add 0-9 random bonus
                };
            }
        }
        
        // Fallback
        return { type: 'ammo', amount: 30 };
    }
    
    createVisualEffects() {
        try {
            // Create subtle glow effect behind crate
            this.glowEffect = this.scene.add.graphics();
            this.glowEffect.setDepth(this.depth - 1); // Behind the crate
            
            // Create content indicator icon above crate
            this.createContentIndicator();
            
            console.log(`✨ Created minimalistic visual effects for ${this.contents.type} crate`);
        } catch (error) {
            console.error('❌ Error creating visual effects:', error);
        }
    }
    
    createContentIndicator() {
        // Create a small, subtle icon above the crate to show its contents
        const iconY = this.y - 30; // Moved closer to crate
        
        if (this.isSupplyCrate) {
            // Supply crate gets a shop icon
            this.contentIcon = this.scene.add.text(this.x, iconY, '$', {
                fontSize: '20px',
                fill: '#FFD700',
                fontFamily: 'Arial',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            });
            this.contentIcon.setOrigin(0.5);
            this.contentIcon.setDepth(this.depth + 2);
            this.contentIcon.setAlpha(0.9);
            
            // Add blue tint to supply crates
            this.setTint(0x6495ED);
        } else {
            // Regular loot crate behavior
            let symbol, color;
            
            if (this.contents.type === 'ammo') {
                symbol = '•'; // Simple bullet point
                color = '#FFD700';
            } else if (this.contents.type === 'health') {
                symbol = '+'; // Plus symbol
                color = '#00FF00';
            } else if (this.contents.type === 'barricade') {
                symbol = '■'; // Square symbol
                color = '#8B4513';
            }
            
            // Create subtle text indicator
            this.contentIcon = this.scene.add.text(this.x, iconY, symbol, {
                fontSize: '16px',
                fill: color,
                fontFamily: 'Arial',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 1
            });
            this.contentIcon.setOrigin(0.5);
            this.contentIcon.setDepth(this.depth + 2);
            this.contentIcon.setAlpha(0.8); // Slightly transparent
        }
    }
    
    setupPhysicsBody() {
        try {
            console.log('📦 Setting up loot crate physics body...');
            
            // Ensure we have a valid physics body
            if (!this.body) {
                console.error('❌ No physics body found for loot crate');
                return;
            }
            
            // Make collection area generous for easy pickup
            const visW = this.displayWidth;
            const visH = this.displayHeight;
            
            // Make collection area larger than visual (120% size)
            const bodyW = visW * 1.2;
            const bodyH = visH * 1.2;
            
            // Center the collision area
            this.body.setSize(bodyW, bodyH);
            this.body.setOffset(
                (visW - bodyW) / 2,
                (visH - bodyH) / 2
            );
            
            // Set up as sensor (no collision, just overlap detection)
            this.body.setImmovable(true);
            this.body.moves = false;
            
            console.log(`📦 Loot crate collection area: ${bodyW.toFixed(1)}x${bodyH.toFixed(1)}`);
            
        } catch (error) {
            console.error('❌ Error setting up loot crate physics body:', error);
        }
    }
    
    collectCrate(player) {
        if (this.isCollected) return false; // Already collected
        
        if (this.isSupplyCrate) {
            // Handle supply crate purchasing
            return this.handleSupplyCratePurchase(player);
        } else {
            // Handle regular loot crate collection
            return this.handleLootCrateCollection(player);
        }
    }
    
    handleSupplyCratePurchase(player) {
        const playerPoints = window.gameState.score || 0;
        const purchaseItems = GameConfig.getPurchasableItems();
        
        // Store player reference for distance checking
        this.purchasingPlayer = player;
        this.lastPlayerCheckTime = this.scene.time.now;
        
        // Show purchase interface
        this.showPurchaseInterface(player, playerPoints, purchaseItems);
        
        return false; // Don't consume the crate yet
    }
    
    showPurchaseInterface(player, playerPoints, purchaseItems) {
        // Create purchase UI
        this.createPurchaseUI(player, playerPoints, purchaseItems);
    }
    
    createPurchaseUI(player, playerPoints, purchaseItems) {
        // Clean up any existing purchase UI
        this.destroyPurchaseUI();
        
        const centerX = this.x;
        const centerY = this.y - 100;
        
        // Create background panel
        this.purchasePanel = this.scene.add.graphics();
        this.purchasePanel.fillStyle(0x000000, 0.8);
        this.purchasePanel.fillRoundedRect(centerX - 150, centerY - 80, 300, 160, 10);
        this.purchasePanel.lineStyle(2, 0xFFD700, 1);
        this.purchasePanel.strokeRoundedRect(centerX - 150, centerY - 80, 300, 160, 10);
        this.purchasePanel.setDepth(5000);
        
        // Title
        this.purchaseTitle = this.scene.add.text(centerX, centerY - 60, 'SUPPLY CRATE', {
            fontSize: '16px',
            fill: '#FFD700',
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            align: 'center'
        });
        this.purchaseTitle.setOrigin(0.5);
        this.purchaseTitle.setDepth(5001);
        
        // Player points display
        this.pointsDisplay = this.scene.add.text(centerX, centerY - 40, `Points: ${playerPoints}`, {
            fontSize: '12px',
            fill: '#FFFFFF',
            fontFamily: 'Courier New',
            align: 'center'
        });
        this.pointsDisplay.setOrigin(0.5);
        this.pointsDisplay.setDepth(5001);
        
        // Create item buttons
        this.purchaseButtons = [];
        const items = Object.keys(purchaseItems);
        const buttonWidth = 280 / items.length;
        
        items.forEach((itemId, index) => {
            const item = purchaseItems[itemId];
            const buttonX = centerX - 140 + (index * buttonWidth) + (buttonWidth / 2);
            const buttonY = centerY;
            
            // Can afford check
            const canAfford = playerPoints >= item.currentCost;
            
            // Enhanced styling - much clearer distinction between affordable and unaffordable
            const buttonColor = canAfford ? 0x00CC00 : 0x444444; // Bright green vs dark grey
            const borderColor = canAfford ? 0x00FF00 : 0x666666; // Bright green vs grey border
            const textColor = canAfford ? '#FFFFFF' : '#888888'; // White vs grey text
            const buttonAlpha = canAfford ? 0.9 : 0.5; // More opaque vs semi-transparent
            
            // Button background with enhanced styling
            const button = this.scene.add.graphics();
            button.fillStyle(buttonColor, buttonAlpha);
            button.fillRoundedRect(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50, 5);
            button.lineStyle(canAfford ? 3 : 1, borderColor, canAfford ? 1 : 0.6); // Thicker border for affordable
            button.strokeRoundedRect(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50, 5);
            button.setDepth(5001);
            
            // Add glow effect for affordable items
            if (canAfford) {
                button.lineStyle(6, 0x00FF00, 0.3); // Outer glow
                button.strokeRoundedRect(buttonX - buttonWidth/2 + 2, buttonY - 18, buttonWidth - 4, 56, 8);
            }
            
            button.setInteractive(new Phaser.Geom.Rectangle(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50), Phaser.Geom.Rectangle.Contains);
            
            // Enhanced button text with clearer pricing
            const itemText = `${item.name}\n💰 ${item.currentCost} pts`;
            const buttonText = this.scene.add.text(buttonX, buttonY, itemText, {
                fontSize: canAfford ? '11px' : '10px', // Slightly larger for affordable items
                fill: textColor,
                fontFamily: 'Courier New',
                fontWeight: canAfford ? 'bold' : 'normal', // Bold for affordable items
                align: 'center',
                stroke: canAfford ? '#000000' : '#333333', // Better contrast
                strokeThickness: canAfford ? 2 : 1
            });
            buttonText.setOrigin(0.5);
            buttonText.setDepth(5002);
            
            // Button click handler - only for affordable items
            if (canAfford) {
                button.on('pointerdown', () => {
                    this.purchaseItem(itemId, item, player);
                });
                
                // Enhanced hover effects for affordable items
                button.on('pointerover', () => {
                    button.clear();
                    // Bright hover state
                    button.fillStyle(0x00FF00, 1.0);
                    button.fillRoundedRect(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50, 5);
                    button.lineStyle(4, 0xFFFFFF, 1);
                    button.strokeRoundedRect(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50, 5);
                    // Glowing outer border
                    button.lineStyle(8, 0x00FF00, 0.4);
                    button.strokeRoundedRect(buttonX - buttonWidth/2, buttonY - 20, buttonWidth, 60, 10);
                    
                    // Text enhancement on hover
                    buttonText.setFill('#000000');
                    buttonText.setFontSize('12px');
                });
                
                button.on('pointerout', () => {
                    button.clear();
                    // Return to normal affordable state
                    button.fillStyle(0x00CC00, 0.9);
                    button.fillRoundedRect(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50, 5);
                    button.lineStyle(3, 0x00FF00, 1);
                    button.strokeRoundedRect(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50, 5);
                    // Outer glow
                    button.lineStyle(6, 0x00FF00, 0.3);
                    button.strokeRoundedRect(buttonX - buttonWidth/2 + 2, buttonY - 18, buttonWidth - 4, 56, 8);
                    
                    // Reset text
                    buttonText.setFill('#FFFFFF');
                    buttonText.setFontSize('11px');
                });
            } else {
                // Add visual feedback for unaffordable items (but no purchase action)
                button.on('pointerover', () => {
                    // Subtle red tint to indicate it's unaffordable
                    button.clear();
                    button.fillStyle(0x662222, 0.6);
                    button.fillRoundedRect(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50, 5);
                    button.lineStyle(2, 0xFF6666, 0.8);
                    button.strokeRoundedRect(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50, 5);
                    
                    // Show "NOT ENOUGH POINTS" text briefly
                    const warningText = this.scene.add.text(buttonX, buttonY - 35, 'NOT ENOUGH POINTS', {
                        fontSize: '9px',
                        fill: '#FF6666',
                        fontFamily: 'Courier New',
                        fontWeight: 'bold',
                        stroke: '#000000',
                        strokeThickness: 1
                    });
                    warningText.setOrigin(0.5);
                    warningText.setDepth(5003);
                    
                    // Auto-remove warning after 1 second
                    this.scene.time.delayedCall(1000, () => {
                        if (warningText && warningText.active) {
                            warningText.destroy();
                        }
                    });
                });
                
                button.on('pointerout', () => {
                    // Return to normal unaffordable state
                    button.clear();
                    button.fillStyle(0x444444, 0.5);
                    button.fillRoundedRect(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50, 5);
                    button.lineStyle(1, 0x666666, 0.6);
                    button.strokeRoundedRect(buttonX - buttonWidth/2 + 5, buttonY - 15, buttonWidth - 10, 50, 5);
                });
            }
            
            this.purchaseButtons.push({
                button: button,
                text: buttonText,
                itemId: itemId
            });
        });
        
        // Close button
        this.closeButton = this.scene.add.text(centerX, centerY + 50, '[ESC] Close • Auto-closes when you move away', {
            fontSize: '10px',
            fill: '#CCCCCC',
            fontFamily: 'Courier New',
            align: 'center'
        });
        this.closeButton.setOrigin(0.5);
        this.closeButton.setDepth(5001);
        
        // Store UI elements for cleanup
        this.purchaseUIElements = [
            this.purchasePanel,
            this.purchaseTitle,
            this.pointsDisplay,
            this.closeButton,
            ...this.purchaseButtons.map(b => b.button),
            ...this.purchaseButtons.map(b => b.text)
        ];
        
        // Set up ESC key to close
        this.escKey = this.scene.input.keyboard.addKey('ESC');
        this.escKey.on('down', () => {
            this.destroyPurchaseUI();
        });
        
        console.log('🛒 Purchase interface created with auto-close and enhanced affordability styling');
    }
    
    purchaseItem(itemId, item, player) {
        const playerPoints = window.gameState.score || 0;
        const validation = GameConfig.validatePurchase(itemId, playerPoints, player.equipment);
        
        if (!validation.valid) {
            this.showPurchaseError(validation.reason);
            return;
        }
        
        // Process the purchase
        const cost = validation.cost;
        
        // Deduct points
        window.gameState.score -= cost;
        if (window.updateUI) {
            window.updateUI.score(window.gameState.score);
        }
        
        // Give item to player
        if (item.type === 'consumable') {
            // Handle consumables (like health packs)
            if (itemId === 'healthPack') {
                const currentHealth = player.health || 100;
                const maxHealth = player.maxHealth || 100;
                const newHealth = Math.min(currentHealth + item.healAmount, maxHealth);
                player.health = newHealth;
                window.gameState.playerHealth = newHealth;
                if (window.updateUI) {
                    window.updateUI.health(newHealth, maxHealth);
                }
                this.showPurchaseSuccess(`+${item.healAmount} Health`, '#00FF00');
            }
        } else {
            // Handle equipment items
            const equipmentSlot = item.equipmentSlot;
            if (player.equipment && player.equipment[equipmentSlot]) {
                player.equipment[equipmentSlot].count = (player.equipment[equipmentSlot].count || 0) + 1;
                this.showPurchaseSuccess(`+1 ${item.name}`, '#FFD700');
            }
        }
        
        console.log(`💰 Purchased ${item.name} for ${cost} points`);
        
        // Update the purchase interface with new point total
        this.destroyPurchaseUI();
        this.createPurchaseUI(player, window.gameState.score, GameConfig.getPurchasableItems());
        
        // Re-establish player reference for auto-close functionality
        this.purchasingPlayer = player;
        this.lastPlayerCheckTime = this.scene.time.now;
    }
    
    showPurchaseSuccess(message, color = '#00FF00') {
        const successText = this.scene.add.text(this.x, this.y - 150, message, {
            fontSize: '14px',
            fill: color,
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        successText.setOrigin(0.5);
        successText.setDepth(6000);
        
        this.scene.tweens.add({
            targets: successText,
            y: successText.y - 30,
            alpha: 0,
            scale: 1.2,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => successText.destroy()
        });
    }
    
    showPurchaseError(message, color = '#FF0000') {
        const errorText = this.scene.add.text(this.x, this.y - 150, message, {
            fontSize: '12px',
            fill: color,
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        errorText.setOrigin(0.5);
        errorText.setDepth(6000);
        
        this.scene.tweens.add({
            targets: errorText,
            y: errorText.y - 20,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => errorText.destroy()
        });
    }
    
    destroyPurchaseUI() {
        if (this.purchaseUIElements) {
            this.purchaseUIElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.purchaseUIElements = null;
        }
        
        if (this.escKey) {
            this.escKey.destroy();
            this.escKey = null;
        }
        
        // Clear player reference and auto-close functionality
        this.purchasingPlayer = null;
        this.lastPlayerCheckTime = 0;
        
        this.purchaseButtons = null;
    }
    
    handleLootCrateCollection(player) {
        console.log(`📦 Player collecting ${this.contents.type} crate (${this.contents.amount})`);
        
        this.isCollected = true;
        this.isActive = false;
        
        // Apply the contents to the player
        let success = false;
        if (this.contents.type === 'ammo') {
            // Add ammo to player
            const currentAmmo = window.gameState.playerAmmo || 0;
            const maxAmmo = window.gameState.maxAmmo || 120;
            const newAmmo = Math.min(currentAmmo + this.contents.amount, maxAmmo);
            const actualGained = newAmmo - currentAmmo;
            
            if (actualGained > 0) {
                window.gameState.playerAmmo = newAmmo;
                if (window.updateUI) {
                    window.updateUI.ammo(newAmmo, maxAmmo);
                }
                success = true;
                
                console.log(`🔫 Player gained ${actualGained} ammo (${currentAmmo} → ${newAmmo})`);
            }
        } else if (this.contents.type === 'health') {
            // Add health to player
            const currentHealth = player.health || 100;
            const maxHealth = player.maxHealth || 100;
            const newHealth = Math.min(currentHealth + this.contents.amount, maxHealth);
            const actualGained = newHealth - currentHealth;
            
            if (actualGained > 0) {
                player.health = newHealth;
                window.gameState.playerHealth = newHealth;
                if (window.updateUI) {
                    window.updateUI.health(newHealth, maxHealth);
                }
                success = true;
                
                console.log(`❤️ Player gained ${actualGained} health (${currentHealth} → ${newHealth})`);
            }
        } else if (this.contents.type === 'barricade') {
            // Add barricades to player's inventory
            if (player.equipment && player.equipment[3] && player.equipment[3].id === 'barricade') {
                player.equipment[3].count = (player.equipment[3].count || 0) + this.contents.amount;
                success = true;
                
                console.log(`🛡️ Player gained ${this.contents.amount} barricades`);
            } else {
                console.warn('⚠️ Player has no barricade slot in equipment');
            }
        }
        
        if (success) {
            // Create collection feedback
            this.createCollectionFeedback();
            
            // Award points for collecting supplies
            window.gameState.score += 25;
            if (window.updateUI) {
                window.updateUI.score(window.gameState.score);
            }
            
            // Play collection animation
            this.playCollectionAnimation();
            
            return true;
        } else {
            // Player couldn't benefit from this crate (full ammo/health)
            this.isCollected = false;
            this.isActive = true;
            console.log(`📦 Player already at max ${this.contents.type}, crate not collected`);
            
            // Show "FULL" feedback
            this.createFullFeedback();
            return false;
        }
    }
    
    createCollectionFeedback() {
        let color, icon, text;
        
        if (this.contents.type === 'ammo') {
            color = '#FFD700';
            icon = '🔫';
            text = `${icon} +${this.contents.amount} AMMO`;
        } else if (this.contents.type === 'health') {
            color = '#00FF00';
            icon = '❤️';
            text = `${icon} +${this.contents.amount} HEALTH`;
        } else if (this.contents.type === 'barricade') {
            color = '#8B4513';
            icon = '🛡️';
            text = `${icon} +${this.contents.amount} BARRICADES`;
        }
        
        const feedbackText = this.scene.add.text(this.x, this.y - 40, text, {
            fontSize: '14px',
            fill: color,
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        feedbackText.setOrigin(0.5);
        feedbackText.setDepth(3000);
        
        // Animate feedback text
        this.scene.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 30,
            alpha: 0,
            scale: 1.2,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => feedbackText.destroy()
        });
    }
    
    createFullFeedback() {
        const feedbackText = this.scene.add.text(this.x, this.y - 40, 'FULL!', {
            fontSize: '12px',
            fill: '#FF6600',
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        feedbackText.setOrigin(0.5);
        feedbackText.setDepth(3000);
        
        // Animate feedback text
        this.scene.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 20,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => feedbackText.destroy()
        });
    }
    
    playCollectionAnimation() {
        // Create sparkle effect
        this.createSparkleEffect();
        
        // Shrink and fade the crate
        this.scene.tweens.add({
            targets: this,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => this.destroy()
        });
        
        // Animate content icon
        if (this.contentIcon) {
            this.scene.tweens.add({
                targets: this.contentIcon,
                y: this.contentIcon.y - 50,
                alpha: 0,
                scale: this.contentIcon.scale * 2,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    if (this.contentIcon && this.contentIcon.destroy) {
                        this.contentIcon.destroy();
                    }
                }
            });
        }
    }
    
    createSparkleEffect() {
        const sparkleCount = 8;
        let sparkleColor;
        
        if (this.contents.type === 'ammo') {
            sparkleColor = 0xFFD700;
        } else if (this.contents.type === 'health') {
            sparkleColor = 0x00FF00;
        } else if (this.contents.type === 'barricade') {
            sparkleColor = 0x8B4513;
        }
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2;
            const distance = 25;
            const sparkX = this.x + Math.cos(angle) * distance;
            const sparkY = this.y + Math.sin(angle) * distance;
            
            // Create low-poly diamond sparkle
            const sparkle = this.scene.add.graphics();
            sparkle.fillStyle(sparkleColor);
            sparkle.fillTriangle(0, -4, 3, 0, 0, 4);
            sparkle.fillTriangle(0, -4, -3, 0, 0, 4);
            sparkle.x = this.x;
            sparkle.y = this.y;
            sparkle.setDepth(3000);
            
            this.scene.tweens.add({
                targets: sparkle,
                x: sparkX,
                y: sparkY,
                scale: 0,
                alpha: 0,
                rotation: Math.PI * 2,
                duration: 500,
                ease: 'Power2',
                onComplete: () => sparkle.destroy()
            });
        }
    }
    
    update(time, delta) {
        if (!this.isActive || this.isCollected) return;
        
        // Check if player has moved away from supply crate (auto-close purchase UI)
        if (this.isSupplyCrate && this.purchasingPlayer && this.purchaseUIElements) {
            const timeSinceLastCheck = time - this.lastPlayerCheckTime;
            
            // Check distance every 100ms to avoid excessive calculations
            if (timeSinceLastCheck > 100) {
                const distanceToPlayer = Phaser.Math.Distance.Between(
                    this.x, this.y, 
                    this.purchasingPlayer.x, this.purchasingPlayer.y
                );
                
                // Auto-close if player is too far away (80 pixels)
                if (distanceToPlayer > 80) {
                    console.log('🛒 Player moved away from supply crate, closing purchase interface');
                    this.destroyPurchaseUI();
                    this.purchasingPlayer = null;
                }
                
                this.lastPlayerCheckTime = time;
            }
        }
        
        try {
            // Smooth hovering effect (much gentler - only 2 pixels)
            const hoverOffset = Math.sin(time * 0.002 + this.pulsePhase) * 2; // Gentle 2px hover
            this.y = this.baseY + hoverOffset;
            
            // Subtle pulsing scale effect (reduced from 15% to 5%)
            const pulseScale = 1 + Math.sin(time * 0.003 + this.pulsePhase) * 0.05; // Very subtle 5% variation
            this.setScale(this.originalScale.x * pulseScale, this.originalScale.y * pulseScale);
            
            // Update visual effects
            this.updateVisualEffects(time);
            
            // Update content icon position to follow smoothly
            if (this.contentIcon) {
                this.contentIcon.y = (this.baseY - 30) + hoverOffset;
            }
            
        } catch (error) {
            console.error('❌ Error updating loot crate:', error);
        }
    }
    
    updateVisualEffects(time) {
        if (!this.glowEffect) return;
        
        try {
            // Clear previous graphics
            this.glowEffect.clear();
            
            // Choose subtle color based on content type
            const contentColor = this.contents.type === 'ammo' ? 0xFFD700 : 
                               this.contents.type === 'health' ? 0x00FF00 : 0x8B4513;
            
            // Create very subtle glow effect
            const glowIntensity = 0.15 + Math.sin(time * 0.004 + this.pulsePhase) * 0.1; // Much subtler
            
            // Soft circular glow behind crate
            const glowRadius = this.displayWidth * 0.8;
            this.glowEffect.fillStyle(contentColor, glowIntensity * 0.6);
            this.glowEffect.fillCircle(this.x, this.y, glowRadius);
            
            // Add a very subtle highlight on top edge
            this.glowEffect.fillStyle(0xFFFFFF, glowIntensity * 0.3);
            this.glowEffect.fillRect(
                this.x - this.displayWidth/2 + 4, 
                this.y - this.displayHeight/2 - 1, 
                this.displayWidth - 8, 
                2
            );
            
        } catch (error) {
            console.error('❌ Error updating visual effects:', error);
        }
    }
    
    destroy() {
        console.log('🗑️ Destroying military crate...');
        
        try {
            // Clean up purchasing UI if it exists
            this.destroyPurchaseUI();
            
            // Clean up purchasing state
            this.purchasingPlayer = null;
            this.lastPlayerCheckTime = 0;
            
            // Clean up visual effects
            if (this.glowEffect) {
                this.glowEffect.destroy();
                this.glowEffect = null;
            }
            
            if (this.contentIcon) {
                this.contentIcon.destroy();
                this.contentIcon = null;
            }
            
            // Call parent destroy
            super.destroy();
            
        } catch (error) {
            console.error('❌ Error destroying military crate:', error);
            // Still try to call parent destroy even if cleanup fails
            try {
                super.destroy();
            } catch (parentError) {
                console.error('❌ Error calling super.destroy():', parentError);
            }
        }
    }
} 