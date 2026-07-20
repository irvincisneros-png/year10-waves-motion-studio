import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import { criticalAngleDeg, qualitativeLensImage, type LensType } from '../../science/optics';

type ApplicationId = 'none' | 'sunscreen' | 'thermal' | 'surfaces' | 'visibility' | 'remote-sensing';

const APPLICATIONS: Record<Exclude<ApplicationId, 'none'>, { title: string; property: string; evidence: string; assumptions: string }> = {
  sunscreen: { title: 'UV-screen material comparison', property: 'Selective absorption and transmission', evidence: 'A UV-screen model absorbs a larger fraction of the UV-rich profile than of the warm-LED profile.', assumptions: 'Conceptual profiles only; no product, dose, exposure time or protection claim. Follow public-health advice rather than this model.' },
  thermal: { title: 'Solar-thermal surface choice', property: 'Absorption under a stated illuminant', evidence: 'A high-absorption surface model places more incoming optical energy in the absorbed ledger fraction.', assumptions: 'This does not calculate temperature. Heat capacity, geometry, convection, duration and surroundings are not modelled.' },
  surfaces: { title: 'White/black visibility comparison', property: 'Diffuse reflection and absorption', evidence: 'Under the same teaching illuminant, the white-matte model redirects more energy and the black-matte model absorbs more.', assumptions: 'The claim is conditional on the selected models. “Black always heats fastest” is not supported.' },
  visibility: { title: 'Road reflector design', property: 'Reflection direction', evidence: 'A reflector must direct returned light towards the observer; a near miss is measurable as an angle error.', assumptions: 'This ideal ray model omits surface roughness, beam spread, weather and observer geometry.' },
  'remote-sensing': { title: 'Remote-sensing band choice', property: 'Reflection, transmission, absorption and scattering', evidence: 'Different material/atmosphere interactions can make one wavelength region more informative than another.', assumptions: 'No real satellite spectrum is analysed here; Stage 6 provides curated astronomical/spectral datasets.' },
};

export default function LightApplicationsPage() {
  const [application, setApplication] = useState<ApplicationId>('none');
  const [lensType, setLensType] = useState<LensType>('converging');
  const [objectPosition, setObjectPosition] = useState<'near' | 'far'>('near');
  const [justification, setJustification] = useState('');
  const [assumption, setAssumption] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'saved'>('idle');
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const fibreCritical = criticalAngleDeg(1.52, 1.49)!;
  const chosen = application === 'none' ? null : APPLICATIONS[application];

  const reset = () => {
    setApplication('none'); setLensType('converging'); setObjectPosition('near'); setJustification(''); setAssumption(''); setStatus('idle');
    announce('Light applications reset.');
  };

  const save = () => {
    if (!chosen || justification.trim() === '' || assumption.trim() === '') {
      setStatus('error');
      announce('Choose an application and complete the justification and assumption.');
      return;
    }
    addEvidence({ outcomeCode: '7.3.3', kind: 'application', summary: `${chosen.title}. Justification: ${justification.trim()} | Assumption/limitation: ${assumption.trim()}` });
    setOutcomeLevel('7.3.3', nextLevelAfterSuccess(outcomes['7.3.3'] ?? 'not-attempted'));
    setStatus('saved');
    announce('Application justification saved as evidence.');
  };

  return (
    <Page title="Everyday applications of light" lead="Use reflection, refraction and absorption evidence to justify a design — and state the assumptions that limit your claim.">
      <div className="seg-control__options"><button type="button" className="btn" onClick={reset} data-control-id="global.reset-button" data-testid="applications-reset"><span aria-hidden="true">↺</span> Reset applications</button></div>

      <section className="card stack" aria-labelledby="mirror-application-heading">
        <h2 id="mirror-application-heading">Mirrors — periscopes and reflectors</h2>
        <p>A two-mirror periscope relies on the law of reflection at each plane mirror. A road reflector is useful only if returned rays reach the observer; equal angles alone do not guarantee the whole device geometry succeeds.</p>
        <p>Use the <Link to="/light/properties">reflection design challenge</Link> to adjust mirror angle and get specific near-miss feedback.</p>
      </section>

      <section className="card stack" aria-labelledby="lens-application-heading">
        <h2 id="lens-application-heading">Lenses — qualitative image models</h2>
        <div className="light-controls">
          <div className="field"><label className="field__label" htmlFor="lens-type">Lens type</label><select id="lens-type" className="field__unit" value={lensType} onChange={(event) => setLensType(event.target.value as LensType)} data-control-id="optics.lens-type-select" data-testid="lens-type"><option value="converging">Converging</option><option value="diverging">Diverging</option></select></div>
          <fieldset className="seg-control" data-control-id="optics.lens-object-position"><legend>Object position</legend><div className="seg-control__options"><label><input type="radio" name="object-position" value="near" checked={objectPosition === 'near'} onChange={() => setObjectPosition('near')} /> Near</label><label><input type="radio" name="object-position" value="far" checked={objectPosition === 'far'} onChange={() => setObjectPosition('far')} /> Far</label></div></fieldset>
        </div>
        <p role="status" data-testid="lens-outcome"><strong>Model result:</strong> {qualitativeLensImage(lensType, objectPosition)}</p>
        <p className="seg-control__note">This is a scaffolded ray-path comparison. No focal length or lens equation is fabricated or required.</p>
      </section>

      <section className="card stack" aria-labelledby="fibre-application-heading">
        <h2 id="fibre-application-heading">Optical fibre — repeated total internal reflection</h2>
        <p>For the example core n = 1.52 and cladding n = 1.49, the ideal critical angle is {fibreCritical.toFixed(1)}° from the normal inside the core. Above it, the ray is reflected back into the core. Real fibres also have bend, coupling and dispersion losses outside this model.</p>
      </section>

      <section className="card stack" aria-labelledby="application-evidence-heading">
        <h2 id="application-evidence-heading">Application evidence challenge</h2>
        <div className="field"><label className="field__label" htmlFor="everyday-application">Everyday application</label><select id="everyday-application" className="field__unit" value={application} onChange={(event) => { setApplication(event.target.value as ApplicationId); setStatus('idle'); }} data-control-id="optics.application-select" data-testid="application-select"><option value="none">None — choose a scenario</option><option value="sunscreen">Sunscreen / UV-screen model</option><option value="thermal">Thermal absorption</option><option value="surfaces">White / black surfaces</option><option value="visibility">Visibility / reflector</option><option value="remote-sensing">Remote sensing</option></select></div>
        {chosen ? <div className="notice notice--info stack" data-testid="application-context"><h3>{chosen.title}</h3><p><strong>Property:</strong> {chosen.property}</p><p><strong>Evidence available:</strong> {chosen.evidence}</p><p><strong>Required guardrail:</strong> {chosen.assumptions}</p></div> : <p>Choose a scenario to load its evidence and required guardrail.</p>}
        <label className="notice-capture__label">Design justification<span className="seg-control__note">Make a claim, cite a property/model result, and explain why it supports the application.</span><textarea className="notice-capture__input" rows={4} value={justification} onChange={(event) => { setJustification(event.target.value); setStatus('idle'); }} data-testid="application-justification" data-control-id="optics.application-justification-input" /></label>
        <label className="notice-capture__label">Assumption or limitation<span className="seg-control__note">State what must be true, or what the ideal model leaves out.</span><textarea className="notice-capture__input" rows={3} value={assumption} onChange={(event) => { setAssumption(event.target.value); setStatus('idle'); }} data-testid="application-assumption" data-control-id="optics.application-assumption-input" /></label>
        <button type="button" className="btn btn--primary" onClick={save} data-testid="application-save" data-control-id="optics.application-save-button">Save design justification</button>
        {status === 'error' ? <p className="field__error" role="status">Choose an application and complete both written fields; empty evidence is not accepted.</p> : null}
        {status === 'saved' ? <p className="notice-capture__status" role="status">✓ Saved for outcome 7.3.3. Review it on the <Link to="/progress">Progress page</Link>.</p> : null}
      </section>
    </Page>
  );
}
