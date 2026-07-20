import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "../../components/Page";
import { SimControl } from "../../components/sim/SimControl";
import { LineGraph } from "../../components/graphs/LineGraph";
import { useAnnouncer } from "../../accessibility/LiveRegion";
import { useProgressStore } from "../../store/progressStore";
import {
  nextLevelAfterAttempt,
  nextLevelAfterSuccess,
} from "../../store/evidenceHelpers";
import { accelerationFromVelocity } from "../../science/motion";
import {
  CART_FRICTION_N,
  runCartTrial,
  type CartTrial,
} from "../../science/forces";
import { formatSigFigs } from "../../science/units";

type RecordedTrial = CartTrial & { id: number; sweep: "force" | "mass" };
const downloadText = (filename: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function CartInvestigationPage() {
  const [sweep, setSweep] = useState<"force" | "mass">("force");
  const [appliedForce, setAppliedForce] = useState(2);
  const [mass, setMass] = useState(1);
  const [friction, setFriction] = useState(false);
  const [noise, setNoise] = useState(false);
  const [seed, setSeed] = useState(4471);
  const [trials, setTrials] = useState<RecordedTrial[]>([]);
  const [fields, setFields] = useState({
    hypothesis: "",
    interpretation: "",
    verification: "",
    uncertainty: "",
    conclusion: "",
    limitation: "",
  });
  const [status, setStatus] = useState<"idle" | "error" | "saved">("idle");
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const forceTrials = trials.filter((trial) => trial.sweep === "force");
  const massTrials = trials.filter((trial) => trial.sweep === "mass");
  const forcePoints = useMemo(
    () =>
      [...forceTrials]
        .sort((a, b) => a.netForceN - b.netForceN)
        .map((trial) => ({
          at: trial.netForceN,
          value: trial.measuredAccelerationMps2,
        })),
    [forceTrials],
  );
  const massPoints = useMemo(
    () =>
      [...massTrials]
        .sort((a, b) => 1 / a.massKg - 1 / b.massKg)
        .map((trial) => ({
          at: 1 / trial.massKg,
          value: trial.measuredAccelerationMps2,
        })),
    [massTrials],
  );
  const last = trials.at(-1);
  const updateField = (key: keyof typeof fields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  };
  const run = () => {
    const repeatIndex = trials.filter(
      (trial) =>
        trial.appliedForceN === appliedForce &&
        trial.massKg === mass &&
        trial.seed === (noise ? seed : null),
    ).length;
    const trial = runCartTrial({
      appliedForceN: appliedForce,
      massKg: mass,
      friction,
      noise,
      seed,
      trialIndex: repeatIndex,
    });
    setTrials((current) => [
      ...current,
      { ...trial, id: Date.now() + current.length, sweep },
    ]);
    announce(`${sweep === "force" ? "Force" : "Mass"} sweep trial recorded.`);
  };
  const reset = () => {
    if (
      trials.length &&
      !window.confirm("Clear all cart trials and investigation writing?")
    )
      return;
    setSweep("force");
    setAppliedForce(2);
    setMass(1);
    setFriction(false);
    setNoise(false);
    setSeed(4471);
    setTrials([]);
    setFields({
      hypothesis: "",
      interpretation: "",
      verification: "",
      uncertainty: "",
      conclusion: "",
      limitation: "",
    });
    setStatus("idle");
    announce("Cart investigation reset.");
  };
  const hasNoiseRepeat =
    !trials.some((trial) => trial.seed !== null) ||
    trials.some(
      (trial, index) =>
        trial.seed !== null &&
        trials.some(
          (other, otherIndex) =>
            otherIndex !== index &&
            other.appliedForceN === trial.appliedForceN &&
            other.massKg === trial.massKg &&
            other.seed === trial.seed,
        ),
    );
  const save = () => {
    const missing = Object.entries(fields).find(
      ([, value]) => value.trim() === "",
    );
    if (
      forceTrials.length < 3 ||
      massTrials.length < 3 ||
      missing ||
      !hasNoiseRepeat
    ) {
      setStatus("error");
      setOutcomeLevel(
        "7.4.4",
        nextLevelAfterAttempt(outcomes["7.4.4"] ?? "not-attempted"),
      );
      announce(
        "Complete both three-trial sweeps, repeat any noisy setup, and fill every field.",
      );
      return;
    }
    const summary = `Cart fair test (${forceTrials.length} force-sweep, ${massTrials.length} mass-sweep trials). Hypothesis: ${fields.hypothesis.trim()} | Pattern: ${fields.interpretation.trim()} | Fnet=ma and Δv/Δt verification: ${fields.verification.trim()} | Uncertainty: ${fields.uncertainty.trim()} | Conclusion: ${fields.conclusion.trim()} | Limitation/improvement: ${fields.limitation.trim()}`;
    for (const outcomeCode of ["7.4.4", "7.4.7"]) {
      addEvidence({ outcomeCode, kind: "investigation", summary });
      setOutcomeLevel(
        outcomeCode,
        nextLevelAfterSuccess(outcomes[outcomeCode] ?? "not-attempted"),
      );
    }
    setStatus("saved");
    announce("Cart investigation saved as evidence.");
  };
  const csv = [
    "Sweep,Applied force (N),Friction force (N),Net force (N),Mass (kg),Ideal acceleration (m/s^2),Measured acceleration (m/s^2),Seed",
    ...trials.map(
      (trial) =>
        `${trial.sweep},${trial.appliedForceN},${trial.frictionForceN},${trial.netForceN},${trial.massKg},${trial.idealAccelerationMps2},${trial.measuredAccelerationMps2},${trial.seed ?? "ideal"}`,
    ),
  ].join("\n");
  const json = JSON.stringify(
    {
      schema: "wavemotion.cart-investigation",
      version: 1,
      exportedAt: new Date().toISOString(),
      teachingFixtures: {
        frictionN: CART_FRICTION_N,
        noise: "uniform ±max(0.02 m/s², 3% of ideal acceleration)",
        defaultSeed: 4471,
      },
      trials,
      writing: fields,
    },
    null,
    2,
  );
  return (
    <Page
      title="Investigate force, mass and acceleration"
      lead="Run two controlled series: change net force at fixed mass, then change mass at fixed net force. Ideal mode is exact; seeded noise changes only measured acceleration."
    >
      <div className="seg-control__options">
        <button
          type="button"
          className="btn"
          onClick={reset}
          data-testid="forces-cart-reset"
          data-control-id="global.reset-button"
        >
          ↺ Reset investigation
        </button>
      </div>
      <section className="card stack">
        <h2>Aim, variables and method</h2>
        <p>
          <strong>Question:</strong> how does cart acceleration respond to net
          force and mass?
        </p>
        <dl>
          <dt>Series A</dt>
          <dd>
            Independent: applied/net force (N). Dependent: acceleration (m/s²).
            Control: mass (kg), friction mode and measurement mode.
          </dd>
          <dt>Series B</dt>
          <dd>
            Independent: mass (kg). Dependent: acceleration (m/s²). Control:
            applied/net force, friction mode and measurement mode.
          </dd>
          <dt>Method and safety</dt>
          <dd>
            Predict first. Record at least three force-sweep trials at one mass
            and three mass-sweep trials at one force. If noise is enabled,
            repeat at least one identical setup. This virtual model has no
            practical collision hazard; a real dynamics-cart practical needs a
            clear track, secured masses and teacher risk controls.
          </dd>
        </dl>
        <label className="notice-capture__label">
          Hypothesis for both controlled relationships
          <textarea
            rows={3}
            className="notice-capture__input"
            value={fields.hypothesis}
            onChange={(event) => updateField("hypothesis", event.target.value)}
            data-testid="forces-cart-hypothesis"
            data-control-id="forces.cart-hypothesis-input"
          />
        </label>
      </section>
      <section className="card stack">
        <h2>Configure and run a trial</h2>
        <div className="mf-controls">
          <label className="field">
            <span className="field__label">Series label</span>
            <select
              value={sweep}
              onChange={(event) => setSweep(event.target.value as typeof sweep)}
              data-testid="forces-sweep"
              data-control-id="forces.cart-sweep-select"
            >
              <option value="force">Force sweep — hold mass fixed</option>
              <option value="mass">Mass sweep — hold force fixed</option>
            </select>
          </label>
          <SimControl
            id="forces.cart-force-slider"
            label="Applied force"
            min={0}
            max={20}
            step={0.1}
            value={appliedForce}
            onChange={setAppliedForce}
            format={(value) => `${value.toFixed(1)} N`}
            testId="forces-cart-force"
          />
          <SimControl
            id="forces.cart-mass-slider"
            label="Mass"
            min={0.1}
            max={10}
            step={0.1}
            value={mass}
            onChange={setMass}
            format={(value) => `${value.toFixed(1)} kg`}
            testId="forces-cart-mass"
          />
          <label>
            <input
              type="checkbox"
              checked={friction}
              onChange={(event) => setFriction(event.target.checked)}
              data-testid="forces-friction"
              data-control-id="forces.friction-toggle"
            />{" "}
            Friction teaching fixture ({CART_FRICTION_N} N maximum opposing
            force)
          </label>
          <label>
            <input
              type="checkbox"
              checked={noise}
              onChange={(event) => setNoise(event.target.checked)}
              data-testid="forces-noise"
              data-control-id="forces.noise-mode-toggle"
            />{" "}
            Seeded measurement noise
          </label>
          {noise ? (
            <label className="field">
              <span className="field__label">Visible seed</span>
              <input
                type="number"
                value={seed}
                onChange={(event) => setSeed(Number(event.target.value))}
                data-testid="forces-seed"
                data-control-id="forces.noise-seed-input"
              />
            </label>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={run}
          data-testid="forces-run-trial"
          data-control-id="forces.trial-run-button"
        >
          Run and record trial
        </button>
        {last ? (
          <dl className="mf-readouts">
            <div>
              <dt>Applied / friction / net force</dt>
              <dd>
                {formatSigFigs(last.appliedForceN)} /{" "}
                {formatSigFigs(last.frictionForceN)} /{" "}
                {formatSigFigs(last.netForceN)} N
              </dd>
            </div>
            <div>
              <dt>Ideal / measured acceleration</dt>
              <dd data-testid="forces-acceleration">
                {formatSigFigs(last.idealAccelerationMps2)} /{" "}
                {formatSigFigs(last.measuredAccelerationMps2)} m/s²
              </dd>
            </div>
            <div>
              <dt>Fnet − ma residual</dt>
              <dd>
                {formatSigFigs(
                  last.netForceN - last.massKg * last.idealAccelerationMps2,
                )}{" "}
                N
              </dd>
            </div>
            <div>
              <dt>Δv/Δt from ideal sensor log</dt>
              <dd>
                {formatSigFigs(
                  accelerationFromVelocity(
                    last.velocityTime[0].value,
                    last.velocityTime[4].value,
                    4,
                  ),
                )}{" "}
                m/s²
              </dd>
            </div>
          </dl>
        ) : null}
        <p className="seg-control__note">
          Friction opposes the applied force up to 0.5 N and never propels a
          stationary cart backward. Noise is a reproducible measurement layer;
          ideal state and sensor motion remain unchanged.
        </p>
      </section>
      <section className="card stack">
        <h2>Results and graphs</h2>
        <div
          className="mf-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Scrollable cart investigation table"
        >
          <table data-testid="forces-cart-trials">
            <caption>Force–mass–acceleration trials</caption>
            <thead>
              <tr>
                <th scope="col">Series</th>
                <th scope="col">Applied F (N)</th>
                <th scope="col">Friction (N)</th>
                <th scope="col">Fnet (N)</th>
                <th scope="col">Mass (kg)</th>
                <th scope="col">Measured a (m/s²)</th>
                <th scope="col">Remove</th>
              </tr>
            </thead>
            <tbody>
              {!trials.length ? (
                <tr>
                  <td colSpan={7}>No trials yet.</td>
                </tr>
              ) : (
                trials.map((trial, index) => (
                  <tr key={trial.id}>
                    <td>{trial.sweep}</td>
                    <td>{formatSigFigs(trial.appliedForceN)}</td>
                    <td>{formatSigFigs(trial.frictionForceN)}</td>
                    <td>{formatSigFigs(trial.netForceN)}</td>
                    <td>{formatSigFigs(trial.massKg)}</td>
                    <td>{formatSigFigs(trial.measuredAccelerationMps2)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        onClick={() =>
                          setTrials((current) =>
                            current.filter((item) => item.id !== trial.id),
                          )
                        }
                        aria-label={`Delete cart trial ${index + 1}`}
                        data-control-id="forces.cart-delete-trial-button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {forcePoints.length >= 2 ? (
          <LineGraph
            title="Acceleration against net force — fixed-mass series"
            xLabel="net force (N)"
            yLabel="acceleration (m/s²)"
            series={[
              { label: "force sweep", points: forcePoints, mode: "scatter" },
            ]}
            testId="forces-force-graph"
          />
        ) : (
          <p>
            Record at least two force-sweep trials to graph acceleration against
            net force.
          </p>
        )}
        {massPoints.length >= 2 ? (
          <LineGraph
            title="Acceleration against inverse mass — fixed-force series"
            xLabel="inverse mass (1/kg)"
            yLabel="acceleration (m/s²)"
            series={[
              { label: "mass sweep", points: massPoints, mode: "scatter" },
            ]}
            testId="forces-mass-graph"
          />
        ) : (
          <p>
            Record at least two mass-sweep trials to graph acceleration against
            inverse mass.
          </p>
        )}
      </section>
      <section className="card stack">
        <h2>Interpret, verify and export</h2>
        <label className="notice-capture__label">
          Interpret both graph patterns
          <textarea
            rows={3}
            className="notice-capture__input"
            value={fields.interpretation}
            onChange={(event) =>
              updateField("interpretation", event.target.value)
            }
            data-testid="forces-cart-interpretation"
            data-control-id="forces.cart-interpretation-input"
          />
        </label>
        <label className="notice-capture__label">
          Use one row to verify Fnet = ma and a = Δv/Δt
          <textarea
            rows={3}
            className="notice-capture__input"
            value={fields.verification}
            onChange={(event) =>
              updateField("verification", event.target.value)
            }
            data-testid="forces-cart-verification"
            data-control-id="forces.cart-verification-input"
          />
        </label>
        <label className="notice-capture__label">
          Measurement uncertainty and repeats
          <textarea
            rows={3}
            className="notice-capture__input"
            value={fields.uncertainty}
            onChange={(event) => updateField("uncertainty", event.target.value)}
            data-testid="forces-cart-uncertainty"
            data-control-id="forces.cart-uncertainty-input"
          />
        </label>
        <label className="notice-capture__label">
          Conclusion
          <textarea
            rows={3}
            className="notice-capture__input"
            value={fields.conclusion}
            onChange={(event) => updateField("conclusion", event.target.value)}
            data-testid="forces-cart-conclusion"
            data-control-id="forces.cart-conclusion-input"
          />
        </label>
        <label className="notice-capture__label">
          Limitation and improvement
          <textarea
            rows={3}
            className="notice-capture__input"
            value={fields.limitation}
            onChange={(event) => updateField("limitation", event.target.value)}
            data-testid="forces-cart-limitation"
            data-control-id="forces.cart-limitation-input"
          />
        </label>
        <div className="seg-control__options">
          <button
            type="button"
            className="btn"
            disabled={!trials.length}
            onClick={() =>
              downloadText("wavemotion-cart-trials.csv", csv, "text/csv")
            }
            data-testid="forces-export-csv"
            data-control-id="forces.export-csv-button"
          >
            Export CSV
          </button>
          <button
            type="button"
            className="btn"
            disabled={!trials.length}
            onClick={() =>
              downloadText(
                "wavemotion-cart-trials.json",
                json,
                "application/json",
              )
            }
            data-testid="forces-export-json"
            data-control-id="forces.export-json-button"
          >
            Export JSON
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => window.print()}
            data-testid="forces-print"
            data-control-id="forces.print-button"
          >
            Print investigation
          </button>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={save}
          data-testid="forces-save-investigation"
          data-control-id="forces.save-investigation-button"
        >
          Save investigation as evidence
        </button>
        {status === "error" ? (
          <p className="field__error" role="status">
            Record three trials in each sweep, repeat one identical noisy setup
            when noise is used, and complete every investigation field.
          </p>
        ) : null}
        {status === "saved" ? (
          <p className="notice-capture__status" role="status">
            ✓ Saved for 7.4.4 and 7.4.7. Review it on{" "}
            <Link to="/progress">Progress</Link>.
          </p>
        ) : null}
      </section>
    </Page>
  );
}
