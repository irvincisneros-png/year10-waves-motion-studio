import { useState, useEffect, useRef } from 'react';
import styles from './OpticsLab.module.css';

export default function OpticsLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refractive indices
  const [n1, setN1] = useState(1.00); // Air
  const [n2, setN2] = useState(1.33); // Water
  
  // Incident angle in degrees (measured from normal)
  const [incidentAngle, setIncidentAngle] = useState(45);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center point of the boundary
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Medium Backgrounds
    // Top Medium
    ctx.fillStyle = n1 === 1 ? '#ffffff' : `rgba(28, 126, 214, ${(n1 - 1) * 0.2})`;
    ctx.fillRect(0, 0, canvas.width, cy);
    
    // Bottom Medium
    ctx.fillStyle = n2 === 1 ? '#ffffff' : `rgba(28, 126, 214, ${(n2 - 1) * 0.2})`;
    ctx.fillRect(0, cy, canvas.width, canvas.height / 2);

    // 2. Draw Boundary
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(canvas.width, cy);
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Draw Normal Line
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, canvas.height);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Physics calculations (Snell's Law: n1 * sin(theta1) = n2 * sin(theta2))
    const theta1Rad = incidentAngle * (Math.PI / 180);
    
    // Reflected ray angle (Angle of reflection = Angle of incidence)
    const reflectedThetaRad = theta1Rad;
    
    // Check for Total Internal Reflection
    const sinTheta2 = (n1 / n2) * Math.sin(theta1Rad);
    const isTIR = sinTheta2 > 1.0;
    
    let refractedThetaRad = 0;
    if (!isTIR) {
      refractedThetaRad = Math.asin(sinTheta2);
    }

    // 4. Draw Incident Ray (comes from top left if angle > 0)
    // Angles are measured from the Normal (y-axis).
    // Incident ray: x = cx - r*sin(theta1), y = cy - r*cos(theta1)
    const rayLength = 300;
    const incX = cx - rayLength * Math.sin(theta1Rad);
    const incY = cy - rayLength * Math.cos(theta1Rad);

    ctx.beginPath();
    ctx.moveTo(incX, incY);
    ctx.lineTo(cx, cy);
    ctx.strokeStyle = '#e03131'; // Red laser
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw arrow on incident ray
    const arrowLen = 15;
    const incArrowX = cx - (rayLength/2) * Math.sin(theta1Rad);
    const incArrowY = cy - (rayLength/2) * Math.cos(theta1Rad);
    ctx.beginPath();
    ctx.moveTo(incArrowX, incArrowY);
    ctx.lineTo(
      incArrowX - arrowLen * Math.cos(Math.PI/4 - theta1Rad), 
      incArrowY - arrowLen * Math.sin(Math.PI/4 - theta1Rad)
    );
    ctx.stroke();

    // 5. Draw Reflected Ray
    // Reflections are always present to some degree, but stronger in TIR.
    // x = cx + r*sin(theta1), y = cy - r*cos(theta1)
    const refX = cx + rayLength * Math.sin(reflectedThetaRad);
    const refY = cy - rayLength * Math.cos(reflectedThetaRad);
    
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(refX, refY);
    // If TIR, 100% intensity, else partial intensity
    ctx.strokeStyle = isTIR ? '#e03131' : 'rgba(224, 49, 49, 0.3)';
    ctx.lineWidth = isTIR ? 3 : 1;
    ctx.stroke();

    // 6. Draw Refracted Ray
    if (!isTIR) {
      // x = cx + r*sin(theta2), y = cy + r*cos(theta2)
      const transX = cx + rayLength * Math.sin(refractedThetaRad);
      const transY = cy + rayLength * Math.cos(refractedThetaRad);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(transX, transY);
      ctx.strokeStyle = '#e03131';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 7. Draw Arcs and Angles
    ctx.fillStyle = '#212529';
    ctx.font = '14px Inter';
    
    // Incident angle text
    ctx.fillText(`θ₁ = ${incidentAngle.toFixed(1)}°`, cx - 70, cy - 40);
    
    if (isTIR) {
      ctx.fillStyle = '#e03131';
      ctx.fillText(`Total Internal Reflection`, cx + 20, cy - 40);
    } else {
      ctx.fillText(`θ₂ = ${(refractedThetaRad * 180 / Math.PI).toFixed(1)}°`, cx + 30, cy + 50);
    }

  }, [n1, n2, incidentAngle]);

  return (
    <div className={styles.simulator}>
      <div className={styles.canvasContainer}>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500}
          className={styles.canvas}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Medium 1 (n₁ = {n1.toFixed(2)})</label>
          <input 
            type="range" 
            min="1.0" 
            max="2.5" 
            step="0.01" 
            value={n1} 
            onChange={e => setN1(Number(e.target.value))} 
            className={styles.slider}
          />
          <div className={styles.presets}>
            <button onClick={() => setN1(1.0)}>Air (1.0)</button>
            <button onClick={() => setN1(1.33)}>Water (1.33)</button>
            <button onClick={() => setN1(1.5)}>Glass (1.5)</button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label>Medium 2 (n₂ = {n2.toFixed(2)})</label>
          <input 
            type="range" 
            min="1.0" 
            max="2.5" 
            step="0.01" 
            value={n2} 
            onChange={e => setN2(Number(e.target.value))} 
            className={styles.slider}
          />
          <div className={styles.presets}>
            <button onClick={() => setN2(1.0)}>Air (1.0)</button>
            <button onClick={() => setN2(1.33)}>Water (1.33)</button>
            <button onClick={() => setN2(1.5)}>Glass (1.5)</button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label>Incident Angle (θ₁ = {incidentAngle}°)</label>
          <input 
            type="range" 
            min="0" 
            max="89" 
            step="1" 
            value={incidentAngle} 
            onChange={e => setIncidentAngle(Number(e.target.value))} 
            className={styles.slider}
          />
        </div>
      </div>
    </div>
  );
}
