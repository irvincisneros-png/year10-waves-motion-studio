import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { SimControl } from '../../components/sim/SimControl';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterAttempt, nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import { advanceTrack, averageSpeed, averageVelocity, trackReadout, type PositiveDirection, type TrackState } from '../../science/motion';
import { formatSigFigs } from '../../science/units';

const INITIAL: TrackState = { timeS: 0, physicalPositionM: 0, physicalVelocityMps: 0, distanceM: 0 };

export default function MotionTrackPage() {
  const [state, setState] = useState(INITIAL);
  const [origin, setOrigin] = useState(0);
  const [positiveDirection, setPositiveDirection] = useState<PositiveDirection>('right');
  const [timerRunning, setTimerRunning] = useState(false);
  const [log, setLog] = useState<TrackState[]>([]);
  const [comparison, setComparison] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'saved'>('idle');
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const readout = trackReadout(state, origin, positiveDirection, 0, 0);
  const average = state.timeS > 0 ? { speed: averageSpeed(state.distanceM, state.timeS), velocity: averageVelocity(readout.displacementM, state.timeS) } : { speed: 0, velocity: 0 };

  const stepWithVelocity = (velocity: number) => {
    setState((current) => {
      const candidate = advanceTrack({ ...current, physicalVelocityMps: velocity }, 0, 1);
      if (candidate.physicalPositionM >= -20 && candidate.physicalPositionM <= 20) return candidate;
      const boundary = candidate.physicalPositionM > 20 ? 20 : -20;
      const travelled = Math.abs(boundary - current.physicalPositionM);
      return { timeS: current.timeS + travelled / Math.abs(velocity), physicalPositionM: boundary, physicalVelocityMps: 0, distanceM: current.distanceM + travelled };
    });
    setTimerRunning(true); setStatus('idle');
  };
  const speed = Math.abs(state.physicalVelocityMps);
  const direction = state.physicalVelocityMps < 0 ? -1 : 1;
  const reset = () => {
    if (log.length > 0 && !window.confirm('Clear the position–time log and reset the track?')) return;
    setState(INITIAL); setOrigin(0); setPositiveDirection('right'); setTimerRunning(false); setLog([]); setComparison(''); setStatus('idle'); announce('Motion track reset.');
  };
  const record = () => {
    if (state.timeS <= 0) { setStatus('error'); setOutcomeLevel('7.4.1', nextLevelAfterAttempt(outcomes['7.4.1'] ?? 'not-attempted')); announce('Move the walker before recording a trial.'); return; }
    setLog((current) => [...current, state]); announce('Position-time sample recorded.');
  };
  const save = () => {
    if (log.length < 2 || comparison.trim() === '') { setStatus('error'); announce('Record two samples and explain the comparison before saving.'); return; }
    addEvidence({ outcomeCode: '7.4.1', kind: 'investigation', summary: `Signed track (${log.length} samples): distance ${formatSigFigs(state.distanceM)} m; displacement ${formatSigFigs(readout.displacementM)} m; average speed ${formatSigFigs(average.speed)} m/s; average velocity ${formatSigFigs(average.velocity)} m/s. Comparison: ${comparison.trim()}` });
    setOutcomeLevel('7.4.1', nextLevelAfterSuccess(outcomes['7.4.1'] ?? 'not-attempted')); setStatus('saved'); announce('Signed track evidence saved.');
  };
  const positionPercent = ((state.physicalPositionM + 20) / 40) * 100;
  const originPercent = ((origin + 20) / 40) * 100;
  const tableRows = useMemo(() => log.map((item) => trackReadout(item, origin, positiveDirection, 0, 0)), [log, origin, positiveDirection]);

  return <Page title="Explore a signed motion track" lead="The physical track does not change when you move the origin or reverse the positive-direction convention — only the coordinates and signs do.">
    <div className="seg-control__options"><button type="button" className="btn" onClick={reset} data-testid="motion-track-reset" data-control-id="global.reset-button">↺ Reset track</button></div>
    <section className="card stack" aria-labelledby="track-model"><h2 id="track-model">Coordinate model</h2><div className="mf-controls"><SimControl id="motion.origin-position-slider" label="Origin position" min={-10} max={10} step={1} value={origin} onChange={setOrigin} format={(value) => `${value.toFixed(0)} m physical coordinate`} testId="motion-origin" /><fieldset className="field"><legend className="field__label">Positive direction</legend><label><input type="radio" name="positive-direction" checked={positiveDirection === 'right'} onChange={() => setPositiveDirection('right')} data-control-id="motion.positive-direction-right-radio" /> Right</label><label><input type="radio" name="positive-direction" checked={positiveDirection === 'left'} onChange={() => setPositiveDirection('left')} data-control-id="motion.positive-direction-left-radio" /> Left</label></fieldset></div>
      <div className="mf-track" role="img" aria-label={`Track from negative 20 to positive 20 metres. Origin at ${origin} metres. Walker at physical position ${formatSigFigs(state.physicalPositionM)} metres.`}><span className="mf-track__origin" style={{ left: `${originPercent}%` }}><span>origin</span></span><span className="mf-track__walker" style={{ left: `${positionPercent}%` }} aria-hidden="true">●</span><span className="mf-track__left">−20 m</span><span className="mf-track__right">+20 m</span></div>
      <p className="seg-control__note">Physical right is the engine’s hidden internal axis. The selected classroom convention derives all displayed signs.</p>
    </section>
    <section className="card stack"><h2>Walker commands</h2><p>Each move or step advances the exact model by 1.0 s. Pausing and changing speed/direction do not advance time.</p><div className="seg-control__options"><button type="button" className="btn btn--primary" onClick={() => stepWithVelocity(Math.max(2, speed))} data-testid="motion-move-positive" data-control-id="motion.walker-move-positive-button">Move positive 1 s</button><button type="button" className="btn btn--primary" onClick={() => stepWithVelocity(-Math.max(2, speed))} data-testid="motion-move-negative" data-control-id="motion.walker-move-negative-button">Move negative 1 s</button><button type="button" className="btn" onClick={() => { setState((value) => ({ ...value, physicalVelocityMps: 0 })); setTimerRunning(false); }} data-control-id="motion.walker-pause-button">Pause</button><button type="button" className="btn" onClick={() => setState((value) => ({ ...value, physicalVelocityMps: value.physicalVelocityMps === 0 ? -2 : -value.physicalVelocityMps }))} data-control-id="motion.walker-turn-button">Turn around</button><button type="button" className="btn" onClick={() => setState((value) => ({ ...value, physicalVelocityMps: Math.min(10, Math.abs(value.physicalVelocityMps) + 1) * (value.physicalVelocityMps < 0 ? -1 : 1) }))} data-control-id="motion.walker-speed-up-button">Speed up</button><button type="button" className="btn" onClick={() => setState((value) => ({ ...value, physicalVelocityMps: Math.max(0, Math.abs(value.physicalVelocityMps) - 1) * direction }))} data-control-id="motion.walker-slow-down-button">Slow down</button><button type="button" className="btn" onClick={() => setTimerRunning((value) => !value)} data-testid="motion-timer" data-control-id="motion.timer-start-button">{timerRunning ? 'Stop timer' : 'Start timer'}</button><button type="button" className="btn" onClick={() => stepWithVelocity(state.physicalVelocityMps)} disabled={state.physicalVelocityMps === 0} data-control-id="global.step-button">Step 1 s</button></div></section>
    <section className="card stack"><h2>Instantaneous and average readouts</h2><dl className="mf-readouts"><div><dt>Time</dt><dd data-testid="motion-time">{formatSigFigs(readout.timeS)} s</dd></div><div><dt>Position from origin</dt><dd>{formatSigFigs(readout.positionM)} m</dd></div><div data-control-id="motion.distance-displacement-display"><dt>Distance / displacement</dt><dd data-testid="motion-distance-displacement">{formatSigFigs(readout.distanceM)} m / {formatSigFigs(readout.displacementM)} m</dd></div><div data-control-id="motion.speed-velocity-display"><dt>Instantaneous speed / velocity</dt><dd>{formatSigFigs(readout.speedMps)} m/s / {formatSigFigs(readout.velocityMps)} m/s</dd></div><div><dt>Average speed / velocity</dt><dd>{formatSigFigs(average.speed)} m/s / {formatSigFigs(average.velocity)} m/s</dd></div></dl><button type="button" className="btn" onClick={record} data-testid="motion-record-sample" data-control-id="motion.trial-record-button">Record current sample</button>
      <div className="mf-table-wrap"><table data-testid="motion-track-log" data-control-id="motion.trial-data-table"><caption>Position–time log; changing origin or convention re-expresses the stored physical samples</caption><thead><tr><th scope="col">Time (s)</th><th scope="col">Position (m)</th><th scope="col">Distance (m)</th><th scope="col">Displacement (m)</th><th scope="col">Velocity (m/s)</th></tr></thead><tbody>{tableRows.length === 0 ? <tr><td colSpan={5}>No samples yet.</td></tr> : tableRows.map((item, index) => <tr key={`${item.timeS}-${index}`}><td>{formatSigFigs(item.timeS)}</td><td>{formatSigFigs(item.positionM)}</td><td>{formatSigFigs(item.distanceM)}</td><td>{formatSigFigs(item.displacementM)}</td><td>{formatSigFigs(item.velocityMps)}</td></tr>)}</tbody></table></div>
      <label className="notice-capture__label">Compare instantaneous speed/velocity with average speed/velocity<textarea rows={3} className="notice-capture__input" value={comparison} onChange={(event) => { setComparison(event.target.value); setStatus('idle'); }} data-testid="motion-track-comparison" data-control-id="motion.average-instantaneous-comparison-input" /></label><button type="button" className="btn btn--primary" onClick={save} data-testid="motion-track-save" data-control-id="motion.save-track-evidence-button">Save track evidence</button>{status === 'error' ? <p className="field__error" role="status">Move first, record at least two samples, and complete the comparison.</p> : null}{status === 'saved' ? <p className="notice-capture__status" role="status">✓ Saved for 7.4.1. Continue to the <Link to="/motion/graphs">graph investigation</Link>.</p> : null}
    </section>
  </Page>;
}
