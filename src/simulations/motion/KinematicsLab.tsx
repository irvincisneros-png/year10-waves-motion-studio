import { useState, useRef, useEffect } from 'react';
import styles from './KinematicsLab.module.css';

export default function KinematicsLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);

  // States
  const [velocity, setVelocity] = useState(2); // m/s
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Simulation variables ref
  const sim = useRef({
    x: 0,
    time: 0,
    strobeDots: [] as {x: number, t: number}[],
    path: [] as {t: number, x: number, distance: number}[],
    totalDistance: 0,
    lastX: 0
  });

  const reset = () => {
    setIsPlaying(false);
    sim.current = {
      x: 0,
      time: 0,
      strobeDots: [],
      path: [],
      totalDistance: 0,
      lastX: 0
    };
    drawScene();
    drawGraph();
  };

  const drawScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Track
    const trackY = 150;
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, trackY);
    ctx.lineTo(canvas.width, trackY);
    ctx.stroke();

    // Rulers (meters, scale 10px = 1m)
    // 0 is at center (x = 400)
    const originX = 400;
    ctx.fillStyle = '#868e96';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    
    for (let i = -40; i <= 40; i += 10) {
      const px = originX + i * 10;
      ctx.beginPath();
      ctx.moveTo(px, trackY);
      ctx.lineTo(px, trackY + 10);
      ctx.stroke();
      ctx.fillText(i.toString(), px, trackY + 22);
    }

    ctx.fillText('Position (m)', originX, trackY + 40);

    // Strobe dots
    ctx.fillStyle = 'rgba(224, 49, 49, 0.5)';
    sim.current.strobeDots.forEach(dot => {
      const px = originX + dot.x * 10;
      ctx.beginPath();
      ctx.arc(px, trackY - 20, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cart
    const currentPx = originX + sim.current.x * 10;
    ctx.fillStyle = '#1c7ed6';
    ctx.fillRect(currentPx - 15, trackY - 20, 30, 20);
    // Wheels
    ctx.fillStyle = '#212529';
    ctx.beginPath(); ctx.arc(currentPx - 10, trackY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(currentPx + 10, trackY, 5, 0, Math.PI * 2); ctx.fill();

    // Stats overlay
    ctx.fillStyle = '#12151a';
    ctx.font = '14px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${sim.current.time.toFixed(1)} s`, 10, 20);
    ctx.fillText(`Position (Displacement): ${sim.current.x.toFixed(1)} m`, 10, 40);
    ctx.fillText(`Distance Travelled: ${sim.current.totalDistance.toFixed(1)} m`, 10, 60);
  };

  const drawGraph = () => {
    const canvas = graphRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Axes
    const originY = height / 2;
    const scaleX = 20; // pixels per second
    const scaleY = 3;  // pixels per meter

    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    // Time axis
    ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(width, originY); ctx.stroke();
    // Distance (positive)
    ctx.beginPath(); ctx.moveTo(0, height - 10); ctx.lineTo(width, height - 10); ctx.stroke();

    // Labels
    ctx.fillStyle = '#868e96';
    ctx.font = '12px Inter';
    ctx.fillText('Displacement (m)', 10, 20);
    ctx.fillText('0', 10, originY - 5);
    ctx.fillText('Distance (m) [Below axis]', 10, height - 20);

    if (sim.current.path.length === 0) return;

    // Plot Displacement (Blue)
    ctx.strokeStyle = '#1c7ed6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    sim.current.path.forEach((p, i) => {
      const px = p.t * scaleX;
      const py = originY - p.x * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Plot Distance (Red) - starting from bottom axis to avoid overlap
    ctx.strokeStyle = '#e03131';
    ctx.beginPath();
    sim.current.path.forEach((p, i) => {
      const px = p.t * scaleX;
      const py = (height - 10) - p.distance * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  };

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const loop = (t: number) => {
      const dt = (t - lastTime) / 1000;
      lastTime = t;

      if (isPlaying) {
        sim.current.time += dt;
        const dx = velocity * dt;
        sim.current.x += dx;
        sim.current.totalDistance += Math.abs(dx);

        // Record path
        sim.current.path.push({
          t: sim.current.time,
          x: sim.current.x,
          distance: sim.current.totalDistance
        });

        // Strobe dot every 1 second
        if (Math.floor(sim.current.time) > Math.floor(sim.current.time - dt)) {
          sim.current.strobeDots.push({ x: sim.current.x, t: Math.floor(sim.current.time) });
        }
      }

      drawScene();
      drawGraph();

      // Stop if hitting edge of track or 40 seconds
      if (Math.abs(sim.current.x) > 40 || sim.current.time > 40) {
        setIsPlaying(false);
      } else {
        animationId = requestAnimationFrame(loop);
      }
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, velocity]);

  return (
    <div className={styles.simulator}>
      <div className={styles.viewports}>
        <div className={styles.canvasContainer}>
          <canvas ref={canvasRef} width={800} height={200} className={styles.canvas} />
        </div>
        <div className={styles.graphContainer}>
          <canvas ref={graphRef} width={800} height={200} className={styles.canvas} />
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Velocity (v = {velocity} m/s)</label>
          <input 
            type="range" 
            min="-10" 
            max="10" 
            step="1"
            value={velocity} 
            onChange={(e) => setVelocity(Number(e.target.value))}
            className={styles.slider}
          />
          <small>Positive = Right, Negative = Left</small>
        </div>

        <div className={styles.buttons}>
          <button 
            className={isPlaying ? styles.stopBtn : styles.playBtn}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button className={styles.resetBtn} onClick={reset}>Reset</button>
        </div>
      </div>

      <div className={styles.explanation}>
        <strong>Analysis:</strong> 
        <ul>
          <li><strong>Displacement (Blue Graph)</strong> tracks position from the origin ($x=0$). It can go up or down.</li>
          <li><strong>Distance (Red Graph)</strong> tracks total ground covered. It only ever increases.</li>
          <li><strong>Strobe Dots</strong> are dropped every 1 second. Fast speeds leave dots spread far apart; slow speeds leave dots close together. (Outcome 7.4.2)</li>
        </ul>
      </div>
    </div>
  );
}
