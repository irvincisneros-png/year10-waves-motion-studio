import { useState, useEffect, useRef } from 'react';
import styles from './WaveMeasurementLab.module.css';
import { calculateWavelength } from '../../science/waveEngine';
import { formatValue } from '../../science/units';

interface Trial {
  id: number;
  speed: number;
  frequency: number;
  wavelength: number;
  inverseFrequency: number;
}

export default function WaveMeasurementLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Wave state
  const [speed, setSpeed] = useState(343); // e.g. Sound in air (m/s)
  const [frequency, setFrequency] = useState(440); // Hz
  const [amplitude, setAmplitude] = useState(20); // visual units
  
  const [isPlaying, setIsPlaying] = useState(true);
  const timeRef = useRef(0);
  const animationRef = useRef<number>(0);

  // Data table state
  const [trials, setTrials] = useState<Trial[]>([]);

  const wavelength = calculateWavelength(speed, frequency);

  // Simulation Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (isPlaying) timeRef.current += dt;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#e9ecef';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Visual scaling factors
      const pixelsPerMeter = 200; 
      const k = (2 * Math.PI) / (wavelength * pixelsPerMeter);
      const w = 2 * Math.PI * frequency;
      const t = timeRef.current;

      // Draw wave
      ctx.beginPath();
      ctx.strokeStyle = '#0ca678';
      ctx.lineWidth = 3;
      
      for (let x = 0; x <= canvas.width; x += 5) {
        // D(x,t) = A * sin(kx - wt)
        const y = (canvas.height / 2) + amplitude * Math.sin(k * x - w * t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [speed, frequency, amplitude, wavelength, isPlaying]);

  const recordTrial = () => {
    setTrials([
      ...trials, 
      {
        id: Date.now(),
        speed,
        frequency,
        wavelength,
        inverseFrequency: 1 / frequency
      }
    ]);
  };

  const clearTrials = () => setTrials([]);

  return (
    <div className={styles.labContainer}>
      <div className={styles.simulationArea}>
        <div className={styles.canvasWrapper}>
          <canvas ref={canvasRef} width={800} height={200} className={styles.canvas} />
          {/* Simple static ruler overlay for measurement */}
          <div className={styles.ruler}>
            <span>0m</span>
            <span>1m</span>
            <span>2m</span>
            <span>3m</span>
            <span>4m</span>
          </div>
        </div>
        
        <div className={styles.controlsGrid}>
          <div className={styles.controlPanel}>
            <h3>Wave Properties</h3>
            
            <div className={styles.inputGroup}>
              <label>Medium (Speed): {speed} m/s</label>
              <input type="range" min="10" max="1000" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
              <div className={styles.presets}>
                <button onClick={() => setSpeed(343)}>Sound (Air)</button>
                <button onClick={() => setSpeed(1500)}>Sound (Water)</button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Source Frequency: {frequency} Hz</label>
              <input type="range" min="50" max="1000" value={frequency} onChange={e => setFrequency(Number(e.target.value))} />
            </div>

            <div className={styles.inputGroup}>
              <label>Amplitude (Relative)</label>
              <input type="range" min="5" max="80" value={amplitude} onChange={e => setAmplitude(Number(e.target.value))} />
            </div>

            <div className={styles.playbackControls}>
              <button onClick={() => setIsPlaying(!isPlaying)} className={styles.primaryBtn}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            </div>
          </div>

          <div className={styles.dataPanel}>
            <h3>Data Collection</h3>
            <p><strong>Calculated Wavelength (λ = v/f):</strong> {formatValue(wavelength, 4)} m</p>
            <button onClick={recordTrial} className={styles.actionBtn}>Record Trial</button>
            <button onClick={clearTrials} className={styles.secondaryBtn}>Clear Data</button>
            
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Trial</th>
                    <th>Speed (v)</th>
                    <th>Freq (f)</th>
                    <th>Wavelength (λ)</th>
                    <th>1/f</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.length === 0 && (
                    <tr><td colSpan={5} className={styles.empty}>No data recorded</td></tr>
                  )}
                  {trials.map((t, idx) => (
                    <tr key={t.id}>
                      <td>{idx + 1}</td>
                      <td>{t.speed} m/s</td>
                      <td>{t.frequency} Hz</td>
                      <td>{formatValue(t.wavelength, 4)} m</td>
                      <td>{formatValue(t.inverseFrequency, 4)} s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
