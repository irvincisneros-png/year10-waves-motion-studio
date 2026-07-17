import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { WaveEquation } from '../../components/sim/WaveEquation';
import { WaveAnatomyDiagram } from './WaveAnatomyDiagram';
import { outcomeMap } from '../../content/outcomes';

const STAGE2_OUTCOMES = ['7.1.1', '7.1.2', '7.1.3', '7.1.5', '7.1.6'];

/**
 * Orient + Learn for the wave-foundations workspace.
 * Orient: phenomenon hook, driving question, learning intention (verbatim
 * syllabus outcome text). Learn: concise explanation with the labelled SVG
 * anatomy diagram and the v = fλ equation (MathML + fallback).
 */
export default function WavesHubPage() {
  return (
    <Page
      title="Wave foundations"
      lead="What every wave has in common — and how to measure it."
    >
      <section className="card stack" aria-labelledby="waves-orient">
        <h2 id="waves-orient">Orient — the phenomenon</h2>
        <p>
          A crowd starts a stadium wave: a ripple of standing-and-sitting sweeps
          right around the ground in under a minute — yet <strong>nobody moves
          from their seat</strong>. An earthquake in the sea floor rattles
          windows hundreds of kilometres away, but the rock between doesn’t
          travel anywhere. Your voice crosses a classroom in a few hundredths of
          a second, and the air stays put.
        </p>
        <p className="wave-lab__question">
          <strong>Driving question:</strong> if nothing actually travels from
          one place to the other, what <em>is</em> moving — and how fast, how
          big, and how often?
        </p>
        <h3>Learning intention</h3>
        <p>In this laboratory you will work towards these syllabus outcomes:</p>
        <ul>
          {STAGE2_OUTCOMES.map((code) => (
            <li key={code}>
              <strong>{code}</strong> — {outcomeMap[code].text}
            </li>
          ))}
        </ul>
        <p className="wave-lab__deferral-note">
          Outcomes 7.1.4 and 7.1.7 (the electromagnetic spectrum) are covered by
          the EM spectrum workspace in a later stage.
        </p>
      </section>

      <section className="card stack" aria-labelledby="waves-learn">
        <h2 id="waves-learn">Learn — the wave model</h2>
        <p>
          A <strong>wave</strong> is a travelling disturbance that carries{' '}
          <strong>energy</strong> from place to place <strong>without carrying
          the matter</strong> with it. The particles of the medium each vibrate
          about a fixed home position; it is the <em>pattern</em> of their
          motion that travels. In a <strong>transverse</strong> wave the
          vibration is at right angles to the direction the wave travels; in a{' '}
          <strong>longitudinal</strong> wave it is back-and-forth along the same
          direction, making <strong>compressions</strong> (bunched particles)
          and <strong>rarefactions</strong> (spread-out particles).
        </p>
        <WaveAnatomyDiagram />
        <h3>The wave equation</h3>
        <WaveEquation />
        <p>
          In the model you will use: the <strong>source sets the frequency</strong>,
          the <strong>medium sets the speed</strong>, and the{' '}
          <strong>wavelength adjusts</strong> so that v&nbsp;=&nbsp;fλ always
          holds. <strong>Amplitude is independent</strong> — it changes how much
          energy the wave carries, not how fast or how often it vibrates.
        </p>
      </section>

      <section className="card stack" aria-labelledby="waves-phases-guide">
        <h2 id="waves-phases-guide">How this laboratory works</h2>
        <p>
          Work through the phases in the navigation above: <strong>Explore</strong>{' '}
          the three simulators, <strong>Investigate</strong> with the measurement
          lab, <strong>Check</strong> your understanding,{' '}
          <strong>Explain</strong> with a claim–evidence–reasoning argument, then{' '}
          <strong>Connect</strong> the ideas to real technology. Evidence you
          save lands on your <Link to="/progress">Progress page</Link>.
        </p>
      </section>

      <section className="card stack" aria-labelledby="waves-limits">
        <h2 id="waves-limits">Model limitations (honesty box)</h2>
        <ul>
          <li>
            The medium here is uniform, lossless and non-dispersive — real waves
            fade and can change shape as they travel.
          </li>
          <li>
            Water-surface waves are <em>not</em> perfectly transverse (real
            water particles move in near-circular paths), so we use ropes and
            springs as the clean transverse examples.
          </li>
          <li>
            Chamber animations are not drawn to true scale — light is roughly a
            million times faster than sound.
          </li>
          <li>
            A virtual investigation never replaces supervised hands-on practical
            work.
          </li>
        </ul>
      </section>
    </Page>
  );
}
