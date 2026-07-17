import styles from './EMAndSound.module.css';
import EMSpectrumExplorer from '../simulations/em-sound/EMSpectrumExplorer';
import SoundWaveSimulator from '../simulations/em-sound/SoundWaveSimulator';
import SoundPropertiesSimulator from '../simulations/em-sound/SoundPropertiesSimulator';

export default function EMAndSound() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Electromagnetic Spectrum & Sound</h1>
        <p className={styles.learningIntention}>
          <strong>Learning Intention:</strong> Explore the properties of the electromagnetic spectrum 
          and investigate how sound travels as a longitudinal wave with pitch and loudness.
        </p>
      </header>

      <div className={styles.content}>
        <section className={styles.moduleSection}>
          <h2>1. Electromagnetic Spectrum Explorer (Outcomes 7.1.4, 7.1.7)</h2>
          <EMSpectrumExplorer />
        </section>

        <section className={styles.moduleSection}>
          <h2>2. Sound Compressions & Rarefactions (Outcome 7.2.1)</h2>
          <SoundWaveSimulator />
        </section>

        <section className={styles.moduleSection}>
          <h2>3. Pitch & Loudness (Outcome 7.2.2)</h2>
          <SoundPropertiesSimulator />
        </section>
      </div>
    </div>
  );
}
