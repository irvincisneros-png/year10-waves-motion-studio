import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.label}>NSW Year 10 Science</span>
          <h1 className={styles.title}>Waves & Motion</h1>
          <p className={styles.subtitle}>
            Explore the invisible mechanisms of energy, light, sound, forces, and motion.
          </p>
        </div>
      </header>
      
      <section className={styles.topicGrid}>
        <TopicCard
          title="Wave Foundations"
          description="Investigate the fundamental properties of mechanical and electromagnetic waves."
          route="/wave-foundations"
          status="available"
        />
        <TopicCard
          title="Electromagnetic Spectrum"
          description="Explore light beyond the visible and investigate how it interacts with matter."
          route="/em-spectrum"
          status="coming-soon"
        />
        <TopicCard
          title="Sound Laboratory"
          description="Listen to and visualize pressure waves, pitch, loudness, and the Doppler effect."
          route="/sound"
          status="coming-soon"
        />
        <TopicCard
          title="Light & Optics"
          description="Bending, bouncing, and scattering of light through lenses and mirrors."
          route="/optics"
          status="coming-soon"
        />
        <TopicCard
          title="Describing Motion"
          description="Track distance, displacement, speed, velocity, and acceleration."
          route="/motion"
          status="coming-soon"
        />
        <TopicCard
          title="Forces & Newton's Laws"
          description="Push, pull, and calculate net forces to predict how objects will move."
          route="/forces"
          status="coming-soon"
        />
      </section>
    </div>
  );
}

function TopicCard({ title, description, route, status }: { title: string, description: string, route: string, status: string }) {
  const isAvailable = status === 'available';
  return (
    <Link 
      to={isAvailable ? route : '#'} 
      className={`${styles.card} ${!isAvailable ? styles.disabled : ''}`}
      aria-disabled={!isAvailable}
    >
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {!isAvailable && <span className={styles.badge}>Coming Soon</span>}
      </div>
      <p className={styles.cardDesc}>{description}</p>
    </Link>
  );
}
