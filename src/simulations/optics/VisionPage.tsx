import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { SimControl } from '../../components/sim/SimControl';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import {
  EYE_STRUCTURES,
  eyeFocusState,
  idealAccommodationPercent,
  pupilOpeningPercent,
  retinalImageRelativeSize,
  type FocusingProblem,
} from '../../science/vision';
import { EyeDiagram } from './EyeDiagram';

const BLIND_SPOT_STEPS = [
  'Keep both eyes open and read the instructions. This is a text-guided perception demonstration, not a medical test.',
  'Cover your left eye gently. Do not press on it. Look steadily at the cross symbol on screen with your right eye.',
  'Slowly change your viewing distance while keeping your gaze on the cross. A nearby dot may disappear when its image falls near the optic-disc blind spot.',
  'Uncover your eye. The effect shows that perception fills a gap where the optic nerve leaves the retina; it does not diagnose vision or eye health.',
];

export default function VisionPage() {
  const [distanceCm, setDistanceCm] = useState(50);
  const [brightness, setBrightness] = useState(60);
  const [problem, setProblem] = useState<FocusingProblem>('none');
  const [accommodation, setAccommodation] = useState(() => idealAccommodationPercent(50));
  const [blindStep, setBlindStep] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'saved'>('idle');
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);

  const pupil = pupilOpeningPercent(brightness);
  const imageScale = retinalImageRelativeSize(distanceCm);
  const focus = eyeFocusState(distanceCm, accommodation, problem);

  const reset = () => {
    setDistanceCm(50);
    setBrightness(60);
    setProblem('none');
    setAccommodation(idealAccommodationPercent(50));
    setBlindStep(0);
    setExplanation('');
    setStatus('idle');
    announce('Vision model reset.');
  };

  const save = () => {
    if (explanation.trim().length === 0) {
      setStatus('error');
      announce('Enter an optical and neural explanation before saving.');
      return;
    }
    addEvidence({ outcomeCode: '7.3.1', kind: 'explanation', summary: `Eye response — optical versus neural stages: ${explanation.trim()}` });
    setOutcomeLevel('7.3.1', nextLevelAfterSuccess(outcomes['7.3.1'] ?? 'not-attempted'));
    setStatus('saved');
    announce('Vision explanation saved as evidence.');
  };

  return (
    <Page title="How the eye responds to light" lead="Adjust a relative eye model, then separate optical image formation from neural interpretation.">
      <div className="seg-control__options">
        <button type="button" className="btn" onClick={reset} data-testid="vision-reset" data-control-id="global.reset-button">↺ Reset vision model</button>
      </div>

      <section className="card stack" aria-labelledby="vision-model-heading">
        <h2 id="vision-model-heading">Explore — brightness, distance and focus</h2>
        <div className="light-controls">
          <SimControl id="vision.object-distance-slider" label="Object distance" min={10} max={1000} step={5} value={distanceCm} onChange={(value) => { setDistanceCm(value); setAccommodation(idealAccommodationPercent(value, problem)); }} format={(value) => value < 100 ? `Distance: ${value.toFixed(0)} cm` : `Distance: ${(value / 100).toFixed(2)} m`} hint="The reset/initial behaviour auto-focuses for the selected distance." testId="vision-distance" />
          <SimControl id="vision.brightness-slider" label="Ambient brightness" min={0} max={100} step={5} value={brightness} onChange={setBrightness} format={(value) => `Brightness: ${value.toFixed(0)}%`} hint="A relative scene setting, not a lux measurement." testId="vision-brightness" />
          <SimControl id="vision.accommodation-slider" label="Lens accommodation" min={0} max={100} step={5} value={accommodation} onChange={setAccommodation} format={(value) => `Accommodation: ${value.toFixed(0)}%`} hint="Relative teaching scale. Focus status is also stated in text." testId="vision-accommodation" />
          <div className="field" data-control-id="vision.focusing-problem-toggle">
            <label className="field__label" htmlFor="vision-problem">Focusing problem model</label>
            <select id="vision-problem" className="field__unit" value={problem} onChange={(event) => { const value = event.target.value as FocusingProblem; setProblem(value); setAccommodation(idealAccommodationPercent(distanceCm, value)); }} data-testid="vision-problem">
              <option value="none">None</option><option value="short-sighted">Short-sighted model</option><option value="long-sighted">Long-sighted model</option>
            </select>
            <p className="seg-control__note">Educational extension only — not medical advice or a diagnostic test.</p>
          </div>
        </div>

        <div className="vision-grid">
          <EyeDiagram pupilOpeningPercent={pupil} imageScale={imageScale} focus={focus} />
          <div className="stack">
            <dl className="light-readouts">
              <div data-control-id="vision.pupil-response-display" role="status" aria-label="Relative pupil opening"><dt>Relative pupil opening</dt><dd data-testid="vision-pupil">{pupil.toFixed(0)}% — teaching model, not millimetres</dd></div>
              <div><dt>Retinal image size</dt><dd data-testid="vision-image-size">{imageScale.toFixed(2)} relative units</dd></div>
              <div><dt>Focus state</dt><dd data-testid="vision-focus">{focus.status}; ideal relative accommodation {focus.idealAccommodationPercent.toFixed(0)}%</dd></div>
            </dl>
            {problem !== 'none' ? <p className="notice notice--warning"><strong>Non-diagnostic model:</strong> this simplified shift only illustrates where focus can fall relative to the retina. It cannot assess anyone’s eyesight.</p> : null}
          </div>
        </div>
      </section>

      <section className="card stack" aria-labelledby="eye-pathway-heading">
        <h2 id="eye-pathway-heading">Learn — optical pathway and neural pathway</h2>
        <dl className="eye-structure-list">
          {EYE_STRUCTURES.map(([name, description]) => <div key={name}><dt>{name}</dt><dd>{description}</dd></div>)}
        </dl>
        <p><strong>Optical stage:</strong> cornea and lens refract rays to form an inverted optical image on the retina. <strong>Neural stage:</strong> retinal receptors convert light to signals carried by the optic nerve; networks in the brain interpret patterns. “The brain simply flips it” leaves out both conversion and interpretation.</p>
      </section>

      <section className="card stack" aria-labelledby="blind-heading">
        <h2 id="blind-heading">Explore — text-guided blind-spot demonstration</h2>
        <p role="status" data-testid="blind-step">Step {blindStep + 1} of {BLIND_SPOT_STEPS.length}: {BLIND_SPOT_STEPS[blindStep]}</p>
        <p aria-hidden="true" style={{ fontSize: '2rem', letterSpacing: '8rem', textAlign: 'center' }}>＋ •</p>
        <button type="button" className="btn" data-control-id="vision.blind-spot-demo-button" data-testid="vision-blind-spot" onClick={() => { const next = (blindStep + 1) % BLIND_SPOT_STEPS.length; setBlindStep(next); announce(`Blind-spot demonstration step ${next + 1}.`); }}>Run blind spot demonstration — next step</button>
      </section>

      <section className="card stack" aria-labelledby="vision-evidence-heading">
        <h2 id="vision-evidence-heading">Explain and save evidence</h2>
        <label className="notice-capture__label" htmlFor="vision-explanation">Explain how an optical image becomes a perceived scene. Name at least one optical structure and one neural stage.</label>
        <textarea id="vision-explanation" className="notice-capture__input" rows={4} value={explanation} onChange={(event) => { setExplanation(event.target.value); setStatus('idle'); }} data-testid="vision-explanation" />
        <button type="button" className="btn btn--primary" onClick={save} data-testid="vision-save">Save vision explanation</button>
        {status === 'error' ? <p role="status" className="field__error">Enter an explanation before saving; empty evidence is not accepted.</p> : null}
        {status === 'saved' ? <p role="status" className="notice-capture__status">✓ Saved for outcome 7.3.1. Review it on the <Link to="/progress">Progress page</Link>.</p> : null}
      </section>
    </Page>
  );
}
