import styles from './LightAndOptics.module.css';
import OpticsLab from '../simulations/optics/OpticsLab';
import AbsorptionScattering from '../simulations/optics/AbsorptionScattering';

export default function LightAndOptics() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Light & Optics</h1>
        <p className={styles.learningIntention}>
          <strong>Learning Intention:</strong> Investigate how light interacts with matter through reflection, 
          refraction, and absorption using the ray model of light.
        </p>
      </header>

      <div className={styles.content}>
        <section className={styles.moduleSection}>
          <h2>1. Ray Tracing & Snell's Law (Outcomes 7.3.1, 7.3.2, 7.3.3)</h2>
          <OpticsLab />
        </section>

        <section className={styles.moduleSection}>
          <h2>2. Absorption & Scattering (Outcomes 7.3.4, 7.3.5)</h2>
          <AbsorptionScattering />
        </section>
      </div>
    </div>
  );
}
