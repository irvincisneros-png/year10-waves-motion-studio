import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { formatSigFigs } from '../../science/units';
import { SOUND_SPEED_AIR_20C } from '../../science/sound';

/** Stage 3 Connect phase: applications of the three implemented sound outcomes. */
export default function SoundConnectPage() {
  return (
    <Page
      title="Sound in the real world"
      lead="Compression patterns, frequency and amplitude, and arrival timing explain technologies from microphones to speed sensing."
    >
      <section className="card stack">
        <h2>Microphones: pressure becomes a signal</h2>
        <p>
          A microphone does not collect air that travelled from the source. Its diaphragm moves
          back and forth as local compressions and rarefactions change the pressure. The device
          turns that pressure-versus-time pattern into an electrical signal. The period of the
          signal gives its frequency; its relative amplitude tracks the size of the pressure
          variation.
        </p>
        <p>
          Revisit the <Link to="/sound/compression">four linked representations</Link> and move
          the microphone probe to connect the particle pattern with the trace.
        </p>
      </section>

      <section className="card stack">
        <h2>Audio engineering: pitch and level stay separate</h2>
        <p>
          A musician tunes a note by adjusting its frequency. A sound engineer changes an output
          level to make a signal stronger or weaker. The controls solve different problems:
          frequency primarily affects pitch, while amplitude relates to loudness. Real hearing is
          non-linear, so equal-amplitude tones at different frequencies may not sound equally loud,
          and this app never claims to measure calibrated decibels.
        </p>
        <p>
          Use the <Link to="/sound/pitch-loudness">pitch and loudness investigation</Link> to
          make a fair comparison with sound off or on.
        </p>
      </section>

      <section className="card stack">
        <h2>Doppler sensing: read motion from arrival timing</h2>
        <p>
          Doppler instruments compare emitted and detected frequencies to infer relative motion.
          The source frequency and the wave speed through the medium remain fixed; the detected
          interval changes because the wavefronts are bunched or stretched. In the model here,
          sound travels through dry air at the reference approximation{' '}
          {formatSigFigs(SOUND_SPEED_AIR_20C)} m/s near 20 °C.
        </p>
        <p>
          Try the pass scenario in the <Link to="/sound/doppler">Doppler model</Link>, then check
          that the source-frequency line stays flat while the detected-frequency line changes.
        </p>
      </section>

      <section className="card stack">
        <h2>Finish the learning cycle</h2>
        <p>
          Review the <Link to="/sound/check">sound checks</Link>, save your{' '}
          <Link to="/sound/explain">explanation</Link>, or export your anonymous evidence from
          the <Link to="/progress">Progress page</Link>.
        </p>
      </section>
    </Page>
  );
}
