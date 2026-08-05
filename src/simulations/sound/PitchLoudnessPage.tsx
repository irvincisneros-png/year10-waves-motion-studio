import { useCallback, useEffect, useRef, useState } from 'react';
import { Page } from '../../components/Page';
import { LineGraph } from '../../components/graphs/LineGraph';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterAttempt, nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import { formatSigFigs, formatValue } from '../../science/units';
import {
  oscilloscopeTrace,
  spectrumBars,
  clampToneFrequency,
  SAFE_TONE_MIN_HZ,
  SAFE_TONE_MAX_HZ,
  WAVEFORMS,
  type ToneState,
  type Waveform,
} from '../../science/sound';
import { SimControl } from '../../components/sim/SimControl';
import { SpectrumView } from './SpectrumView';
import { AudioEnablePanel } from './AudioEnablePanel';
import { useToneAudio } from './useToneAudio';
import {
  hasAudioSafetyAcknowledgement,
  rememberAudioSafetyAcknowledgement,
} from './audioSafetySession';
import { LiveSoundVisualiser } from './LiveSoundVisualiser';
import { GuitarStringConnection } from './GuitarStringConnection';

/**
 * Pitch and loudness investigation (outcome 7.2.2). Frequency and amplitude are
 * varied INDEPENDENTLY; an oscilloscope (pressure-vs-time) and a spectrum view
 * make the effect visible with or without sound. Web Audio is strictly opt-in
 * (SCIENCE_REVIEW §12.5): nothing plays until the headphone warning is
 * acknowledged and "Enable sound" is pressed; it starts muted at a safe, capped
 * level. Teaches: volume (a control setting) ≠ loudness (a perception);
 * amplitude never changes pitch (invariant 20.4).
 */

const DURATION_CEILING_S = 5;

interface ToneTrial {
  id: string;
  waveform: Waveform;
  frequencyHz: number;
  levelPct: number;
}

const WAVEFORM_LABELS: Record<Waveform, string> = {
  sine: 'Sine',
  square: 'Square',
  triangle: 'Triangle',
  sawtooth: 'Sawtooth',
};

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PitchLoudnessPage() {
  const [frequency, setFrequency] = useState(440);
  const [levelPct, setLevelPct] = useState(20);
  const [waveform, setWaveform] = useState<Waveform>('sine');
  const [durationRaw, setDurationRaw] = useState('1.0');
  const [durationError, setDurationError] = useState<string | null>(null);
  const [emissionMode, setEmissionMode] = useState<'pulse' | 'continuous'>('pulse');
  const [timescaleMs, setTimescaleMs] = useState(10);
  const [view, setView] = useState<'oscilloscope' | 'spectrum'>('oscilloscope');
  const [visualOnly, setVisualOnly] = useState(false);
  const [acknowledged, setAcknowledged] = useState(hasAudioSafetyAcknowledgement);
  const [trials, setTrials] = useState<ToneTrial[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [limitation, setLimitation] = useState('');
  const [promptStatus, setPromptStatus] = useState<
    'idle' | 'saved' | 'missing-interpretation' | 'missing-limitation'
  >('idle');
  const [pulseSummary, setPulseSummary] = useState<string | null>(null);

  const { announce } = useAnnouncer();
  const audio = useToneAudio();
  const {
    setFrequency: setAudioFrequency,
    setLevel: setAudioLevel,
    setWaveform: setAudioWaveform,
  } = audio;
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const pulseTimer = useRef<number | null>(null);

  const tone: ToneState = { frequencyHz: frequency, amplitude: levelPct / 100, waveform };

  // Reflect control changes into the (optional) audio graph.
  useEffect(() => {
    setAudioFrequency(frequency);
  }, [frequency, setAudioFrequency]);
  useEffect(() => {
    setAudioLevel(levelPct / 100);
  }, [levelPct, setAudioLevel]);
  useEffect(() => {
    setAudioWaveform(waveform);
  }, [waveform, setAudioWaveform]);
  useEffect(() => {
    return () => {
      if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
    };
  }, []);

  const parseDuration = useCallback((raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '' || !/^\d*\.?\d+$/.test(trimmed)) {
      setDurationError('Enter a duration in seconds.');
      return null;
    }
    let value = Number(trimmed);
    if (!Number.isFinite(value) || value <= 0) {
      setDurationError('Enter a duration in seconds.');
      return null;
    }
    if (value > DURATION_CEILING_S) {
      value = DURATION_CEILING_S;
      setDurationError(`Capped at the ${DURATION_CEILING_S} s ceiling.`);
    } else {
      setDurationError(null);
    }
    return value;
  }, []);

  const playPulse = () => {
    const duration = parseDuration(durationRaw);
    if (duration === null) return;
    const cycles = frequency * duration;
    setPulseSummary(
      `${formatValue(duration)} s pulse at ${formatSigFigs(frequency)} Hz = ${formatSigFigs(cycles)} cycles.`,
    );
    if (audio.phase === 'enabled' && !visualOnly) audio.setMuted(false);
    if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => {
      audio.setMuted(true);
    }, duration * 1000);
    announce(
      audio.phase === 'enabled' && !visualOnly
        ? `Playing a ${formatValue(duration)} second tone.`
        : `Showing a ${formatValue(duration)} second visual pulse.`,
    );
  };

  const setEmission = (next: 'pulse' | 'continuous') => {
    setEmissionMode(next);
    if (audio.phase !== 'enabled' || visualOnly) return;
    audio.setMuted(next !== 'continuous');
    announce(
      next === 'continuous'
        ? 'Continuous tone started. Use Mute sound to stop it.'
        : 'Pulse mode selected. Continuous tone stopped.',
    );
  };

  // Keep enough samples per cycle that high tones do not alias into a false
  // lower-frequency shape at long oscilloscope windows.
  const traceSamples = Math.min(
    6400,
    Math.max(240, Math.ceil(frequency * (timescaleMs / 1000) * 8)),
  );
  const oscTrace = oscilloscopeTrace(tone, timescaleMs / 1000, traceSamples).map((s) => ({
    at: s.at * 1000, // ms
    value: s.value,
  }));
  const bars = spectrumBars({ ...tone, amplitude: 1 }, 8); // shape independent of level

  const addTrial = () => {
    setTrials((prev) => [
      ...prev,
      { id: crypto.randomUUID(), waveform, frequencyHz: frequency, levelPct },
    ]);
    announce(
      `Trial added: ${WAVEFORM_LABELS[waveform]} at ${formatSigFigs(frequency)} hertz, level ${levelPct} percent.`,
    );
  };

  const trialsCsv = () => {
    const rows = ['Waveform,Frequency (Hz),Output level (%),Period (ms)'];
    for (const t of trials) {
      rows.push([WAVEFORM_LABELS[t.waveform], String(t.frequencyHz), String(t.levelPct), String(1000 / t.frequencyHz)].join(','));
    }
    return rows.join('\n');
  };

  const trialsJson = () =>
    JSON.stringify(
      {
        schema: 'wavemotion.sound-investigation',
        version: 1,
        title: 'Pitch and loudness — varying frequency and amplitude independently',
        exportedAt: new Date().toISOString(),
        columns: ['Waveform', 'Frequency (Hz)', 'Output level (%)', 'Period (ms)'],
        trials: trials.map((t) => ({ ...t, periodMs: 1000 / t.frequencyHz })),
      },
      null,
      2,
    );

  const controlledEvidenceComplete = (() => {
    const frequencySweep = trials.some((a, index) =>
      trials.some(
        (b, otherIndex) =>
          otherIndex !== index &&
          a.waveform === b.waveform &&
          a.levelPct === b.levelPct &&
          a.frequencyHz !== b.frequencyHz,
      ),
    );
    const levelSweep = trials.some((a, index) =>
      trials.some(
        (b, otherIndex) =>
          otherIndex !== index &&
          a.waveform === b.waveform &&
          a.frequencyHz === b.frequencyHz &&
          a.levelPct !== b.levelPct,
      ),
    );
    return frequencySweep && levelSweep;
  })();

  const periodGraph = [...trials]
    .sort((a, b) => a.frequencyHz - b.frequencyHz)
    .map((trial) => ({ at: trial.frequencyHz, value: 1000 / trial.frequencyHz }));

  const saveInterpretation = () => {
    if (interpretation.trim().length === 0) {
      setPromptStatus('missing-interpretation');
      return;
    }
    if (limitation.trim().length === 0) {
      setPromptStatus('missing-limitation');
      return;
    }
    addEvidence({
      outcomeCode: '7.2.2',
      kind: 'investigation',
      summary: `Pitch/loudness interpretation: ${interpretation.trim()} | Limitation: ${limitation.trim()}`,
    });
    const current = outcomes['7.2.2'] ?? 'not-attempted';
    setOutcomeLevel(
      '7.2.2',
      controlledEvidenceComplete ? nextLevelAfterSuccess(current) : nextLevelAfterAttempt(current),
    );
    setPromptStatus('saved');
    announce('Saved as investigation evidence.');
  };

  const reset = () => {
    if (trials.length > 0 && !window.confirm('Clear all pitch and loudness trials and reset the lab?')) {
      return;
    }
    setFrequency(440);
    setLevelPct(20);
    setWaveform('sine');
    setDurationRaw('1.0');
    setDurationError(null);
    setEmissionMode('pulse');
    setTimescaleMs(10);
    setView('oscilloscope');
    setTrials([]);
    setInterpretation('');
    setLimitation('');
    setPromptStatus('idle');
    setPulseSummary(null);
    audio.setMuted(true);
    announce('Reset to default. Visual-only and sound settings are unchanged.');
  };

  const pitchFill = ((frequency - SAFE_TONE_MIN_HZ) / (SAFE_TONE_MAX_HZ - SAFE_TONE_MIN_HZ)) * 100;

  return (
    <Page
      title="Pitch & loudness"
      lead="Change frequency and amplitude independently, and watch — or hear — how one sets the pitch and the other sets the loudness."
    >
      <div className="wave-stage stack">
        <div className="seg-control__options">
          <button
            type="button"
            className="btn"
            onClick={reset}
            data-testid="sim-reset"
            data-control-id="global.reset-button"
          >
            <span aria-hidden="true">↺</span> Reset pitch &amp; loudness lab
          </button>
        </div>

        <section className="sound-classroom-flow" aria-labelledby="classroom-flow-title">
          <p className="live-sound__eyebrow">Primary classroom activity</p>
          <h2 id="classroom-flow-title">1. Teacher: choose and play a tone</h2>
          <p>The teacher changes frequency or output level and plays the tone through classroom speakers. Students then use the live listening view below on their own laptops.</p>
        </section>

        <AudioEnablePanel
          audio={audio}
          acknowledged={acknowledged}
          onAcknowledge={() => {
            rememberAudioSafetyAcknowledgement();
            setAcknowledged(true);
          }}
          visualOnly={visualOnly}
          onVisualOnly={setVisualOnly}
          level={levelPct / 100}
        />

        <div className="wave-controls">
          <SimControl
            id="sound-lab.frequency-slider"
            label="Tone frequency"
            min={SAFE_TONE_MIN_HZ}
            max={SAFE_TONE_MAX_HZ}
            step={1}
            value={frequency}
            onChange={(v) => setFrequency(clampToneFrequency(v))}
            format={(v) => `Frequency: ${formatSigFigs(v)} Hz`}
            hint="Frequency sets the pitch. Kept inside a safe audible range."
            testId="frequency-slider"
          />
          <SimControl
            id="sound-lab.amplitude-output-slider"
            label="Output level"
            min={0}
            max={100}
            step={1}
            value={levelPct}
            onChange={setLevelPct}
            format={(v) => `Level: ${Math.round(v)}%`}
            hint="Amplitude sets the loudness — never the pitch. Hard-capped for safety."
            testId="amplitude-slider"
          />

          <div className="field">
            <label className="field__label" htmlFor="waveform-select">
              Waveform shape
            </label>
            <select
              id="waveform-select"
              className="field__unit"
              value={waveform}
              onChange={(e) => setWaveform(e.target.value as Waveform)}
              data-testid="waveform-select"
              data-control-id="sound-lab.waveform-preset-select"
            >
              {WAVEFORMS.map((w) => (
                <option key={w} value={w}>
                  {WAVEFORM_LABELS[w]}
                </option>
              ))}
            </select>
            <p className="seg-control__note">Timbre extension — changes the harmonics, not the pitch.</p>
          </div>

          <div className="field" data-control-id="sound-lab.duration-input">
            <label className="field__label" htmlFor="duration-input">
              Tone duration (pulse mode)
            </label>
            <div className="field__row">
              <input
                id="duration-input"
                className="field__input"
                inputMode="decimal"
                value={durationRaw}
                onChange={(e) => {
                  setDurationRaw(e.target.value);
                  parseDuration(e.target.value);
                }}
                data-testid="duration-input"
              />
              <span>s</span>
            </div>
            {durationError ? (
              <p className="field__error" role="status" data-testid="duration-error">
                {durationError}
              </p>
            ) : null}
          </div>

          <fieldset className="seg-control" data-control-id="sound-lab.pulse-continuous-toggle">
            <legend className="seg-control__legend">Emission mode</legend>
            <div className="seg-control__options" role="radiogroup" aria-label="Emission mode">
              {(
                [
                  ['pulse', 'Pulse'],
                  ['continuous', 'Continuous'],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="seg-control__option">
                  <input
                    type="radio"
                    name="emission-mode"
                    checked={emissionMode === value}
                    onChange={() => setEmission(value)}
                    data-testid={`emission-${value}`}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <SimControl
            id="sound-lab.oscilloscope-timescale-slider"
            label="Oscilloscope time scale"
            min={1}
            max={100}
            step={1}
            value={timescaleMs}
            onChange={setTimescaleMs}
            format={(v) => `Window: ${formatSigFigs(v)} ms`}
            hint="How much time the oscilloscope shows at once."
            testId="timescale-slider"
          />
        </div>

        {emissionMode === 'pulse' ? (
          <div className="seg-control__options" data-control-id="sound-lab.pulse-timing-button">
            <button type="button" className="btn" onClick={playPulse} data-testid="play-pulse">
              <span aria-hidden="true">▶</span>{' '}
              {audio.phase === 'enabled' && !visualOnly ? 'Play a pulse' : 'Show pulse timing'}
            </button>
          </div>
        ) : null}
        {pulseSummary ? (
          <p className="seg-control__note" role="status" data-testid="pulse-summary">
            {pulseSummary} The oscilloscope is the equivalent visual representation.
          </p>
        ) : null}
        {emissionMode === 'continuous' ? (
          <p className="seg-control__note" role="status" data-testid="continuous-status">
            {audio.phase === 'enabled' && !visualOnly
              ? audio.muted
                ? 'Continuous mode ready — use Unmute sound to hear it.'
                : 'Continuous tone is playing until you mute it or choose Pulse.'
              : 'Continuous mode selected. The visual trace remains complete with sound off.'}
          </p>
        ) : null}

        <LiveSoundVisualiser demoFrequencyHz={frequency} demoAmplitude={levelPct / 100} />

        {/* Pitch and loudness meters — never colour-only; always paired with a number. */}
        <div className="wave-controls">
          <div className="meter" data-testid="pitch-meter">
            <span className="rep-panel__label">Pitch (from frequency)</span>
            <div className="meter__track">
              <div className="meter__fill" style={{ width: `${Math.max(0, Math.min(100, pitchFill))}%` }} />
            </div>
            <span className="seg-control__note">
              {formatSigFigs(frequency)} Hz — {frequency < 250 ? 'low' : frequency > 2000 ? 'high' : 'mid'} pitch
            </span>
          </div>
          <div className="meter" data-testid="loudness-meter">
            <span className="rep-panel__label">Output level (sets loudness)</span>
            <div className="meter__track">
              <div className="meter__fill meter__fill--violet" style={{ width: `${levelPct}%` }} />
            </div>
            <span className="seg-control__note">{levelPct}% — a relative level, not calibrated decibels.</span>
          </div>
        </div>

        <fieldset className="seg-control" data-control-id="sound-lab.spectrum-view-toggle">
          <legend className="seg-control__legend">Visualisation view</legend>
          <div className="seg-control__options" role="radiogroup" aria-label="Visualisation view">
            {(
              [
                ['oscilloscope', 'Oscilloscope (time)'],
                ['spectrum', 'Spectrum (frequency)'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="seg-control__option">
                <input
                  type="radio"
                  name="viz-view"
                  checked={view === value}
                  onChange={() => setView(value)}
                  data-testid={`view-${value}`}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {view === 'oscilloscope' ? (
          <LineGraph
            title={`Oscilloscope — pressure vs time (${WAVEFORM_LABELS[waveform]}, ${formatSigFigs(frequency)} Hz)`}
            xLabel="time (ms)"
            yLabel="pressure (relative)"
            series={[{ label: 'Waveform', points: oscTrace }]}
            yDomain={[-1.05, 1.05]}
            height={240}
            testId="oscilloscope"
          />
        ) : (
          <SpectrumView bars={bars} testId="spectrum" />
        )}

        <div className="card stack">
          <h2>Investigation: change one thing at a time</h2>
          <dl className="investigation-plan">
            <div>
              <dt>Aim</dt>
              <dd>Distinguish the effects of frequency and amplitude/output level.</dd>
            </div>
            <div>
              <dt>Independent variable</dt>
              <dd>Part A: frequency. Part B: output level.</dd>
            </div>
            <div>
              <dt>Dependent evidence</dt>
              <dd>Pitch/period in Part A; relative visual amplitude/loudness in Part B.</dd>
            </div>
            <div>
              <dt>Controlled variables</dt>
              <dd>Keep waveform and the other slider fixed while changing one variable.</dd>
            </div>
          </dl>
          <p>
            Run a fair test. <strong>Part A:</strong> keep the level fixed and change only the
            frequency — record how the oscilloscope trace and pitch change.{' '}
            <strong>Part B:</strong> keep the frequency fixed and change only the level — record
            what changes and what stays the same. Add each setting as a trial.
          </p>
          <div className="seg-control__options">
            <button
              type="button"
              className="btn btn--primary"
              onClick={addTrial}
              data-testid="add-trial"
              data-control-id="sound-lab.add-trial-button"
            >
              Add this setting to the trial table
            </button>
          </div>

          {trials.length >= 2 ? (
            <LineGraph
              title="Recorded period vs frequency"
              xLabel="frequency (Hz)"
              yLabel="period (ms)"
              series={[{ label: 'Recorded trials', points: periodGraph, mode: 'scatter' }]}
              height={240}
              testId="trial-graph"
            />
          ) : (
            <p className="seg-control__note" data-testid="trial-graph-empty">
              Add at least two trials to graph period against frequency.
            </p>
          )}

          <div className="data-table-wrap">
            <table className="data-table" data-control-id="sound-lab.trial-table">
              <caption>Pitch and loudness trials</caption>
              <thead>
                <tr>
                  <th scope="col">Trial</th>
                  <th scope="col">Waveform</th>
                  <th scope="col">Frequency (Hz)</th>
                  <th scope="col">Output level (%)</th>
                  <th scope="col">Period (ms)</th>
                  <th scope="col">Remove</th>
                </tr>
              </thead>
              <tbody data-testid="sound-trial-body">
                {trials.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No trials yet — set the controls and add one.</td>
                  </tr>
                ) : (
                  trials.map((t, i) => (
                    <tr key={t.id}>
                      <th scope="row">{i + 1}</th>
                      <td>{WAVEFORM_LABELS[t.waveform]}</td>
                      <td>{formatSigFigs(t.frequencyHz)}</td>
                      <td>{t.levelPct}</td>
                      <td>{formatSigFigs(1000 / t.frequencyHz)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => setTrials((prev) => prev.filter((x) => x.id !== t.id))}
                          aria-label={`Delete trial ${i + 1}`}
                        >
                          <span aria-hidden="true">🗑</span> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="seg-control__options">
            <button
              type="button"
              className="btn"
              onClick={() => downloadText('wavemotion-pitch-loudness-trials.csv', trialsCsv(), 'text/csv')}
              disabled={trials.length === 0}
              data-testid="export-csv"
              data-control-id="sound-lab.export-csv-button"
            >
              Export trials (CSV)
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => downloadText('wavemotion-pitch-loudness-trials.json', trialsJson(), 'application/json')}
              disabled={trials.length === 0}
              data-testid="export-json"
              data-control-id="sound-lab.export-json-button"
            >
              Export trials (JSON)
            </button>
          </div>

          <label className="notice-capture__label" data-control-id="sound-lab.interpretation-input">
            What did your trials show about how frequency and amplitude affect pitch and loudness?
            <textarea
              className="notice-capture__input"
              rows={3}
              value={interpretation}
              onChange={(e) => {
                setInterpretation(e.target.value);
                if (promptStatus !== 'idle') setPromptStatus('idle');
              }}
              data-testid="interpretation-input"
            />
          </label>
          <label className="notice-capture__label" data-control-id="sound-lab.limitation-input">
            Limitation and improvement
            <span className="seg-control__note">
              Name one limitation of this relative model and how a real investigation could improve the evidence.
            </span>
            <textarea
              className="notice-capture__input"
              rows={3}
              value={limitation}
              onChange={(e) => {
                setLimitation(e.target.value);
                if (promptStatus !== 'idle') setPromptStatus('idle');
              }}
              data-testid="limitation-input"
            />
          </label>
          <div className="seg-control__options" data-control-id="sound-lab.interpretation-save-button">
            <button type="button" className="btn" onClick={saveInterpretation} data-testid="interpretation-save">
              Save interpretation as evidence
            </button>
            {promptStatus === 'saved' ? (
              <p className="notice-capture__status" role="status">
                <span aria-hidden="true">✓</span> Saved (outcome 7.2.2).
              </p>
            ) : null}
            {promptStatus === 'missing-interpretation' ? (
              <p className="notice-capture__status notice-capture__status--warn" role="status">
                Write your interpretation before saving.
              </p>
            ) : null}
            {promptStatus === 'missing-limitation' ? (
              <p className="notice-capture__status notice-capture__status--warn" role="status">
                Add a limitation and improvement before saving.
              </p>
            ) : null}
          </div>
          <p className="seg-control__note" data-testid="fair-test-status">
            {controlledEvidenceComplete
              ? 'Fair-test evidence complete: one frequency sweep and one output-level sweep recorded.'
              : 'To complete the fair test, record both a frequency sweep at fixed level and an output-level sweep at fixed frequency.'}
          </p>
        </div>

        <p className="notice">
          <span>
            <strong>Volume</strong> is the control setting; <strong>loudness</strong> is what a
            listener perceives. Because the ear is not equally sensitive at every frequency,
            two tones at the same level can sound differently loud. Changing the level never
            changes the pitch, and changing the frequency never changes the level — the two
            controls are independent.
          </span>
        </p>

        <GuitarStringConnection />
      </div>
    </Page>
  );
}
