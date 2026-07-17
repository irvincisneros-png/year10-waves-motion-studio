import { useState, useRef, useEffect } from 'react';
import styles from './AbsorptionScattering.module.css';

type LightColor = 'white' | 'red' | 'green' | 'blue';
type MediumType = 'vacuum' | 'red-filter' | 'green-leaf' | 'atmosphere';

export default function AbsorptionScattering() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sourceLight, setSourceLight] = useState<LightColor>('white');
  const [medium, setMedium] = useState<MediumType>('atmosphere');
  const [particleCount, setParticleCount] = useState<number>(50); // Air density for atmosphere

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simulation dimensions
    const width = canvas.width;
    const height = canvas.height;
    const mediumStartX = width * 0.3;
    const mediumEndX = width * 0.7;

    let animationId: number;
    let time = 0;

    // Particles for scattering
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: mediumStartX + Math.random() * (mediumEndX - mediumStartX),
      y: Math.random() * height,
      size: Math.random() * 2 + 1
    }));

    // Rays traveling left to right
    // Each ray has a color, y position, and current x position
    interface Ray {
      id: number;
      x: number;
      y: number;
      color: string;
      speed: number;
      state: 'travel' | 'scatter' | 'absorb';
      scatterAngle?: number;
      wavelengthType: 'red' | 'green' | 'blue';
    }

    let rays: Ray[] = [];
    let rayIdCounter = 0;

    const spawnRays = () => {
      // Spawn new rays at x=0
      if (Math.random() > 0.3) {
        const y = height * 0.2 + Math.random() * height * 0.6;
        
        let colorsToSpawn: Array<'red' | 'green' | 'blue'> = [];
        if (sourceLight === 'white') colorsToSpawn = ['red', 'green', 'blue'];
        else colorsToSpawn = [sourceLight as 'red' | 'green' | 'blue'];

        colorsToSpawn.forEach(c => {
          let hex = c === 'red' ? '#ff6b6b' : c === 'green' ? '#51cf66' : '#339af0';
          rays.push({
            id: rayIdCounter++,
            x: 0,
            y: y + (Math.random() * 4 - 2), // slight offset
            color: hex,
            speed: 5,
            state: 'travel',
            wavelengthType: c as any
          });
        });
      }
    };

    const render = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      // Draw medium background
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      if (medium === 'red-filter') ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
      if (medium === 'green-leaf') ctx.fillStyle = 'rgba(81, 207, 102, 0.2)';
      if (medium === 'atmosphere') ctx.fillStyle = 'rgba(51, 154, 240, 0.1)';
      ctx.fillRect(mediumStartX, 0, mediumEndX - mediumStartX, height);
      
      // Draw border
      ctx.strokeStyle = '#495057';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(mediumStartX, 0); ctx.lineTo(mediumStartX, height);
      ctx.moveTo(mediumEndX, 0); ctx.lineTo(mediumEndX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw particles if atmosphere
      if (medium === 'atmosphere') {
        ctx.fillStyle = '#ced4da';
        particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      spawnRays();

      // Update and draw rays
      for (let i = rays.length - 1; i >= 0; i--) {
        const r = rays[i];
        
        if (r.state === 'travel') {
          r.x += r.speed;

          // Check interactions in medium
          if (r.x > mediumStartX && r.x < mediumEndX) {
            
            // Filter logic (Absorption)
            if (medium === 'red-filter' && r.wavelengthType !== 'red') {
              if (Math.random() < 0.05) r.state = 'absorb'; // Slowly absorb over distance
            }
            if (medium === 'green-leaf' && r.wavelengthType !== 'green') {
              if (Math.random() < 0.05) r.state = 'absorb';
            }

            // Atmosphere logic (Scattering - Rayleigh)
            if (medium === 'atmosphere') {
              // Blue scatters much more than red
              let scatterProb = 0.001; // Red
              if (r.wavelengthType === 'green') scatterProb = 0.003;
              if (r.wavelengthType === 'blue') scatterProb = 0.01 * (particleCount / 50); // Scale by density

              if (Math.random() < scatterProb) {
                r.state = 'scatter';
                r.scatterAngle = Math.random() * Math.PI * 2;
              }
            }
          }
        } else if (r.state === 'scatter') {
          r.x += r.speed * Math.cos(r.scatterAngle!);
          r.y += r.speed * Math.sin(r.scatterAngle!);
        }
        
        // Draw
        if (r.state !== 'absorb') {
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Tail
          ctx.strokeStyle = r.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          if (r.state === 'travel') {
            ctx.moveTo(r.x - 10, r.y);
          } else {
            ctx.moveTo(r.x - 10 * Math.cos(r.scatterAngle!), r.y - 10 * Math.sin(r.scatterAngle!));
          }
          ctx.lineTo(r.x, r.y);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        } else {
          // Absorbed - draw small glow
          ctx.fillStyle = r.color;
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Remove off-screen or absorbed rays
        if (r.x > width + 50 || r.x < -50 || r.y > height + 50 || r.y < -50 || (r.state === 'absorb' && Math.random() < 0.1)) {
          rays.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [sourceLight, medium, particleCount]);

  return (
    <div className={styles.simulator}>
      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} width={800} height={300} className={styles.canvas} />
        
        <div className={styles.labels}>
          <span style={{ left: '10%' }}>Source Light</span>
          <span style={{ left: '50%' }}>Medium</span>
          <span style={{ left: '85%' }}>Observer</span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Source Light</label>
          <div className={styles.buttonGroup}>
            <button className={sourceLight === 'white' ? styles.active : ''} onClick={() => setSourceLight('white')}>White (All)</button>
            <button className={sourceLight === 'red' ? styles.activeRed : ''} onClick={() => setSourceLight('red')}>Red</button>
            <button className={sourceLight === 'green' ? styles.activeGreen : ''} onClick={() => setSourceLight('green')}>Green</button>
            <button className={sourceLight === 'blue' ? styles.activeBlue : ''} onClick={() => setSourceLight('blue')}>Blue</button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label>Medium (Obstacle)</label>
          <div className={styles.buttonGroup}>
            <button className={medium === 'vacuum' ? styles.active : ''} onClick={() => setMedium('vacuum')}>Vacuum (None)</button>
            <button className={medium === 'red-filter' ? styles.activeRed : ''} onClick={() => setMedium('red-filter')}>Red Filter</button>
            <button className={medium === 'green-leaf' ? styles.activeGreen : ''} onClick={() => setMedium('green-leaf')}>Plant Leaf</button>
            <button className={medium === 'atmosphere' ? styles.activeBlue : ''} onClick={() => setMedium('atmosphere')}>Earth's Atmosphere</button>
          </div>
        </div>

        {medium === 'atmosphere' && (
          <div className={styles.controlGroup}>
            <label>Atmosphere Density: {particleCount}</label>
            <input 
              type="range" 
              min="0" 
              max="200" 
              value={particleCount} 
              onChange={e => setParticleCount(Number(e.target.value))}
              className={styles.slider}
            />
            <small>More density = More scattering (simulating sunset / thicker atmosphere)</small>
          </div>
        )}
      </div>
      
      <div className={styles.explanation}>
        <strong>Observation:</strong> 
        {medium === 'vacuum' && ' Light travels in straight lines without interaction.'}
        {medium === 'red-filter' && ' The red filter transmits red light but absorbs green and blue, turning their energy into heat.'}
        {medium === 'green-leaf' && ' The leaf reflects and transmits green light, but absorbs red and blue light for photosynthesis.'}
        {medium === 'atmosphere' && ' Rayleigh scattering causes shorter wavelengths (blue) to scatter in all directions. When density is high (sunset), blue is scattered away before reaching the observer, leaving only red/orange.'}
      </div>
    </div>
  );
}
