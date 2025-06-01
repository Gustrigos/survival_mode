import { Player } from './Player.js';

export class NPCPlayer extends Player {
    constructor(scene, x, y, squadConfig = {}) {
        super(scene, x, y);
        
        // Squad member properties
        this.isNPC = true;
        this.squadConfig = {
            name: squadConfig.name || 'Alpha',
            color: squadConfig.color || 0x00ff00, // Green for NPCs
            followDistance: squadConfig.followDistance || 100, // Increased from 60 - more space from formation position
            maxSeparation: squadConfig.maxSeparation || 250, // Increased from 200 - longer leash before abandoning combat
            formationOffset: squadConfig.formationOffset || { x: 0, y: 0 }, // Formation position relative to leader
            aggroRange: squadConfig.aggroRange || 300, // Range to detect and shoot zombies
            ...squadConfig
        };
        
        // AI behavior properties
        this.target = null; // Current zombie target
        this.lastTargetScanTime = 0;
        this.targetScanInterval = 500; // Scan for targets every 500ms
        this.lastFollowUpdateTime = 0;
        this.followUpdateInterval = 200; // Reduced frequency: Update follow position every 200ms (was 100ms)
        this.isFollowing = true;
        this.isDead = false; // Track death state to prevent multiple death calls
        this.isRetreating = false; // Track if NPC is retreating due to reloading
        
        // Stuck detection and pathfinding persistence
        this.positionHistory = []; // Track recent positions to detect if stuck
        this.stuckCheckInterval = 1000; // Check if stuck every 1 second
        this.lastStuckCheckTime = 0;
        this.isStuck = false;
        this.unstuckAttempts = 0;
        this.maxUnstuckAttempts = 3;
        
        // Persistent pathfinding
        this.currentPathDirection = null; // Current chosen path direction
        this.pathPersistenceTime = 2000; // Stick with chosen path for 2 seconds
        this.lastPathChoiceTime = 0;
        this.alternatePathIndex = 0; // Track which alternate path we're trying
        
        // === SQUAD COMMAND PROPERTIES ===
        this.squadMode = 'follow'; // 'follow' or 'hold' - controlled by player
        this.pingTarget = null; // Specific zombie to focus fire on
        this.pingLocation = null; // Specific location to move to
        this.holdPosition = null; // Position to hold when in 'hold' mode
        this.isExecutingPing = false; // Whether currently executing a ping command
        
        // Create name tag
        this.createNameTag();
        
        // Set different weapon loadout for variety
        if (squadConfig.weapon) {
            this.switchWeapon(squadConfig.weapon);
        }
        
    }
    
    createNameTag() {
        // Create name tag above the player
        this.nameTag = this.scene.add.text(this.x, this.y - 40, this.squadConfig.name, {
            fontSize: '12px',
            fill: `#${this.squadConfig.color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 2,
            alpha: 0.8
        });
        this.nameTag.setOrigin(0.5);
        this.nameTag.setDepth(2000); // High depth to stay above everything
        
        // Removed above-character health bars - using UI panel instead
    }
    
    update(time, delta) {
        // Handle reloading for NPCs (without updating main player's UI)
        if (this.isReloading) {
            const elapsed = time - this.reloadStartTime;
            
            if (elapsed >= this.reloadTime) {
                this.isReloading = false;
                this.ammo = this.maxAmmo;
                this.weapons[this.currentWeapon].ammo = this.ammo;
                
                // End retreat behavior when reloading finishes
                this.isRetreating = false;
                
                // Restore normal name tag color
                if (this.nameTag) {
                    this.nameTag.clearTint();
                }
                
                
                // DO NOT update window.gameState or window.updateUI 
                // (that's only for the main player's HTML UI)
            }
        }
        
        // Update animation (same as parent)
        this.updateAnimation(time);
        
        // Update sprite tint for damage effect (same as parent)
        if (time - this.lastDamageTime < 200) {
            this.setTint(0xff6666); // Red tint when damaged
        } else {
            this.clearTint();
        }
        
        // Update name tag position
        if (this.nameTag) {
            this.nameTag.x = this.x;
            this.nameTag.y = this.y - 40;
        }
        
        // Stuck detection system
        this.updateStuckDetection(time);
        
        // AI behavior updates
        this.updateAI(time, delta);
    }
    
    updateStuckDetection(time) {
        // Only track stuck detection when in follow mode - don't interfere with squad commands
        const isExecutingSquadCommand = (this.squadMode === 'hold' && this.holdPosition) || 
                                       (this.squadMode === 'move' && (this.pingLocation || this.holdPosition)) ||
                                       (this.pingTarget && this.pingTarget.active);
        
        // Reset stuck state when executing squad commands
        if (isExecutingSquadCommand) {
            this.isStuck = false;
            this.unstuckAttempts = 0;
            return; // Don't track position history during squad commands
        }
        
        // Record current position in history
        this.positionHistory.push({ x: this.x, y: this.y, time: time });
        
        // Keep only last 5 seconds of position history
        const cutoffTime = time - 5000;
        this.positionHistory = this.positionHistory.filter(pos => pos.time > cutoffTime);
        
        // Check if stuck every second
        if (time - this.lastStuckCheckTime > this.stuckCheckInterval) {
            this.lastStuckCheckTime = time;
            
            // Calculate if we've made meaningful progress in the last 2 seconds
            const recentHistory = this.positionHistory.filter(pos => pos.time > time - 2000);
            
            if (recentHistory.length > 5) {
                const oldestPos = recentHistory[0];
                const newestPos = recentHistory[recentHistory.length - 1];
                const distanceTraveled = Phaser.Math.Distance.Between(
                    oldestPos.x, oldestPos.y, newestPos.x, newestPos.y
                );
                
                // If moved less than 30 pixels in 2 seconds while trying to move, we're stuck
                if (distanceTraveled < 30 && (this.body.velocity.x !== 0 || this.body.velocity.y !== 0)) {
                    if (!this.isStuck) {
                        this.isStuck = true;
                        this.unstuckAttempts = 0;
                        console.log(`${this.squadConfig.name} detected as stuck! Distance traveled: ${distanceTraveled.toFixed(1)}px`);
                    }
                } else {
                    // Made good progress, no longer stuck
                    if (this.isStuck) {
                        console.log(`${this.squadConfig.name} unstuck! Distance traveled: ${distanceTraveled.toFixed(1)}px`);
                    }
                    this.isStuck = false;
                    this.unstuckAttempts = 0;
                }
            }
        }
    }
    
    updateAI(time, delta) {
        // Check if we're too far from the main player (priority override)
        const distanceToLeader = this.scene.player ? 
            Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y) : 0;
        
        // PRIORITY 1: Execute squad commands FIRST - This takes precedence over everything except emergency retreat
        if (this.executeSquadCommands(distanceToLeader)) {
            return; // Skip all other AI logic when executing specific squad commands
        }
        
        // PRIORITY 2: If reloading and NOT in hold mode, retreat to leader
        if (this.isRetreating && this.isReloading && this.squadMode !== 'hold') {
            this.target = null;
            this.isFollowing = true;
            // Force follow behavior update every frame during retreat for responsiveness
            this.updateFollowBehavior();
            return; // Skip all other AI logic during retreat
        }
        
        // PRIORITY 3: Check if we're blocking the player's line of fire and move out of the way
        if (this.isBlockingPlayer()) {
            this.repositionToAvoidBlocking();
            return; // Skip other AI logic while repositioning
        }
        
        // PRIORITY 4: If too far from leader AND NOT in hold mode, abandon combat and return to formation
        if (distanceToLeader > this.squadConfig.maxSeparation && this.squadMode !== 'hold') {
            this.target = null;
            this.isFollowing = true;
        }
        
        // PRIORITY 5: Scan for zombie targets periodically (but only if not in strict command mode)
        // Only scan for targets if in follow mode or if in hold/move mode and at position
        const canEngageCombat = this.squadMode === 'follow' || 
                               (this.squadMode === 'hold' && this.holdPosition && 
                                Phaser.Math.Distance.Between(this.x, this.y, this.holdPosition.x, this.holdPosition.y) <= 25) ||
                               (this.squadMode === 'move' && this.holdPosition && 
                                Phaser.Math.Distance.Between(this.x, this.y, this.holdPosition.x, this.holdPosition.y) <= 25);
        
        if (time - this.lastTargetScanTime > this.targetScanInterval && 
            distanceToLeader <= this.squadConfig.maxSeparation && 
            !this.isRetreating && canEngageCombat) {
            this.scanForTargets();
            this.lastTargetScanTime = time;
        }
        
        // PRIORITY 6: Shoot at target if we have one and are allowed to engage
        if (this.target && this.target.active && 
            distanceToLeader <= this.squadConfig.maxSeparation && 
            !this.isRetreating && canEngageCombat) {
            this.aimAndShoot();
        }
        
        // PRIORITY 7: Always update follow behavior (but prioritize it when retreating or far from leader)
        if (time - this.lastFollowUpdateTime > this.followUpdateInterval) {
            this.updateFollowBehavior();
            this.lastFollowUpdateTime = time;
        }
        
        // PRIORITY 8: Smart reload logic - reload proactively when safe near leader
        if (!this.isReloading && !this.isRetreating && distanceToLeader <= 50) {
            // If low on ammo and close to leader, reload preemptively for safety
            const ammoPercentage = this.ammo / this.maxAmmo;
            if (ammoPercentage <= 0.2 && !this.target) {
                this.reload();
            }
        }
    }
    
    scanForTargets() {
        if (!this.scene.zombies || !this.scene.player) return;
        
        let closestZombie = null;
        let closestDistance = this.squadConfig.aggroRange;
        
        // Find closest zombie within aggro range
        this.scene.zombies.children.entries.forEach(zombie => {
            if (!zombie.active) return;
            
            const distance = Phaser.Math.Distance.Between(this.x, this.y, zombie.x, zombie.y);
            if (distance < closestDistance) {
                closestZombie = zombie;
                closestDistance = distance;
            }
        });
        
        // Update target
        if (closestZombie) {
            this.target = closestZombie;
            this.isFollowing = false; // Stop following when engaging
        } else if (this.target) {
            // Only update behavior if we previously had a target
            this.target = null;
            // Don't automatically set isFollowing = true here
            // Let the normal follow logic handle positioning
        }
    }
    
    aimAndShoot() {
        if (!this.target || !this.target.active) {
            this.target = null;
            return;
        }
        
        // Check line of sight before shooting to prevent friendly fire
        if (!this.scene.checkLineOfSight(this, this.target)) {
            
            // Try to find a better shooting position
            this.repositionForClearShot();
            return; // Don't shoot if friendly units are in the way
        }
        
        // Calculate direction to target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        
        // Determine which direction to face based on angle - support 8 directions
        let direction = 'down';
        const degrees = Phaser.Math.RadToDeg(angle);
        
        // Map angle ranges to 8 directions including diagonals
        if (degrees >= -22.5 && degrees < 22.5) {
            direction = 'right';
        } else if (degrees >= 22.5 && degrees < 67.5) {
            direction = 'down-right';
        } else if (degrees >= 67.5 && degrees < 112.5) {
            direction = 'down';
        } else if (degrees >= 112.5 && degrees < 157.5) {
            direction = 'down-left';
        } else if (degrees >= 157.5 || degrees < -157.5) {
            direction = 'left';
        } else if (degrees >= -157.5 && degrees < -112.5) {
            direction = 'up-left';
        } else if (degrees >= -112.5 && degrees < -67.5) {
            direction = 'up';
        } else if (degrees >= -67.5 && degrees < -22.5) {
            direction = 'up-right';
        }
        
        // Update NPC direction
        this.setDirection(direction);
        
        // Shoot if we have a clear shot and are facing the right direction
        const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        if (distanceToTarget <= this.squadConfig.aggroRange) {
            this.shoot();
        }
    }
    
    // Reposition to get a clear shot when line of sight is blocked
    repositionForClearShot() {
        if (!this.target || !this.target.active) return;
        
        // Try to find a better shooting position
        const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        const repositionDistance = 60; // Distance to move for repositioning
        
        // Try multiple angles around the current position to find a clear shot
        const angles = [
            targetAngle + Math.PI / 4,      // 45 degrees clockwise
            targetAngle - Math.PI / 4,      // 45 degrees counter-clockwise
            targetAngle + Math.PI / 2,      // 90 degrees clockwise
            targetAngle - Math.PI / 2,      // 90 degrees counter-clockwise
            targetAngle + 3 * Math.PI / 4,  // 135 degrees clockwise
            targetAngle - 3 * Math.PI / 4   // 135 degrees counter-clockwise
        ];
        
        for (let angle of angles) {
            const testX = this.x + Math.cos(angle) * repositionDistance;
            const testY = this.y + Math.sin(angle) * repositionDistance;
            
            // Check if this position would give a clear shot
            // Create a temporary position object for testing
            const testPosition = { x: testX, y: testY, active: true };
            
            if (this.scene.checkLineOfSight(testPosition, this.target)) {
                // Also check that we're not moving too far from formation
                const distanceToLeader = Phaser.Math.Distance.Between(testX, testY, this.scene.player.x, this.scene.player.y);
                
                if (distanceToLeader <= this.squadConfig.maxSeparation) {
                    // Move to this position using smart pathfinding
                    const moveVector = this.calculateSmartMovement(testX, testY);
                    const speed = 150; // Faster repositioning
                    
                    // Apply the calculated movement vector with speed adjustment
                    const velocityX = moveVector.x * (speed / 120);
                    const velocityY = moveVector.y * (speed / 120);
                    
                    this.setVelocity(velocityX, velocityY);
                    
                    const moveAngle = Math.atan2(velocityY, velocityX);
                    this.updateDirectionFromMovement(moveAngle);
                    this.setMoving(true);
                    
                    const degrees = Phaser.Math.RadToDeg(moveAngle);
                    console.log(`${this.squadConfig.name} repositioning for clear shot at angle ${degrees.toFixed(0)}°`);
                    return; // Found a good position, stop looking
                }
            }
        }
        
        // If no good repositioning angle found, just step back a bit to give space
        const backwardAngle = targetAngle + Math.PI; // Opposite direction from target
        const backupDistance = 30;
        const backupX = this.x + Math.cos(backwardAngle) * backupDistance;
        const backupY = this.y + Math.sin(backwardAngle) * backupDistance;
        
        // Only back up if it doesn't take us too far from leader
        const distanceToLeader = Phaser.Math.Distance.Between(backupX, backupY, this.scene.player.x, this.scene.player.y);
        if (distanceToLeader <= this.squadConfig.maxSeparation) {
            this.setVelocity(Math.cos(backwardAngle) * 80, Math.sin(backwardAngle) * 80);
            console.log(`${this.squadConfig.name} backing up to avoid friendly fire`);
        }
    }
    
    updateFollowBehavior() {
        if (!this.scene.player) return;
        
        // === SQUAD COMMAND MODE HANDLING ===
        let desiredX, desiredY;
        
        if (this.squadMode === 'hold' && this.holdPosition) {
            // Hold mode: stay at assigned hold position
            desiredX = this.holdPosition.x;
            desiredY = this.holdPosition.y;
        } else if (this.squadMode === 'move' && this.pingLocation) {
            // Move mode: go to pinged location (but don't hold there permanently)
            desiredX = this.pingLocation.x;
            desiredY = this.pingLocation.y;
        } else {
            // Follow mode or fallback: use formation position relative to leader
            desiredX = this.scene.player.x + this.squadConfig.formationOffset.x;
            desiredY = this.scene.player.y + this.squadConfig.formationOffset.y;
        }
        
        // Add dynamic spacing to prevent overlapping with other squad members
        const spacing = this.calculateDynamicSpacing(desiredX, desiredY);
        desiredX += spacing.x;
        desiredY += spacing.y;
        
        // Calculate distances
        const distanceToDesired = Phaser.Math.Distance.Between(this.x, this.y, desiredX, desiredY);
        const distanceToLeader = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
        
        // Define behavior thresholds
        const deadZone = 25; // Don't move if closer than this to desired position
        const followThreshold = this.squadConfig.followDistance; // 60-100 pixels depending on config
        // Increased buffer from 20 to 30
        
        // Determine if we should follow based on distance and combat status
        // Both follow and move modes use the same logic
        const shouldFollow = this.isRetreating || // Always follow when retreating
                           ((this.squadMode === 'follow' || this.squadMode === 'move') && distanceToDesired > followThreshold) ||
                           distanceToLeader > this.squadConfig.maxSeparation; // Normal max separation for follow/move mode only
        
        // Only move if outside the dead zone AND should follow
        if (shouldFollow && distanceToDesired > deadZone) {
            // Smart pathfinding: calculate movement with obstacle avoidance
            const moveVector = this.calculateSmartMovement(desiredX, desiredY);
            
            // Adjust speed based on distance and retreat status
            let speed = 120; // Base speed
            
            if (this.isRetreating) {
                speed = 250; // Much faster when retreating for protection!
            } else if (distanceToLeader > this.squadConfig.maxSeparation) {
                speed = 220; // Much faster when too far from leader
            } else if (distanceToDesired > followThreshold * 1.5) {
                speed = 180; // Faster when moderately far
            } else {
                speed = 80; // Slower when close to avoid overshooting
            }
            
            // Apply the calculated movement vector with speed adjustment
            const velocityX = moveVector.x * (speed / 120); // Scale to desired speed
            const velocityY = moveVector.y * (speed / 120);
            
            this.setVelocity(velocityX, velocityY);
            
            // Update direction for animation
            const angle = Math.atan2(velocityY, velocityX);
            this.updateDirectionFromMovement(angle);
            this.setMoving(true);
            
            // Set following flag to false when we get close enough
            if (distanceToDesired <= deadZone) {
                this.isFollowing = false;
            }
        } else {
            // Stop moving when in dead zone or when close enough
            this.setVelocity(0, 0);
            this.setMoving(false);
            this.isFollowing = false; // Clear following flag to prevent constant re-triggering
        }
    }
    
    calculateDynamicSpacing(targetX, targetY) {
        // Check for nearby squad members and adjust position to avoid overlapping
        const minSpacing = 45; // Minimum distance between squad members
        let totalPushX = 0;
        let totalPushY = 0;
        
        if (this.scene.squadMembers) {
            this.scene.squadMembers.children.entries.forEach(otherMember => {
                if (otherMember !== this && otherMember.active) {
                    const distance = Phaser.Math.Distance.Between(targetX, targetY, otherMember.x, otherMember.y);
                    
                    if (distance < minSpacing && distance > 0) {
                        // Calculate push vector away from other member
                        const angle = Phaser.Math.Angle.Between(otherMember.x, otherMember.y, targetX, targetY);
                        const pushStrength = (minSpacing - distance) / minSpacing; // Stronger push when closer
                        
                        totalPushX += Math.cos(angle) * pushStrength * 30;
                        totalPushY += Math.sin(angle) * pushStrength * 30;
                    }
                }
            });
        }
        
        return { x: totalPushX, y: totalPushY };
    }
    
    calculateSmartMovement(targetX, targetY) {
        const currentTime = this.scene.time.now;
        
        // Only use stuck detection in follow mode - don't interfere with squad commands
        const isExecutingSquadCommand = (this.squadMode === 'hold' && this.holdPosition) || 
                                       (this.squadMode === 'move' && (this.pingLocation || this.holdPosition)) ||
                                       (this.pingTarget && this.pingTarget.active);
        
        // Special unstuck behavior if detected as stuck AND not executing squad commands
        if (this.isStuck && this.unstuckAttempts < this.maxUnstuckAttempts && !isExecutingSquadCommand) {
            return this.performUnstuckManeuver(targetX, targetY, currentTime);
        }
        
        // If we have a current path direction and it's still valid, stick with it
        // But only in follow mode - always recalculate for squad commands
        if (this.currentPathDirection && 
            (currentTime - this.lastPathChoiceTime) < this.pathPersistenceTime &&
            !isExecutingSquadCommand) {
            
            // Check if current path is still clear
            if (!this.checkForObstacles(this.currentPathDirection.x, this.currentPathDirection.y)) {
                // Path is still clear, keep using it
                return this.currentPathDirection;
            } else {
                // Path is now blocked, need to choose a new one
                console.log(`${this.squadConfig.name} current path blocked, choosing new path`);
                this.currentPathDirection = null;
            }
        }
        
        // Get direct path to target
        const directPath = this.getDirectPathToTarget(targetX, targetY);
        
        // Check for obstacles in the direct path
        const obstacleAhead = this.checkForObstacles(directPath.x, directPath.y);
        
        if (!obstacleAhead) {
            // Direct path is clear, use it and remember it (only in follow mode)
            if (!isExecutingSquadCommand) {
                this.currentPathDirection = directPath;
                this.lastPathChoiceTime = currentTime;
            }
            return directPath;
        }
        
        // Direct path blocked, find alternate path using persistent method
        const alternatePath = this.findPersistentAlternatePath(targetX, targetY, currentTime);
        if (alternatePath) {
            // Remember the path only in follow mode
            if (!isExecutingSquadCommand) {
                this.currentPathDirection = alternatePath;
                this.lastPathChoiceTime = currentTime;
            }
            return alternatePath;
        }
        
        // No clear alternate path, try obstacle avoidance
        const avoidancePath = this.getObstacleAvoidanceVector(targetX, targetY);
        if (!isExecutingSquadCommand) {
            this.currentPathDirection = avoidancePath;
            this.lastPathChoiceTime = currentTime;
        }
        return avoidancePath;
    }
    
    getDirectPathToTarget(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Return normalized direction vector (base speed 120)
            const normalizedX = (dx / distance) * 120;
            const normalizedY = (dy / distance) * 120;
            return { x: normalizedX, y: normalizedY };
        }
        
        return { x: 0, y: 0 };
    }
    
    checkForObstacles(velX, velY) {
        // Check for sandbags in front of NPC
        const lookAheadDistance = 100; // Increased from 70 to 100 - look further ahead
        const futureX = this.x + (velX / 120) * lookAheadDistance; // Assume base speed of 120
        const futureY = this.y + (velY / 120) * lookAheadDistance;
        
        // Check collision with sandbags, barricades, and other solid structures
        if (this.scene.structures) {
            for (let structure of this.scene.structures.children.entries) {
                if (structure.active && (structure.structureType === 'sandbags' || 
                    structure.structureType === 'crashed_helicopter' ||
                    structure.structureType === 'concrete_building' ||
                    structure.structureType === 'damaged_building')) {
                    
                    const distance = Phaser.Math.Distance.Between(futureX, futureY, structure.x, structure.y);
                    
                    // Increased obstacle ranges for better detection
                    let obstacleRange = 50; // Increased from 40 to 50
                    if (structure.structureType === 'crashed_helicopter') obstacleRange = 100; // Increased from 80
                    else if (structure.structureType === 'concrete_building') obstacleRange = 75; // Increased from 60
                    else if (structure.structureType === 'damaged_building') obstacleRange = 65; // Increased from 50
                    
                    if (distance < obstacleRange) {
                        return structure; // Return the obstacle
                    }
                }
            }
        }
        
        // Also check for barricades in the barricadesList
        if (this.scene.barricadesList) {
            for (let barricade of this.scene.barricadesList) {
                if (barricade && barricade.active) {
                    const distance = Phaser.Math.Distance.Between(futureX, futureY, barricade.x, barricade.y);
                    if (distance < 50) { // Within obstacle range for barricades
                        return barricade; // Return the barricade obstacle
                    }
                }
            }
        }
        
        return null;
    }
    
    findPersistentAlternatePath(targetX, targetY, currentTime) {
        // Try multiple directions to find a clear path to target
        // Use a more systematic approach that tries each direction longer
        const angles = [
            Math.PI / 6,     // 30 degrees right
            -Math.PI / 6,    // 30 degrees left
            Math.PI / 4,     // 45 degrees right
            -Math.PI / 4,    // 45 degrees left
            Math.PI / 3,     // 60 degrees right
            -Math.PI / 3,    // 60 degrees left
            Math.PI / 2,     // 90 degrees right
            -Math.PI / 2,    // 90 degrees left
        ];
        
        const baseAngle = Math.atan2(targetY - this.y, targetX - this.x);
        
        // Start from where we left off to avoid constantly switching directions
        for (let i = 0; i < angles.length; i++) {
            const angleIndex = (this.alternatePathIndex + i) % angles.length;
            const testAngle = baseAngle + angles[angleIndex];
            const testVelX = Math.cos(testAngle) * 120;
            const testVelY = Math.sin(testAngle) * 120;
            
            // Check if this direction is clear
            if (!this.checkForObstacles(testVelX, testVelY)) {
                // Update the index for next time
                this.alternatePathIndex = angleIndex;
                console.log(`${this.squadConfig.name} choosing alternate path: ${Phaser.Math.RadToDeg(testAngle).toFixed(0)}°`);
                return { x: testVelX, y: testVelY };
            }
        }
        
        return null; // No clear path found
    }
    
    updateDirectionFromMovement(angle) {
        // Update direction for animation based on movement angle
        let direction = 'down';
        const degrees = Phaser.Math.RadToDeg(angle);
        
        if (degrees >= -22.5 && degrees < 22.5) {
            direction = 'right';
        } else if (degrees >= 22.5 && degrees < 67.5) {
            direction = 'down-right';
        } else if (degrees >= 67.5 && degrees < 112.5) {
            direction = 'down';
        } else if (degrees >= 112.5 && degrees < 157.5) {
            direction = 'down-left';
        } else if (degrees >= 157.5 || degrees < -157.5) {
            direction = 'left';
        } else if (degrees >= -157.5 && degrees < -112.5) {
            direction = 'up-left';
        } else if (degrees >= -112.5 && degrees < -67.5) {
            direction = 'up';
        } else if (degrees >= -67.5 && degrees < -22.5) {
            direction = 'up-right';
        }
        
        this.setDirection(direction);
    }
    
    // Override takeDamage to prevent NPCs from updating main player's HTML UI
    takeDamage(amount) {
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastDamageTime < this.damageImmunityTime) {
            return false; // Still immune
        }
        
        this.health = Math.max(0, this.health - amount);
        this.lastDamageTime = currentTime;
        
        // Removed screen flash effect - only main player should get screen flash
        // NPCs use name tag visual feedback instead for damage indication
        
        // DO NOT update window.gameState.playerHealth or window.updateUI.health 
        // (that's only for the main player's HTML UI)
        
        // Flash name tag when taking damage (NPC-specific visual feedback)
        if (this.nameTag) {
            this.nameTag.setTint(0xff0000);
            
            // Safely create name tag damage tween
            try {
                this.scene.tweens.add({
                    targets: this.nameTag,
                    alpha: 0.3,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        if (this.nameTag && this.nameTag.active) {
                            this.nameTag.clearTint();
                            this.nameTag.setAlpha(0.8);
                        }
                    }
                });
            } catch (error) {
                console.warn(`Error creating name tag tween for ${this.squadConfig.name}:`, error);
                // Fallback: just clear the tint immediately
                if (this.nameTag && this.nameTag.active) {
                    this.nameTag.clearTint();
                    this.nameTag.setAlpha(0.8);
                }
            }
        }
        
        // Check for death
        if (this.health <= 0) {
            this.die();
            return true; // NPC was killed
        }
        
        return false; // NPC was damaged but not killed
    }
    
    // Death handling for NPCs
    die() {
        // Prevent multiple death calls
        if (this.isDead || !this.active) {
            return;
        }
        this.isDead = true;
        
        // Track this death for HUD display
        if (this.scene.trackDestroyedSquadMember) {
            this.scene.trackDestroyedSquadMember(this);
        }
        
        // Create death effects
        this.createDeathEffect();
        
        // Remove from squad members group and destroy
        if (this.scene.squadMembers) {
            this.scene.squadMembers.remove(this, true, true); // Remove and destroy
        } else {
            this.destroy();
        }
    }
    
    // Create death effect for NPCs
    createDeathEffect() {
        // Create blood splats
        for (let i = 0; i < 2; i++) {
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            
            const bloodSplat = this.scene.add.image(this.x + offsetX, this.y + offsetY, 'bloodSplat');
            bloodSplat.setDepth(-5);
            bloodSplat.setAlpha(0.8);
            bloodSplat.setScale(0.3 + Math.random() * 0.3);
            
            if (this.scene.bloodSplats) {
                this.scene.bloodSplats.add(bloodSplat);
            }
            
            // Fade out blood splat over time
            this.scene.tweens.add({
                targets: bloodSplat,
                alpha: 0,
                duration: 12000,
                onComplete: () => bloodSplat.destroy()
            });
        }
        
        // Death message effect
        const deathText = this.scene.add.text(this.x, this.y - 60, `${this.squadConfig.name} KIA`, {
            fontSize: '14px',
            fill: '#ff0000',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 2
        });
        deathText.setOrigin(0.5);
        deathText.setDepth(2100);
        
        // Animate death text with safety check
        try {
            this.scene.tweens.add({
                targets: deathText,
                y: deathText.y - 40,
                alpha: 0,
                duration: 2000,
                ease: 'Power2',
                onComplete: () => {
                    if (deathText && deathText.active) {
                        deathText.destroy();
                    }
                }
            });
        } catch (error) {
            console.warn(`Error creating death text tween for ${this.squadConfig.name}:`, error);
            // Fallback: destroy text immediately
            if (deathText && deathText.active) {
                deathText.destroy();
            }
        }
    }
    
    // Override shoot method to prevent NPCs from updating main player's ammo UI
    shoot() {
        const currentTime = this.scene.time.now;
        
        if (this.isReloading || this.ammo <= 0 || currentTime - this.lastShotTime < this.fireRate) {
            return;
        }
        
        // Calculate bullet direction based on NPC direction
        let bulletVelX = 0;
        let bulletVelY = 0;
        let muzzleOffsetX = 0;
        let muzzleOffsetY = 0;
        
        // Use the physics body center directly
        const playerCenterX = this.body.center.x;
        const playerCenterY = this.body.center.y;
        
        switch (this.direction) {
            case 'up':
                bulletVelY = -this.bulletSpeed;
                muzzleOffsetY = -20;
                break;
            case 'down':
                bulletVelY = this.bulletSpeed;
                muzzleOffsetY = 20;
                break;
            case 'left':
                bulletVelX = -this.bulletSpeed;
                muzzleOffsetX = -20;
                break;
            case 'right':
                bulletVelX = this.bulletSpeed;
                muzzleOffsetX = 20;
                break;
            case 'up-left':
                bulletVelX = -this.bulletSpeed * 0.707; // Normalize diagonal speed
                bulletVelY = -this.bulletSpeed * 0.707;
                muzzleOffsetX = -14; // Diagonal offset
                muzzleOffsetY = -14;
                break;
            case 'up-right':
                bulletVelX = this.bulletSpeed * 0.707;
                bulletVelY = -this.bulletSpeed * 0.707;
                muzzleOffsetX = 14;
                muzzleOffsetY = -14;
                break;
            case 'down-left':
                bulletVelX = -this.bulletSpeed * 0.707;
                bulletVelY = this.bulletSpeed * 0.707;
                muzzleOffsetX = -14;
                muzzleOffsetY = 14;
                break;
            case 'down-right':
                bulletVelX = this.bulletSpeed * 0.707;
                bulletVelY = this.bulletSpeed * 0.707;
                muzzleOffsetX = 14;
                muzzleOffsetY = 14;
                break;
        }
        
        // Create bullet starting from NPC's collision box center
        const bulletStartX = playerCenterX + muzzleOffsetX;
        const bulletStartY = playerCenterY + muzzleOffsetY;
        
        const bullet = this.scene.bullets.get();
        if (bullet) {
            bullet.fire(bulletStartX, bulletStartY, bulletVelX, bulletVelY);
        }
        
        // Create muzzle flash (same as parent)
        this.createMuzzleFlash(muzzleOffsetX, muzzleOffsetY);
        
        // Create shell casing (same as parent)
        this.createShellCasing();
        
        // Update NPC's own ammo (NOT the main player's ammo UI)
        this.ammo--;
        this.weapons[this.currentWeapon].ammo = this.ammo;
        
        // DO NOT update window.gameState.playerAmmo or window.updateUI.ammo
        // (that's only for the main player's HTML UI)
        
        // Auto-reload when empty
        if (this.ammo <= 0) {
            this.reload();
        }
        
        this.lastShotTime = currentTime;
    }
    
    // Override reload method to trigger retreat behavior during vulnerable reloading
    reload() {
        if (this.isReloading || this.ammo >= this.maxAmmo) {
            return;
        }
        
        // Start reloading
        this.isReloading = true;
        this.reloadStartTime = this.scene.time.now;
        
        // Only trigger retreat behavior if NOT in hold mode
        if (this.squadMode !== 'hold') {
            this.isRetreating = true;
            this.target = null; // Abandon current target
            this.isFollowing = true; // Force follow mode
            
            // Visual indication of retreating (subtle name tag color change)
            if (this.nameTag) {
                this.nameTag.setTint(0xffaa00); // Orange tint during retreat
            }
        } else {
            // In hold mode - stay put while reloading, no retreat
            this.target = null; // Still abandon current target while reloading
            
            // Visual indication of reloading in place
            if (this.nameTag) {
                this.nameTag.setTint(0xaaaa00); // Darker yellow tint for reload in place
            }
        }
        
        // DO NOT update window.gameState.isReloading 
        // (that's only for the main player's HTML UI)
    }
    
    // Override for NPC-specific behavior when dying
    destroy() {
        // Clean up name tag and any associated tweens
        if (this.nameTag && this.nameTag.active) {
            try {
                // Kill any tweens targeting the name tag
                this.scene.tweens.killTweensOf(this.nameTag);
                this.nameTag.destroy();
            } catch (error) {
                console.warn(`Error destroying name tag for ${this.squadConfig.name}:`, error);
            }
            this.nameTag = null;
        }
        
        // Call parent destroy
        super.destroy();
    }
    
    // Set formation position for squad coordination
    setFormationOffset(offsetX, offsetY) {
        this.squadConfig.formationOffset.x = offsetX;
        this.squadConfig.formationOffset.y = offsetY;
    }
    
    // Manual target assignment (useful for coordinated attacks)
    assignTarget(zombie) {
        this.target = zombie;
        this.isFollowing = false;
    }
    
    // Get status for UI or debugging
    getStatus() {
        return {
            name: this.squadConfig.name,
            health: this.health,
            ammo: this.ammo,
            hasTarget: !!this.target,
            isFollowing: this.isFollowing,
            position: { x: this.x, y: this.y }
        };
    }
    
    // Check if this NPC is blocking the player's line of fire
    isBlockingPlayer() {
        if (!this.scene.player || !this.scene.player.active) {
            return false;
        }
        
        // Only check blocking if player is moving or has recently moved
        const player = this.scene.player;
        const playerDirection = player.direction;
        
        // Skip check if player is not facing any direction
        if (!playerDirection) {
            return false;
        }
        
        // Calculate player's facing direction vector
        let facingX = 0, facingY = 0;
        switch (playerDirection) {
            case 'up':
                facingY = -1;
                break;
            case 'down':
                facingY = 1;
                break;
            case 'left':
                facingX = -1;
                break;
            case 'right':
                facingX = 1;
                break;
            case 'up-left':
                facingX = -0.707;
                facingY = -0.707;
                break;
            case 'up-right':
                facingX = 0.707;
                facingY = -0.707;
                break;
            case 'down-left':
                facingX = -0.707;
                facingY = 0.707;
                break;
            case 'down-right':
                facingX = 0.707;
                facingY = 0.707;
                break;
        }
        
        // Check if NPC is in front of the player (within 60 pixels in facing direction)
        const directionX = this.x - player.x;
        const directionY = this.y - player.y;
        
        // Project NPC position onto player's facing direction
        const dotProduct = directionX * facingX + directionY * facingY;
        
        // If NPC is in front of player (positive dot product) and close to the line
        if (dotProduct > 0 && dotProduct < 60) {
            // Calculate perpendicular distance from NPC to player's facing line
            const perpendicularDistance = Math.abs(directionX * facingY - directionY * facingX);
            
            // If NPC is within 35 pixels of the player's facing line, they're blocking
            if (perpendicularDistance < 35) {
                return true;
            }
        }
        
        return false;
    }
    
    // Reposition to avoid blocking the player
    repositionToAvoidBlocking() {
        if (!this.scene.player || !this.scene.player.active) return;
        
        // Calculate direction away from player
        const angle = Phaser.Math.Angle.Between(this.scene.player.x, this.scene.player.y, this.x, this.y);
        const repositionDistance = 50; // Distance to move away
        
        // Move perpendicular to avoid blocking player's movement path
        const perpAngle1 = angle + Math.PI / 2; // 90 degrees left
        const perpAngle2 = angle - Math.PI / 2; // 90 degrees right
        
        // Test both perpendicular directions and choose the one that keeps us closer to formation
        const testX1 = this.x + Math.cos(perpAngle1) * repositionDistance;
        const testY1 = this.y + Math.sin(perpAngle1) * repositionDistance;
        const testX2 = this.x + Math.cos(perpAngle2) * repositionDistance;
        const testY2 = this.y + Math.sin(perpAngle2) * repositionDistance;
        
        // Calculate formation position
        const formationX = this.scene.player.x + this.squadConfig.formationOffset.x;
        const formationY = this.scene.player.y + this.squadConfig.formationOffset.y;
        
        // Choose the safer position (one that keeps us within maxSeparation from leader)
        const distanceToLeader1 = Phaser.Math.Distance.Between(this.scene.player.x, this.scene.player.y, testX1, testY1);
        const distanceToLeader2 = Phaser.Math.Distance.Between(this.scene.player.x, this.scene.player.y, testX2, testY2);
        
        let targetX, targetY;
        if (distanceToLeader1 <= this.squadConfig.maxSeparation && distanceToLeader2 <= this.squadConfig.maxSeparation) {
            // Both positions are valid, choose the one closer to our formation position
            const formationX = this.scene.player.x + this.squadConfig.formationOffset.x;
            const formationY = this.scene.player.y + this.squadConfig.formationOffset.y;
            
            const distanceToFormation1 = Phaser.Math.Distance.Between(formationX, formationY, testX1, testY1);
            const distanceToFormation2 = Phaser.Math.Distance.Between(formationX, formationY, testX2, testY2);
            
            if (distanceToFormation1 < distanceToFormation2) {
                targetX = testX1;
                targetY = testY1;
            } else {
                targetX = testX2;
                targetY = testY2;
            }
        } else if (distanceToLeader1 <= this.squadConfig.maxSeparation) {
            targetX = testX1;
            targetY = testY1;
        } else if (distanceToLeader2 <= this.squadConfig.maxSeparation) {
            targetX = testX2;
            targetY = testY2;
        } else {
            // Neither position is safe, use formation offset
            targetX = this.scene.player.x + this.squadConfig.formationOffset.x;
            targetY = this.scene.player.y + this.squadConfig.formationOffset.y;
        }
        
        // Move to target position using smart pathfinding
        const moveVector = this.calculateSmartMovement(targetX, targetY);
        const speed = 100; // Moderate speed for avoidance
        
        // Apply the calculated movement vector with speed adjustment
        const velocityX = moveVector.x * (speed / 120);
        const velocityY = moveVector.y * (speed / 120);
        
        this.setVelocity(velocityX, velocityY);
        
        const moveAngle = Math.atan2(velocityY, velocityX);
        this.updateDirectionFromMovement(moveAngle);
        this.setMoving(true);
        
        console.log(`${this.squadConfig.name} repositioning to avoid blocking player`);
    }
    
    // === SQUAD COMMAND SYSTEM ===
    
    updateSquadCommand() {
        // Skip if game is still initializing
        if (this.scene && !this.scene.squadCommandsInitialized) {
            return;
        }
        
        // Handle mode transitions
        if (this.squadMode === 'hold' && !this.holdPosition) {
            // Switching TO hold mode: set hold position at current location
            this.holdPosition = { x: this.x, y: this.y };
        } else if (this.squadMode === 'follow') {
            // Switching TO follow mode: clear any hold positions (from both hold mode and move commands)
            this.holdPosition = null;
        } else if (this.squadMode === 'move') {
            // Switching TO move mode: clear any existing hold positions from previous hold commands
            // (but keep hold positions created by move commands)
            if (this.holdPosition && !this.isExecutingPing) {
                // Only clear if we're not currently executing a move command
                this.holdPosition = null;
            }
        }
        
        // Set ping execution flag
        this.isExecutingPing = !!(this.pingTarget || this.pingLocation);
        
        // Update name tag to show current command - with safety check
        if (!this.isDead && this.active) {
            this.updateNameTagWithCommand();
        }
    }
    
    executeSquadCommands(distanceToLeader) {
        // Return true if we're handling a specific command and should skip normal AI
        
        // PRIORITY 1: Execute ping target (focus fire)
        if (this.pingTarget && this.pingTarget.active) {
            // Target the pinged zombie specifically
            this.target = this.pingTarget;
            this.aimAndShoot();
            
            // Show we're executing focus fire command
            if (this.nameTag && this.nameTag.active && !this.isDead) {
                try {
                    this.nameTag.setText(`${this.squadConfig.name} [FOCUS]`);
                    this.nameTag.setTint(0xff0000); // Red tint for focus fire
                } catch (error) {
                    console.warn(`Error updating name tag for focus fire: ${this.squadConfig.name}`, error);
                }
            }
            
            return true; // Skip normal AI
        }
        
        // PRIORITY 2: Execute ping location (move to position) - works in both follow and move modes
        if (this.pingLocation && (this.squadMode === 'follow' || this.squadMode === 'move')) {
            const distanceToPing = Phaser.Math.Distance.Between(this.x, this.y, this.pingLocation.x, this.pingLocation.y);
            
            if (distanceToPing > 30) { // Move towards ping location
                // Clear target to focus on movement
                this.target = null;
                
                // Use smart pathfinding for ping movement
                const moveVector = this.calculateSmartMovement(this.pingLocation.x, this.pingLocation.y);
                const speed = 180; // Fast movement for ping commands
                
                // Apply the calculated movement vector with speed adjustment
                const velocityX = moveVector.x * (speed / 120); // Scale to desired speed
                const velocityY = moveVector.y * (speed / 120);
                
                this.setVelocity(velocityX, velocityY);
                
                const angle = Math.atan2(velocityY, velocityX);
                this.updateDirectionFromMovement(angle);
                this.setMoving(true);
                
                // Show we're executing move command
                if (this.nameTag && this.nameTag.active && !this.isDead) {
                    try {
                        this.nameTag.setText(`${this.squadConfig.name} [MOVE]`);
                        this.nameTag.setTint(0x00ffff); // Cyan tint for movement
                    } catch (error) {
                        console.warn(`Error updating name tag for move: ${this.squadConfig.name}`, error);
                    }
                }
                
                return true; // Skip normal AI
            } else {
                // Reached ping location
                if (this.squadMode === 'move') {
                    // In move mode: convert ping location to hold position
                    this.holdPosition = { x: this.pingLocation.x, y: this.pingLocation.y };
                    this.pingLocation = null;
                    this.isExecutingPing = false;
                } else {
                    // In follow mode: just clear the ping and resume following
                    this.pingLocation = null;
                    this.isExecutingPing = false;
                }
            }
        }
        
        // PRIORITY 3: Hold position mode - absolute hold
        if (this.squadMode === 'hold' && this.holdPosition) {
            const distanceToHold = Phaser.Math.Distance.Between(this.x, this.y, this.holdPosition.x, this.holdPosition.y);
            
            if (distanceToHold > 25) { // Return to hold position if moved too far
                // Clear target to focus on returning to position
                this.target = null;
                
                // Use smart pathfinding to return to hold position
                const moveVector = this.calculateSmartMovement(this.holdPosition.x, this.holdPosition.y);
                const speed = 120; // Moderate speed to return to position
                
                // Apply the calculated movement vector with speed adjustment
                const velocityX = moveVector.x * (speed / 120);
                const velocityY = moveVector.y * (speed / 120);
                
                this.setVelocity(velocityX, velocityY);
                
                const angle = Math.atan2(velocityY, velocityX);
                this.updateDirectionFromMovement(angle);
                this.setMoving(true);
                
                // Show we're returning to hold position
                if (this.nameTag && this.nameTag.active && !this.isDead) {
                    try {
                        this.nameTag.setText(`${this.squadConfig.name} [HOLD]`);
                        this.nameTag.setTint(0xff6600); // Orange tint for hold
                    } catch (error) {
                        console.warn(`Error updating name tag for hold: ${this.squadConfig.name}`, error);
                    }
                }
                
                return true; // Skip normal AI
            } else {
                // At hold position, just scan for targets but don't move
                this.setVelocity(0, 0);
                this.setMoving(false);
                
                // Show we're holding position
                if (this.nameTag && this.nameTag.active && !this.isDead) {
                    try {
                        this.nameTag.setText(`${this.squadConfig.name} [HOLD]`);
                        this.nameTag.setTint(0xff6600); // Orange tint for hold
                    } catch (error) {
                        console.warn(`Error updating name tag for hold stationary: ${this.squadConfig.name}`, error);
                    }
                }
                
                return true; // Skip normal follow AI - stay in position
            }
        }
        
        // PRIORITY 4: Move mode - handle hold positions created by move commands
        if (this.squadMode === 'move' && this.holdPosition) {
            const distanceToHold = Phaser.Math.Distance.Between(this.x, this.y, this.holdPosition.x, this.holdPosition.y);
            
            if (distanceToHold > 25) { // Return to move destination if moved too far
                // Clear target to focus on returning to position
                this.target = null;
                
                // Use smart pathfinding to return to move destination
                const moveVector = this.calculateSmartMovement(this.holdPosition.x, this.holdPosition.y);
                const speed = 120; // Moderate speed to return to position
                
                // Apply the calculated movement vector with speed adjustment
                const velocityX = moveVector.x * (speed / 120);
                const velocityY = moveVector.y * (speed / 120);
                
                this.setVelocity(velocityX, velocityY);
                
                const angle = Math.atan2(velocityY, velocityX);
                this.updateDirectionFromMovement(angle);
                this.setMoving(true);
                
                // Show we're returning to move destination
                if (this.nameTag && this.nameTag.active && !this.isDead) {
                    try {
                        this.nameTag.setText(`${this.squadConfig.name} [MOVE]`);
                        this.nameTag.setTint(0x00ffff); // Cyan tint for move mode
                    } catch (error) {
                        console.warn(`Error updating name tag for move hold: ${this.squadConfig.name}`, error);
                    }
                }
                
                return true; // Skip normal AI
            } else {
                // At move destination, just scan for targets but don't move
                this.setVelocity(0, 0);
                this.setMoving(false);
                
                // Show we're holding at move destination
                if (this.nameTag && this.nameTag.active && !this.isDead) {
                    try {
                        this.nameTag.setText(`${this.squadConfig.name} [MOVE]`);
                        this.nameTag.setTint(0x00ffff); // Cyan tint for move mode
                    } catch (error) {
                        console.warn(`Error updating name tag for move hold stationary: ${this.squadConfig.name}`, error);
                    }
                }
                
                return true; // Skip normal follow AI - stay at move destination
            }
        }
        
        // If not executing any specific command, restore normal name tag
        if (!this.isDead && this.active) {
            this.updateNameTagWithCommand();
        }
        
        return false; // Continue with normal AI
    }
    
    updateNameTagWithCommand() {
        if (!this.nameTag || !this.nameTag.active) return;
        
        try {
            // Reset to normal name and color
            this.nameTag.setText(this.squadConfig.name);
            this.nameTag.clearTint();
            
            // Add mode indicator
            if (this.squadMode === 'hold') {
                this.nameTag.setText(`${this.squadConfig.name} [H]`); // H for Hold
                this.nameTag.setTint(0xffaa00); // Light orange for hold mode
            } else if (this.squadMode === 'move') {
                this.nameTag.setText(`${this.squadConfig.name} [M]`); // M for Move
                this.nameTag.setTint(0x00ffff); // Cyan for move mode
            }
        } catch (error) {
            console.warn(`Error updating name tag for ${this.squadConfig.name}:`, error);
        }
    }
    
    performUnstuckManeuver(targetX, targetY, currentTime) {
        this.unstuckAttempts++;
        console.log(`${this.squadConfig.name} performing unstuck maneuver #${this.unstuckAttempts}`);
        
        // Try different unstuck strategies based on attempt number
        switch (this.unstuckAttempts) {
            case 1:
                // First attempt: Move directly away from nearest obstacle
                return this.moveAwayFromNearestObstacle();
                
            case 2:
                // Second attempt: Find the furthest entrance and go there
                return this.moveToFurthestEntrance(targetX, targetY);
                
            case 3:
                // Third attempt: Random direction to break out of stuck state
                return this.moveInRandomDirection();
                
            default:
                // Fallback: force movement toward target regardless of obstacles
                this.isStuck = false; // Reset stuck state
                return this.getDirectPathToTarget(targetX, targetY);
        }
    }
    
    moveAwayFromNearestObstacle() {
        let nearestObstacle = null;
        let nearestDistance = Infinity;
        
        // Find nearest obstacle in structures
        if (this.scene.structures) {
            this.scene.structures.children.entries.forEach(structure => {
                if (structure.active && (structure.structureType === 'sandbags' || 
                    structure.structureType === 'crashed_helicopter' ||
                    structure.structureType === 'concrete_building' ||
                    structure.structureType === 'damaged_building')) {
                    
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, structure.x, structure.y);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestObstacle = structure;
                    }
                }
            });
        }
        
        // Also find nearest barricade
        if (this.scene.barricadesList) {
            this.scene.barricadesList.forEach(barricade => {
                if (barricade && barricade.active) {
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, barricade.x, barricade.y);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestObstacle = barricade;
                    }
                }
            });
        }
        
        if (nearestObstacle) {
            // Move directly away from nearest obstacle
            const awayAngle = Phaser.Math.Angle.Between(nearestObstacle.x, nearestObstacle.y, this.x, this.y);
            return {
                x: Math.cos(awayAngle) * 120,
                y: Math.sin(awayAngle) * 120
            };
        }
        
        // No obstacle found, move in random direction
        return this.moveInRandomDirection();
    }
    
    moveToFurthestEntrance(targetX, targetY) {
        const entrances = this.findNearestEntrances(targetX, targetY);
        
        if (entrances.length > 0) {
            // Choose the furthest entrance (might be less crowded)
            const furthestEntrance = entrances[entrances.length - 1];
            const dx = furthestEntrance.x - this.x;
            const dy = furthestEntrance.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                console.log(`${this.squadConfig.name} heading to furthest entrance at (${furthestEntrance.x}, ${furthestEntrance.y})`);
                return {
                    x: (dx / distance) * 120,
                    y: (dy / distance) * 120
                };
            }
        }
        
        return this.moveInRandomDirection();
    }
    
    moveInRandomDirection() {
        const randomAngle = Math.random() * Math.PI * 2;
        console.log(`${this.squadConfig.name} moving in random direction: ${Phaser.Math.RadToDeg(randomAngle).toFixed(0)}°`);
        return {
            x: Math.cos(randomAngle) * 120,
            y: Math.sin(randomAngle) * 120
        };
    }
    
    getObstacleAvoidanceVector(targetX, targetY) {
        // Find the closest sandbag entrance by checking gaps in the perimeter
        const entrances = this.findNearestEntrances(targetX, targetY);
        
        if (entrances.length > 0) {
            // Move towards the closest entrance
            const closestEntrance = entrances[0];
            const dx = closestEntrance.x - this.x;
            const dy = closestEntrance.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                return {
                    x: (dx / distance) * 120,
                    y: (dy / distance) * 120
                };
            }
        }
        
        // Fallback: move perpendicular to obstacle
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        // Try moving perpendicular to the direct path
        const perpX = -dy;
        const perpY = dx;
        const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
        
        if (perpLength > 0) {
            const normalizedPerpX = (perpX / perpLength) * 120 * 0.8;
            const normalizedPerpY = (perpY / perpLength) * 120 * 0.8;
            
            // Randomly choose left or right
            const direction = Math.random() > 0.5 ? 1 : -1;
            return { 
                x: normalizedPerpX * direction, 
                y: normalizedPerpY * direction 
            };
        }
        
        // Final fallback: move towards target anyway
        return this.getDirectPathToTarget(targetX, targetY);
    }
    
    findNearestEntrances(targetX, targetY) {
        // Define known entrance positions based on sandbag layout
        // These correspond to the gaps left in createCrashSiteSandbags()
        const helicopterX = 1000;
        const helicopterY = 750;
        
        const knownEntrances = [
            // Main northern entrance (between x-72 to x+72) - wider approach
            { x: helicopterX - 20, y: helicopterY - 220 }, // Left approach
            { x: helicopterX, y: helicopterY - 220 },      // Center approach
            { x: helicopterX + 20, y: helicopterY - 220 }, // Right approach
            
            // Southern entrances with wider approaches
            { x: helicopterX - 88, y: helicopterY + 220 }, // Left southern entrance
            { x: helicopterX - 60, y: helicopterY + 220 }, // Left approach
            { x: helicopterX + 50, y: helicopterY + 220 },  // Right approach  
            { x: helicopterX + 80, y: helicopterY + 220 },  // Right southern entrance
            
            // Western entrance with approach angles
            { x: helicopterX - 290, y: helicopterY - 30 }, // North approach
            { x: helicopterX - 290, y: helicopterY },      // Direct approach
            { x: helicopterX - 290, y: helicopterY + 30 }, // South approach
            
            // Eastern entrance with approach angles
            { x: helicopterX + 290, y: helicopterY - 30 }, // North approach
            { x: helicopterX + 290, y: helicopterY },      // Direct approach
            { x: helicopterX + 290, y: helicopterY + 30 }, // South approach
            
            // Additional corner waypoints for better navigation
            { x: helicopterX - 250, y: helicopterY - 180 }, // Northwest corner
            { x: helicopterX + 250, y: helicopterY - 180 }, // Northeast corner
            { x: helicopterX - 250, y: helicopterY + 180 }, // Southwest corner
            { x: helicopterX + 250, y: helicopterY + 180 }, // Southeast corner
        ];
        
        // Sort entrances by distance from current position
        const entranceDistances = knownEntrances.map(entrance => {
            const distanceFromNPC = Phaser.Math.Distance.Between(this.x, this.y, entrance.x, entrance.y);
            const distanceToTarget = Phaser.Math.Distance.Between(entrance.x, entrance.y, targetX, targetY);
            
            return {
                ...entrance,
                totalDistance: distanceFromNPC + distanceToTarget * 0.3 // Reduced weight for target distance
            };
        });
        
        // Return sorted by total distance (closest first)
        return entranceDistances.sort((a, b) => a.totalDistance - b.totalDistance);
    }
} 