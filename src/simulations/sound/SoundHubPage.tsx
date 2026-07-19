import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { SoundAnatomyDiagram } from './SoundAnatomyDiagram';
import { outcomeMap } from '../../content/outcomes';

const SOUND_OUTCOMES = ['7.2.1', '7.2.2', '7.2.3'];

/**
 * Orient + Learn for the sound-laboratory workspace.
 * Orient: phenomenon hook, driving question, learning intention (verbatim
 * syllabus outcome text). Learn: sound as a longitudinal wave with the labelled
 * compression/rarefaction anatomy diagram and honest model notes.
 */
export default function SoundHubPage() {
  return (
    <Page
      title="Sound laboratory"
      lead="Sound is a longitudinal wave — a travelling pattern of compressions and rarefactions in the air."
    >
      <section className="card stack" aria-labelledby="sound-orient">
        <h2 id="sound-orient">Orient — the phenomenon</h2>
        <p>
          Clap your hands and someone across the room hears it almost instantly —
          yet the air between you never rushes across the room. An ambulance siren
          sounds higher as it races towards you and drops the moment it passes,
          even though the siren itself never changes its note. Turn a speaker up
          and it sounds louder, but the note stays exactly the same pitch.
        </p>
        <p className="wave-lab__question">
          <strong>Driving question:</strong> if the air stays put, what travels
          from the source to your ear — and what makes one sound higher, louder,
          or seem to change pitch as it moves?
        </p>
        <h3>Learning intention</h3>
        <p>In this laboratory you will work towards these syllabus outcomes:</p>
        <ul>
          {SOUND_OUTCOMES.map((code) => (
            <li key={code}>
              <strong>{code}</strong> — {outcomeMap[code].text}
            </li>
          ))}
        </ul>
        <p className="wave-lab__deferral-note">
          How the ear responds to sound (7.2.4), sound in Aboriginal and Torres
          Strait Islander instruments (7.2.5) and medical ultrasound (7.2.6) are
          covered in later stages of this app.
        </p>
      </section>

      <section className="card stack" aria-labelledby="sound-learn">
        <h2 id="sound-learn">Learn — sound as a longitudinal wave</h2>
        <p>
          A sound wave is a <strong>longitudinal</strong> wave: the air particles
          vibrate <strong>back and forth along</strong> the direction the sound
          travels, not across it. Where particles bunch closer together than
          normal you get a <strong>compression</strong> (a high-pressure region);
          where they spread further apart you get a <strong>rarefaction</strong>{' '}
          (a low-pressure region). A microphone at one point measures the pressure
          rising and falling as these compressions and rarefactions sweep past.
        </p>
        <SoundAnatomyDiagram />
        <p>
          As with every wave, <strong>energy travels but matter does not</strong>:
          each air particle only oscillates about its home position and returns —
          it does not fly from the source to your ear. The wave carries the energy;
          the air stays put.
        </p>
      </section>

      <section className="card stack" aria-labelledby="sound-phases-guide">
        <h2 id="sound-phases-guide">How this laboratory works</h2>
        <p>
          Work through the phases in the navigation above:{' '}
          <strong>Explore</strong> compressions and rarefactions with four linked
          views, <strong>Investigate</strong> how amplitude and frequency change
          loudness and pitch, <strong>Explore</strong> the Doppler effect,{' '}
          <strong>Check</strong> your understanding, <strong>Explain</strong> the
          siren with a claim–evidence–reasoning argument, then{' '}
          <strong>Connect</strong> the ideas to real technology. Evidence you save
          lands on your <Link to="/progress">Progress page</Link>.
        </p>
      </section>

      <section className="card stack" aria-labelledby="sound-limits">
        <h2 id="sound-limits">Model limitations (honesty box)</h2>
        <ul>
          <li>
            The default speed of sound is <strong>343 m/s</strong> in dry air at
            about 20 °C — a labelled reference approximation, not a calibrated
            measurement. Temperature and medium change it.
          </li>
          <li>
            The app shows a <strong>relative</strong> pressure and output level.
            It does <em>not</em> measure calibrated sound-pressure level
            (decibels): there is no hardware calibration.
          </li>
          <li>
            The Doppler model is a one-dimensional arrival-timing model at
            subsonic speeds. Sonic booms and shock waves are out of scope.
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
