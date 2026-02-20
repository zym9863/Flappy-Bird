[中文](./README.md) | **English**

# Flappy Bird 🐦

A classic Flappy Bird clone implemented with HTML5 Canvas.

## 🎮 Game preview

This project reproduces the classic Flappy Bird gameplay: control the bird to fly through pipe gaps and score as high as possible!

## ✨ Features

- 🎨 Pure Canvas rendering
- 🐤 Cute yellow bird with wing-flapping animation
- 🌿 Classic green pipes as obstacles
- 🏙️ Background with clouds and silhouette buildings
- 📊 Real-time score display
- 🔄 Game over screen and restart
- 📱 Works on desktop and mobile

## 🎯 How to run

1. Clone or download this repository
2. Open `index.html` in your browser
3. Click the "Start Game" button to play

No dependencies — pure frontend.

## 🕹️ Controls

| Action | Effect |
|--------|--------|
| `Space` | Bird flap (move up) |
| `Arrow Up` | Bird flap (move up) |
| Mouse click | Bird flap (move up) |
| Touch (mobile) | Bird flap (move up) |

## 🛠️ Tech stack

- **HTML5** - Page structure
- **CSS3** - Styling
- **JavaScript** - Game logic
- **Canvas API** - Rendering

## 📁 Project structure

```
Flappy Bird/
├── index.html    # Main page
├── script.js     # Game logic
├── style.css     # Styles
└── README.md     # Project (Chinese)
```

## 🎲 Game rules

1. Tap/click or press Space to make the bird flap
2. Gravity makes the bird fall automatically
3. Pass through gaps between pipes to score
4. Hitting a pipe or the ground ends the game
5. Try to beat your high score!

## 🔧 Game parameters

Key parameters (editable in `script.js`):

| Parameter | Value | Description |
|-----------|-------|-------------|
| `GRAVITY` | 0.25  | Gravity |
| `FLAP_SPEED` | -5.5 | Flap velocity |
| `PIPE_WIDTH` | 52 | Pipe width |
| `PIPE_SPACING` | 140 | Vertical gap between pipes |
| `PIPE_SPEED` | 2.5 | Pipe scrolling speed |
| `BIRD_RADIUS` | 12 | Bird radius |

## 📝 Development notes

- Organized with `Bird` and `Pipe` classes
- Uses `requestAnimationFrame` for the game loop
- Collision detection for bird vs pipes and ground

## 📄 License

For learning and entertainment purposes only.

---

Enjoy the game — try to beat your best score! 
