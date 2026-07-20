import { useMemo, useState } from 'react';
import { Page } from '../../components/Page';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterAttempt, nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import { forceTypeAllowed, netForce, physicalDirectionForSign, signedForce, type ForceContext, type ForceType, type ForceVector } from '../../science/forces';
import type { PositiveDirection } from '../../science/motion';
import { formatSigFigs } from '../../science/units';

const FORCE_TYPES: ForceType[] = ['applied', 'friction', 'drag', 'tension', 'normal', 'weight'];

export default function ForceVectorsPage() {
  const [forces, setForces] = useState<ForceVector[]>([]);
  const [magnitude, setMagnitude] = useState('2');
  const [directionSign, setDirectionSign] = useState<'positive' | 'negative'>('positive');
  const [positiveDirection, setPositiveDirection] = useState<PositiveDirection>('right');
  const [type, setType] = useState<ForceType>('applied');
  const [context, setContext] = useState<ForceContext>('horizontal');
  const [explanation, setExplanation] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'saved'>('idle');
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const total = useMemo(() => netForce(forces, positiveDirection), [forces, positiveDirection]);
  const addForce = () => {
    const value = Number(magnitude);
    if (!Number.isFinite(value) || value < 0) { setStatus('error'); announce('Enter a non-negative force magnitude.'); return; }
    if (forces.length >= 6) { setStatus('error'); announce('Six-force maximum reached.'); return; }
    if (!forceTypeAllowed(type, context)) { setStatus('error'); announce(`${type} is not available in the selected context.`); return; }
    const physicalDirection = physicalDirectionForSign(directionSign, positiveDirection);
    setForces((current) => [...current, { id: `${Date.now()}-${current.length}`, magnitudeN: value, physicalDirection, type, label: type }]); setStatus('idle'); announce(`${type} force added.`);
  };
  const save = () => {
    if (!forces.length || explanation.trim() === '') { setStatus('error'); setOutcomeLevel('7.4.6', nextLevelAfterAttempt(outcomes['7.4.6'] ?? 'not-attempted')); announce('Add a force and explain the signed sum before saving.'); return; }
    addEvidence({ outcomeCode: '7.4.6', kind: 'diagram', summary: `One-object force diagram: ${forces.map((force) => `${force.label} ${formatSigFigs(force.magnitudeN)} N ${force.physicalDirection}`).join('; ')}. Positive ${positiveDirection}; Fnet ${formatSigFigs(total)} N. ${explanation.trim()}` });
    setOutcomeLevel('7.4.6', nextLevelAfterSuccess(outcomes['7.4.6'] ?? 'not-attempted')); setStatus('saved'); announce('Force-vector evidence saved.');
  };
  const changeContext = (next: ForceContext) => { setContext(next); if (!forceTypeAllowed(type, next)) setType('applied'); };
  return <Page title="Build a one-object force diagram" lead="Store physical arrow directions, choose a positive coordinate convention, and calculate the exact signed sum. Changing convention flips signs but never the physical arrows.">
    <section className="card stack"><h2>Object and coordinate context</h2><div className="mf-controls"><label className="field"><span className="field__label">Physical context</span><select value={context} onChange={(event) => changeContext(event.target.value as ForceContext)} data-testid="forces-context" data-control-id="forces.context-select"><option value="horizontal">Horizontal, unsupported model</option><option value="supported">Supported on a surface</option><option value="vertical">Vertical motion</option></select></label><label className="field"><span className="field__label">Positive direction</span><select value={positiveDirection} onChange={(event) => setPositiveDirection(event.target.value as PositiveDirection)} data-testid="forces-positive-direction" data-control-id="forces.positive-direction-select"><option value="right">Right is positive</option><option value="left">Left is positive</option></select></label></div><p className="seg-control__note">Selected object: cart. Only forces acting on this cart belong in the diagram.</p></section>
    <section className="card stack"><h2>Add a force</h2><div className="mf-controls"><label className="field"><span className="field__label">Magnitude (N)</span><input type="number" min="0" max="50" step="0.1" value={magnitude} onChange={(event) => setMagnitude(event.target.value)} data-testid="forces-magnitude" data-control-id="forces.force-magnitude-input" /></label><label className="field"><span className="field__label">Direction in selected convention</span><select value={directionSign} onChange={(event) => setDirectionSign(event.target.value as typeof directionSign)} data-control-id="forces.force-direction-select"><option value="positive">Positive</option><option value="negative">Negative</option></select></label><label className="field"><span className="field__label">Force type</span><select value={type} onChange={(event) => setType(event.target.value as ForceType)} data-control-id="forces.force-type-toggle">{FORCE_TYPES.map((forceType) => <option key={forceType} value={forceType} disabled={!forceTypeAllowed(forceType, context)}>{forceType}{!forceTypeAllowed(forceType, context) ? ' — not in this context' : ''}</option>)}</select></label></div><button type="button" className="btn btn--primary" onClick={addForce} disabled={forces.length >= 6} data-testid="forces-add-force" data-control-id="forces.add-force-button">Add force</button>{forces.length >= 6 ? <p role="status">Six-force maximum reached. Delete a force to add another.</p> : null}</section>
    <section className="card stack"><h2>Diagram and signed sum</h2><div className="mf-force-scene" role="img" aria-label={`Cart with ${forces.length} forces. ${forces.map((force) => `${force.label}, ${force.magnitudeN} newtons ${force.physicalDirection}`).join('; ') || 'No forces.'}`}><div className="mf-cart">cart</div>{forces.map((force, index) => <div key={force.id} className={`mf-force-arrow mf-force-arrow--${force.physicalDirection}`} style={{ top: `${15 + index * 12}%` }} aria-hidden="true"><span>{force.physicalDirection === 'right' ? '→' : '←'} {force.label}</span></div>)}</div><div className="mf-table-wrap"><table data-testid="forces-vector-table"><caption>Forces acting on the selected cart</caption><thead><tr><th scope="col">Type</th><th scope="col">Physical direction</th><th scope="col">Signed value (N)</th><th scope="col">Remove</th></tr></thead><tbody>{forces.length === 0 ? <tr><td colSpan={4}>No forces yet.</td></tr> : forces.map((force, index) => <tr key={force.id}><td>{force.label}</td><td>{force.physicalDirection}</td><td>{formatSigFigs(signedForce(force, positiveDirection))}</td><td><button type="button" className="btn" onClick={() => setForces((current) => current.filter((item) => item.id !== force.id))} aria-label={`Delete ${force.label} force ${index + 1}`} data-control-id="forces.delete-force-button">Delete</button></td></tr>)}</tbody></table></div><p className="mf-net-force" data-testid="forces-net-force" data-control-id="forces.net-force-display"><strong>F<sub>net</sub> = {formatSigFigs(total)} N</strong> ({positiveDirection} is positive)</p><label className="notice-capture__label">Explain how the signed vectors determine the net force<textarea rows={3} className="notice-capture__input" value={explanation} onChange={(event) => { setExplanation(event.target.value); setStatus('idle'); }} data-testid="forces-vector-explanation" data-control-id="forces.vector-explanation-input" /></label><button type="button" className="btn btn--primary" onClick={save} data-testid="forces-vector-save" data-control-id="forces.save-vector-evidence-button">Save vector evidence</button>{status === 'error' ? <p className="field__error" role="status">Add at least one valid force and complete the explanation.</p> : null}{status === 'saved' ? <p className="notice-capture__status" role="status">✓ Saved for 7.4.6.</p> : null}</section>
  </Page>;
}
