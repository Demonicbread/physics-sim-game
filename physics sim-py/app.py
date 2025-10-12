from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import pymunk
import threading
import time
import json
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# Physics simulation class
class PhysicsSim:
    def __init__(self):
        self.space = pymunk.Space()
        self.space.gravity = (0, 900)  # Gravity downwards
        self.particles = []
        self.colliders = []
        self.portals = []
        self.magnets = []
        self.explosions = []
        self.lock = threading.Lock()
        self.running = True
        self.wind_force = 0
        self.time_scale = 1
        self.particle_type = 'balls'
        self.particle_size = 5
        self.particle_color = '#ff0000'
        self.magnet_strength = 0
        self.explosion_power = 50
        self.screen_shake = False
        self.particle_trails = False

        # Create static boundaries
        self.create_boundaries()

        # Set up collision handlers
        self.setup_collision_handlers()

    def setup_collision_handlers(self):
        # Define collision types
        PARTICLE_TYPE = 1
        DESTROYER_TYPE = 2
        PORTAL_TYPE = 3
        EXPLOSIVE_TYPE = 4

        # Collision handler for destroyer
        def destroyer_collision(arbiter, space, data):
            particle_shape = arbiter.shapes[0] if arbiter.shapes[0].collision_type == PARTICLE_TYPE else arbiter.shapes[1]
            if particle_shape in self.particles:
                self.particles.remove(particle_shape)
                space.remove(particle_shape, particle_shape.body)
            return False

        # Collision handler for portal
        def portal_collision(arbiter, space, data):
            particle_shape = arbiter.shapes[0] if arbiter.shapes[0].collision_type == PARTICLE_TYPE else arbiter.shapes[1]
            portal_shape = arbiter.shapes[0] if arbiter.shapes[0].collision_type == PORTAL_TYPE else arbiter.shapes[1]
            if particle_shape in self.particles:
                # Find another portal to teleport to
                other_portals = [s for s in self.colliders if hasattr(s, 'portal') and s != portal_shape]
                if other_portals:
                    other_portal = random.choice(other_portals)
                    particle_shape.body.position = other_portal.body.position
            return False

        # Collision handler for explosive
        def explosive_collision(arbiter, space, data):
            explosive_shape = arbiter.shapes[0] if arbiter.shapes[0].collision_type == EXPLOSIVE_TYPE else arbiter.shapes[1]
            if explosive_shape in self.particles:
                self.trigger_explosion(explosive_shape.body.position.x, explosive_shape.body.position.y)
                self.particles.remove(explosive_shape)
                space.remove(explosive_shape, explosive_shape.body)
            return False

        # Add handlers
        destroyer_handler = self.space.add_collision_handler(PARTICLE_TYPE, DESTROYER_TYPE)
        destroyer_handler.begin = destroyer_collision

        portal_handler = self.space.add_collision_handler(PARTICLE_TYPE, PORTAL_TYPE)
        portal_handler.begin = portal_collision

        explosive_handler = self.space.add_collision_handler(EXPLOSIVE_TYPE, 0)  # Explosive with any
        explosive_handler.begin = explosive_collision

    def create_boundaries(self):
        thickness = 30
        width, height = 1200, 700

        # Ground
        ground = pymunk.Body(body_type=pymunk.Body.STATIC)
        ground.position = (width / 2, height + thickness / 2 - 1)
        ground_shape = pymunk.Poly.create_box(ground, (width, thickness))
        ground_shape.friction = 0.8
        ground_shape.elasticity = 0.3
        self.space.add(ground, ground_shape)

        # Left wall
        left_wall = pymunk.Body(body_type=pymunk.Body.STATIC)
        left_wall.position = (-thickness / 2, height / 2)
        left_shape = pymunk.Poly.create_box(left_wall, (thickness, height))
        self.space.add(left_wall, left_shape)

        # Right wall
        right_wall = pymunk.Body(body_type=pymunk.Body.STATIC)
        right_wall.position = (width + thickness / 2, height / 2)
        right_shape = pymunk.Poly.create_box(right_wall, (thickness, height))
        self.space.add(right_wall, right_shape)

        # Ceiling
        ceiling = pymunk.Body(body_type=pymunk.Body.STATIC)
        ceiling.position = (width / 2, -thickness / 2)
        ceiling_shape = pymunk.Poly.create_box(ceiling, (width, thickness))
        self.space.add(ceiling, ceiling_shape)

    def step(self, dt=1/60):
        with self.lock:
            # Apply wind force
            if self.wind_force != 0:
                for shape in self.particles:
                    if hasattr(shape, 'body'):
                        force = (self.wind_force * 0.001, 0)
                        shape.body.apply_force_at_world_point(force, shape.body.position)

            # Apply magnet forces
            if self.magnet_strength != 0:
                for magnet_shape in self.colliders:
                    if hasattr(magnet_shape, 'magnet'):
                        magnet_pos = magnet_shape.body.position
                        for particle_shape in self.particles:
                            if hasattr(particle_shape, 'body'):
                                particle_pos = particle_shape.body.position
                                dx = magnet_pos.x - particle_pos.x
                                dy = magnet_pos.y - particle_pos.y
                                distance = (dx**2 + dy**2)**0.5
                                if distance > 0 and distance < 200:  # Magnet range
                                    force_magnitude = self.magnet_strength / (distance ** 2)
                                    force = (dx / distance * force_magnitude, dy / distance * force_magnitude)
                                    particle_shape.body.apply_force_at_world_point(force, particle_pos)

            self.space.step(dt * self.time_scale)

    def add_particle(self, x, y, particle_type=None, size=None, color=None):
        with self.lock:
            if particle_type is None:
                particle_type = self.particle_type
            if size is None:
                size = self.particle_size
            if color is None:
                color = self.particle_color

            body = None
            shape = None

            if particle_type == 'balls':
                mass = size * 0.1
                moment = pymunk.moment_for_circle(mass, 0, size)
                body = pymunk.Body(mass, moment)
                body.position = x, y
                shape = pymunk.Circle(body, size)
                shape.elasticity = 0.8
                shape.friction = 0.5

            elif particle_type == 'sand':
                mass = size * 0.2
                body = pymunk.Body(mass, pymunk.moment_for_box(mass, (size * 1.5, size * 1.5)))
                body.position = x, y
                shape = pymunk.Poly.create_box(body, (size * 1.5, size * 1.5))
                shape.friction = 0.9
                shape.elasticity = 0.1

            elif particle_type == 'water':
                mass = size * 0.05
                moment = pymunk.moment_for_circle(mass, 0, size * 0.8)
                body = pymunk.Body(mass, moment)
                body.position = x, y
                shape = pymunk.Circle(body, size * 0.8)
                shape.friction = 0.1
                shape.elasticity = 0.1
                shape.damping = 0.02

            elif particle_type == 'plasma':
                mass = size * 0.05
                moment = pymunk.moment_for_circle(mass, 0, size)
                body = pymunk.Body(mass, moment)
                body.position = x, y
                shape = pymunk.Circle(body, size)
                shape.elasticity = 1.2
                shape.friction = 0.01
                # Random color for plasma
                hue = random.randint(240, 360)  # Blue to purple range
                color = f"hsl({hue}, 100%, 70%)"

            elif particle_type == 'metal':
                mass = size * 0.3
                body = pymunk.Body(mass, pymunk.moment_for_box(mass, (size * 2, size * 2)))
                body.position = x, y
                shape = pymunk.Poly.create_box(body, (size * 2, size * 2))
                shape.friction = 0.8
                shape.elasticity = 0.3
                color = '#C0C0C0'

            elif particle_type == 'explosive':
                mass = size * 0.1
                moment = pymunk.moment_for_circle(mass, 0, size)
                body = pymunk.Body(mass, moment)
                body.position = x, y
                shape = pymunk.Circle(body, size)
                shape.elasticity = 0.6
                shape.friction = 0.5
                color = '#FF4500'

            # Add unique attributes for each material type
            if particle_type == 'balls':
                shape.elasticity = 0.8
                shape.friction = 0.5
            elif particle_type == 'sand':
                shape.friction = 0.9
                shape.elasticity = 0.1
            elif particle_type == 'water':
                shape.friction = 0.1
                shape.elasticity = 0.1
                shape.damping = 0.02
            elif particle_type == 'plasma':
                shape.elasticity = 1.2
                shape.friction = 0.01
            elif particle_type == 'metal':
                shape.friction = 0.8
                shape.elasticity = 0.3
            elif particle_type == 'explosive':
                shape.elasticity = 0.6
                shape.friction = 0.5

            if body and shape:
                shape.particle_type = particle_type
                shape.particle_color = color
                shape.particle_size = size
                shape.collision_type = 4 if particle_type == 'explosive' else 1
                self.space.add(body, shape)
                self.particles.append(shape)
                return shape

        return None

    def add_collider(self, x, y, collider_type):
        with self.lock:
            body = None
            shape = None

            if collider_type == 'platform':
                body = pymunk.Body(body_type=pymunk.Body.STATIC)
                body.position = x, y
                shape = pymunk.Poly.create_box(body, (120, 20))
                shape.friction = 0.8
                shape.elasticity = 0.3

            elif collider_type == 'bouncer':
                mass = 10
                moment = pymunk.moment_for_circle(mass, 0, 30)
                body = pymunk.Body(mass, moment)
                body.position = x, y
                shape = pymunk.Circle(body, 30)
                shape.elasticity = 1.8

            elif collider_type == 'destroyer':
                body = pymunk.Body(body_type=pymunk.Body.STATIC)
                body.position = x, y
                shape = pymunk.Poly.create_box(body, (60, 60))
                shape.is_sensor = True
                shape.destroyer = True

            elif collider_type == 'magnet':
                body = pymunk.Body(body_type=pymunk.Body.STATIC)
                body.position = x, y
                shape = pymunk.Circle(body, 40)
                shape.is_sensor = True
                shape.magnet = True

            elif collider_type == 'portal':
                body = pymunk.Body(body_type=pymunk.Body.STATIC)
                body.position = x, y
                shape = pymunk.Circle(body, 35)
                shape.is_sensor = True
                shape.portal = True

            elif collider_type == 'spinner':
                mass = 20
                moment = pymunk.moment_for_box(mass, (100, 20))
                body = pymunk.Body(mass, moment)
                body.position = x, y
                shape = pymunk.Poly.create_box(body, (100, 20))
                shape.friction = 0.1
                shape.elasticity = 0.5
                # Apply angular velocity for spinning
                body.angular_velocity = 5

            if body and shape:
                shape.collider_type = collider_type
                if collider_type == 'destroyer':
                    shape.collision_type = 2
                elif collider_type == 'portal':
                    shape.collision_type = 3
                else:
                    shape.collision_type = 0  # Default
                self.space.add(body, shape)
                self.colliders.append(shape)
                return shape

        return None

    def clear(self):
        with self.lock:
            for shape in self.particles + self.colliders:
                if hasattr(shape, 'body'):
                    self.space.remove(shape, shape.body)
            self.particles.clear()
            self.colliders.clear()

    def set_gravity(self, gravity):
        with self.lock:
            self.space.gravity = (0, gravity * 900)

    def set_wind(self, wind):
        with self.lock:
            self.wind_force = wind

    def set_time_scale(self, scale):
        with self.lock:
            self.time_scale = scale

    def trigger_explosion(self, x, y):
        with self.lock:
            # Find particles near explosion point and apply force
            for shape in self.particles:
                if hasattr(shape, 'body'):
                    dx = shape.body.position.x - x
                    dy = shape.body.position.y - y
                    distance = (dx**2 + dy**2)**0.5
                    if distance < 100:  # Explosion radius
                        force = (dx / distance * self.explosion_power, dy / distance * self.explosion_power)
                        shape.body.apply_impulse_at_world_point(force, shape.body.position)

    def get_state(self):
        with self.lock:
            state = {
                'particles': [],
                'colliders': []
            }

            for shape in self.particles:
                if hasattr(shape, 'body'):
                    pos = shape.body.position
                    particle_data = {
                        'x': pos.x,
                        'y': pos.y,
                        'type': getattr(shape, 'particle_type', 'ball'),
                        'color': getattr(shape, 'particle_color', '#ff0000'),
                        'size': getattr(shape, 'particle_size', 5)
                    }

                    if isinstance(shape, pymunk.Circle):
                        particle_data['radius'] = shape.radius
                        particle_data['shape'] = 'circle'
                    elif isinstance(shape, pymunk.Poly):
                        particle_data['vertices'] = [(v.x, v.y) for v in shape.get_vertices()]
                        particle_data['shape'] = 'poly'

                    state['particles'].append(particle_data)

            for shape in self.colliders:
                if hasattr(shape, 'body'):
                    pos = shape.body.position
                    collider_data = {
                        'x': pos.x,
                        'y': pos.y,
                        'type': getattr(shape, 'collider_type', 'platform')
                    }

                    if isinstance(shape, pymunk.Circle):
                        collider_data['radius'] = shape.radius
                        collider_data['shape'] = 'circle'
                    elif isinstance(shape, pymunk.Poly):
                        collider_data['vertices'] = [(v.x, v.y) for v in shape.get_vertices()]
                        collider_data['shape'] = 'poly'

                    state['colliders'].append(collider_data)

            return state

sim = PhysicsSim()

def physics_thread():
    while sim.running:
        sim.step()
        state = sim.get_state()
        socketio.emit('state_update', json.dumps(state))
        time.sleep(1/60)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def on_connect():
    print('Client connected')

@socketio.on('disconnect')
def on_disconnect():
    print('Client disconnected')

@socketio.on('add_particle')
def on_add_particle(data):
    x = data.get('x', 100)
    y = data.get('y', 100)
    particle_type = data.get('type', sim.particle_type)
    size = data.get('size', sim.particle_size)
    color = data.get('color', sim.particle_color)
    sim.add_particle(x, y, particle_type, size, color)

@socketio.on('add_collider')
def on_add_collider(data):
    x = data.get('x', 100)
    y = data.get('y', 100)
    collider_type = data.get('type', 'platform')
    sim.add_collider(x, y, collider_type)

@socketio.on('set_gravity')
def on_set_gravity(data):
    gravity = data.get('value', 1)
    sim.set_gravity(gravity)

@socketio.on('set_wind')
def on_set_wind(data):
    wind = data.get('value', 0)
    sim.set_wind(wind)

@socketio.on('set_time_scale')
def on_set_time_scale(data):
    scale = data.get('value', 1)
    sim.set_time_scale(scale)

@socketio.on('set_particle_type')
def on_set_particle_type(data):
    particle_type = data.get('type', 'balls')
    sim.particle_type = particle_type

@socketio.on('set_particle_size')
def on_set_particle_size(data):
    size = data.get('size', 5)
    sim.particle_size = size

@socketio.on('set_particle_color')
def on_set_particle_color(data):
    color = data.get('color', '#ff0000')
    sim.particle_color = color

@socketio.on('clear')
def on_clear():
    sim.clear()

@socketio.on('set_magnet_strength')
def on_set_magnet_strength(data):
    strength = data.get('value', 0)
    sim.magnet_strength = strength

@socketio.on('set_explosion_power')
def on_set_explosion_power(data):
    power = data.get('value', 50)
    sim.explosion_power = power

@socketio.on('set_screen_shake')
def on_set_screen_shake(data):
    shake = data.get('value', False)
    sim.screen_shake = shake

@socketio.on('set_particle_trails')
def on_set_particle_trails(data):
    trails = data.get('value', False)
    sim.particle_trails = trails

@socketio.on('trigger_explosion')
def on_trigger_explosion(data):
    x = data.get('x', 600)
    y = data.get('y', 350)
    # Implement explosion logic
    sim.trigger_explosion(x, y)

if __name__ == '__main__':
    thread = threading.Thread(target=physics_thread)
    thread.daemon = True
    thread.start()
    socketio.run(app, host='0.0.0.0', port=5000)
