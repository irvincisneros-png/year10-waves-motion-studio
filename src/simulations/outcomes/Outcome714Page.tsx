import { useCallback, useMemo, useState } from 'react';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { WaveRunnerBrief, type WaveRunnerStep } from '../../components/sim/WaveRunnerBrief';
import { outcomeMap } from '../../content/outcomes';
import {
  EMPTY_SPECTRUM_PINS,
  EM_REGIONS,
  EM_SPECTRUM_PROVENANCE,
  SPECTRUM_LONG_EDGE_M,
  SPECTRUM_SHORT_EDGE_M,
  comparePinnedSpectrumStates,
  createSpectrumCalibrationChallenge,
  evaluateSpectrumCalibrationMission,
  logPositionFromWavelength,
  pinSpectrumState,
  spectrumStateFromFrequency,
  spectrumStateFromLogPosition,
  spectrumStateFromWavelength,
  type ContinuousSpectrumState,
  type EmRegionId,
  type SpectrumBoundaryMission,
  type SpectrumCalibrationResult,
  type SpectrumCompareMission,
  type SpectrumPins,
  type SpectrumSelection,
  type SpectrumTuneMission,
} from '../../science/emSpectrum';
import { useSettingsStore } from '../../store/settingsStore';
import './Outcome714Page.css';
import './OutcomeGamePolish.css';

const TOUR_STEPS = [
  {
    title: 'Tune one continuous family',
    body: 'Move from long radio wavelengths to short gamma wavelengths. Frequency updates inversely while every wave keeps the same vacuum speed.',
  },
  {
    title: 'Pin two wave forms',
    body: 'Save A and B anywhere on the scale. Compare wavelength, frequency and photon-energy order from the linked values.',
  },
  {
    title: 'Treat boundaries honestly',
    body: 'Named regions are useful conventions, not sharp natural walls. At some wavelengths, more than one approximate region is valid.',
  },
] as const;

const CHALLENGE_SEED = 0x714;

function scientific(value: number, digits = 3): string {
  return value.toExponential(digits - 1).replace('e+', 'e');
}

function regionNames(state: ContinuousSpectrumState): string {
  return state.candidateRegionIds
    .map((id) => EM_REGIONS.find((region) => region.id === id)?.name ?? id)
    .join(' / ');
}

interface ChallengeSummary {
  results: readonly SpectrumCalibrationResult[];
  score: number;
  maxScore: 300;
}

export default function Outcome714Page() {
  const visibleRegion = EM_REGIONS.find((region) => region.id === 'visible')!;
  const initialState = spectrumStateFromWavelength(visibleRegion.representativeM);
  const [position, setPosition] = useState(initialState.logPosition);
  const [wavelengthEntry, setWavelengthEntry] = useState(scientific(initialState.wavelengthM));
  const [frequencyEntry, setFrequencyEntry] = useState(scientific(initialState.frequencyHz));
  const [entryError, setEntryError] = useState('');
  const [pins, setPins] = useState<SpectrumPins>(EMPTY_SPECTRUM_PINS);
  const [replayIndex, setReplayIndex] = useState(0);
  const [compareSelection, setCompareSelection] = useState<SpectrumSelection | null>(null);
  const [boundarySelections, setBoundarySelections] = useState<readonly EmRegionId[]>([]);
  const [tuneResult, setTuneResult] = useState<SpectrumCalibrationResult | null>(null);
  const [summary, setSummary] = useState<ChallengeSummary | null>(null);
  const [message, setMessage] = useState('Tune the scale, pin two wave forms, then complete the three calibration missions.');
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const lowGraphics = useSettingsStore((state) => state.lowGraphics);
  const { announce } = useAnnouncer();
  const currentState = useMemo(() => spectrumStateFromLogPosition(position), [position]);
  const pinComparison = useMemo(() => comparePinnedSpectrumStates(pins), [pins]);
  const challenge = useMemo(
    () => createSpectrumCalibrationChallenge(CHALLENGE_SEED, replayIndex),
    [replayIndex],
  );
  const tuneMission = challenge.missions[0] as SpectrumTuneMission;
  const compareMission = challenge.missions[1] as SpectrumCompareMission;
  const boundaryMission = challenge.missions[2] as SpectrumBoundaryMission;

  const syncEntries = useCallback((state: ContinuousSpectrumState) => {
    setWavelengthEntry(scientific(state.wavelengthM));
    setFrequencyEntry(scientific(state.frequencyHz));
  }, []);

  const setTunerState = useCallback((state: ContinuousSpectrumState) => {
    setPosition(state.logPosition);
    syncEntries(state);
    setEntryError('');
    setTuneResult(null);
    setSummary(null);
  }, [syncEntries]);

  const tuneByPosition = (nextPosition: number) => {
    const nextState = spectrumStateFromLogPosition(nextPosition);
    setTunerState(nextState);
  };

  const jumpToRegion = (id: EmRegionId) => {
    const region = EM_REGIONS.find((item) => item.id === id)!;
    setTunerState(spectrumStateFromWavelength(region.representativeM));
    announce(`Spectrum tuned to the representative ${region.name} wavelength.`);
  };

  const applyWavelength = () => {
    const value = Number(wavelengthEntry);
    try {
      const next = spectrumStateFromWavelength(value);
      setTunerState(next);
      announce(`Wavelength applied: ${scientific(next.wavelengthM)} metres.`);
    } catch {
      setEntryError(`Enter a wavelength from ${scientific(SPECTRUM_SHORT_EDGE_M)} to ${scientific(SPECTRUM_LONG_EDGE_M)} m.`);
    }
  };

  const applyFrequency = () => {
    const value = Number(frequencyEntry);
    try {
      const next = spectrumStateFromFrequency(value);
      setTunerState(next);
      announce(`Frequency applied: ${scientific(next.frequencyHz)} hertz.`);
    } catch {
      setEntryError('Enter a positive frequency whose wavelength lies within the displayed spectrum span.');
    }
  };

  const pinCurrent = (slot: 'A' | 'B') => {
    setPins((current) => pinSpectrumState(current, slot, currentState));
    setSummary(null);
    announce(`Pinned ${slot}: ${regionNames(currentState)}, wavelength ${scientific(currentState.wavelengthM)} metres.`);
  };

  const calibrateCurrent = () => {
    const result = evaluateSpectrumCalibrationMission(tuneMission, { kind: 'tune', state: currentState });
    setTuneResult(result);
    setSummary(null);
    setMessage(result.correct
      ? `Target calibration locked within ${(tuneMission.maxLogPositionError * 100).toFixed(0)}% of the logarithmic scale.`
      : `Move closer to the target ${regionNames(tuneMission.target)} representative wavelength.`);
    announce(result.correct ? 'Calibration target locked.' : 'Calibration target not yet locked.');
  };

  const toggleBoundaryRegion = (id: EmRegionId) => {
    setBoundarySelections((current) => current.includes(id)
      ? current.filter((candidate) => candidate !== id)
      : [...current, id]);
    setSummary(null);
  };

  const checkChallenge = () => {
    const tune = evaluateSpectrumCalibrationMission(tuneMission, { kind: 'tune', state: currentState });
    const compare = evaluateSpectrumCalibrationMission(compareMission, {
      kind: 'compare',
      selection: compareSelection ?? 'equal',
    });
    const boundary = evaluateSpectrumCalibrationMission(boundaryMission, {
      kind: 'boundary',
      selectedRegionIds: boundarySelections,
    });
    const results = [tune, compare, boundary] as const;
    const score = results.reduce((total, result) => total + result.score, 0);
    setTuneResult(tune);
    setSummary({ results, score, maxScore: 300 });
    if (results.every((result) => result.correct)) {
      setMessage('Spectrum calibration complete: linked values, relative order and overlapping boundary evidence all agree.');
      announce('Spectrum calibration complete. Three hundred out of three hundred points.');
    } else {
      setMessage('Some calibration evidence needs another pass. Use the mission feedback, then tune or revise your choices.');
      announce(`Spectrum calibration scored ${score} out of 300.`);
    }
  };

  const replayChallenge = () => {
    setReplayIndex((index) => index + 1);
    setCompareSelection(null);
    setBoundarySelections([]);
    setTuneResult(null);
    setSummary(null);
    setMessage('New deterministic calibration loaded. Tune the target, compare the mission pins and inspect the boundary candidates.');
    announce('New Spectrum Tuner calibration challenge loaded.');
  };

  const drawScene = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const background = ctx.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, '#07172a');
      background.addColorStop(0.55, '#0b2a3c');
      background.addColorStop(1, '#1b173e');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      const left = 44;
      const right = width - 44;
      const centreY = height * 0.55;
      const span = Math.max(120, right - left);
      const cycles = 1.2 + currentState.logPosition * 6.8;
      const amplitude = Math.min(82, height * 0.28);
      const samples = lowGraphics ? 72 : 180;

      ctx.strokeStyle = 'rgba(197, 221, 232, 0.3)';
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(left, centreY);
      ctx.lineTo(right, centreY);
      ctx.stroke();
      ctx.setLineDash([]);

      const waveGradient = ctx.createLinearGradient(left, 0, right, 0);
      waveGradient.addColorStop(0, '#5ed6e1');
      waveGradient.addColorStop(0.55, '#d6e9f1');
      waveGradient.addColorStop(1, '#b99bff');
      ctx.strokeStyle = waveGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let index = 0; index < samples; index += 1) {
        const fraction = index / (samples - 1);
        const x = left + fraction * span;
        const y = centreY - Math.sin(fraction * cycles * Math.PI * 2) * amplitude;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#dceaf2';
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ELECTRIC-FIELD REPRESENTATION', 18, 24);
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillStyle = '#aebfce';
      ctx.fillText('Display cycles are normalised so the enormous wavelength range remains visible.', 18, 43);

      ctx.fillStyle = 'rgba(7, 23, 42, 0.78)';
      ctx.fillRect(width - 238, height - 70, 210, 54);
      ctx.strokeStyle = '#f4f8fb';
      ctx.fillStyle = '#f4f8fb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width - 155, height - 34);
      ctx.lineTo(width - 66, height - 34);
      ctx.lineTo(width - 78, height - 41);
      ctx.moveTo(width - 66, height - 34);
      ctx.lineTo(width - 78, height - 27);
      ctx.stroke();
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('propagation at c in vacuum →', width - 38, height - 48);
    },
    [currentState.logPosition, lowGraphics],
  );

  const currentRegions = currentState.candidateRegionIds.map((id) => EM_REGIONS.find((region) => region.id === id)!);
  const currentPrimary = currentRegions[0] ?? EM_REGIONS[0];
  const comparePropertyLabel = compareMission.property === 'photon-energy'
    ? 'higher photon energy'
    : compareMission.property === 'frequency'
      ? 'higher frequency'
      : 'longer wavelength';
  const frameKey = `${currentState.logPosition}|${lowGraphics}`;
  const outcome = outcomeMap['7.1.4'];
  const pinsReady = Boolean(pins.A && pins.B && compareSelection);
  const missionComplete = summary?.score === summary?.maxScore;
  const missionSteps: readonly WaveRunnerStep[] = [
    { label: 'Tune target', state: tuneResult?.correct ? 'complete' : 'active' },
    { label: 'Compare pins', state: pinsReady ? 'complete' : tuneResult?.correct ? 'active' : 'locked' },
    { label: 'Map boundary', state: missionComplete ? 'complete' : pinsReady ? 'active' : 'locked' },
  ];

  return (
    <Page
      title="7.1.4 Spectrum Tuner"
      heading={<><span className="outcome-714__code">7.1.4</span> Spectrum Tuner</>}
      lead={<span>{outcome.text}</span>}
    >
      <div className="outcome-714">
        <div className="outcome-714__command-row">
          <p className="outcome-714__eyebrow">Continuous EM spectrum · pin A/B lab</p>
          {tourOpen ? null : (
            <button type="button" className="outcome-714__text-button" data-control-id="outcome-7-1-4.tour-open" onClick={() => { setTourStep(0); setTourOpen(true); }}>Show quick tour</button>
          )}
        </div>

        <WaveRunnerBrief
          sector="Spectrum Navigator"
          title="Calibrate Pulse’s scanner across the EM spectrum"
          objective="Tune the continuous scale, compare two pinned wave forms, then identify every valid region at an overlapping boundary."
          status={missionComplete ? 'Spectrum scan calibrated across all three missions.' : pinsReady ? 'Pin comparison ready. Resolve the boundary mission.' : tuneResult?.correct ? 'Target locked. Build the A/B comparison.' : 'Tune to the target wavelength and calibrate the scanner.'}
          points={300}
          complete={missionComplete}
          theme="spectrum"
          steps={missionSteps}
        />

        {tourOpen ? (
          <aside className="outcome-714__tour" aria-label="Three-step simulator tour">
            <div className="outcome-714__tour-index" aria-hidden="true">{TOUR_STEPS.map((_, index) => <span key={index} data-active={index === tourStep} />)}</div>
            <div><p className="outcome-714__tour-kicker">Quick tour · {tourStep + 1} of 3</p><h2>{TOUR_STEPS[tourStep].title}</h2><p>{TOUR_STEPS[tourStep].body}</p></div>
            <div className="outcome-714__tour-actions">
              <button type="button" className="outcome-714__text-button" data-control-id="outcome-7-1-4.tour-dismiss" onClick={() => setTourOpen(false)}>Skip tour</button>
              <button type="button" className="btn" data-control-id="outcome-7-1-4.tour-next" onClick={() => tourStep === TOUR_STEPS.length - 1 ? setTourOpen(false) : setTourStep((step) => step + 1)}>{tourStep === TOUR_STEPS.length - 1 ? 'Start tuning' : 'Next'}</button>
            </div>
          </aside>
        ) : null}

        <section className="outcome-714__deck" aria-labelledby="outcome-714-deck-title">
          <div className="outcome-714__deck-heading">
            <div><p className="outcome-714__eyebrow">Spectrum tuner console</p><h2 id="outcome-714-deck-title">How do wavelength and frequency compare?</h2></div>
            <button type="button" className="outcome-714__calibrate" data-control-id="outcome-7-1-4.calibrate" data-testid="outcome-714-calibrate" onClick={calibrateCurrent}><span aria-hidden="true">⌖</span>Calibrate current setting</button>
          </div>

          <div className="outcome-714__scale">
            <div className="outcome-714__scale-labels"><span>long wavelength · low f</span><span>short wavelength · high f</span></div>
            <div className="outcome-714__spectrum-track" aria-hidden="true">
              {EM_REGIONS.map((region) => {
                const left = logPositionFromWavelength(region.longEdgeM) * 100;
                const right = logPositionFromWavelength(region.shortEdgeM) * 100;
                return <span key={region.id} className={`outcome-714__region-band outcome-714__region-band--${region.id}`} style={{ left: `${left}%`, width: `${Math.max(0.3, right - left)}%` }}><span>{region.name}</span></span>;
              })}
              <span className="outcome-714__cursor" style={{ left: `${currentState.logPosition * 100}%` }} />
            </div>
            <label htmlFor="spectrum-tuner-position"><strong>Continuous spectrum position</strong></label>
            <input id="spectrum-tuner-position" type="range" min="0" max="1" step="0.001" value={position} aria-label="Continuous spectrum position" data-testid="outcome-714-position" data-control-id="outcome-7-1-4.position" onChange={(event) => tuneByPosition(Number(event.target.value))} />
            <div className="outcome-714__pin-actions" data-control-id="outcome-7-1-4.region-jumps">
              {EM_REGIONS.map((region) => <button type="button" className="btn" key={region.id} data-testid={`outcome-714-jump-${region.id}`} onClick={() => jumpToRegion(region.id)}>{region.name}</button>)}
            </div>
          </div>

          <div className="outcome-714__viewport">
            <CanvasScene
              label={`Normalised electric-field wave representation at ${scientific(currentState.wavelengthM)} metres wavelength and ${scientific(currentState.frequencyHz)} hertz.`}
              height={280}
              frameKey={frameKey}
              draw={drawScene}
              testId="outcome-714-canvas"
              alternative={
                <div className="outcome-714__table-wrap">
                  <table className="outcome-714__state-table">
                    <caption>Live linked electromagnetic wave state</caption>
                    <thead><tr><th scope="col">Property</th><th scope="col">Current value</th><th scope="col">Comparison meaning</th></tr></thead>
                    <tbody>
                      <tr><th scope="row">Wavelength</th><td>{scientific(currentState.wavelengthM)} m</td><td>Shortens from left to right</td></tr>
                      <tr><th scope="row">Frequency</th><td>{scientific(currentState.frequencyHz)} Hz</td><td>Increases from left to right</td></tr>
                      <tr><th scope="row">Vacuum speed</th><td>{currentState.vacuumSpeedMps.toLocaleString('en-AU')} m/s</td><td>Same for every EM wave form</td></tr>
                      <tr><th scope="row">Approximate region candidate(s)</th><td>{regionNames(currentState)}</td><td>More than one may be valid near overlapping conventions</td></tr>
                    </tbody>
                  </table>
                </div>
              }
            />
          </div>

          <div className="outcome-714__instrument-bar" aria-label="Live Spectrum Tuner readouts">
            <p><span>Candidate region</span><strong>{regionNames(currentState)}</strong></p>
            <p><span>Wavelength λ</span><strong>{scientific(currentState.wavelengthM)} m</strong></p>
            <p><span>Frequency f</span><strong>{scientific(currentState.frequencyHz)} Hz</strong></p>
            <p><span>Vacuum speed c</span><strong>{currentState.vacuumSpeedMps.toLocaleString('en-AU')} m/s</strong></p>
          </div>

          <div className="outcome-714__linked-inputs">
            <label>Enter wavelength λ (m)<input value={wavelengthEntry} inputMode="decimal" aria-label="Enter wavelength in metres" data-control-id="outcome-7-1-4.wavelength-entry" onChange={(event) => setWavelengthEntry(event.target.value)} /><button type="button" className="btn" data-control-id="outcome-7-1-4.wavelength-apply" onClick={applyWavelength}>Apply wavelength</button><small>Frequency updates from c = fλ.</small></label>
            <label>Enter frequency f (Hz)<input value={frequencyEntry} inputMode="decimal" aria-label="Enter frequency in hertz" data-control-id="outcome-7-1-4.frequency-entry" onChange={(event) => setFrequencyEntry(event.target.value)} /><button type="button" className="btn" data-control-id="outcome-7-1-4.frequency-apply" onClick={applyFrequency}>Apply frequency</button><small>Wavelength updates from λ = c/f.</small></label>
          </div>
          {entryError ? <p className="field__error" role="status">{entryError}</p> : null}

          <div className="outcome-714__candidate-row" data-testid="outcome-714-candidates"><strong>Approximate candidate region{currentRegions.length === 1 ? '' : 's'}:</strong>{currentRegions.map((region) => <span key={region.id} className="outcome-714__candidate-chip">{region.name}</span>)}<span>Boundaries may overlap.</span></div>

          <div className="outcome-714__pin-panel">
            <div><p className="outcome-714__eyebrow">Pin comparison</p><h3>Save A and B anywhere on the continuous scale</h3></div>
            <div className="outcome-714__pin-actions">
              <button type="button" className="btn" data-control-id="outcome-7-1-4.pin-a" onClick={() => pinCurrent('A')}>Pin current as A</button>
              <button type="button" className="btn" data-control-id="outcome-7-1-4.pin-b" onClick={() => pinCurrent('B')}>Pin current as B</button>
              <button type="button" className="btn" data-control-id="outcome-7-1-4.clear-pins" onClick={() => { setPins(EMPTY_SPECTRUM_PINS); setSummary(null); }}>Clear pins</button>
            </div>
            <div className="outcome-714__pin-grid">
              {(['A', 'B'] as const).map((slot) => <div className="outcome-714__pin-card" key={slot}><span>Pin {slot}</span>{pins[slot] ? <><strong>{regionNames(pins[slot])}</strong><span>λ {scientific(pins[slot].wavelengthM)} m · f {scientific(pins[slot].frequencyHz)} Hz</span></> : <strong>Not pinned</strong>}</div>)}
            </div>
            {pinComparison ? <p role="status" data-testid="outcome-714-pin-comparison">Compared with A, B has a {pinComparison.pinBWavelength} wavelength, {pinComparison.pinBFrequency} frequency and {pinComparison.pinBPhotonEnergy} photon energy. Both keep c = {pinComparison.sharedVacuumSpeedMps.toLocaleString('en-AU')} m/s in vacuum.</p> : <p>Pin both A and B to reveal their linked comparison.</p>}
          </div>

          <p className="outcome-714__honesty"><strong>Model honesty:</strong> the coloured named regions are approximate, sometimes overlapping conventions. Displayed wave cycles are normalised and do not share one physical distance scale. Higher frequency means higher photon energy, but risk also depends on interaction, exposure and dose.</p>
        </section>

        <section className="outcome-714__challenge" aria-labelledby="outcome-714-challenge-title">
          <div className="outcome-714__challenge-copy"><p className="outcome-714__eyebrow">Three-mission calibration</p><h2 id="outcome-714-challenge-title">Tune, compare and handle a boundary</h2><p>Objective: calibrate the target wave form, compare two mission pins from linked values, then select every valid region at an overlapping boundary.</p></div>

          <div className="outcome-714__checks">
            <div className="outcome-714__check"><strong>1 · Tune to {regionNames(tuneMission.target)}</strong><p data-testid="outcome-714-tune-target">Target λ = {scientific(tuneMission.target.wavelengthM)} m. Use the continuous slider, a region jump or a linked value entry.</p><p className={`outcome-714__result ${tuneResult?.correct ? 'is-correct' : 'is-incorrect'}`}>{tuneResult?.correct ? '✓ Calibration locked' : tuneResult ? 'Move closer to the target' : 'Not checked yet'}</p></div>
            <div className="outcome-714__check"><strong>2 · Compare mission pins</strong><p>Pin A: {regionNames(compareMission.pinA)} · λ {scientific(compareMission.pinA.wavelengthM)} m<br />Pin B: {regionNames(compareMission.pinB)} · λ {scientific(compareMission.pinB.wavelengthM)} m</p><p>Choose which pin has the {comparePropertyLabel}.</p></div>
            <div className="outcome-714__check"><strong>3 · Overlapping boundary</strong><p data-testid="outcome-714-boundary-target">At λ = {scientific(boundaryMission.target.wavelengthM)} m, select every named region whose approximate range includes the value.</p></div>
          </div>

          <div className="outcome-714__questions">
            <fieldset className="outcome-714__question" data-control-id="outcome-7-1-4.compare-answer"><legend><strong>Mission 2 answer</strong></legend><p>Which pin has the {comparePropertyLabel}?</p><div className="outcome-714__answer-options">{(['A', 'B', 'equal'] as const).map((selection) => <label key={selection}><input type="radio" name="spectrum-compare" checked={compareSelection === selection} onChange={() => { setCompareSelection(selection); setSummary(null); }} />{selection === 'equal' ? 'A and B are equal' : `Pin ${selection}`}</label>)}</div></fieldset>
            <fieldset className="outcome-714__question" data-control-id="outcome-7-1-4.boundary-answer"><legend><strong>Mission 3 candidates</strong></legend><p>Select all valid approximate regions.</p><div className="outcome-714__answer-options">{EM_REGIONS.map((region) => <label key={region.id}><input type="checkbox" checked={boundarySelections.includes(region.id)} onChange={() => toggleBoundaryRegion(region.id)} />{region.name}</label>)}</div></fieldset>
          </div>

          <div className="outcome-714__challenge-actions"><button type="button" className="btn btn--primary" data-control-id="outcome-7-1-4.challenge-check" data-testid="outcome-714-challenge-check" onClick={checkChallenge}>Check all missions</button><button type="button" className="btn" data-control-id="outcome-7-1-4.challenge-replay" data-testid="outcome-714-challenge-replay" onClick={replayChallenge}>New calibration</button></div>
          <p className="outcome-714__result" role="status">{message}</p>

          {summary ? <div className={`outcome-714__reward ${summary.score === summary.maxScore ? 'is-complete' : ''}`} role="status" aria-live="polite"><div className="outcome-714__score-ring" aria-hidden="true">{summary.score}</div><div><p className="outcome-714__reward-title">{summary.score === summary.maxScore ? 'Spectrum calibration expert unlocked' : 'Calibration needs another pass'}</p><p>{summary.score}/{summary.maxScore} points. {summary.score === summary.maxScore ? 'You linked wavelength, frequency, photon-energy order and approximate boundary conventions.' : 'Each mission is worth 100 points; partial tune proximity can earn limited credit.'}</p></div></div> : null}

          <details open data-control-id="outcome-7-1-4.sources"><summary>Authoritative sources and model limits</summary>{EM_SPECTRUM_PROVENANCE.map((source) => <p key={source.id}><strong>{source.authority}:</strong> <a href={source.url} target="_blank" rel="noreferrer" aria-label={`${source.authority}: ${source.title}`}>{source.title}</a>. {source.supports} Reviewed {source.reviewDate}.</p>)}<p>Region boundaries are teaching conventions and are not defined by BIPM or NASA as sharp universal constants.</p></details>
        </section>

        <section className="card"><h2>{currentPrimary.name} evidence snapshot</h2><p><strong>Sources:</strong> {currentPrimary.sources}. <strong>Detectors:</strong> {currentPrimary.detectors}.</p><p><strong>Interactions:</strong> {currentPrimary.interactions}</p><p><strong>Uses:</strong> {currentPrimary.uses.join(', ')}. <strong>Risk control:</strong> {currentPrimary.riskControl}</p></section>
      </div>
    </Page>
  );
}
