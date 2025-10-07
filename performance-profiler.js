// Performance Profiler for Physics Simulation
// Add this to your React component to monitor performance

export class PhysicsProfiler {
  constructor() {
    this.metrics = {
      frameTime: [],
      renderTime: [],
      physicsTime: [],
      particleCount: [],
      memoryUsage: [],
      fps: [],
      timestamps: []
    };
    this.isRunning = false;
    this.startTime = 0;
    this.lastFrameTime = 0;
    this.maxSamples = 1000; // Keep last 1000 samples
  }

  start() {
    this.isRunning = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    console.log('🚀 Physics Profiler Started');
  }

  stop() {
    this.isRunning = false;
    console.log('⏹️  Physics Profiler Stopped');
    this.generateReport();
  }

  recordFrame(particleCount = 0) {
    if (!this.isRunning) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    const fps = 1000 / frameTime;

    // Record metrics
    this.addMetric('frameTime', frameTime);
    this.addMetric('fps', fps);
    this.addMetric('particleCount', particleCount);
    this.addMetric('timestamps', now - this.startTime);

    // Memory usage (if available)
    if (performance.memory) {
      this.addMetric('memoryUsage', performance.memory.usedJSHeapSize / 1024 / 1024); // MB
    }

    this.lastFrameTime = now;
  }

  recordPhysicsStep(duration) {
    if (!this.isRunning) return;
    this.addMetric('physicsTime', duration);
  }

  recordRenderStep(duration) {
    if (!this.isRunning) return;
    this.addMetric('renderTime', duration);
  }

  addMetric(key, value) {
    this.metrics[key].push(value);
    
    // Keep only recent samples
    if (this.metrics[key].length > this.maxSamples) {
      this.metrics[key].shift();
    }
  }

  getStats(key) {
    const data = this.metrics[key];
    if (data.length === 0) return null;

    const sorted = [...data].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: data.reduce((a, b) => a + b, 0) / data.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      current: data[data.length - 1],
      samples: data.length
    };
  }

  generateReport() {
    console.log('\n📊 PHYSICS PERFORMANCE REPORT');
    console.log('=' .repeat(50));

    const metrics = ['fps', 'frameTime', 'physicsTime', 'renderTime', 'particleCount', 'memoryUsage'];
    
    metrics.forEach(metric => {
      const stats = this.getStats(metric);
      if (!stats) return;

      console.log(`\n${metric.toUpperCase()}:`);
      console.log(`  Current: ${stats.current.toFixed(2)}`);
      console.log(`  Average: ${stats.avg.toFixed(2)}`);
      console.log(`  Min/Max: ${stats.min.toFixed(2)} / ${stats.max.toFixed(2)}`);
      console.log(`  95th percentile: ${stats.p95.toFixed(2)}`);
      console.log(`  Samples: ${stats.samples}`);
    });

    this.analyzePerformance();
    this.generateOptimizationSuggestions();
  }

  analyzePerformance() {
    console.log('\n🔍 PERFORMANCE ANALYSIS:');
    
    const fpsStats = this.getStats('fps');
    const frameStats = this.getStats('frameTime');
    const particleStats = this.getStats('particleCount');
    
    if (fpsStats) {
      if (fpsStats.avg < 30) {
        console.log('  ⚠️  Low FPS detected - performance issues likely');
      } else if (fpsStats.avg < 45) {
        console.log('  ⚡ Moderate FPS - room for improvement');
      } else {
        console.log('  ✅ Good FPS performance');
      }

      // Frame time consistency
      const frameTimeVariance = this.calculateVariance('frameTime');
      if (frameTimeVariance > 100) {
        console.log('  ⚠️  High frame time variance - stuttering likely');
      } else {
        console.log('  ✅ Consistent frame timing');
      }
    }

    if (particleStats && fpsStats) {
      const particlesPerFps = particleStats.avg / fpsStats.avg;
      console.log(`  📊 Performance ratio: ${particlesPerFps.toFixed(2)} particles per FPS`);
      
      if (particlesPerFps > 10) {
        console.log('  🎯 Excellent particle/performance ratio');
      } else if (particlesPerFps > 5) {
        console.log('  👍 Good particle/performance ratio');
      } else {
        console.log('  ⚠️  Poor particle/performance ratio');
      }
    }
  }

  calculateVariance(key) {
    const data = this.metrics[key];
    if (data.length < 2) return 0;
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
    return variance;
  }

  generateOptimizationSuggestions() {
    console.log('\n💡 OPTIMIZATION SUGGESTIONS:');
    
    const fpsStats = this.getStats('fps');
    const particleStats = this.getStats('particleCount');
    const memoryStats = this.getStats('memoryUsage');
    
    if (fpsStats && fpsStats.avg < 45) {
      console.log('  • Reduce particle count or complexity');
      console.log('  • Consider object pooling for particles');
      console.log('  • Implement level-of-detail (LOD) system');
      console.log('  • Use requestAnimationFrame throttling');
    }

    if (particleStats && particleStats.max > 500) {
      console.log('  • Implement particle culling (remove off-screen particles)');
      console.log('  • Use spatial partitioning for collision detection');
      console.log('  • Consider instanced rendering for similar particles');
    }

    if (memoryStats && memoryStats.current > 100) {
      console.log('  • Memory usage is high - check for memory leaks');
      console.log('  • Implement garbage collection friendly patterns');
      console.log('  • Reuse objects instead of creating new ones');
    }

    const frameVariance = this.calculateVariance('frameTime');
    if (frameVariance > 100) {
      console.log('  • Frame time is inconsistent - profile individual operations');
      console.log('  • Consider using Web Workers for heavy computations');
      console.log('  • Implement frame rate limiting');
    }
  }

  exportData() {
    return {
      timestamp: new Date().toISOString(),
      duration: (performance.now() - this.startTime) / 1000,
      metrics: this.metrics,
      stats: Object.keys(this.metrics).reduce((acc, key) => {
        acc[key] = this.getStats(key);
        return acc;
      }, {})
    };
  }

  // Real-time monitoring
  startRealTimeMonitoring(callback, interval = 1000) {
    const monitor = () => {
      if (!this.isRunning) return;
      
      const currentStats = {
        fps: this.getStats('fps')?.current || 0,
        particles: this.getStats('particleCount')?.current || 0,
        memory: this.getStats('memoryUsage')?.current || 0,
        frameTime: this.getStats('frameTime')?.current || 0
      };
      
      callback(currentStats);
      setTimeout(monitor, interval);
    };
    
    monitor();
  }
}

// Usage example for React component:
/*
import { PhysicsProfiler } from './performance-profiler.js';

// In your component:
const profilerRef = useRef(new PhysicsProfiler());

useEffect(() => {
  const profiler = profilerRef.current;
  profiler.start();
  
  // Start real-time monitoring
  profiler.startRealTimeMonitoring((stats) => {
    console.log('Real-time stats:', stats);
  });
  
  return () => profiler.stop();
}, []);

// In your animation loop:
profilerRef.current.recordFrame(particleCount);

// Around physics step:
const physicsStart = performance.now();
// ... physics calculations ...
profilerRef.current.recordPhysicsStep(performance.now() - physicsStart);

// Around render step:
const renderStart = performance.now();
// ... rendering ...
profilerRef.current.recordRenderStep(performance.now() - renderStart);
*/