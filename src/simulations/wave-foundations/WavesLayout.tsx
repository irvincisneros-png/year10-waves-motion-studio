import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './WaveLab.css';

/**
 * Wave-foundations workspace layout: the seven-phase learning rhythm
 * (Orient → Learn → Explore → Investigate → Check → Explain → Connect) as
 * explicit navigation. Every linked activity is real — no dead links.
 */
const PHASES = [
  { to: '/waves', end: true, phase: 'Orient · Learn', label: 'Start here' },
  { to: '/waves/medium', end: false, phase: 'Explore', label: 'Medium or vacuum?' },
  { to: '/waves/energy', end: false, phase: 'Explore', label: 'Energy transfer' },
  { to: '/waves/types', end: false, phase: 'Explore', label: 'Wave types' },
  { to: '/waves/measure', end: false, phase: 'Investigate', label: 'Measurement lab' },
  { to: '/waves/check', end: false, phase: 'Check', label: 'Check questions' },
  { to: '/waves/explain', end: false, phase: 'Explain', label: 'Claim–evidence–reasoning' },
  { to: '/waves/connect', end: false, phase: 'Connect', label: 'Waves in the real world' },
];

export function WavesLayout() {
  const location = useLocation();
  const isFocusedInvestigation = location.pathname === '/waves/measure';

  return (
    <div className={isFocusedInvestigation ? 'wave-lab wave-lab--focused' : 'wave-lab'}>
      {isFocusedInvestigation ? (
        <nav aria-label="Wave investigation navigation" className="wave-lab__focus-nav">
          <NavLink to="/waves" className="wave-lab__back-link">← All wave activities</NavLink>
          <span>Year 10 · outcomes 7.1.5 and 7.1.6</span>
        </nav>
      ) : (
        <nav aria-label="Wave laboratory phases" className="wave-lab__phases">
          <ul role="list" className="wave-lab__phase-list">
            {PHASES.map((p) => (
              <li key={p.to}>
                <NavLink to={p.to} end={p.end} className="wave-lab__phase-link">
                  <span className="wave-lab__phase-tag">{p.phase}</span>
                  <span>{p.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <Outlet />
    </div>
  );
}
