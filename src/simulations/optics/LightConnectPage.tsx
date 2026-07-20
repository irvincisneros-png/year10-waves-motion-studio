import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';

export default function LightConnectPage() {
  return <Page title="Light in the real world" lead="The same boundary models support cameras, fibres, reflectors, protective materials and vision — when their assumptions are stated.">
    <section className="card stack"><h2>From rays to instruments</h2><p>Plane mirrors redirect rays in periscopes and reflectors. Qualitative converging-lens models explain magnifiers and real camera images. Optical fibres guide light by repeated total internal reflection at a higher-index core boundary.</p><p>Revisit the <Link to="/light/applications">application challenges</Link> and make a justification that cites a property rather than only naming a device.</p></section>
    <section className="card stack"><h2>From a ledger to a responsible claim</h2><p>Transmission, reflection and absorption describe where incoming optical energy goes. A surface comparison is meaningful only for a stated illuminant and model. Temperature change additionally depends on material, geometry, environment and time.</p><p>Return to the <Link to="/light/properties">energy ledger</Link> and compare one surface under two illuminants.</p></section>
    <section className="card stack"><h2>From retinal image to perception</h2><p>The cornea and lens form an optical image. The retina converts light to signals, which travel along the optic nerve and are interpreted by neural systems. The model deliberately avoids the misleading one-step claim that the brain merely “flips” an image.</p><p>Use the <Link to="/vision">vision model</Link> to inspect the labelled pathway.</p></section>
    <section className="card stack"><h2>Complete the cycle</h2><p>Try the <Link to="/light/check">misconception checks</Link>, save your <Link to="/light/explain">refraction explanation</Link>, and review anonymous evidence on the <Link to="/progress">Progress page</Link>.</p></section>
  </Page>;
}
