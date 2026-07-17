import { useEffect, useRef, useState } from 'react';
import styles from './MediumVsVacuumSimulator.module.css';

export default function MediumVsVacuumSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPulse, setIsPulse] = useState(true);
  const timeRef = useRef(0);
  const animationRef = useRef<number>(0);
  
  // Basic properties
  const amplitude = 30;
  const frequency = 1;
  const speed = 200; // pixels per second
  const wavelength = speed / frequency;
  const k = (2 * Math.PI) / wavelength;
  const w = 2 * Math.PI * frequency;
  
  // Trigger pulse
  const triggerPulse = () => {
    timeRef.current = 0;
    setIsPlaying(true);
  };

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

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const t = timeRef.current;
      const pulseWidth = 0.5; // seconds
      
      const calculateDisplacement = (x: number, isEM: boolean, isVacuum: boolean) => {
        // A pulse travels at 'speed'. It exists between x = speed * t and x = speed * (t - pulseWidth)
        const waveFront = speed * t;
        const waveBack = speed * (t - pulseWidth);
        
        let active = false;
        if (isPulse) {
          active = x <= waveFront && x >= waveBack;
        } else {
          active = x <= waveFront;
        }

        if (isVacuum && !isEM) return 0; // Mechanical waves don't travel in vacuum

        if (active) {
          return amplitude * Math.sin(k * x - w * t);
        }
        return 0;
      };

      const drawChamber = (yOffset: number, label: string, isEM: boolean, isVacuum: boolean) => {
        ctx.fillStyle = '#12151a';
        ctx.font = '14px Inter';
        ctx.fillText(label, 10, yOffset - 40);

        ctx.strokeStyle = '#e9ecef';
        ctx.beginPath();
        ctx.moveTo(0, yOffset);
        ctx.lineTo(800, yOffset);
        ctx.stroke();

        if (isEM) {
          // Draw EM field as a continuous wave line
          ctx.beginPath();
          let started = false;
          for (let x = 0; x <= 800; x += 5) {
            const dy = calculateDisplacement(x, isEM, isVacuum);
            const waveFront = speed * t;
            if (x <= waveFront) {
              if (!started) {
                ctx.moveTo(x, yOffset + dy);
                started = true;
              } else {
                ctx.lineTo(x, yOffset + dy);
              }
            }
          }
          ctx.strokeStyle = '#8e24aa'; // Violet for EM
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (!isVacuum) {
          // Draw mechanical particles
          for (let i = 0; i <= 40; i++) {
            const baseX = i * 20;
            const dy = calculateDisplacement(baseX, isEM, isVacuum);
            
            ctx.beginPath();
            ctx.arc(baseX, yOffset + dy, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#0ca678'; // Green for mechanical
            ctx.fill();

            // Link particles
            if (i > 0) {
              const prevX = (i - 1) * 20;
              const prevDy = calculateDisplacement(prevX, isEM, isVacuum);
              ctx.beginPath();
              ctx.moveTo(prevX, yOffset + prevDy);
              ctx.lineTo(baseX, yOffset + dy);
              ctx.strokeStyle = 'rgba(12, 166, 120, 0.3)';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      };

      // 1. Mechanical Medium
      drawChamber(80, '1. Mechanical Wave in Medium (Particles)', false, false);
      
      // 2. Vacuum (Mechanical attempt)
      drawChamber(180, '2. Mechanical Wave in Vacuum (No Particles)', false, true);
      
      // 3. EM Wave in Vacuum
      drawChamber(280, '3. Electromagnetic Wave in Vacuum (Field)', true, true);

      // Stop pulse after it leaves screen (800 / 200 = 4 seconds + pulse width)
      if (isPulse && t > 4.5) {
        setIsPlaying(false);
        timeRef.current = 0; // reset for next trigger
      } else if (!isPulse && t > 10) { // arbitrary reset for continuous so it doesn't overflow
        timeRef.current = 0;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, isPulse, amplitude, frequency, speed, k, w]);

  return (
    <div className={styles.simulator}>
      <div className={styles.canvasContainer}>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={340}
          className={styles.canvas}
          aria-label="Simulation showing three chambers: mechanical in medium, mechanical in vacuum, and EM in vacuum."
        />
      </div>
      
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Source Type:</label>
          <div className={styles.buttonGroup}>
            <button 
              className={isPulse ? styles.active : ''} 
              onClick={() => { setIsPulse(true); setIsPlaying(false); timeRef.current = 0; }}
            >
              Pulse
            </button>
            <button 
              className={!isPulse ? styles.active : ''} 
              onClick={() => { setIsPulse(false); setIsPlaying(false); timeRef.current = 0; }}
            >
              Continuous
            </button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <button onClick={triggerPulse} className={styles.primaryButton}>
            Trigger Disturbance
          </button>
          <button onClick={() => { setIsPlaying(false); timeRef.current = 0; }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
