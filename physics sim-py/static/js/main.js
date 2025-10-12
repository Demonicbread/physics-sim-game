// Initialize Socket.IO connection
const socket = io();

// Canvas and context
const canvas = document.getElementById('physics-canvas');
const ctx = canvas.getContext('2d');
const canvasWidth = 1200;
const canvasHeight = 700;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Simulation state
let particles = [];
let colliders = [];
let currentTool = 'normal';
let currentCollider = 'none';
let particleType = 'balls';
let particleSize = 5;
let particleColor = '#ff0000';
let gravity = 1;
let windForce = 0;
let timeScale = 1;

// Mouse state
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;

// Stats
let fps = 60;
let frameCount = 0;
let lastTime = performance.now();
let highScore = 0;

// Mouse event handlers
canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    updateMousePos(e);
    handleMouseDown();
});

canvas.addEventListener('mousemove', (e) => {
    updateMousePos(e);
    if (isMouseDown) {
        handleMouseMove();
    }
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

canvas.addEventListener('mouseleave', () => {
    isMouseDown = false;
});

function updateMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
}

function handleMouseDown() {
    if (currentTool === 'explosion') {
        // Handle explosion
        console.log('Explosion at', mouseX, mouseY);
    } else if (currentTool === 'gun') {
        // Handle gun
        socket.emit('add_particle', { x: mouseX, y: mouseY, radius: particleSize });
    } else if (currentCollider !== 'none') {
        // Handle collider placement
        console.log('Place collider', currentCollider, 'at', mouseX, mouseY);
    } else {
        // Add particle
        socket.emit('add_particle', { x: mouseX, y: mouseY, radius: particleSize });
    }
}

function handleMouseMove() {
    if (currentTool === 'spray' || (currentTool === 'normal' && currentCollider === 'none')) {
        socket.emit('add_particle', { x: mouseX, y: mouseY, radius: particleSize });
    } else if (currentTool === 'gun') {
        socket.emit('add_particle', { x: mouseX, y: mouseY, radius: particleSize });
    }
}

// Control event handlers
document.getElementById('tool-normal').addEventListener('click', () => setTool('normal'));
document.getElementById('tool-spray').addEventListener('click', () => setTool('spray'));
document.getElementById('tool-gun').addEventListener('click', () => setTool('gun'));
document.getElementById('tool-explosion').addEventListener('click', () => setTool('explosion'));

document.getElementById('collider-none').addEventListener('click', () => setCollider('none'));
document.getElementById('collider-platform').addEventListener('click', () => setCollider('platform'));
document.getElementById('collider-bouncer').addEventListener('click', () => setCollider('bouncer'));
document.getElementById('collider-destroyer').addEventListener('click', () => setCollider('destroyer'));

document.getElementById('particle-type').addEventListener('change', (e) => {
    particleType = e.target.value;
});

document.getElementById('add-particle').addEventListener('click', () => {
    socket.emit('add_particle', { x: canvasWidth / 2, y: 100, radius: particleSize });
});

document.getElementById('stress-test').addEventListener('click', () => {
    for (let i = 0; i < 500; i++) {
        const x = canvasWidth / 2 + (Math.random() - 0.5) * 200;
        const y = 100 + (Math.random() - 0.5) * 200;
        socket.emit('add_particle', { x, y, radius: particleSize });
    }
});

document.getElementById('mega-test').addEventListener('click', () => {
    for (let i = 0; i < 2000; i++) {
        const x = canvasWidth / 2 + (Math.random() - 0.5) * 300;
        const y = 100 + (Math.random() - 0.5) * 300;
        socket.emit('add_particle', { x, y, radius: particleSize });
    }
});

document.getElementById('clear').addEventListener('click', () => {
    socket.emit('clear');
    particles = [];
    updateStats();
});

// Range input handlers
document.getElementById('gravity').addEventListener('input', (e) => {
    gravity = parseFloat(e.target.value);
    document.getElementById('gravity-value').textContent = gravity.toFixed(1);
    socket.emit('set_gravity', { value: gravity });
});

document.getElementById('size').addEventListener('input', (e) => {
    particleSize = parseInt(e.target.value);
    document.getElementById('size-value').textContent = particleSize;
    socket.emit('set_particle_size', { size: particleSize });
});

document.getElementById('wind').addEventListener('input', (e) => {
    windForce = parseInt(e.target.value);
    document.getElementById('wind-value').textContent = windForce;
    socket.emit('set_wind', { value: windForce });
});

document.getElementById('time-scale').addEventListener('input', (e) => {
    timeScale = parseFloat(e.target.value);
    document.getElementById('time-scale-value').textContent = timeScale.toFixed(1);
    socket.emit('set_time_scale', { value: timeScale });
});

document.getElementById('color').addEventListener('input', (e) => {
    particleColor = e.target.value;
    socket.emit('set_particle_color', { color: particleColor });
});

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tool-${tool}`).classList.add('active');
}

function setCollider(collider) {
    currentCollider = collider;
    document.querySelectorAll('.collider-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`collider-${collider}`).classList.add('active');
}

// Socket.IO event handlers
socket.on('state_update', (data) => {
    const state = JSON.parse(data);
    particles = state.particles || [];
    colliders = state.colliders || [];
    updateStats();
    render();
});

// Rendering
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw colliders first (behind particles)
    colliders.forEach(collider => {
        ctx.save();
        ctx.translate(collider.x, collider.y);

        if (collider.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, collider.radius, 0, Math.PI * 2);
            ctx.fillStyle = getColliderColor(collider.type);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (collider.shape === 'poly' && collider.vertices) {
            ctx.beginPath();
            ctx.moveTo(collider.vertices[0][0], collider.vertices[0][1]);
            for (let i = 1; i < collider.vertices.length; i++) {
                ctx.lineTo(collider.vertices[i][0], collider.vertices[i][1]);
            }
            ctx.closePath();
            ctx.fillStyle = getColliderColor(collider.type);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    });

    // Draw particles
    particles.forEach(particle => {
        ctx.save();
        ctx.translate(particle.x, particle.y);

        if (particle.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color || particleColor;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (particle.shape === 'poly' && particle.vertices) {
            ctx.beginPath();
            ctx.moveTo(particle.vertices[0][0], particle.vertices[0][1]);
            for (let i = 1; i < particle.vertices.length; i++) {
                ctx.lineTo(particle.vertices[i][0], particle.vertices[i][1]);
            }
            ctx.closePath();
            ctx.fillStyle = particle.color || particleColor;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    });
}

function getColliderColor(type) {
    switch (type) {
        case 'platform': return '#8B4513';
        case 'bouncer': return '#FF1493';
        case 'destroyer': return '#FF0000';
        default: return '#666666';
    }
}

// Stats update
function updateStats() {
    const now = performance.now();
    frameCount++;

    if (now - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastTime));
        document.getElementById('fps').textContent = fps;
        frameCount = 0;
        lastTime = now;

        if (particles.length > highScore) {
            highScore = particles.length;
            document.getElementById('highscore').textContent = highScore;
        }
    }

    document.getElementById('particles').textContent = particles.length;
    document.getElementById('colliders').textContent = colliders.length;
}

// Animation loop
function animate() {
    render();
    requestAnimationFrame(animate);
}

function initCanvas() {
    // Initialization code if needed
    console.log('Canvas initialized');
}

// Initialize
initCanvas();
animate();

// Connection status
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});
