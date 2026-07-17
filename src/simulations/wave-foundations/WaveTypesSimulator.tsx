import { useEffect, useRef, useState } from 'react';
import styles from './WaveTypesSimulator.module.css';

interface Particle {
  id: number;
  baseX: number;
  baseY: number;
  isTagged: boolean;
}

export default function WaveTypesSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveType, setWaveType] = useState<'transverse' | 'longitudinal'>('transverse');
  const [amplitude, setAmplitude] = useState(30);
  const [frequency, setFrequency] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const animationRef = useRef<number>(0);

  // Initialize particles
  useEffect(() => {
    const p: Particle[] = [];
    const numParticles = 40;
    const spacing = 800 / numParticles;
    for (let i = 0; i <= numParticles; i++) {
      p.push({
        id: i,
        baseX: i * spacing,
        baseY: 100, // vertical center
        isTagged: i === 20 // Tag the middle particle
      });
    }
    particlesRef.current = p;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        timeRef.current += dt;
      }

      const t = timeRef.current;
      const speed = 200; // pixels per second (v)
      const wavelength = speed / frequency; // λ = v / f
      const k = (2 * Math.PI) / wavelength; // wave number
      const w = 2 * Math.PI * frequency; // angular frequency

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid/background
      ctx.strokeStyle = '#e9ecef';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.lineTo(800, 100);
      ctx.stroke();

      // Draw particles
      particlesRef.current.forEach(p => {
        let x = p.baseX;
        let y = p.baseY;

        // The displacement equation: D(x, t) = A * sin(k * x - w * t)
        const displacement = amplitude * Math.sin(k * p.baseX - w * t);

        if (waveType === 'transverse') {
          y += displacement;
        } else {
          x += displacement;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(x, y, p.isTagged ? 8 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = p.isTagged ? '#e03131' : '#1c7ed6';
        ctx.fill();
        
        // Draw equilibrium connector for transverse to show it's a medium
        if (waveType === 'transverse' && !p.isTagged) {
           ctx.beginPath();
           ctx.moveTo(p.baseX, p.baseY);
           ctx.lineTo(x, y);
           ctx.strokeStyle = 'rgba(28, 126, 214, 0.2)';
           ctx.stroke();
        }
      });

      // Draw envelope curve for transverse
      if (waveType === 'transverse') {
        ctx.beginPath();
        for (let ix = 0; ix <= 800; ix += 5) {
          const iy = 100 + amplitude * Math.sin(k * ix - w * t);
          if (ix === 0) ctx.moveTo(ix, iy);
          else ctx.lineTo(ix, iy);
        }
        ctx.strokeStyle = 'rgba(142, 36, 170, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [waveType, amplitude, frequency, isPlaying]);

  return (
    <div className={styles.simulator}>
      <div className={styles.canvasContainer}>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={200}
          className={styles.canvas}
          aria-label="Interactive wave simulation showing particles oscillating."
        />
      </div>
      
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Wave Type:</label>
          <div className={styles.buttonGroup}>
            <button 
              className={waveType === 'transverse' ? styles.active : ''} 
              onClick={() => setWaveType('transverse')}
            >
              Transverse
            </button>
            <button 
              className={waveType === 'longitudinal' ? styles.active : ''} 
              onClick={() => setWaveType('longitudinal')}
            >
              Longitudinal
            </button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="amplitude">Amplitude</label>
          <input 
            id="amplitude"
            type="range" 
            min="10" max="80" 
            value={amplitude} 
            onChange={(e) => setAmplitude(Number(e.target.value))} 
          />
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="frequency">Frequency</label>
          <input 
            id="frequency"
            type="range" 
            min="0.5" max="3" step="0.1"
            value={frequency} 
            onChange={(e) => setFrequency(Number(e.target.value))} 
          />
        </div>

        <div className={styles.controlGroup}>
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
}
