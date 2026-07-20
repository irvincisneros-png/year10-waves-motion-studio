import { Link } from "react-router-dom";
import { Page } from "../../components/Page";

export function MotionHubPage() {
  return (
    <Page
      title="Describing motion"
      lead="Use a signed one-dimensional model, equal-time diagrams and measured graphs to distinguish how far, where, and how fast an object moves."
    >
      <section className="card stack">
        <h2>Orient — the return-trip puzzle</h2>
        <p>
          A student walks to a marker and returns to the starting point. Their
          distance is not zero, but their displacement is. Their average speed
          is not zero, but their average velocity is.
        </p>
        <p>
          <strong>Driving question:</strong> which measurements describe the
          path, and which describe change from a chosen starting position?
        </p>
        <h3>Learning intentions</h3>
        <ul>
          <li>
            <strong>7.4.1</strong> — investigate distance, time, speed,
            displacement and velocity.
          </li>
          <li>
            <strong>7.4.2</strong> — construct and interpret motion diagrams.
          </li>
          <li>
            <strong>7.4.3</strong> — collect data and analyse distance–time
            graphs.
          </li>
        </ul>
      </section>
      <section className="card stack">
        <h2>Learn — scalar, vector and graph</h2>
        <div className="mf-grid">
          <article>
            <h3>Path quantities</h3>
            <p>
              Distance is the total non-negative path length. Speed is distance
              divided by time and has no direction.
            </p>
          </article>
          <article>
            <h3>Signed quantities</h3>
            <p>
              Position is measured from an origin. Displacement compares finish
              with run start. Velocity includes the chosen positive direction.
            </p>
          </article>
          <article>
            <h3>Rates of change</h3>
            <p>
              A distance–time slope is speed. A displacement–time slope is
              velocity. A velocity–time slope is acceleration.
            </p>
          </article>
        </div>
      </section>
      <section className="card stack">
        <h2>Choose a starting point</h2>
        <div className="mf-grid">
          <article>
            <h3>
              <Link to="/motion/track">Explore the signed track</Link>
            </h3>
            <p>
              Change origin and positive direction, then compare instantaneous
              and average readouts.
            </p>
          </article>
          <article>
            <h3>
              <Link to="/motion/diagrams">Build motion diagrams</Link>
            </h3>
            <p>
              Edit up to eight equal-time positions and test five motion
              patterns.
            </p>
          </article>
          <article>
            <h3>
              <Link to="/motion/graphs">Run a graph investigation</Link>
            </h3>
            <p>
              Record timed trials, calculate slope, interpret a piecewise story
              and export evidence.
            </p>
          </article>
        </div>
      </section>
      <aside className="notice notice--warning stack">
        <h2>Model limits</h2>
        <p>
          This is exact one-dimensional centre-of-mass motion on a −20 m to +20
          m teaching track. Commands are discrete and deterministic; real
          walking includes reaction time and measurement uncertainty.
        </p>
      </aside>
    </Page>
  );
}

export function ForcesHubPage() {
  return (
    <Page
      title="Forces & Newton’s laws"
      lead="Select one object, add signed forces, run controlled cart trials and connect Newton’s laws to six real situations."
    >
      <section className="card stack">
        <h2>Orient — why does the heavier cart respond differently?</h2>
        <p>
          The same push does not produce the same acceleration for every mass.
          Several forces may act at once, so the motion depends on their signed
          sum — the net force.
        </p>
        <p>
          <strong>Driving question:</strong> how do force diagrams, F
          <sub>net</sub> = ma and Newton’s laws tell one consistent story?
        </p>
        <h3>Learning intentions</h3>
        <ul>
          <li>
            <strong>7.4.4</strong> — investigate force, mass and acceleration.
          </li>
          <li>
            <strong>7.4.5</strong> — investigate applications of Newton’s laws.
          </li>
          <li>
            <strong>7.4.6</strong> — determine one-dimensional net force using
            vectors.
          </li>
          <li>
            <strong>7.4.7</strong> — use F = ma, v<sub>av</sub> = Δs/Δt and a =
            Δv/Δt.
          </li>
        </ul>
      </section>
      <section className="card stack">
        <h2>Learn — one object at a time</h2>
        <div className="mf-grid">
          <article>
            <h3>Free-body diagram</h3>
            <p>
              Choose one object. Draw only forces acting on it, then add their
              signed values.
            </p>
          </article>
          <article>
            <h3>Controlled comparison</h3>
            <p>
              At fixed mass, acceleration follows net force. At fixed net force,
              acceleration follows inverse mass.
            </p>
          </article>
          <article>
            <h3>Interaction pairs</h3>
            <p>
              Third-law forces are equal and opposite but act on different
              objects, so they do not cancel on one diagram.
            </p>
          </article>
        </div>
      </section>
      <section className="card stack">
        <h2>Choose a starting point</h2>
        <div className="mf-grid">
          <article>
            <h3>
              <Link to="/forces/vectors">Build a force diagram</Link>
            </h3>
            <p>
              Add up to six physical forces and switch the positive-direction
              convention.
            </p>
          </article>
          <article>
            <h3>
              <Link to="/forces/cart">Investigate a cart</Link>
            </h3>
            <p>
              Run force and mass sweeps in ideal or seeded-measurement mode.
            </p>
          </article>
          <article>
            <h3>
              <Link to="/forces/applications">Apply Newton’s laws</Link>
            </h3>
            <p>
              Test seatbelt, carts, walking, balloon, collision and spacecraft
              cases.
            </p>
          </article>
        </div>
      </section>
      <aside className="notice notice--warning stack">
        <h2>Model limits</h2>
        <p>
          The cart uses a one-dimensional point-particle model. Friction is a
          stated 0.5 N teaching fixture, not a measured material constant.
          Rotation, drag and collision deformation are outside scope.
        </p>
      </aside>
    </Page>
  );
}
