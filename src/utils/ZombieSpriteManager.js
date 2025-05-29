export class ZombieSpriteManager {
    static frameMap = {
        down: 0,
        left: 1,
        up: 3,
        right: 1, // use left frame, flip
        idle: 4,
        action: 5
    };

    static setupAnimations(scene) {
        if (!scene.textures.exists('zombie_sprite')) return;
        Object.keys(this.frameMap).forEach(dir => {
            const key = `zombie_${dir}`;
            if (!scene.anims.exists(key)) {
                scene.anims.create({
                    key,
                    frames: scene.anims.generateFrameNumbers('zombie_sprite', {
                        start: this.frameMap[dir],
                        end: this.frameMap[dir]
                    }),
                    frameRate: 8,
                    repeat: -1
                });
            }
        });
    }

    static getFrame(dir) {
        return this.frameMap[dir] ?? this.frameMap.down;
    }
} 