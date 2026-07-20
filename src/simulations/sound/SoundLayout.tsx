import { NavLink, Outlet } from 'react-router-dom';
import './SoundLab.css';

/**
 * Sound-laboratory workspace layout: the seven-phase learning rhythm
 * (Orient → Learn → Explore → Investigate → Check → Explain → Connect) as
 * explicit navigation, matching the wave-foundations pattern. Every linked
 * activity is real — no dead links.
 */
const PHASES = [
  { to: '/sound', end: true, phase: 'Orient · Learn', label: 'Start here' },
  { to: '/sound/compression', end: false, phase: 'Explore', label: 'Compression & rarefaction' },
  { to: '/sound/pitch-loudness', end: false, phase: 'Investigate', label: 'Pitch & loudness' },
  { to: '/sound/doppler', end: false, phase: 'Explore', label: 'Doppler effect' },
  { to: '/sound/check', end: false, phase: 'Check', label: 'Check questions' },
  { to: '/sound/explain', end: false, phase: 'Explain', label: 'Claim–evidence–reasoning' },
  { to: '/sound/connect', end: false, phase: 'Connect', label: 'Sound in the real world' },
];

export function SoundLayout() {
  return (
    <div className="wave-lab sound-lab">
      <nav aria-label="Sound laboratory phases" className="wave-lab__phases">
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
      <Outlet />
    </div>
  );
}
