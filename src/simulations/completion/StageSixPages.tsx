import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Page } from '../../components/Page';
import { EAR_PATHWAY, cochlearPlaceForFrequency } from '../../science/hearing';
import {
  EM_REGIONS,
  frequencyFromWavelength,
  logPositionFromWavelength,
  regionAtWavelength,
  wavelengthFromFrequency,
  wavelengthFromLogPosition,
} from '../../science/emSpectrum';
import {
  angleEchoFactor,
  echoTimeMsForDepth,
  frequencyTradeoff,
  TISSUE_PHANTOMS,
} from '../../science/ultrasound';
import {
  identifySpectralLine,
  radialDirection,
  shiftedWavelengthNm,
  STAR_EXAMPLES,
  STELLAR_LINES,
  type ObservationBand,
} from '../../science/astronomy';
import {
  ASTRONOMY_BAND_EVIDENCE,
  HEARING_PROTECTION_POINTS,
  SOCIETY_EVIDENCE_PACKS,
} from '../../content/stageSixContent';
import { useProgressStore } from '../../store/progressStore';
import './StageSixPages.css';

function scientific(value: number, digits = 3) {
  return value.toExponential(digits - 1).replace('e+', ' × 10^').replace('e-', ' × 10^-');
}

function download(content: string, filename: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function SpectrumPage() {
  const [params, setParams] = useSearchParams();
  const requested = EM_REGIONS.find((item) => item.id === params.get('region')) ?? EM_REGIONS[3];
  const [position, setPosition] = useState(() => logPositionFromWavelength(requested.representativeM));
  const [entryMode, setEntryMode] = useState<'wavelength' | 'frequency'>('wavelength');
  const [logScale, setLogScale] = useState(true);
  const [overlay, setOverlay] = useState(false);
  const [property, setProperty] = useState('suitability');
  const [citation, setCitation] = useState('');
  const [comparisonIndex, setComparisonIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const addEvidence = useProgressStore((state) => state.addEvidence);
  const wavelength = wavelengthFromLogPosition(position);
  const frequency = frequencyFromWavelength(wavelength);
  const region = regionAtWavelength(wavelength);
  const comparisons = ['building (10 m)', 'person (1 m)', 'grain of sand (1 mm)', 'cell (10 µm)', 'virus (100 nm)', 'atom (0.1 nm)'];

  const jumpToRegion = (id: string) => {
    const next = EM_REGIONS.find((item) => item.id === id) ?? EM_REGIONS[3];
    setPosition(logPositionFromWavelength(next.representativeM));
    setParams(next.id === 'visible' ? {} : { region: next.id });
    setFeedback('');
  };

  const save = () => {
    if (!citation.trim()) {
      setFeedback('Cite at least one data point before submitting.');
      return;
    }
    addEvidence({ outcomeCode: '7.1.4', kind: 'comparison', activityId: 'spectrum-region-comparison', result: 'successful', summary: `Compared ${region.name} with the continuous spectrum.` });
    addEvidence({ outcomeCode: '7.1.7', kind: 'secondary-data', activityId: `spectrum-use-${property}`, result: 'successful', summary: `${property}: ${citation.trim()}` });
    setFeedback('Spectrum comparison saved for outcomes 7.1.4 and 7.1.7.');
  };

  return (
    <Page title="Electromagnetic spectrum" lead="Explore one continuous logarithmic spectrum, then use cited properties—not colour alone—to justify an application.">
      <section className="card stack"><span className="eyebrow">Orient · Learn</span><h2>One family, enormous range</h2><p>All EM waves travel at the same speed in vacuum. Frequency and wavelength vary inversely; the named regions have approximate, overlapping boundaries.</p><p className="notice">Ionising is not the same as radioactive. Risk depends on interaction, exposure and dose; higher frequency alone is not a complete risk statement.</p></section>
      <section className="card stack" aria-labelledby="spectrum-explore"><span className="eyebrow">Explore</span><h2 id="spectrum-explore">Continuous log-scale explorer</h2>
        <div className={`s6-spectrum ${overlay ? 's6-spectrum--overlay' : ''}`} data-scale={logScale ? 'logarithmic' : 'linear'} aria-label="Continuous electromagnetic spectrum from radio to gamma">
          {EM_REGIONS.map((item) => <button type="button" key={item.id} className={item.id === region.id ? 'is-active' : ''} onClick={() => jumpToRegion(item.id)}>{item.name}</button>)}
        </div>
        <label>Position on the electromagnetic spectrum
          <input type="range" min="0" max="1" step="0.001" value={position} onChange={(event) => { setPosition(Number(event.target.value)); setFeedback(''); }} data-control-id="em-spectrum.zoom-pan-slider" data-testid="spectrum-position" />
        </label>
        <div className="s6-grid s6-grid--3">
          <label>Jump to spectrum region<select value={region.id} onChange={(event) => jumpToRegion(event.target.value)} data-control-id="em-spectrum.region-select"><option value="radio">Radio</option>{EM_REGIONS.slice(1).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Enter position by<select value={entryMode} onChange={(event) => setEntryMode(event.target.value as 'wavelength' | 'frequency')} data-control-id="em-spectrum.wavelength-frequency-input-toggle"><option value="wavelength">Wavelength (m)</option><option value="frequency">Frequency (Hz)</option></select></label>
          <label>{entryMode === 'wavelength' ? 'Wavelength (m)' : 'Frequency (Hz)'}<input type="number" min="0" step="any" value={entryMode === 'wavelength' ? wavelength : frequency} onChange={(event) => { const value = Number(event.target.value); if (value > 0) setPosition(logPositionFromWavelength(entryMode === 'wavelength' ? value : wavelengthFromFrequency(value))); }} data-testid="spectrum-numeric-entry" /></label>
        </div>
        <div className="toggle-row"><label><input type="checkbox" checked={logScale} onChange={(event) => setLogScale(event.target.checked)} data-control-id="em-spectrum.log-axis-toggle" /> Use logarithmic scale</label><label><input type="checkbox" checked={overlay} onChange={(event) => setOverlay(event.target.checked)} data-control-id="em-spectrum.atmospheric-overlay-toggle" /> Show atmospheric transmission overlay</label></div>
        {!logScale ? <p className="notice notice--warn" role="status">A linear axis compresses almost the entire spectrum into one edge. Use it only to examine that limitation.</p> : null}
        <div className="readout-grid"><p><strong>Region</strong><br />{region.name}</p><p><strong>Wavelength</strong><br />{scientific(wavelength)} m</p><p><strong>Frequency</strong><br />{scientific(frequency)} Hz</p><p><strong>Energy trend</strong><br />{region.energyTrend}</p><p data-testid="ionising-class"><strong>Ionising classification</strong><br />{region.ionisingClass.replace('-', ' ')}</p></div>
        <details data-control-id="em-spectrum.source-detector-toggle"><summary>Sources and detectors for this wavelength</summary><p>{region.sources}. Detected with {region.detectors}.</p></details>
        <details data-control-id="em-spectrum.interaction-toggle"><summary>Material and atmosphere interactions</summary><p>{region.interactions}</p></details>
        <details data-control-id="em-spectrum.application-risk-toggle"><summary>Applications and risk controls</summary><p>Uses: {region.uses.join(', ')}.</p><p>{region.riskControl}</p></details>
        <details data-control-id="em-spectrum.evidence-card-toggle"><summary>Evidence and review date</summary><p>{region.source}. Reviewed {region.reviewDate}. Boundaries are approximate.</p></details>
        <button type="button" className="btn" onClick={() => setComparisonIndex((current) => (current + 1) % comparisons.length)} data-control-id="em-spectrum.scale-comparison-strip">Scale comparison: {comparisons[comparisonIndex]}</button>
      </section>
      <section className="card stack"><span className="eyebrow">Investigate · Explain</span><h2>Which property suits the use?</h2><label>Compare applications by<select value={property} onChange={(event) => setProperty(event.target.value)} data-control-id="em-spectrum.dataset-property-select"><option value="suitability">overall suitability</option><option value="atmospheric-access">atmospheric access</option><option value="penetration">penetration and absorption</option><option value="resolution">resolution</option><option value="risk-control">risk controls</option></select></label>
        <div className="s6-table-wrap" tabIndex={0} role="region" aria-label="EM region comparison table"><table><caption>Secondary-source comparison dataset</caption><thead><tr><th>Region</th><th>Uses</th><th>Interaction/risk evidence</th><th>Source date</th></tr></thead><tbody>{EM_REGIONS.map((item) => <tr key={item.id} className={item.id === region.id ? 'is-selected' : ''}><th>{item.name}</th><td>{item.uses.join(', ')}</td><td>{item.interactions} {item.riskControl}</td><td>{item.reviewDate}</td></tr>)}</tbody></table></div>
        <label>Your evidence for this property<textarea maxLength={300} rows={4} value={citation} onChange={(event) => { setCitation(event.target.value); setFeedback(''); }} data-control-id="em-spectrum.dataset-citation-input" /></label><p>{citation.length}/300</p><button type="button" className="btn btn--primary" onClick={save} data-testid="spectrum-save">Save cited comparison</button>{feedback ? <p role="status" className={feedback.startsWith('Cite') ? 'field__error' : 'notice'}>{feedback}</p> : null}
      </section>
      <section className="card stack"><span className="eyebrow">Check · Connect</span><h2>Use properties, not labels</h2><p>Return to <Link to="/waves/measure?preset=em">v = fλ</Link> to measure an EM case, or continue to <Link to="/astronomy">Reading starlight</Link> to apply the spectrum to stars.</p></section>
    </Page>
  );
}

export function HearingPage() {
  const [partId, setPartId] = useState(EAR_PATHWAY[0].id);
  const [frequency, setFrequency] = useState(1_000);
  const [explanation, setExplanation] = useState('');
  const [feedback, setFeedback] = useState('');
  const addEvidence = useProgressStore((state) => state.addEvidence);
  const part = EAR_PATHWAY.find((item) => item.id === partId) ?? EAR_PATHWAY[0];
  const place = cochlearPlaceForFrequency(frequency);
  const save = () => {
    if (explanation.trim().length < 30) { setFeedback('Explain the mechanical, fluid and electrical stages in at least 30 characters.'); return; }
    addEvidence({ outcomeCode: '7.2.4', kind: 'explanation', activityId: 'hearing-pathway-explanation', result: 'successful', summary: explanation.trim() });
    setFeedback('Ear-response explanation saved for outcome 7.2.4.');
  };
  return <Page title="How the ear responds to sound" lead="Trace sound energy through a simplified ear pathway without turning this teaching model into a diagnosis.">
    <section className="card stack"><span className="eyebrow">Orient · Learn</span><h2>Mechanical → fluid → electrical</h2><p>The eardrum does not send a signal straight to the brain. Sound pressure drives a chain of mechanical motion, a fluid disturbance, hair-cell transduction and then electrical nerve signals.</p><p className="notice">This is a simplified, non-diagnostic model. The brain is the final interpretation stage beyond the eight selectable pathway structures.</p></section>
    <section className="card stack"><span className="eyebrow">Explore</span><h2>Ear pathway</h2><div className="s6-ear" aria-label="Simplified ear pathway diagram">{EAR_PATHWAY.map((item, index) => <button key={item.id} type="button" className={item.id === part.id ? 'is-active' : ''} onClick={() => setPartId(item.id)} data-control-id={`hearing.anatomy-part-${item.id}`}>{index + 1}. {item.name}</button>)}</div><article className="notice"><h3>{part.name}</h3><p><strong>{part.signalType} stage.</strong> {part.description}</p></article>
      <label>Test frequency for cochlear mapping: {frequency.toLocaleString('en-AU')} Hz<input type="range" min="20" max="20000" step="10" value={frequency} onChange={(event) => setFrequency(Number(event.target.value))} data-control-id="hearing.frequency-location-slider" /></label><p role="status">{frequency.toLocaleString('en-AU')} Hz maps to the simplified {place.frequencyDescription}. Relative place: {(place.position * 100).toFixed(0)}% from apex to base.</p>
      <details data-control-id="hearing.representation-ladder-toggle"><summary>Show signal-type explanation</summary><ol>{EAR_PATHWAY.map((item) => <li key={item.id}><strong>{item.name}:</strong> {item.signalType} — {item.description}</li>)}<li><strong>Brain:</strong> neural interpretation, not a simple “sound copy”.</li></ol></details>
      <details data-control-id="hearing.protection-info-toggle"><summary>Show hearing protection information</summary><ul>{HEARING_PROTECTION_POINTS.map((point) => <li key={point}>{point}</li>)}</ul></details>
    </section>
    <section className="card stack"><span className="eyebrow">Investigate · Check · Explain</span><h2>Build the pathway explanation</h2><label>Explain how a pressure wave becomes a signal the brain can interpret<textarea rows={5} value={explanation} onChange={(event) => { setExplanation(event.target.value); setFeedback(''); }} data-testid="hearing-explanation" /></label><button type="button" className="btn btn--primary" onClick={save} data-testid="hearing-save">Save explanation</button>{feedback ? <p role="status" className={feedback.startsWith('Explain') ? 'field__error' : 'notice'}>{feedback}</p> : null}<p>Connect this response to the visual-only <Link to="/sound/compression">compression model</Link> and WHO-informed hearing-health evidence in the <Link to="/society">argument studio</Link>.</p></section>
  </Page>;
}

export function UltrasoundPage() {
  const [frequency, setFrequency] = useState(5);
  const [angle, setAngle] = useState(0);
  const [phantomId, setPhantomId] = useState(TISSUE_PHANTOMS[0].id);
  const [showBMode, setShowBMode] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [interpretation, setInterpretation] = useState('');
  const [feedback, setFeedback] = useState('');
  const addEvidence = useProgressStore((state) => state.addEvidence);
  const phantom = TISSUE_PHANTOMS.find((item) => item.id === phantomId) ?? TISSUE_PHANTOMS[0];
  const tradeoff = frequencyTradeoff(frequency);
  const angleFactor = angleEchoFactor(angle);
  const save = () => {
    if (pulseCount === 0) { setFeedback('Send at least one pulse before saving evidence.'); return; }
    if (interpretation.trim().length < 30) { setFeedback('Interpret an echo time, depth and model limitation in at least 30 characters.'); return; }
    addEvidence({ outcomeCode: '7.2.6', kind: 'investigation', activityId: `ultrasound-${phantom.id}`, result: 'successful', summary: interpretation.trim() });
    setFeedback('Synthetic ultrasound investigation saved for outcome 7.2.6.');
  };
  return <Page title="Medical ultrasound: pulse and echo" lead="Use a synthetic tissue phantom to connect echo return time with boundary depth. This is not patient data or a clinical tool.">
    <section className="card stack"><span className="eyebrow">Orient · Learn</span><h2>Images assembled from reflected sound</h2><p>A probe sends a high-frequency pulse. Boundaries reflect part of the sound; the same probe detects return time and amplitude. The teaching model estimates depth = 1540 m/s × round-trip time ÷ 2.</p><p className="notice notice--warn">Synthetic phantom only. No diagnosis, patient data or claim of clinical accuracy. Real ultrasound requires trained professionals and prudent exposure.</p></section>
    <section className="card stack"><span className="eyebrow">Explore · Investigate</span><h2>Probe a synthetic phantom</h2><div className="s6-grid s6-grid--3"><label>Probe angle: {angle}°<input type="range" min="-45" max="45" step="1" value={angle} onChange={(event) => setAngle(Number(event.target.value))} data-control-id="ultrasound.probe-angle-slider" /></label><label>Probe frequency: {frequency} MHz<input type="range" min="2" max="12" step="1" value={frequency} onChange={(event) => setFrequency(Number(event.target.value))} data-control-id="ultrasound.probe-frequency-slider" /></label><label>Tissue phantom scenario<select value={phantom.id} onChange={(event) => { setPhantomId(event.target.value); setPulseCount(0); }} data-control-id="ultrasound.tissue-phantom-select">{TISSUE_PHANTOMS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><p>Trade-off: {tradeoff.resolution} resolution and {tradeoff.penetration} penetration. Relative echo visibility at {angle}°: {(angleFactor * 100).toFixed(0)}%.</p><div className="toggle-row"><button type="button" className="btn btn--primary" onClick={() => setPulseCount((count) => count + 1)} data-control-id="ultrasound.pulse-trigger-button" data-testid="ultrasound-pulse">Send ultrasound pulse</button><label><input type="checkbox" checked={showBMode} onChange={(event) => setShowBMode(event.target.checked)} data-control-id="ultrasound.bmode-image-toggle" /> Show simplified B-mode image</label></div>{pulseCount > 0 ? <p role="status">Pulse {pulseCount} sent at t = 0.0 ms; echoes calculated deterministically.</p> : <p>No pulse sent yet.</p>}
      {showBMode ? <div className="s6-bmode" aria-label="Simplified B-mode image with boundary echoes">{phantom.boundaries.map((boundary) => <span key={boundary.label} style={{ top: `${Math.min(92, boundary.depthMm)}%`, opacity: Math.max(0.2, boundary.relativeEcho * angleFactor) }} />)}</div> : null}
      <div className="s6-table-wrap" tabIndex={0} role="region" aria-label="Ultrasound echo-depth table"><table><caption>Calculated synthetic echoes</caption><thead><tr><th>Boundary</th><th>Round-trip echo time (ms)</th><th>Calculated depth (mm)</th><th>Relative echo</th></tr></thead><tbody>{phantom.boundaries.map((boundary) => <tr key={boundary.label}><th>{boundary.label}</th><td>{echoTimeMsForDepth(boundary.depthMm).toFixed(3)}</td><td>{boundary.depthMm.toFixed(1)}</td><td>{(boundary.relativeEcho * angleFactor).toFixed(2)}</td></tr>)}</tbody></table></div>
    </section>
    <section className="card stack"><span className="eyebrow">Check · Explain · Connect</span><h2>Interpret the echoes</h2><label>Use one echo time and depth, explain the divide-by-two, and state a limitation<textarea rows={5} value={interpretation} onChange={(event) => { setInterpretation(event.target.value); setFeedback(''); }} data-testid="ultrasound-interpretation" /></label><button type="button" className="btn btn--primary" onClick={save} data-testid="ultrasound-save">Save investigation evidence</button>{feedback ? <p role="status" className={feedback.includes('saved') ? 'notice' : 'field__error'}>{feedback}</p> : null}<p>Connect the physics and the societal trade-offs in the <Link to="/society">argument studio</Link>.</p></section>
  </Page>;
}

export function AstronomyPage() {
  const [params, setParams] = useSearchParams();
  const requestedBand = (params.get('band') as ObservationBand | null) ?? 'visible';
  const [band, setBand] = useState<ObservationBand>(Object.hasOwn(ASTRONOMY_BAND_EVIDENCE, requestedBand) ? requestedBand : 'visible');
  const [starId, setStarId] = useState(STAR_EXAMPLES[0].id);
  const [cursor, setCursor] = useState(656.3);
  const [velocity, setVelocity] = useState(0);
  const [windows, setWindows] = useState(false);
  const [inference, setInference] = useState('');
  const [feedback, setFeedback] = useState('');
  const addEvidence = useProgressStore((state) => state.addEvidence);
  const star = STAR_EXAMPLES.find((item) => item.id === starId) ?? STAR_EXAMPLES[0];
  const line = identifySpectralLine(cursor);
  const starLines = STELLAR_LINES.filter((item) => star.lineIds.includes(item.id));
  const selectBand = (next: ObservationBand) => { setBand(next); setParams(next === 'visible' ? {} : { band: next }); };
  const save = () => {
    if (inference.trim().length < 40) { setFeedback('Use band, line and motion evidence in at least 40 characters.'); return; }
    addEvidence({ outcomeCode: '7.3.4', kind: 'explanation', activityId: `astronomy-${star.id}-${band}`, result: 'successful', summary: inference.trim() });
    setFeedback('Starlight inference saved for outcome 7.3.4.');
  };
  return <Page title="Reading starlight" lead="Use curated multiwavelength and spectral-line evidence to infer temperature trend, composition and motion—never decorative imagery.">
    <section className="card stack"><span className="eyebrow">Orient · Learn</span><h2>Different bands answer different questions</h2><p>Continuous spectra give a temperature/colour trend; catalogued lines provide composition evidence; line shifts provide motion evidence. Some wavelengths require space telescopes because Earth’s atmosphere absorbs them.</p></section>
    <section className="card stack"><span className="eyebrow">Explore · Investigate</span><h2>Virtual multiwavelength observatory</h2><div className="s6-grid s6-grid--3"><label>Observation band<select value={band} onChange={(event) => selectBand(event.target.value as ObservationBand)} data-control-id="astronomy.band-select"><option value="radio">Radio</option><option value="infrared">Infrared</option><option value="visible">Visible</option><option value="ultraviolet">Ultraviolet</option><option value="xray">X-ray</option><option value="gamma">Gamma</option></select></label><label>Star example<select value={star.id} onChange={(event) => setStarId(event.target.value)} data-control-id="astronomy.stellar-example-select">{STAR_EXAMPLES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Radial velocity: {velocity > 0 ? '+' : ''}{velocity} km/s<input type="range" min="-300" max="300" step="10" value={velocity} onChange={(event) => setVelocity(Number(event.target.value))} data-control-id="astronomy.redshift-blueshift-slider" /></label></div><p><strong>{band} evidence:</strong> {ASTRONOMY_BAND_EVIDENCE[band]}</p><p><strong>Temperature trend:</strong> {star.temperatureTrend}. <strong>Motion:</strong> {radialDirection(velocity)}.</p><p className="seg-control__note">Dataset: {star.source}. Reviewed {star.reviewDate}.</p><label><input type="checkbox" checked={windows} onChange={(event) => setWindows(event.target.checked)} data-control-id="astronomy.atmospheric-window-toggle" /> Show atmospheric windows</label>{windows ? <p className="notice">Major ground windows include visible and radio plus selected infrared bands. Most ultraviolet, X-ray and gamma observations require space instruments.</p> : null}
      <label>Spectral line inspector: {cursor.toFixed(1)} nm<input type="range" min="400" max="660" step="0.1" value={cursor} onChange={(event) => setCursor(Number(event.target.value))} data-control-id="astronomy.spectral-line-tool" /></label><p role="status" data-testid="line-identification">{line && star.lineIds.includes(line.id) ? `${line.wavelengthNm.toFixed(1)} nm — ${line.element} ${line.name}` : 'No catalogued line here for this star.'}</p>
      <div className="s6-table-wrap" tabIndex={0} role="region" aria-label="Stellar spectral-line data"><table><caption>Curated lines for {star.name}</caption><thead><tr><th>Element/line</th><th>Rest λ (nm)</th><th>Shifted λ (nm)</th><th>Source</th></tr></thead><tbody>{starLines.map((item) => <tr key={item.id}><th>{item.element} {item.name}</th><td>{item.wavelengthNm.toFixed(1)}</td><td>{shiftedWavelengthNm(item.wavelengthNm, velocity).toFixed(2)}</td><td>{item.source}, {item.reviewDate}</td></tr>)}</tbody></table></div>
    </section>
    <section className="card stack"><span className="eyebrow">Check · Explain · Connect</span><h2>Make an evidence-based inference</h2><label>Use a band, a catalogued line and the sign of the shift; state a model limitation<textarea rows={5} value={inference} onChange={(event) => { setInference(event.target.value); setFeedback(''); }} data-testid="astronomy-inference" /></label><button type="button" className="btn btn--primary" onClick={save} data-testid="astronomy-save">Save starlight inference</button>{feedback ? <p role="status" className={feedback.includes('saved') ? 'notice' : 'field__error'}>{feedback}</p> : null}<p>Compare the wider family in the <Link to="/spectrum">EM spectrum explorer</Link>.</p></section>
  </Page>;
}

interface EvidenceRow { claim: string; source: string; relevance: string }

export function SocietyPage() {
  const [packId, setPackId] = useState(SOCIETY_EVIDENCE_PACKS[0].id);
  const [section, setSection] = useState('benefit');
  const [contention, setContention] = useState('');
  const [criteria, setCriteria] = useState(['']);
  const [rows, setRows] = useState<EvidenceRow[]>([{ claim: '', source: '', relevance: '' }]);
  const [cer, setCer] = useState({ claim: '', evidence: '', reasoning: '' });
  const [counterclaim, setCounterclaim] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [sources, setSources] = useState(['']);
  const [feedback, setFeedback] = useState('');
  const addEvidence = useProgressStore((state) => state.addEvidence);
  const pack = SOCIETY_EVIDENCE_PACKS.find((item) => item.id === packId) ?? SOCIETY_EVIDENCE_PACKS[0];
  const sectionText = useMemo(() => ({ benefit: pack.benefit, limitation: pack.limitation, groups: pack.affectedGroups, history: pack.historicalChange, quantitative: pack.quantitativeEvidence, competing: pack.competingConsiderations }[section] ?? pack.benefit), [pack, section]);
  const updateList = (values: string[], index: number, value: string, setter: (next: string[]) => void) => setter(values.map((item, itemIndex) => itemIndex === index ? value : item));
  const validate = () => {
    if (!contention.trim()) return 'Write a contention before saving.';
    if (!criteria.some((item) => item.trim())) return 'Add at least one non-empty criterion.';
    if (!rows.some((row) => row.claim.trim() && row.source.trim() && row.relevance.trim())) return 'Complete an evidence row, including its source and relevance.';
    if (!cer.claim.trim()) return 'Claim is missing from the CER paragraph.';
    if (!cer.evidence.trim()) return 'Evidence is missing from the CER paragraph.';
    if (!cer.reasoning.trim()) return 'Reasoning is missing from the CER paragraph.';
    if (!counterclaim.trim()) return 'Add a counterclaim and your response.';
    if (!conclusion.trim()) return 'Write a conclusion before finishing.';
    if (!sources.some((item) => item.trim())) return 'Add at least one bibliography source before exporting.';
    return '';
  };
  const save = () => {
    const error = validate(); if (error) { setFeedback(error); return; }
    addEvidence({ outcomeCode: '7.5.1', kind: 'argument', activityId: `society-${pack.id}`, result: 'successful', summary: `${contention.trim()} | ${cer.claim.trim()} | ${conclusion.trim()}` });
    setFeedback('Argument saved for outcome 7.5.1.');
  };
  const exportArgument = () => {
    const error = validate(); if (error) { setFeedback(error); return; }
    download(JSON.stringify({ caseStudy: pack.title, contention, criteria, evidence: rows, cer, counterclaim, conclusion, bibliography: sources, evidencePackSource: pack.sourceUrl }, null, 2), `wavemotion-argument-${pack.id}.json`);
    setFeedback('Argument exported.');
  };
  return <Page title="Waves and motion in society" lead="Structure a sourced argument about change, using criteria, evidence, a counterclaim and a conclusion proportional to the evidence.">
    <section className="card stack"><span className="eyebrow">Orient · Learn</span><h2>Changed society—for whom, and by what criterion?</h2><p>“Technology is entirely good” and “technology is entirely bad” are both weak contentions. Define what change means, identify affected groups and weigh benefits against limitations.</p><label>Case study<select value={pack.id} onChange={(event) => { setPackId(event.target.value); setSection('benefit'); }} data-control-id="society.case-study-select">{SOCIETY_EVIDENCE_PACKS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Evidence pack section<select value={section} onChange={(event) => setSection(event.target.value)} data-control-id="society.evidence-pack-viewer"><option value="benefit">Benefits</option><option value="limitation">Limitations</option><option value="groups">Affected groups</option><option value="history">Historical change</option><option value="quantitative">Quantitative evidence</option><option value="competing">Competing considerations</option></select></label><article className="notice"><h3>{pack.title}: {section}</h3><p>{sectionText}</p><p><a href={pack.sourceUrl} target="_blank" rel="noreferrer">{pack.sourceTitle}</a> · reviewed {pack.reviewDate}</p></article></section>
    <section className="card stack"><span className="eyebrow">Explore · Investigate</span><h2>Build the evidence structure</h2><label>Your contention<textarea rows={3} value={contention} onChange={(event) => setContention(event.target.value)} data-control-id="society.contention-input" /></label><fieldset data-control-id="society.criteria-builder"><legend>Criteria for “changed society”</legend>{criteria.map((criterion, index) => <div className="s6-inline" key={`criterion-${index}`}><label>Criterion {index + 1}<input value={criterion} onChange={(event) => updateList(criteria, index, event.target.value, setCriteria)} /></label><button type="button" className="btn" onClick={() => setCriteria(criteria.filter((_, itemIndex) => itemIndex !== index))} disabled={criteria.length === 1}>Remove criterion {index + 1}</button></div>)}<button type="button" className="btn" onClick={() => setCriteria([...criteria, ''])}>Add criterion</button></fieldset>
      <fieldset data-control-id="society.evidence-table-entry"><legend>Your evidence table</legend>{rows.map((row, index) => <div className="s6-evidence-row" key={`row-${index}`}><label>Evidence claim {index + 1}<input value={row.claim} onChange={(event) => setRows(rows.map((item, itemIndex) => itemIndex === index ? { ...item, claim: event.target.value } : item))} /></label><label>Source {index + 1}<input value={row.source} onChange={(event) => setRows(rows.map((item, itemIndex) => itemIndex === index ? { ...item, source: event.target.value } : item))} /></label><label>Relevance {index + 1}<input value={row.relevance} onChange={(event) => setRows(rows.map((item, itemIndex) => itemIndex === index ? { ...item, relevance: event.target.value } : item))} /></label><button type="button" className="btn" onClick={() => setRows(rows.filter((_, itemIndex) => itemIndex !== index))} disabled={rows.length === 1}>Delete evidence row {index + 1}</button></div>)}<button type="button" className="btn" onClick={() => setRows([...rows, { claim: '', source: '', relevance: '' }])}>Add evidence row</button></fieldset>
    </section>
    <section className="card stack"><span className="eyebrow">Check · Explain · Connect</span><h2>Write and challenge the argument</h2><fieldset data-control-id="society.cer-paragraph-editor"><legend>Claim–Evidence–Reasoning paragraph</legend>{(['claim', 'evidence', 'reasoning'] as const).map((field) => <label key={field}>{field[0].toUpperCase() + field.slice(1)}<textarea rows={3} value={cer[field]} onChange={(event) => setCer({ ...cer, [field]: event.target.value })} /></label>)}</fieldset><label>Counterclaim and response<textarea rows={4} value={counterclaim} onChange={(event) => setCounterclaim(event.target.value)} data-control-id="society.counterclaim-input" /></label><label>Conclusion proportional to the evidence<textarea rows={4} value={conclusion} onChange={(event) => setConclusion(event.target.value)} data-control-id="society.conclusion-input" /></label><fieldset data-control-id="society.bibliography-input"><legend>Bibliography</legend>{sources.map((source, index) => <div className="s6-inline" key={`source-${index}`}><label>Source {index + 1}<input value={source} onChange={(event) => updateList(sources, index, event.target.value, setSources)} /></label><button type="button" className="btn" onClick={() => setSources(sources.filter((_, itemIndex) => itemIndex !== index))} disabled={sources.length === 1}>Remove source {index + 1}</button></div>)}<button type="button" className="btn" onClick={() => setSources([...sources, ''])}>Add source</button></fieldset><div className="button-row"><button type="button" className="btn btn--primary" onClick={save} data-testid="society-save">Save argument evidence</button><button type="button" className="btn" onClick={exportArgument} data-control-id="society.export-argument-button">Export argument</button><button type="button" className="btn" onClick={() => window.print()}>Print argument</button></div>{feedback ? <p role="status" className={feedback.includes('saved') || feedback.includes('exported') ? 'notice' : 'field__error'}>{feedback}</p> : null}</section>
  </Page>;
}
