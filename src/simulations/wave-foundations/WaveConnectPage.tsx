import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { formatSigFigs } from '../../science/units';
import { LIGHT_SPEED_MPS, SOUND_AIR, SOUND_FRESH_WATER } from '../../science/constants';

/**
 * Connect phase: honest, short application contexts linking the wave
 * properties from this lab to real technology. No dead links, no teasers —
 * deeper treatments (ultrasound, EM spectrum) are named as later-stage
 * workspaces without pretending to exist yet.
 */
export default function WaveConnectPage() {
  return (
    <Page
      title="Waves in the real world"
      lead="The same three ideas — a source setting frequency, a medium setting speed, and λ = v/f — sit inside technology you use every day."
    >
      <section className="card stack">
        <h2>Radio and Wi-Fi: choosing a wavelength</h2>
        <p>
          An FM station transmitting at 100 MHz is sending an electromagnetic
          wave at c ≈ {formatSigFigs(LIGHT_SPEED_MPS)} m/s, so each wave is
          λ = v/f ≈ 3.0 m long. Antennas work best when their length matches a
          simple fraction of the wavelength — which is why car FM aerials are
          roughly 75 cm (a quarter of 3 m), while your phone's 2.4 GHz Wi-Fi
          (λ ≈ 12.5 cm) needs only a tiny internal antenna. Engineers pick
          frequencies, and therefore wavelengths, to fit the hardware and how
          far the signal must reach.
        </p>
      </section>

      <section className="card stack">
        <h2>Sonar and echo sounding: the medium sets the speed</h2>
        <p>
          Sound travels at about {formatSigFigs(SOUND_AIR.speedMps!)} m/s in
          air but roughly {formatSigFigs(SOUND_FRESH_WATER.speedMps!)} m/s in
          water — the medium, not the source, sets the speed. Ships use this:
          a sonar ping's echo time, multiplied by the known speed of sound in
          water, gives the depth. Get the medium's speed wrong and every depth
          reading is wrong too — exactly the "medium sets speed" rule you
          tested in the measurement lab.
        </p>
      </section>

      <section className="card stack">
        <h2>Earthquakes: energy without net transport</h2>
        <p>
          A seismic wave can flatten buildings hundreds of kilometres from the
          epicentre, yet the rock between arrives nowhere — each piece of
          ground oscillates about its rest position, just like your tagged
          particles. Seismologists time the arrival of the waves at different
          stations and, knowing wave speeds in rock, locate the source — the
          energy-transfer model from this lab at continental scale.
        </p>
      </section>

      <section className="card stack">
        <h2>Where next</h2>
        <p>
          Sound in detail (pitch, loudness, Doppler) and the electromagnetic
          spectrum each get their own laboratory in a later stage of this app.
          For now you can review your <Link to="/progress">evidence</Link> or
          revisit the <Link to="/waves/measure">measurement lab</Link> with a
          different preset.
        </p>
      </section>
    </Page>
  );
}
