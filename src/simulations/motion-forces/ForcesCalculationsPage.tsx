import { useState } from "react";
import { Page } from "../../components/Page";
import { useAnnouncer } from "../../accessibility/LiveRegion";
import { useProgressStore } from "../../store/progressStore";
import {
  nextLevelAfterAttempt,
  nextLevelAfterSuccess,
} from "../../store/evidenceHelpers";
import {
  parseNumericField,
  solveAccelerationTime,
  solveAverageVelocity,
  solveDisplacement,
  solveForForce,
  solveForMass,
  solveForceAcceleration,
  solveVelocityAcceleration,
  solveVelocityChange,
  solveVelocityTime,
  type SolveResult,
} from "../../science/equations";
import { formatSigFigs } from "../../science/units";

type Mode =
  | "force"
  | "mass"
  | "force-a"
  | "velocity"
  | "displacement"
  | "velocity-time"
  | "acceleration"
  | "velocity-change"
  | "acceleration-time";
type Config = {
  equation: string;
  resultLabel: string;
  resultUnit: string;
  inputs: [{ label: string; unit: string }, { label: string; unit: string }];
  solve: (a: number, b: number) => SolveResult;
};
const CONFIGS: Record<Mode, Config> = {
  force: {
    equation: "F = ma",
    resultLabel: "Force",
    resultUnit: "N",
    inputs: [
      { label: "Mass", unit: "kg" },
      { label: "Acceleration", unit: "m/s²" },
    ],
    solve: solveForForce,
  },
  mass: {
    equation: "m = F/a",
    resultLabel: "Mass",
    resultUnit: "kg",
    inputs: [
      { label: "Force", unit: "N" },
      { label: "Acceleration", unit: "m/s²" },
    ],
    solve: solveForMass,
  },
  "force-a": {
    equation: "a = F/m",
    resultLabel: "Acceleration",
    resultUnit: "m/s²",
    inputs: [
      { label: "Force", unit: "N" },
      { label: "Mass", unit: "kg" },
    ],
    solve: solveForceAcceleration,
  },
  velocity: {
    equation: "vₐᵥ = Δs/Δt",
    resultLabel: "Average velocity",
    resultUnit: "m/s",
    inputs: [
      { label: "Displacement", unit: "m" },
      { label: "Time", unit: "s" },
    ],
    solve: solveAverageVelocity,
  },
  displacement: {
    equation: "Δs = vₐᵥΔt",
    resultLabel: "Displacement",
    resultUnit: "m",
    inputs: [
      { label: "Average velocity", unit: "m/s" },
      { label: "Time", unit: "s" },
    ],
    solve: solveDisplacement,
  },
  "velocity-time": {
    equation: "Δt = Δs/vₐᵥ",
    resultLabel: "Time",
    resultUnit: "s",
    inputs: [
      { label: "Displacement", unit: "m" },
      { label: "Average velocity", unit: "m/s" },
    ],
    solve: solveVelocityTime,
  },
  acceleration: {
    equation: "a = Δv/Δt",
    resultLabel: "Acceleration",
    resultUnit: "m/s²",
    inputs: [
      { label: "Change in velocity", unit: "m/s" },
      { label: "Time", unit: "s" },
    ],
    solve: solveVelocityAcceleration,
  },
  "velocity-change": {
    equation: "Δv = aΔt",
    resultLabel: "Change in velocity",
    resultUnit: "m/s",
    inputs: [
      { label: "Acceleration", unit: "m/s²" },
      { label: "Time", unit: "s" },
    ],
    solve: solveVelocityChange,
  },
  "acceleration-time": {
    equation: "Δt = Δv/a",
    resultLabel: "Time",
    resultUnit: "s",
    inputs: [
      { label: "Change in velocity", unit: "m/s" },
      { label: "Acceleration", unit: "m/s²" },
    ],
    solve: solveAccelerationTime,
  },
};

export default function ForcesCalculationsPage() {
  const [mode, setMode] = useState<Mode>("force-a");
  const [raw, setRaw] = useState(["", ""]);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [interpretation, setInterpretation] = useState("");
  const [saved, setSaved] = useState(false);
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const config = CONFIGS[mode];
  const calculate = () => {
    const parsed = raw.map((value, index) =>
      parseNumericField(value, {
        label: config.inputs[index].label.toLowerCase(),
        allowNegative: true,
        allowZero: true,
        requireUnit: true,
        hasUnit: true,
      }),
    );
    const invalid = parsed.find((item) => !item.ok);
    if (invalid && !invalid.ok) {
      const next = {
        ok: false as const,
        code: "invalid-field",
        message: invalid.message,
      };
      setResult(next);
      setOutcomeLevel(
        "7.4.7",
        nextLevelAfterAttempt(outcomes["7.4.7"] ?? "not-attempted"),
      );
      announce(next.message);
      return;
    }
    const next = config.solve(
      (parsed[0] as { ok: true; value: number }).value,
      (parsed[1] as { ok: true; value: number }).value,
    );
    setResult(next);
    setSaved(false);
    announce(next.ok ? `${config.resultLabel} calculated.` : next.message);
  };
  const save = () => {
    if (!result?.ok || interpretation.trim() === "") {
      announce(
        "Calculate a valid result and explain its sign and units before saving.",
      );
      return;
    }
    addEvidence({
      outcomeCode: "7.4.7",
      kind: "calculation",
      summary: `${config.equation}: ${config.inputs[0].label} ${raw[0]} ${config.inputs[0].unit}; ${config.inputs[1].label} ${raw[1]} ${config.inputs[1].unit}; ${config.resultLabel} ${formatSigFigs(result.value)} ${config.resultUnit}. Interpretation: ${interpretation.trim()}`,
    });
    setOutcomeLevel(
      "7.4.7",
      nextLevelAfterSuccess(outcomes["7.4.7"] ?? "not-attempted"),
    );
    setSaved(true);
    announce("Calculation saved as evidence.");
  };
  return (
    <Page
      title="Calculate motion and force relationships"
      lead="Choose the unknown, enter unit-labelled signed quantities and use guarded rearrangements of F = ma, vav = Δs/Δt and a = Δv/Δt."
    >
      <section className="card stack">
        <h2>Equation triangle</h2>
        <label className="field">
          <span className="field__label">Choose the unknown</span>
          <select
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as Mode);
              setRaw(["", ""]);
              setResult(null);
              setSaved(false);
            }}
            data-testid="forces-calculation-mode"
            data-control-id="forces.calculation-mode-select"
          >
            <optgroup label="F = ma">
              <option value="force">Force F</option>
              <option value="mass">Mass m</option>
              <option value="force-a">Acceleration a</option>
            </optgroup>
            <optgroup label="vav = Δs/Δt">
              <option value="velocity">Average velocity vav</option>
              <option value="displacement">Displacement Δs</option>
              <option value="velocity-time">Time Δt</option>
            </optgroup>
            <optgroup label="a = Δv/Δt">
              <option value="acceleration">Acceleration a</option>
              <option value="velocity-change">Change in velocity Δv</option>
              <option value="acceleration-time">Time Δt</option>
            </optgroup>
          </select>
        </label>
        <p className="mf-equation" aria-live="polite">
          {config.equation}
        </p>
        <div className="mf-controls">
          {config.inputs.map((input, index) => (
            <label className="field" key={`${mode}-${input.label}`}>
              <span className="field__label">{input.label}</span>
              <span className="field__row">
                <input
                  inputMode="decimal"
                  value={raw[index]}
                  onChange={(event) => {
                    setRaw((current) =>
                      current.map((value, item) =>
                        item === index ? event.target.value : value,
                      ),
                    );
                    setResult(null);
                    setSaved(false);
                  }}
                  data-testid={`forces-calculation-input-${index}`}
                  data-control-id={`forces.calculation-input-${index + 1}`}
                />
                <span>{input.unit}</span>
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={calculate}
          data-testid="forces-calculate"
          data-control-id="forces.calculate-button"
        >
          Calculate
        </button>
        {result ? (
          <p
            className={`feedback ${result.ok ? "feedback--correct" : "feedback--invalid"}`}
            role="status"
            data-testid="forces-calculation-result"
          >
            {result.ok
              ? `${config.resultLabel} = ${formatSigFigs(result.value)} ${config.resultUnit}`
              : result.message}
          </p>
        ) : null}
      </section>
      <section className="card stack">
        <h2>Interpret and save</h2>
        <p>
          State what the sign means in the chosen coordinate convention and
          confirm that the result unit matches the physical dimension. A
          negative acceleration can mean speeding up in the negative direction.
        </p>
        <label className="notice-capture__label">
          Result interpretation
          <textarea
            rows={3}
            className="notice-capture__input"
            value={interpretation}
            onChange={(event) => {
              setInterpretation(event.target.value);
              setSaved(false);
            }}
            data-testid="forces-calculation-interpretation"
            data-control-id="forces.calculation-interpretation-input"
          />
        </label>
        <button
          type="button"
          className="btn btn--primary"
          onClick={save}
          data-testid="forces-calculation-save"
          data-control-id="forces.save-calculation-evidence-button"
        >
          Save calculation as evidence
        </button>
        {saved ? (
          <p className="notice-capture__status" role="status">
            ✓ Saved for 7.4.7.
          </p>
        ) : null}
      </section>
    </Page>
  );
}
