# Zombie Survival (Three.js)

A lightweight modular 2-D zombie survival prototype built on vanilla JavaScript and Three.js.

## Features

* Player movement (WASD / arrow keys).
* Mouse-aimed shooting (hold left click).
* Endless zombie spawning from screen edges.
* Simple collision detection and game-over logic.
* Fully modular code for quick extension.

## Project structure

```
├── index.html          # Entry page + canvas
├── src
│   └── main.js         # Bootstraps the game
│   └── modules
│       ├── Game.js     # Core game engine / loop
│       ├── Player.js   # Player entity
│       ├── Zombie.js   # Zombie entity
│       ├── Bullet.js   # Bullet entity
│       └── InputHandler.js
└── README.md
```

## Getting started

1. **Serve locally** – any static server works. For example using Node's built-in http server:

   ```bash
   npx serve .
   # or
   npx http-server .
   ```

   (You can also just open `index.html`, but some browsers block ES module imports via `file://`.)

2. Open the printed URL (usually http://localhost:5000) and start surviving!

## Extending the game

* Adjust spawn rate in `Game.js` (`spawnInterval`).
* Add health, score keeping, audio, sprite textures, etc.
* Swap primitive circles for textured planes / sprites for richer visuals.

Pull requests are welcome – have fun! 