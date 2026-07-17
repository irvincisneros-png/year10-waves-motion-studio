import { useState, useRef, useEffect } from 'react';
import styles from './NewtonsLawsLab.module.css';

export default function NewtonsLawsLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [mass, setMass] = useState(10); // kg
  const [appliedForce, setAppliedForce] = useState(0); // N
  const [friction, setFriction] = useState(0); // N
  const [isPlaying, setIsPlaying] = useState(false);

  // Simulation state
  const sim = useRef({
    x: 0,
    v: 0,
    time: 0
  });

  const reset = () => {
    setIsPlaying(false);
    sim.current = { x: 0, v: 0, time: 0 };
    setAppliedForce(0);
    drawScene();
  };

  const drawScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 50;

    // Ground
    ctx.fillStyle = '#f1f3f5';
    ctx.fillRect(0, cy, canvas.width, canvas.height - cy);
    ctx.strokeStyle = '#adb5bd';
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();

    // Box
    const boxSize = 40 + mass; // visually scales with mass
    const px = cx + sim.current.x * 20 - boxSize / 2;
    
    ctx.fillStyle = '#8c9bc9'; // subtle blue-grey
    ctx.fillRect(px, cy - boxSize, boxSize, boxSize);
    ctx.strokeStyle = '#5c7cfa';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, cy - boxSize, boxSize, boxSize);
    
    ctx.fillStyle = '#12151a';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${mass} kg`, px + boxSize/2, cy - boxSize/2 + 5);

    // Forces Arrows
    const drawArrow = (x: number, y: number, length: number, color: string, label: string) => {
      if (length === 0) return;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      
      const dir = length > 0 ? 1 : -1;
      const absLength = Math.max(Math.abs(length), 20); // min visual length
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dir * absLength, y);
      ctx.stroke();
      
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(x + dir * absLength, y);
      ctx.lineTo(x + dir * absLength - dir * 10, y - 5);
      ctx.lineTo(x + dir * absLength - dir * 10, y + 5);
      ctx.fill();

      ctx.fillText(label, x + dir * absLength / 2, y - 10);
    };

    // Applied Force (Red)
    if (appliedForce !== 0) {
      drawArrow(px + boxSize/2, cy - boxSize/2, appliedForce * 2, '#e03131', `F_app = ${appliedForce} N`);
    }

    // Friction Force (Orange)
    // Direction of friction opposes velocity. If v=0, it opposes applied force.
    let frictionForce = 0;
    if (Math.abs(sim.current.v) > 0.01) {
      frictionForce = sim.current.v > 0 ? -friction : friction;
    } else if (appliedForce !== 0) {
      frictionForce = appliedForce > 0 ? -Math.min(friction, appliedForce) : Math.min(friction, Math.abs(appliedForce));
    }
    
    if (frictionForce !== 0) {
      drawArrow(px + boxSize/2, cy - boxSize + 10, frictionForce * 2, '#f59f00', `F_frict = ${Math.abs(frictionForce).toFixed(1)} N`);
    }

    // Net Force
    const netForce = appliedForce + frictionForce;

    // Kinematics Stats
    ctx.textAlign = 'left';
    ctx.fillStyle = '#495057';
    ctx.fillText(`Net Force (ΣF) = ${netForce.toFixed(1)} N`, 20, 30);
    ctx.fillText(`Acceleration (a) = ΣF/m = ${(netForce/mass).toFixed(2)} m/s²`, 20, 50);
    ctx.fillText(`Velocity (v) = ${sim.current.v.toFixed(2)} m/s`, 20, 70);
  };

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const loop = (t: number) => {
      const dt = Math.min((t - lastTime) / 1000, 0.1);
      lastTime = t;

      if (isPlaying) {
        sim.current.time += dt;

        // Determine friction
        let frictionForce = 0;
        if (Math.abs(sim.current.v) > 0.01) {
          frictionForce = sim.current.v > 0 ? -friction : friction;
        } else if (appliedForce !== 0) {
          frictionForce = appliedForce > 0 ? -Math.min(friction, appliedForce) : Math.min(friction, Math.abs(appliedForce));
        }

        const netForce = appliedForce + frictionForce;
        const a = netForce / mass;
        
        sim.current.v += a * dt;

        // Stop if friction makes v cross 0 while no applied force
        if (appliedForce === 0 && Math.abs(sim.current.v) < 0.1 && friction > 0) {
          sim.current.v = 0;
        }

        sim.current.x += sim.current.v * dt;

        // Boundaries
        if (sim.current.x > 18) sim.current.x = 18;
        if (sim.current.x < -18) sim.current.x = -18;
      }

      drawScene();
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, mass, appliedForce, friction]);

  return (
    <div className={styles.simulator}>
      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} width={800} height={300} className={styles.canvas} />
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Applied Force (N): {appliedForce}</label>
          <input 
            type="range" 
            min="-50" 
            max="50" 
            value={appliedForce} 
            onChange={e => setAppliedForce(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.controlGroup}>
          <label>Mass (kg): {mass}</label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={mass} 
            onChange={e => setMass(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.controlGroup}>
          <label>Kinetic Friction Force (N): {friction}</label>
          <input 
            type="range" 
            min="0" 
            max="50" 
            value={friction} 
            onChange={e => setFriction(Number(e.target.value))}
            className={styles.slider}
          />
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
        <strong>Newton's Laws in Action:</strong>
        <ul>
          <li><strong>1st Law (Inertia):</strong> Set Force and Friction to 0. Notice that if the box is moving, it keeps moving at a constant velocity forever.</li>
          <li><strong>2nd Law (F = ma):</strong> Push with 50N. Increase the mass. Notice the acceleration drops, so velocity increases more slowly.</li>
          <li><strong>Net Force:</strong> Acceleration is determined by Net Force (Applied + Friction).</li>
        </ul>
      </div>
    </div>
  );
}
