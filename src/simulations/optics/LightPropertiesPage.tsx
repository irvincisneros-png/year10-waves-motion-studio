import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { SimControl } from '../../components/sim/SimControl';
import { LineGraph } from '../../components/graphs/LineGraph';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterAttempt, nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import { formatSigFigs } from '../../science/units';
import {
  DEFAULT_LIGHT_FREQUENCY_HZ,
  ILLUMINANTS,
  OPTICAL_MEDIA,
  OPTICAL_SURFACES,
  criticalAngleDeg,
  energyLedger,
  opticalMediumById,
  qualitativeMirrorImage,
  reflect,
  refract,
  reflectionChallenge,
  scatteringRegime,
  type IlluminantId,
  type MirrorType,
  type SurfaceId,
} from '../../science/optics';
import { RayDiagram } from './RayDiagram';
import { EnergyLedgerView } from './EnergyLedgerView';

type Trial = {
  id: string;
  kind: 'reflection' | 'refraction' | 'energy';
  input: string;
  result: string;
  incidentAngleDeg?: number;
  measuredAngleDeg?: number;
};

function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvField(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export default function LightPropertiesPage() {
  const [sourceX, setSourceX] = useState(20);
  const [mirrorX, setMirrorX] = useState(50);
  const [mirrorRotation, setMirrorRotation] = useState(60);
  const [showNormal, setShowNormal] = useState(true);
  const [protractor, setProtractor] = useState(false);
  const [mirrorType, setMirrorType] = useState<MirrorType>('plane');
  const [challenge, setChallenge] = useState<'none' | 'periscope' | 'reflector'>('none');
  const [firstMediumId, setFirstMediumId] = useState('air');
  const [secondMediumId, setSecondMediumId] = useState('water');
  const [incidentAngle, setIncidentAngle] = useState(30);
  const [showSnell, setShowSnell] = useState(false);
  const [tirDemo, setTirDemo] = useState(false);
  const [showFibre, setShowFibre] = useState(false);
  const [surfaceId, setSurfaceId] = useState<SurfaceId>('smoked-glass');
  const [illuminantId, setIlluminantId] = useState<IlluminantId>('daylight');
  const [particleSize, setParticleSize] = useState(20);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [limitation, setLimitation] = useState('');
  const [evidenceStatus, setEvidenceStatus] = useState<'idle' | 'error' | 'saved'>('idle');
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);

  const reflectionAngle = Math.min(89, Math.abs(90 - mirrorRotation));
  const reflectionResult = reflect(reflectionAngle);
  const firstMedium = opticalMediumById(firstMediumId)!;
  const secondMedium = opticalMediumById(secondMediumId)!;
  const refraction = refract(firstMedium.refractiveIndex, secondMedium.refractiveIndex, incidentAngle);
  const critical = criticalAngleDeg(firstMedium.refractiveIndex, secondMedium.refractiveIndex);
  const ledger = energyLedger(surfaceId, illuminantId);
  const scattering = scatteringRegime(particleSize);
  const challengeTarget = challenge === 'periscope' ? 45 : 30;
  const challengeResult = challenge === 'none' ? null : reflectionChallenge(challengeTarget, mirrorRotation);

  const reflectionPoints = useMemo(
    () => trials.filter((trial) => trial.kind === 'reflection' && trial.incidentAngleDeg !== undefined).map((trial) => ({ at: trial.incidentAngleDeg!, value: trial.measuredAngleDeg! })).sort((a, b) => a.at - b.at),
    [trials],
  );

  const addTrial = (trial: Omit<Trial, 'id'>) => {
    setTrials((current) => [...current, { ...trial, id: crypto.randomUUID() }]);
    announce(`${trial.kind} trial recorded.`);
  };

  const reset = () => {
    if (trials.length > 0 && !window.confirm('Clear all light-property trials and reset the laboratory?')) return;
    setSourceX(20); setMirrorX(50); setMirrorRotation(60); setShowNormal(true); setProtractor(false); setMirrorType('plane'); setChallenge('none');
    setFirstMediumId('air'); setSecondMediumId('water'); setIncidentAngle(30); setShowSnell(false); setTirDemo(false); setShowFibre(false);
    setSurfaceId('smoked-glass'); setIlluminantId('daylight'); setParticleSize(20); setTrials([]); setInterpretation(''); setLimitation(''); setEvidenceStatus('idle');
    announce('Light properties laboratory reset.');
  };

  const enableTir = (enabled: boolean) => {
    setTirDemo(enabled);
    if (enabled) {
      setFirstMediumId('crown-glass');
      setSecondMediumId('air');
      setIncidentAngle(45);
      announce('TIR demonstration loaded: crown glass to air at 45 degrees.');
    }
  };

  const saveEvidence = () => {
    if (trials.length < 3 || !trials.some((t) => t.kind === 'reflection') || !trials.some((t) => t.kind === 'refraction') || !trials.some((t) => t.kind === 'energy') || interpretation.trim() === '' || limitation.trim() === '') {
      setEvidenceStatus('error');
      setOutcomeLevel('7.3.2', nextLevelAfterAttempt(outcomes['7.3.2'] ?? 'not-attempted'));
      announce('Complete all three trial types, interpretation and limitation before saving.');
      return;
    }
    addEvidence({ outcomeCode: '7.3.2', kind: 'investigation', summary: `Light properties investigation (${trials.length} trials). Interpretation: ${interpretation.trim()} | Limitation/improvement: ${limitation.trim()}` });
    setOutcomeLevel('7.3.2', nextLevelAfterSuccess(outcomes['7.3.2'] ?? 'not-attempted'));
    setEvidenceStatus('saved');
    announce('Light investigation saved as evidence.');
  };

  const trialsCsv = () => ['Trial type,Inputs with units,Result with units', ...trials.map((trial) => [trial.kind, csvField(trial.input), csvField(trial.result)].join(','))].join('\n');
  const trialsJson = () => JSON.stringify({ schema: 'wavemotion.optics-investigation', version: 1, title: 'Light properties investigation', exportedAt: new Date().toISOString(), trials }, null, 2);

  return (
    <Page title="Investigate light properties" lead="Measure reflection and refraction, then compare a normalised absorption/scattering model. Record all three kinds of evidence.">
      <div className="seg-control__options"><button type="button" className="btn" onClick={reset} data-testid="optics-reset" data-control-id="global.reset-button">↺ Reset light laboratory</button></div>

      <section className="card stack" aria-labelledby="reflection-heading">
        <h2 id="reflection-heading">1. Reflection — measure from the normal</h2>
        <div className="light-controls">
          <SimControl id="optics.reflection-source-drag" label="Light source position" min={0} max={100} step={1} value={sourceX} onChange={setSourceX} format={(value) => `Source at x = ${value.toFixed(0)} cm`} hint="Keyboard and pointer-operable numeric position." testId="reflection-source" />
          <div className="stack" data-control-id="optics.reflection-mirror-drag">
            <SimControl id="optics.reflection-mirror-position" label="Mirror position" min={0} max={100} step={1} value={mirrorX} onChange={setMirrorX} format={(value) => `Position: ${value.toFixed(0)} cm`} testId="mirror-position" />
            <SimControl id="optics.reflection-mirror-angle" label="Mirror position and angle" min={1} max={180} step={1} value={mirrorRotation} onChange={setMirrorRotation} format={(value) => `Mirror angle: ${value.toFixed(0)}°; incident angle: ${Math.min(89, Math.abs(90 - value)).toFixed(0)}° from normal`} testId="mirror-angle" />
          </div>
          <div className="field"><label><input type="checkbox" checked={showNormal} onChange={(event) => setShowNormal(event.target.checked)} data-control-id="optics.reflection-normal-toggle" data-testid="normal-toggle" /> Show normal line</label></div>
          <div className="field"><label><input type="checkbox" checked={protractor} onChange={(event) => setProtractor(event.target.checked)} data-control-id="optics.reflection-protractor-tool" data-testid="protractor-toggle" /> Protractor</label><p className="seg-control__note">{protractor ? `Measured incident ${reflectionResult.incidentAngleDeg.toFixed(1)}°; reflected ${reflectionResult.reflectedAngleDeg.toFixed(1)}° — both from the normal.` : 'Attach the protractor to show the numeric measurement.'}</p></div>
          <div className="field"><label className="field__label" htmlFor="mirror-type">Mirror type</label><select id="mirror-type" className="field__unit" value={mirrorType} onChange={(event) => setMirrorType(event.target.value as MirrorType)} data-control-id="optics.mirror-type-select" data-testid="mirror-type"><option value="plane">Plane</option><option value="concave">Concave extension</option><option value="convex">Convex extension</option></select></div>
          <div className="field"><label className="field__label" htmlFor="reflection-challenge">Design challenge</label><select id="reflection-challenge" className="field__unit" value={challenge} onChange={(event) => setChallenge(event.target.value as typeof challenge)} data-control-id="optics.reflection-challenge-select" data-testid="reflection-challenge"><option value="none">None — free play</option><option value="periscope">Periscope design</option><option value="reflector">Reflector design</option></select></div>
        </div>
        <RayDiagram mode="reflection" incidentAngleDeg={reflectionAngle} showNormal={showNormal} />
        <dl className="light-readouts"><div><dt>Source / mirror positions</dt><dd>{sourceX} cm / {mirrorX} cm (geometry placement only)</dd></div><div><dt>Law result</dt><dd data-testid="reflection-readout">θᵢ = {reflectionResult.incidentAngleDeg.toFixed(1)}°; θᵣ = {reflectionResult.reflectedAngleDeg.toFixed(1)}° from the normal</dd></div><div><dt>Mirror model</dt><dd>{qualitativeMirrorImage(mirrorType)}</dd></div></dl>
        {challengeResult ? <p role="status" data-testid="challenge-feedback" className={challengeResult.complete ? 'feedback feedback--correct' : 'feedback feedback--invalid'}>{challengeResult.complete ? '✓ ' : '↻ '}{challengeResult.feedback}</p> : null}
        <button type="button" className="btn" onClick={() => addTrial({ kind: 'reflection', input: `source ${sourceX} cm; mirror ${mirrorX} cm; θi ${reflectionAngle.toFixed(1)}°`, result: `θr ${reflectionResult.reflectedAngleDeg.toFixed(1)}°`, incidentAngleDeg: reflectionAngle, measuredAngleDeg: reflectionResult.reflectedAngleDeg })} data-testid="record-reflection">Record reflection trial</button>
      </section>

      <section className="card stack" aria-labelledby="refraction-heading">
        <h2 id="refraction-heading">2. Refraction — speed and wavelength change, frequency does not</h2>
        <div className="light-controls">
          <div className="field"><label className="field__label" htmlFor="first-medium">First medium</label><select id="first-medium" className="field__unit" value={firstMediumId} onChange={(event) => { setFirstMediumId(event.target.value); setTirDemo(false); }} data-control-id="optics.refraction-first-medium-select" data-testid="first-medium">{OPTICAL_MEDIA.map((medium) => <option key={medium.id} value={medium.id}>{medium.label} (n = {formatSigFigs(medium.refractiveIndex, 3)})</option>)}</select></div>
          <div className="field"><label className="field__label" htmlFor="second-medium">Second medium</label><select id="second-medium" className="field__unit" value={secondMediumId} onChange={(event) => { setSecondMediumId(event.target.value); setTirDemo(false); }} data-control-id="optics.refraction-media-select" data-testid="second-medium">{OPTICAL_MEDIA.map((medium) => <option key={medium.id} value={medium.id}>{medium.label} (n = {formatSigFigs(medium.refractiveIndex, 3)})</option>)}</select></div>
          <SimControl id="optics.refraction-incident-angle-slider" label="Incident angle" min={0} max={89} step={1} value={incidentAngle} onChange={(value) => { setIncidentAngle(value); setTirDemo(false); }} format={(value) => `Incident: ${value.toFixed(0)}° from normal`} hint="89° maximum. Exactly 90° is grazing and undefined in this simple ray control." testId="refraction-angle" />
          <div className="field"><label><input type="checkbox" checked={tirDemo} onChange={(event) => enableTir(event.target.checked)} data-control-id="optics.tir-demo-toggle" data-testid="tir-toggle" /> Demonstrate total internal reflection</label></div>
        </div>
        <RayDiagram mode="refraction" incidentAngleDeg={incidentAngle} result={refraction} firstMedium={firstMedium.label} secondMedium={secondMedium.label} />
        <dl className="light-readouts">
          <div data-control-id="optics.frequency-constant-indicator" role="status" aria-label="Frequency at the boundary"><dt>Frequency at boundary</dt><dd data-testid="frequency-constant">{DEFAULT_LIGHT_FREQUENCY_HZ.toExponential(2)} Hz — unchanged across boundary</dd></div>
          <div><dt>Speed</dt><dd>{formatSigFigs(refraction.speedBeforeMps, 3)} → {formatSigFigs(refraction.speedAfterMps, 3)} m/s</dd></div>
          <div><dt>Wavelength</dt><dd>{formatSigFigs(refraction.wavelengthBeforeM * 1e9, 3)} → {formatSigFigs(refraction.wavelengthAfterM * 1e9, 3)} nm</dd></div>
          <div><dt>Ray result</dt><dd data-testid="refraction-readout">{refraction.totalInternalReflection ? 'Total internal reflection — no refracted ray.' : `Refracted angle ${refraction.refractedAngleDeg!.toFixed(1)}° from normal.`}</dd></div>
        </dl>
        <button type="button" className="btn" aria-expanded={showSnell} onClick={() => setShowSnell((value) => !value)} data-control-id="optics.snells-law-calculation-toggle" data-testid="snell-toggle">{showSnell ? 'Hide' : 'Show'} Snell&apos;s law calculation</button>
        {showSnell ? <p data-testid="snell-worked"><code>{formatSigFigs(firstMedium.refractiveIndex, 3)} × sin {incidentAngle}° = {formatSigFigs(secondMedium.refractiveIndex, 3)} × sin θ₂</code> → {refraction.totalInternalReflection ? 'no transmitted-ray solution (TIR)' : `θ₂ = ${refraction.refractedAngleDeg!.toFixed(1)}°`}.</p> : null}
        <button type="button" className="btn" aria-expanded={showFibre} onClick={() => setShowFibre((value) => !value)} data-control-id="optics.fibre-application-toggle" data-testid="fibre-toggle">{showFibre ? 'Hide' : 'Show'} optical fibre application</button>
        {showFibre ? <p>In a fibre, a higher-index core meets lower-index cladding. Rays above the critical angle undergo repeated TIR and remain guided. This ideal ray model omits bending losses and dispersion.</p> : null}
        {critical !== null ? <p className="notice notice--info">Critical angle for this direction: {critical.toFixed(1)}°. Above it the engine returns TIR and never draws a fictitious refracted ray.</p> : <p className="seg-control__note">TIR is impossible in this direction because the ray is not leaving the higher-index medium.</p>}
        <button type="button" className="btn" onClick={() => addTrial({ kind: 'refraction', input: `${firstMedium.label} n=${firstMedium.refractiveIndex} to ${secondMedium.label} n=${secondMedium.refractiveIndex}; θi ${incidentAngle}°`, result: refraction.totalInternalReflection ? 'TIR; no refracted ray' : `θ2 ${refraction.refractedAngleDeg!.toFixed(1)}°; frequency ${DEFAULT_LIGHT_FREQUENCY_HZ.toExponential(2)} Hz unchanged` })} data-testid="record-refraction">Record refraction trial</button>
      </section>

      <section className="card stack" aria-labelledby="energy-heading">
        <h2 id="energy-heading">3. Absorption and scattering — a normalised teaching ledger</h2>
        <div className="light-controls">
          <div className="field"><label className="field__label" htmlFor="surface-model">Material or surface</label><select id="surface-model" className="field__unit" value={surfaceId} onChange={(event) => setSurfaceId(event.target.value as SurfaceId)} data-control-id="optics.material-surface-select" data-testid="surface-select">{OPTICAL_SURFACES.map((surface) => <option key={surface.id} value={surface.id}>{surface.label}</option>)}</select></div>
          <div className="field"><label className="field__label" htmlFor="illuminant-model">Illuminant (light source type)</label><select id="illuminant-model" className="field__unit" value={illuminantId} onChange={(event) => setIlluminantId(event.target.value as IlluminantId)} data-control-id="optics.illuminant-select" data-testid="illuminant-select">{ILLUMINANTS.map((illuminant) => <option key={illuminant.id} value={illuminant.id}>{illuminant.label}</option>)}</select></div>
          <SimControl id="optics.atmospheric-particle-size-slider" label="Atmospheric particle size" min={0} max={100} step={1} value={particleSize} onChange={setParticleSize} format={(value) => `Conceptual size setting: ${value.toFixed(0)}%`} hint="Three qualitative regimes only; this is not a particle-size measurement." testId="particle-size" />
        </div>
        <EnergyLedgerView ledger={ledger} />
        <p role="status" data-testid="scattering-regime"><strong>{scattering.label}:</strong> {scattering.explanation}</p>
        <p className="notice notice--warning"><strong>Model honesty:</strong> these fractions are modelled comparison fixtures, not measured material constants. They conserve energy, but do not calculate temperature or claim that black objects always heat fastest.</p>
        <button type="button" className="btn" onClick={() => addTrial({ kind: 'energy', input: `${surfaceId}; ${illuminantId}; particle regime ${scattering.id}`, result: `T ${(ledger.transmitted * 100).toFixed(0)}%; R ${(ledger.reflected * 100).toFixed(0)}%; A ${(ledger.absorbed * 100).toFixed(0)}%` })} data-testid="record-energy">Record energy/scattering trial</button>
      </section>

      <section className="card stack" aria-labelledby="results-heading">
        <h2 id="results-heading">Results, graph and evidence</h2>
        <dl><dt>Aim</dt><dd>Test how light direction and energy sharing respond to one changed boundary/material variable at a time.</dd><dt>Variables</dt><dd>Independent: selected angle, medium pair or surface/illuminant. Dependent: measured ray angle or energy fraction. Controls: keep all other settings fixed during a comparison.</dd><dt>Method and safety</dt><dd>Use this deterministic model, record at least one trial of each type, interpret the pattern and name a limitation. A virtual model does not replace supervised practical work or a school risk assessment; do not improvise laser activities.</dd></dl>
        <div className="optics-trials-wrap"><table className="optics-trials" data-testid="optics-trials"><caption>Light-property investigation trials</caption><thead><tr><th scope="col">Trial</th><th scope="col">Type</th><th scope="col">Inputs</th><th scope="col">Result</th><th scope="col">Remove</th></tr></thead><tbody>{trials.length === 0 ? <tr><td colSpan={5}>No trials yet — record reflection, refraction and energy evidence above.</td></tr> : trials.map((trial, index) => <tr key={trial.id}><td>{index + 1}</td><td>{trial.kind}</td><td>{trial.input}</td><td>{trial.result}</td><td><button type="button" className="btn" aria-label={`Delete trial ${index + 1}`} onClick={() => setTrials((current) => current.filter((item) => item.id !== trial.id))}>Delete</button></td></tr>)}</tbody></table></div>
        {reflectionPoints.length >= 2 ? <LineGraph title="Recorded law-of-reflection trials" xLabel="incident angle (° from normal)" yLabel="reflected angle (° from normal)" series={[{ label: 'Measured reflection', points: reflectionPoints, mode: 'scatter' }, { label: 'θᵣ = θᵢ reference', points: [{ at: 0, value: 0 }, { at: 89, value: 89 }] }]} xDomain={[0, 89]} yDomain={[0, 89]} testId="reflection-graph" /> : <p>Add at least two reflection trials to graph reflected angle against incident angle.</p>}
        <div className="seg-control__options"><button type="button" className="btn" disabled={trials.length === 0} onClick={() => downloadText('wavemotion-light-trials.csv', trialsCsv(), 'text/csv')} data-testid="optics-export-csv">Export trials (CSV)</button><button type="button" className="btn" disabled={trials.length === 0} onClick={() => downloadText('wavemotion-light-trials.json', trialsJson(), 'application/json')} data-testid="optics-export-json">Export trials (JSON)</button></div>
        <label className="notice-capture__label">What pattern did your measurements show?<textarea className="notice-capture__input" rows={3} value={interpretation} onChange={(event) => { setInterpretation(event.target.value); setEvidenceStatus('idle'); }} data-testid="optics-interpretation" /></label>
        <label className="notice-capture__label">Limitation and improvement<span className="seg-control__note">Name a ray/ledger model limitation and how real measured evidence could improve the comparison.</span><textarea className="notice-capture__input" rows={3} value={limitation} onChange={(event) => { setLimitation(event.target.value); setEvidenceStatus('idle'); }} data-testid="optics-limitation" /></label>
        <button type="button" className="btn btn--primary" onClick={saveEvidence} data-testid="optics-save-evidence">Save investigation as evidence</button>
        {evidenceStatus === 'error' ? <p className="field__error" role="status">Record reflection, refraction and energy trials, then complete both written fields.</p> : null}
        {evidenceStatus === 'saved' ? <p className="notice-capture__status" role="status">✓ Saved for outcome 7.3.2. Export the complete progress record on the <Link to="/progress">Progress page</Link>.</p> : null}
      </section>
    </Page>
  );
}
