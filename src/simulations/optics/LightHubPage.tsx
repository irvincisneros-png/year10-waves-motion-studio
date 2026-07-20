import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';

export default function LightHubPage() {
  return (
    <Page
      title="Light & vision laboratory"
      lead="Trace what light does at boundaries, through materials and inside the eye — while keeping ray-model evidence separate from neural perception."
    >
      <section className="card stack" aria-labelledby="light-orient">
        <h2 id="light-orient">Orient — three everyday puzzles</h2>
        <p>
          A shop window shows both the street behind you and objects through the glass. A straw
          seems bent in water even though it is straight. Your pupil changes between a dim room
          and bright sunlight, while the lens adjusts when you read something close.
        </p>
        <p><strong>Driving question:</strong> how can one model explain where light travels, how its energy is shared at a material, and how the eye turns incoming light into evidence the brain can interpret?</p>
        <h3>Learning intentions</h3>
        <ul>
          <li><strong>7.3.1</strong> — describe how the eye responds to light.</li>
          <li><strong>7.3.2</strong> — investigate absorption, reflection, refraction and scattering.</li>
          <li><strong>7.3.3</strong> — investigate everyday applications of those properties.</li>
        </ul>
      </section>

      <section className="card stack" aria-labelledby="light-learn">
        <h2 id="light-learn">Learn — choose the right representation</h2>
        <div className="light-grid">
          <article className="stack">
            <h3>Ray model</h3>
            <p>Rays show direction. At a mirror, incident and reflected angles are equal when both are measured from the normal. At a stationary boundary, a speed change can bend the ray.</p>
          </article>
          <article className="stack">
            <h3>Wave and energy models</h3>
            <p>Frequency stays fixed at a stationary boundary, so speed and wavelength change together. A separate ledger tracks transmitted, reflected and absorbed fractions, which must total 100%.</p>
          </article>
          <article className="stack">
            <h3>Eye model</h3>
            <p>Cornea and lens form an optical image on the retina. The retina converts light into neural signals; the optic nerve and brain interpret them. “The brain simply flips the image” is not a complete explanation.</p>
          </article>
        </div>
      </section>

      <section className="card stack" aria-labelledby="light-path">
        <h2 id="light-path">Choose a starting point</h2>
        <div className="light-grid">
          <article className="stack">
            <h3><Link to="/vision">Explore eye response</Link></h3>
            <p>Adjust brightness, object distance and relative accommodation; follow the labelled optical and neural pathway.</p>
          </article>
          <article className="stack">
            <h3><Link to="/light/properties">Investigate light properties</Link></h3>
            <p>Measure reflection and refraction, test TIR, compare energy ledgers and record/export trials.</p>
          </article>
          <article className="stack">
            <h3><Link to="/light/applications">Apply the models</Link></h3>
            <p>Work with mirrors, qualitative lenses, optical fibres and conditional surface comparisons.</p>
          </article>
        </div>
      </section>

      <aside className="notice notice--warning stack" aria-labelledby="light-limits">
        <h2 id="light-limits">Model limits and safety</h2>
        <ul>
          <li>Ray and wavefront models explain different features; neither is a complete model of light.</li>
          <li>Diffraction, interference and quantitative photons are outside this Year 10 model.</li>
          <li>Surface ledgers and eye outputs are explicitly relative teaching models, not calibrated material or biometric measurements.</li>
          <li>The eye/focusing extension is educational only, not medical advice. Do not use lasers or bright sources for an unsupervised practical.</li>
        </ul>
      </aside>
    </Page>
  );
}
