import { useEffect, useRef, useState } from 'react';
import styles from './SoundWaveSimulator.module.css';

export default function SoundWaveSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const timeRef = useRef(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create 150 particles randomly distributed
    const particles = Array.from({ length: 150 }).map(() => ({
      baseX: Math.random() * 800,
      baseY: 40 + Math.random() * 80, // spread vertically for a "tube" look
      isTagged: Math.random() > 0.95 // Tag 5% of particles
    }));

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        timeRef.current += dt;
      }

      const t = timeRef.current;
      const amplitude = 30; // max displacement
      const frequency = 1;
      const speed = 150; // v
      const wavelength = speed / frequency;
      const k = (2 * Math.PI) / wavelength;
      const w = 2 * Math.PI * frequency;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Tube/Pipe Background
      ctx.fillStyle = 'rgba(28, 126, 214, 0.05)';
      ctx.fillRect(0, 30, 800, 100);
      ctx.strokeStyle = '#1c7ed6';
      ctx.strokeRect(0, 30, 800, 100);

      // 1. Draw Longitudinal Particles
      ctx.fillStyle = '#0ca678';
      particles.forEach(p => {
        // D(x,t) = A * sin(kx - wt)
        const displacement = amplitude * Math.sin(k * p.baseX - w * t);
        const x = p.baseX + displacement;
        
        ctx.beginPath();
        ctx.arc(x, p.baseY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = p.isTagged ? '#e03131' : '#495057';
        ctx.fill();
      });

      // 2. Draw Pressure Graph (Transverse Representation)
      const graphY = 220;
      ctx.strokeStyle = '#e9ecef';
      ctx.beginPath();
      ctx.moveTo(0, graphY);
      ctx.lineTo(800, graphY);
      ctx.stroke();

      ctx.beginPath();
      for (let x = 0; x <= 800; x += 5) {
        // Pressure is proportional to the negative derivative of displacement
        // P(x,t) ~ -A * k * cos(kx - wt). Let's shift phase to align visually:
        // Compression (particles bunched) happens when displacement goes from positive to negative.
        // That corresponds to -sin(kx - wt).
        const pressure = -amplitude * Math.sin(k * x - w * t);
        const y = graphY + pressure;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#8e24aa';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#12151a';
      ctx.font = '14px Inter';
      ctx.fillText('Air Particles (Longitudinal Wave)', 10, 20);
      ctx.fillText('Pressure Graph (Mathematical Representation)', 10, 180);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <div className={styles.simulator}>
      <div className={styles.canvasContainer}>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={280}
          className={styles.canvas}
        />
      </div>
      <div className={styles.controls}>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause Animation' : 'Play Animation'}
        </button>
        <p className={styles.explanation}>
          <strong>Notice:</strong> The red tagged particles oscillate back and forth around their starting position. 
          They do not travel across the screen. The <em>energy</em> (the compressions) travels from left to right.
          The pressure graph peaks where particles are most compressed.
        </p>
      </div>
    </div>
  );
}
