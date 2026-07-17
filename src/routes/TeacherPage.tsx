import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Teacher tools. Stage 1 ships the tools that already have a real effect
 * (presentation mode, the progress export on the Progress page). Tools that
 * arrive with later stages are described in text only — no dead controls.
 */
export default function TeacherPage() {
  const presentationMode = useSettingsStore((s) => s.presentationMode);
  const setPresentationMode = useSettingsStore((s) => s.setPresentationMode);

  return (
    <Page
      title="Teacher tools"
      lead="Tools for demonstration and class management. No account is needed and no student data ever leaves the device."
    >
      <section className="card stack" aria-labelledby="teacher-presentation">
        <h2 id="teacher-presentation">Presentation mode</h2>
        <p>
          Enlarges text throughout the app for projection. From Stage 2, it
          also enlarges each simulation and its key equation.
        </p>
        <label className="toggle">
          <input
            type="checkbox"
            checked={presentationMode}
            onChange={(e) => setPresentationMode(e.target.checked)}
            data-testid="toggle-presentation"
          />
          <span className="toggle__text">
            <span className="toggle__label">Presentation mode</span>
            <span className="toggle__hint">
              Larger text for data projectors and interactive whiteboards.
            </span>
          </span>
        </label>
      </section>

      <section className="card stack" aria-labelledby="teacher-progress">
        <h2 id="teacher-progress">Class progress</h2>
        <p>
          The <Link to="/progress">Progress page</Link> shows the evidence
          level for every syllabus outcome on this device, and can export an
          anonymous JSON summary — useful for collecting evidence from a class
          set of devices.
        </p>
      </section>

      <section className="card stack" aria-labelledby="teacher-roadmap">
        <h2 id="teacher-roadmap">Coming with the laboratories</h2>
        <p>
          These tools depend on the simulations and are added as each stage is
          built and verified — they are listed here so you know what to expect,
          and deliberately have no buttons yet:
        </p>
        <ul>
          <li>Pause, step, slow-motion and preset scenario controls in every simulation</li>
          <li>Show/hide labels, vectors, particles, values and answers</li>
          <li>Deep links to a specific activity with chosen presets</li>
          <li>Outcome coverage view and misconception prompts</li>
          <li>Printable investigation and report sheets</li>
        </ul>
      </section>
    </Page>
  );
}
