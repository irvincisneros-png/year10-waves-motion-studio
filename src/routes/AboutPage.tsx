import { Page } from '../components/Page';
import { APP_VERSION, BUILD_TIME } from '../app/version';

/**
 * About: sources, model limitations, accessibility statement, privacy, and
 * the build/service-worker version (so a cached device can be identified).
 */
export default function AboutPage() {
  return (
    <Page
      title="About"
      lead="What WaveMotion Studio is, where its content comes from, and how it treats you and your data."
    >
      <section className="card stack" aria-labelledby="about-app">
        <h2 id="about-app">About this app</h2>
        <p>
          WaveMotion Studio is an interactive learning environment for the NSW
          Year 10 (Stage 5) <em>Waves and motion</em> focus area. It is built
          for classroom demonstration, guided learning, open exploration,
          virtual investigation and revision. Every laboratory shown in the
          learner navigation is complete and available.
        </p>
      </section>

      <section className="card stack" aria-labelledby="about-sources">
        <h2 id="about-sources">Sources</h2>
        <ul>
          <li>
            Outcome statements are reproduced verbatim from the NSW Education
            Standards Authority (NESA) Science 7–10 Syllabus, focus area 7
            (Waves and motion), content points 7.1.1–7.5.1.
          </li>
          <li>
            Physical constants and reference values used by the simulations
            (for example, the speed of sound in dry air at about 20&nbsp;°C)
            are curated with their sources and review dates in the project’s
            scientific review record, and each value is shown with its units
            wherever it is used.
          </li>
        </ul>
      </section>

      <section className="card stack" aria-labelledby="about-limitations">
        <h2 id="about-limitations">Model limitations</h2>
        <p>
          Every simulation in WaveMotion Studio is a simplified model, not a
          recording of reality. Each laboratory states its own limitations
          beside the simulation — what is idealised, what is exaggerated for
          visibility, and where the model stops matching the real world. A
          virtual investigation never replaces practical work, teacher
          supervision or your school’s safety procedures.
        </p>
      </section>

      <section className="card stack" aria-labelledby="about-accessibility">
        <h2 id="about-accessibility">Accessibility</h2>
        <p>
          The app targets WCAG 2.2 AA. It is designed for full keyboard
          operation with visible focus, semantic landmarks and headings, a
          skip link, text alternatives for visual content, and at least
          44&nbsp;×&nbsp;44&nbsp;pixel interactive targets. Reduce motion,
          low graphics and sound settings are in the header, and the
          operating-system “reduce motion” preference is honoured
          automatically. Meaning is never carried by colour alone. If you find
          an accessibility problem, please report it to your teacher so it can
          be fixed.
        </p>
      </section>

      <section className="card stack" aria-labelledby="about-privacy">
        <h2 id="about-privacy">Privacy</h2>
        <ul>
          <li>No sign-in, no student names, and no analytics or tracking.</li>
          <li>
            After the first load the app makes no automatic external runtime
            requests and works offline. Source links open only when you choose
            them.
          </li>
          <li>
            Progress and settings are stored only in this browser on this
            device. You can export, import or reset them at any time from the
            Progress page.
          </li>
          <li>
            Optional sound permission is off by default. Each audio activity
            also requires a separate explicit enable action, starts muted and
            remains volume-limited.
          </li>
        </ul>
      </section>

      <section className="card stack" aria-labelledby="about-version">
        <h2 id="about-version">Version</h2>
        <p>
          Build <strong data-testid="app-version">{APP_VERSION}</strong>, built{' '}
          {BUILD_TIME}. The app updates itself only when you accept the
          “new version available” prompt, so a lesson is never interrupted.
        </p>
      </section>
    </Page>
  );
}
