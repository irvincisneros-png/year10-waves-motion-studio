import { NavLink, Outlet } from 'react-router-dom';
import '../wave-foundations/WaveLab.css';
import './LightLab.css';

const PHASES = [
  { to: '/light', end: true, phase: 'Orient · Learn', label: 'Start here' },
  { to: '/vision', end: false, phase: 'Explore', label: 'Eye response' },
  { to: '/light/properties', end: false, phase: 'Investigate', label: 'Light properties' },
  { to: '/light/applications', end: false, phase: 'Apply', label: 'Everyday applications' },
  { to: '/light/check', end: false, phase: 'Check', label: 'Check questions' },
  { to: '/light/explain', end: false, phase: 'Explain', label: 'Evidence reasoning' },
  { to: '/light/connect', end: false, phase: 'Connect', label: 'Light in the real world' },
];

export function LightVisionLayout() {
  return (
    <div className="wave-lab light-lab">
      <nav aria-label="Light and vision phases" className="wave-lab__phases">
        <ul role="list" className="wave-lab__phase-list">
          {PHASES.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className="wave-lab__phase-link">
                <span className="wave-lab__phase-tag">{item.phase}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  );
}
