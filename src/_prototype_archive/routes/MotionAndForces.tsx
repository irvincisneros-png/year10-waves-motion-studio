import styles from './MotionAndForces.module.css';
import KinematicsLab from '../simulations/motion/KinematicsLab';
import NewtonsLawsLab from '../simulations/motion/NewtonsLawsLab';

export default function MotionAndForces() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Motion & Forces</h1>
        <p className={styles.learningIntention}>
          <strong>Learning Intention:</strong> Understand the difference between distance, displacement, speed, and velocity. 
          Investigate how Newton's Laws of Motion explain the relationship between force, mass, and acceleration.
        </p>
      </header>

      <div className={styles.content}>
        <section className={styles.moduleSection}>
          <h2>1. Kinematics & Motion Diagrams (Outcomes 7.4.1, 7.4.2, 7.4.3)</h2>
          <KinematicsLab />
        </section>

        <section className={styles.moduleSection}>
          <h2>2. Newton's Laws of Motion (Outcomes 7.5.1, 7.5.2, 7.5.3)</h2>
          <NewtonsLawsLab />
        </section>
      </div>
    </div>
  );
}
