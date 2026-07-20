import { useEffect, useState } from 'react';
import {
  parseNumericField,
  solveForFrequency,
  solveForSpeed,
  solveForWavelength,
  tripleIsConsistent,
} from '../../science/equations';
import {
  formatWithUnit,
  fromHertz,
  fromMeters,
  toHertz,
  toMeters,
  FREQUENCY_UNITS,
  DISTANCE_UNITS,
  type DistanceUnit,
  type FrequencyUnit,
} from '../../science/units';
import { WaveEquation } from '../../components/sim/WaveEquation';

/**
 * The v = fλ calculator (outcome 7.1.6). Enter any two of speed, frequency and
 * wavelength to compute the third; enter all three to check consistency.
 * Validation follows SCIENCE_REVIEW §3.5: empty, non-numeric, negative, zero
 * and unit-less input is rejected with a specific message — never coerced, and
 * an internally inconsistent triple is never accepted.
 */

interface FieldState {
  raw: string;
  error: string | null;
}

const blank = (): FieldState => ({ raw: '', error: null });

export function LambdaCalculator({ resetKey }: { resetKey: number }) {
  const [v, setV] = useState<FieldState>(blank());
  const [f, setF] = useState<FieldState>(blank());
  const [lambda, setLambda] = useState<FieldState>(blank());
  const [fUnit, setFUnit] = useState<'' | FrequencyUnit>('');
  const [lambdaUnit, setLambdaUnit] = useState<'' | DistanceUnit>('');
  const [result, setResult] = useState<
    | { kind: 'computed'; text: string }
    | { kind: 'consistent' }
    | { kind: 'inconsistent' }
    | { kind: 'error'; text: string }
    | null
  >(null);

  // Toolbar reset clears every field to blank (never zero).
  useEffect(() => {
    setV(blank());
    setF(blank());
    setLambda(blank());
    setFUnit('');
    setLambdaUnit('');
    setResult(null);
  }, [resetKey]);

  const calculate = () => {
    const filled = [v.raw.trim() !== '', f.raw.trim() !== '', lambda.raw.trim() !== ''];
    const filledCount = filled.filter(Boolean).length;

    let vErr: string | null = null;
    let fErr: string | null = null;
    let lErr: string | null = null;
    let vSI: number | null = null;
    let fSI: number | null = null;
    let lSI: number | null = null;

    if (filled[0]) {
      const r = parseNumericField(v.raw, {
        label: 'speed',
        zeroMessage: 'Speed cannot be 0 m/s for a travelling wave.',
      });
      if (r.ok) vSI = r.value;
      else vErr = r.message;
    }
    if (filled[1]) {
      const r = parseNumericField(f.raw, {
        label: 'frequency',
        requireUnit: true,
        hasUnit: fUnit !== '',
        zeroMessage: 'Frequency cannot be 0 Hz for a travelling wave.',
      });
      if (r.ok) fSI = toHertz(r.value, fUnit as FrequencyUnit);
      else fErr = r.message;
    }
    if (filled[2]) {
      const r = parseNumericField(lambda.raw, {
        label: 'wavelength',
        requireUnit: true,
        hasUnit: lambdaUnit !== '',
        zeroMessage: 'Wavelength cannot be 0 for a travelling wave.',
      });
      if (r.ok) lSI = toMeters(r.value, lambdaUnit as DistanceUnit);
      else lErr = r.message;
    }

    setV((s) => ({ ...s, error: vErr }));
    setF((s) => ({ ...s, error: fErr }));
    setLambda((s) => ({ ...s, error: lErr }));

    if (vErr || fErr || lErr) {
      setResult({ kind: 'error', text: 'Fix the highlighted field(s) first.' });
      return;
    }
    if (filledCount < 2) {
      setResult({ kind: 'error', text: 'Enter at least two values.' });
      return;
    }

    if (filledCount === 3) {
      setResult(
        tripleIsConsistent(vSI!, fSI!, lSI!)
          ? { kind: 'consistent' }
          : { kind: 'inconsistent' },
      );
      return;
    }

    // Exactly two filled → compute the third.
    if (vSI === null) {
      const r = solveForSpeed(fSI!, lSI!);
      if (!r.ok) {
        setResult({ kind: 'error', text: r.message });
        return;
      }
      setResult({ kind: 'computed', text: `v = ${formatWithUnit(r.value, 'm/s')}` });
    } else if (fSI === null) {
      const r = solveForFrequency(vSI, lSI!);
      if (!r.ok) {
        setResult({ kind: 'error', text: r.message });
        return;
      }
      const unit: FrequencyUnit = fUnit === '' ? 'Hz' : (fUnit as FrequencyUnit);
      setResult({
        kind: 'computed',
        text: `f = ${formatWithUnit(fromHertz(r.value, unit), unit)}`,
      });
    } else {
      const r = solveForWavelength(vSI, fSI!);
      if (!r.ok) {
        setResult({ kind: 'error', text: r.message });
        return;
      }
      const unit: DistanceUnit = lambdaUnit === '' ? 'm' : (lambdaUnit as DistanceUnit);
      setResult({
        kind: 'computed',
        text: `λ = ${formatWithUnit(fromMeters(r.value, unit), unit)}`,
      });
    }
  };

  return (
    <div className="card stack">
      <h2>v = fλ calculator</h2>
      <WaveEquation compact />
      <p>
        Enter any <strong>two</strong> values to calculate the third, or all
        three to check they agree.
      </p>
      <div className="wave-controls">
        <div className="field" data-control-id="wave-lab.lambda-v-f-input-v">
          <label className="field__label" htmlFor="calc-v">
            Speed (v)
          </label>
          <div className="field__row">
            <input
              id="calc-v"
              className="field__input"
              inputMode="decimal"
              value={v.raw}
              onChange={(e) => setV({ raw: e.target.value, error: null })}
              data-testid="calc-v"
            />
            <span>m/s</span>
          </div>
          {v.error ? (
            <p className="field__error" role="status" data-testid="calc-v-error">
              {v.error}
            </p>
          ) : null}
        </div>

        <div className="field" data-control-id="wave-lab.lambda-v-f-input-f">
          <label className="field__label" htmlFor="calc-f">
            Frequency (f)
          </label>
          <div className="field__row">
            <input
              id="calc-f"
              className="field__input"
              inputMode="decimal"
              value={f.raw}
              onChange={(e) => setF({ raw: e.target.value, error: null })}
              data-testid="calc-f"
            />
            <select
              className="field__unit"
              aria-label="Frequency unit"
              value={fUnit}
              onChange={(e) => setFUnit(e.target.value as '' | FrequencyUnit)}
              data-testid="calc-f-unit"
            >
              <option value="">— unit —</option>
              {FREQUENCY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          {f.error ? (
            <p className="field__error" role="status" data-testid="calc-f-error">
              {f.error}
            </p>
          ) : null}
        </div>

        <div className="field" data-control-id="wave-lab.lambda-v-f-input-lambda">
          <label className="field__label" htmlFor="calc-lambda">
            Wavelength (λ)
          </label>
          <div className="field__row">
            <input
              id="calc-lambda"
              className="field__input"
              inputMode="decimal"
              value={lambda.raw}
              onChange={(e) => setLambda({ raw: e.target.value, error: null })}
              data-testid="calc-lambda"
            />
            <select
              className="field__unit"
              aria-label="Wavelength unit"
              value={lambdaUnit}
              onChange={(e) => setLambdaUnit(e.target.value as '' | DistanceUnit)}
              data-testid="calc-lambda-unit"
            >
              <option value="">— unit —</option>
              {DISTANCE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          {lambda.error ? (
            <p className="field__error" role="status" data-testid="calc-lambda-error">
              {lambda.error}
            </p>
          ) : null}
        </div>
      </div>

      <button type="button" className="btn btn--primary" onClick={calculate} data-testid="calc-submit" data-control-id="wave-lab.lambda-v-f-submit-button">
        Calculate / check with v = fλ
      </button>

      {result ? (
        <p
          className={`feedback ${
            result.kind === 'computed' || result.kind === 'consistent'
              ? 'feedback--correct'
              : result.kind === 'inconsistent'
                ? 'feedback--incorrect'
                : 'feedback--invalid'
          }`}
          role="status"
          data-testid="calc-result"
        >
          <span aria-hidden="true">
            {result.kind === 'computed' || result.kind === 'consistent' ? '✓' : '✗'}
          </span>
          <span>
            {result.kind === 'computed'
              ? result.text
              : result.kind === 'consistent'
                ? 'These values satisfy v = fλ.'
                : result.kind === 'inconsistent'
                  ? "These three values don't satisfy v = fλ — check your working."
                  : result.text}
          </span>
        </p>
      ) : null}
    </div>
  );
}
