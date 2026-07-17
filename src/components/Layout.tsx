import { Outlet, NavLink } from 'react-router-dom';
import { Home, Compass, Activity, CheckCircle, BookOpen, Radio, Sun, Move } from 'lucide-react';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Activity className={styles.brandIcon} aria-hidden="true" />
          <span className={styles.brandText}>WaveMotion Studio</span>
        </div>
        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink to="/" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
            <Home className={styles.icon} aria-hidden="true" />
            <span>Topic Map</span>
          </NavLink>
          <NavLink to="/wave-foundations" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
            <Compass className={styles.icon} aria-hidden="true" />
            <span>Wave Foundations</span>
          </NavLink>
          <NavLink to="/em-and-sound" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
            <Radio className={styles.icon} aria-hidden="true" />
            <span>EM & Sound</span>
          </NavLink>
          <NavLink to="/light-optics" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
            <Sun className={styles.icon} aria-hidden="true" />
            <span>Light & Optics</span>
          </NavLink>
          <NavLink to="/motion-forces" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
            <Move className={styles.icon} aria-hidden="true" />
            <span>Motion & Forces</span>
          </NavLink>
          <NavLink to="/mastery" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
            <CheckCircle className={styles.icon} aria-hidden="true" />
            <span>Mastery</span>
          </NavLink>
          <NavLink to="/glossary" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
            <BookOpen className={styles.icon} aria-hidden="true" />
            <span>Glossary</span>
          </NavLink>
        </nav>
      </header>

      <main className={styles.mainContent} id="main-content">
        {/* Skip link target */}
        <a href="#main-content" className="sr-only focus-visible">Skip to main content</a>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2026 Science Simulators Suite. NSW Year 10 Waves & Motion.</p>
        <div className={styles.footerLinks}>
          <NavLink to="/teacher">Teacher Tools</NavLink>
          <NavLink to="/about">About & Privacy</NavLink>
        </div>
      </footer>
    </div>
  );
}
