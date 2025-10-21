// neighborWorker.js
// Receives { particles: [{id,x,y,charge,temperature}], cellSize }
// Returns forces: [{id, fx, fy}]
self.onmessage = function(e) {
  const msg = e.data;
  if (!msg || !msg.particles) return;
  const parts = msg.particles;
  const forces = [];
  // Build simple spatial hash in worker
  const cellSize = msg.cellSize || 60;
  const hash = Object.create(null);
  const key = (x,y) => Math.floor(x/cellSize)+','+Math.floor(y/cellSize);
  for (const p of parts) {
    const k = key(p.x,p.y);
    if (!hash[k]) hash[k]=[];
    hash[k].push(p);
  }
  const neighborsOf = (p, radius) => {
    const xi = Math.floor(p.x/cellSize);
    const yi = Math.floor(p.y/cellSize);
    const found = [];
    for (let dx=-1; dx<=1; dx++) for (let dy=-1; dy<=1; dy++) {
      const k = (xi+dx)+','+(yi+dy);
      const list = hash[k];
      if (!list) continue;
      for (const q of list) {
        const dx2 = q.x-p.x; const dy2 = q.y-p.y;
        if (dx2*dx2 + dy2*dy2 <= radius*radius) found.push(q);
      }
    }
    return found;
  };

  for (const p of parts) {
    let fx = 0; let fy = 0;
    // temperature buoyancy
    if (p.temperature && Math.abs(p.temperature-20) > 0.1) {
      fy += (p.temperature-20) * -0.00002;
    }
    // neighbors
    const neigh = neighborsOf(p, 60);
    if (neigh.length > 3) {
      const f = (neigh.length-3)*0.000002;
      fx += (Math.random()-0.5)*f; fy += (Math.random()-0.5)*f;
    }
    // charge interactions
    if (p.charge) {
      for (const q of neigh) {
        if (q.id === p.id || !q.charge) continue;
        const dx = q.x-p.x; const dy = q.y-p.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 0.01;
        if (dist < 120) {
          const forceMag = (p.charge * q.charge) * 0.00002 / (dist*dist);
          fx += -dx * forceMag; fy += -dy * forceMag;
        }
      }
    }
    if (fx !== 0 || fy !== 0) forces.push({ id: p.id, fx, fy });
  }
  postMessage({ forces });
};
