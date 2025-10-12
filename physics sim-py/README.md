# PhysicsBox Python - Physics Sandbox

A beautiful and interactive physics sandbox built with Python, Flask, and Pymunk physics engine. This is a complete rewrite of the original React-based physics simulator, now running entirely on Python backend with real-time WebSocket communication.

## ✨ Features

### 🎯 Particle Types
- **Bouncing Balls**: Classic elastic spheres with realistic physics
- **Falling Sand**: Granular material simulation with friction
- **Water Drops**: Fluid-like particles with low friction and damping
- **Plasma Energy**: High-energy particles with random colors and high elasticity
- **Metal Chunks**: Heavy, angular metal pieces with high friction

### 🛠️ Tools
- **Normal**: Click to place single particles
- **Spray**: Hold mouse to continuously add particles
- **Gun**: Rapid-fire particle placement
- **Explosion**: Create explosive effects (coming soon)

### 🏗️ Colliders
- **Platform**: Static rectangular platforms
- **Bouncer**: High-elasticity circular bouncers
- **Destroyer**: Sensor-based particle removal zones
- **Magnet**: Attractive/repulsive force fields (coming soon)
- **Portal**: Teleportation systems (coming soon)
- **Spinner**: Rotating force fields (coming soon)

### ⚙️ Physics Controls
- **Gravity**: Adjust gravitational force (0.1x to 3x)
- **Size**: Particle radius (1-30 pixels)
- **Wind**: Horizontal force (-50 to +50)
- **Time Scale**: Slow motion to fast-forward (0.1x to 3x)
- **Color**: Custom particle colors

### 📊 Real-time Stats
- FPS counter
- Particle count
- High score tracking
- Collider count

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip package manager

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd physics sim-py
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5000`

## 🎮 How to Use

### Basic Interaction
- **Click** on the canvas to add particles
- **Hold and drag** with spray tool for continuous placement
- **Use controls** in the left panel to adjust physics parameters
- **Select different tools** and particle types from the interface

### Advanced Features
- **Stress Test**: Add 500 particles at once
- **MEGA Test**: Add 2000 particles for performance testing
- **Clear All**: Remove all particles and colliders
- **Real-time Controls**: Adjust gravity, wind, and time scale while simulation runs

## 🏗️ Project Structure

```
physics sim-py/
├── app.py                 # Flask application with physics simulation
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── styles.css    # Beautiful styling with gradients
    └── js/
        └── main.js       # Frontend logic and WebSocket communication
```

## 🧪 Technical Details

### Backend (Python)
- **Flask**: Web framework for serving the application
- **Pymunk**: 2D physics engine for realistic simulations
- **Flask-SocketIO**: Real-time bidirectional communication
- **Eventlet**: Asynchronous networking for WebSocket support

### Frontend (HTML/CSS/JS)
- **Vanilla JavaScript**: No frameworks, pure browser APIs
- **Canvas API**: Hardware-accelerated 2D rendering
- **Socket.IO**: Real-time communication with backend
- **Modern CSS**: Gradients, animations, and responsive design

### Physics Engine
- **Pymunk**: Chipmunk2D Python bindings
- **Real-time Simulation**: 60 FPS physics updates
- **Boundary Conditions**: Automatic wall and floor collision
- **Custom Properties**: Different materials with unique physics properties

## 🎨 Design Philosophy

This rewrite focuses on:
- **Performance**: Optimized for thousands of particles
- **Beauty**: Modern UI with gradients and animations
- **Simplicity**: Clean, intuitive interface
- **Realism**: Accurate physics simulation
- **Interactivity**: Real-time parameter adjustment

## 🔧 Customization

### Adding New Particle Types
Edit the `add_particle` method in `app.py` to add new particle behaviors:

```python
elif particle_type == 'your_type':
    # Define mass, shape, and physics properties
    pass
```

### Modifying Physics
Adjust the physics simulation in the `PhysicsSim` class:
- Gravity, friction, elasticity values
- Collision detection parameters
- Force application logic

### Styling
Customize the appearance in `static/css/styles.css`:
- Color schemes and gradients
- Animation timings
- Layout and responsiveness

## 🚀 Performance

The application is optimized for:
- **50,000+ particles** with efficient rendering
- **60 FPS** physics simulation
- **Real-time WebSocket** updates
- **Hardware acceleration** via Canvas API

## 🤝 Contributing

Feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Share your creations!

## 📄 License

This project is open source and available under the MIT License.

---

**Enjoy creating physics simulations! ⚡**
