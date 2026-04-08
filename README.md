# 🐍 Neon Snake Game

A modern, visually stunning Snake Game built with **HTML5 Canvas**, **CSS3**, and **vanilla JavaScript**. Features a neon-glow dark theme, synthesized sound effects, responsive design, and progressive difficulty.

![Neon Snake Game](https://img.shields.io/badge/Status-Live-00ff88?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## 🎮 Live Demo

> 🔗 **[Play Now on GitHub Pages](https://your-username.github.io/snake-game/)**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌙 **Dark Neon Theme** | Sleek dark background with glowing neon-green snake and pink food orb |
| 🎵 **Sound Effects** | Synthesized Web Audio sounds for eating, game over, and level up |
| 📱 **Responsive** | Works on desktop and mobile with touch swipe + on-screen D-Pad |
| 🏆 **High Score** | Persistent high score saved to `localStorage` |
| ⚡ **Progressive Difficulty** | Speed increases every 5 points as you level up |
| ✨ **Particle Effects** | Burst animation when food is eaten |
| ⏸️ **Pause / Resume** | Pause with spacebar, escape key, or on-screen button |
| 🎯 **Collision Detection** | Wall and self-collision with screen shake feedback |
| 👀 **Snake Eyes** | Directional eyes on the snake head for personality |

---

## 📸 Screenshots

| Game Start | Gameplay | Game Over |
|:----------:|:--------:|:---------:|
| *Start screen with neon title* | *Snake eating glowing orbs* | *Game over with final score* |

---

## 🚀 How to Run

### Option 1: Open Directly
1. Clone or download this repository
2. Open `index.html` in any modern browser

### Option 2: Local Server
```bash
# Clone the repository
git clone https://github.com/your-username/snake-game.git
cd snake-game

# Serve with any static server
npx serve .
# or
python -m http.server 8000
```

### Option 3: GitHub Pages
Visit the [live demo link](#-live-demo) above.

---

## 🕹️ Controls

| Input | Action |
|-------|--------|
| `↑ ↓ ← →` | Move snake |
| `W A S D` | Move snake (alternative) |
| `Space / Esc` | Pause / Resume |
| **Swipe** | Mobile touch controls |
| **D-Pad** | On-screen mobile buttons |

---

## 📁 Project Structure

```
snake-game/
├── index.html      # Main HTML with canvas and UI
├── style.css       # Dark neon theme and responsive styles
├── script.js       # Game engine, audio, and rendering
└── README.md       # Project documentation
```

---

## 🛠️ Tech Stack

- **HTML5 Canvas** — Game rendering
- **CSS3** — Glassmorphism, animations, responsive layout
- **Vanilla JavaScript** — Game logic, `requestAnimationFrame` loop
- **Web Audio API** — Synthesized sound effects (no audio files needed)
- **localStorage** — Persistent high score

---

## 🎯 Game Mechanics

- **Grid**: 20×20 cells
- **Starting Speed**: 140ms per step
- **Speed Increase**: -10ms per level (min 50ms)
- **Level Up**: Every 5 food items eaten
- **Scoring**: +1 per food item

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with 💚 by <strong>Your Name</strong>
</p>
