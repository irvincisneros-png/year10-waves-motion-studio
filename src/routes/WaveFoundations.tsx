import styles from './WaveFoundations.module.css';
import WaveTypesSimulator from '../simulations/wave-foundations/WaveTypesSimulator';
import MediumVsVacuumSimulator from '../simulations/wave-foundations/MediumVsVacuumSimulator';
import WaveMeasurementLab from '../simulations/wave-foundations/WaveMeasurementLab';

export default function WaveFoundations() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Wave Foundations</h1>
        <p className={styles.learningIntention}>
          <strong>Learning Intention:</strong> Investigate how mechanical and electromagnetic waves transfer energy, 
          and discover the relationship between wave speed, frequency, and wavelength.
        </p>
      </header>

      <div className={styles.content}>
        <section className={styles.moduleSection}>
          <h2>1. Medium or Vacuum? (Outcome 7.1.1)</h2>
          <MediumVsVacuumSimulator />
        </section>

        <section className={styles.moduleSection}>
          <h2>2. Transverse vs Longitudinal (Outcome 7.1.3)</h2>
          <WaveTypesSimulator />
        </section>

        <section className={styles.moduleSection}>
          <h2>3. Wave Measurement Lab (Outcomes 7.1.5, 7.1.6)</h2>
          <WaveMeasurementLab />
        </section>
      </div>
    </div>
  );
}
