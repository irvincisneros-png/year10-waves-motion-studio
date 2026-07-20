import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { SkipLink } from '../accessibility/SkipLink';
import { ErrorBoundary } from '../app/ErrorBoundary';
import { StorageNotice } from '../app/StorageNotice';
import { UpdatePrompt } from '../app/UpdatePrompt';
import { APP_VERSION } from '../app/version';
import { SettingsPanel } from './SettingsPanel';
import './AppLayout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/waves', label: 'Waves', end: false },
  { to: '/sound', label: 'Sound', end: false },
  { to: '/light', label: 'Light', end: false },
  { to: '/vision', label: 'Vision', end: false },
  { to: '/motion', label: 'Motion', end: false },
  { to: '/forces', label: 'Forces', end: false },
  { to: '/glossary', label: 'Glossary', end: false },
  { to: '/progress', label: 'Progress', end: false },
  { to: '/teacher', label: 'Teacher', end: false },
  { to: '/about', label: 'About', end: false },
];

function BrandMark() {
  return (
    <svg
      className="brand__mark"
      viewBox="0 0 32 32"
      width="28"
      height="28"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="var(--surface-nav-raised)" />
      <path
        d="M3 16c3.5 0 3.5-7 7-7s3.5 7 7 7 3.5-7 7-7 3.5 7 7 7"
        fill="none"
        stroke="var(--accent-cyan)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M3 23c3.5 0 3.5-5 7-5s3.5 5 7 5 3.5-5 7-5 3.5 5 7 5"
        fill="none"
        stroke="var(--accent-violet)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * App shell: skip link, banner (brand + primary nav + settings), main
 * landmark, footer. Routed views render inside an error boundary that resets
 * on navigation.
 */
export function AppLayout() {
  const location = useLocation();

  return (
    <div className="shell">
      <SkipLink />
      <header className="shell__header">
        <div className="shell__header-inner">
          <NavLink to="/" className="brand" end>
            <BrandMark />
            <span className="brand__name">WaveMotion Studio</span>
          </NavLink>
          <nav aria-label="Primary" className="primary-nav">
            <ul role="list" className="primary-nav__list">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="primary-nav__link">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <SettingsPanel />
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="shell__main">
        <div className="shell__notices">
          <StorageNotice />
        </div>
        <ErrorBoundary resetKey={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>

      <footer className="shell__footer">
        <div className="shell__footer-inner">
          <p>
            WaveMotion Studio — NSW Year 10 Waves &amp; Motion. No sign-in, no
            analytics; your progress stays on this device.
          </p>
          <p className="shell__footer-version">Version {APP_VERSION}</p>
        </div>
      </footer>

      <UpdatePrompt />
    </div>
  );
}
