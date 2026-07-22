import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { SimControl } from '../../components/sim/SimControl';
import { SimToolbar } from '../../components/sim/SimToolbar';
import { useSimClock } from '../../components/sim/useSimClock';
import { outcomeMap } from '../../content/outcomes';
import {
  EM_DISPLAY_SPEED,
  SOURCE_FREQUENCY_HZ,
  TRANSMISSION_BAYS,
  TRANSMISSION_CHAMBER_LENGTH,
  bayRuntimeState,
  hasDetectorEvidence,
  mechanicalDisplaySpeed,
  scoreTransmissionChallenge,
  type ChallengePredictions,
  type ChallengeResult,
  type DetectorState,
  type TransmissionBayId,
} from '../../science/mediumVacuum';
import { pulseDisplacement } from '../../science/pulse';
import { formatSigFigs } from '../../science/units';
import { useSettingsStore } from '../../store/settingsStore';
import './Outcome711Page.css';

const DEFAULTS = {
  amplitude: 40,
  coupling: 50,
  density: 1,
};

const TOUR_STEPS = [
  {
    title: 'One launch, three tests',
    body: 'Launch the same moment in all three bays so the only meaningful differences are the wave family and whether matter is present.',
  },
  {
    title: 'Watch the detector',
    body: 'A travelling pulse is not enough: compare whether energy reaches the detector at the far end of each chamber.',
  },
  {
    title: 'Tune the material',
    body: 'Coupling and density change the mechanical model speed. They cannot make a mechanical wave cross a vacuum.',
  },
] as const;

const detectorText: Record<DetectorState, string> = {
  ready: 'Ready',
  travelling: 'Pulse travelling',
  blocked: 'Blocked — no medium',
  received: 'Signal received',
};

function environmentText(id: TransmissionBayId): string {
  return id === 'mechanical-medium' ? 'Linked material particles' : 'Vacuum';
}

function sourceText(id: TransmissionBayId): string {
  return id === 'em-vacuum' ? 'Electromagnetic pulse' : 'Mechanical pulse';
}

export default function Outcome711Page() {
  const [amplitude, setAmplitude] = useState(DEFAULTS.amplitude);
  const [coupling, setCoupling] = useState(DEFAULTS.coupling);
  const [density, setDensity] = useState(DEFAULTS.density);
  const [running, setRunning] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [launchStartTime, setLaunchStartTime] = useState<number | null>(null);
  const [launchCount, setLaunchCount] = useState(0);
  const [pulseFinished, setPulseFinished] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [predictions, setPredictions] = useState<ChallengePredictions>({});
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  const [challengeAttempted, setChallengeAttempted] = useState(false);

  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const lowGraphics = useSettingsStore((state) => state.lowGraphics);
  const { announce } = useAnnouncer();
  const mechanicalSpeed = mechanicalDisplaySpeed(coupling, density);

  const clock = useSimClock({
    running,
    speed: playbackSpeed,
    reducedMotion,
    active: launchStartTime !== null && !pulseFinished,
  });
  const elapsed = launchStartTime === null ? null : Math.max(0, clock.t - launchStartTime);
  const runtimeStates = useMemo(
    () =>
      TRANSMISSION_BAYS.map((bay) =>
        bayRuntimeState(
          bay,
          { amplitude: amplitude / 100, coupling, density },
          elapsed,
        ),
      ),
    [amplitude, coupling, density, elapsed],
  );

  useEffect(() => {
    if (elapsed === null || pulseFinished) return;
    const slowestExit = (TRANSMISSION_CHAMBER_LENGTH + 1.8) / mechanicalSpeed;
    if (elapsed > slowestExit) setPulseFinished(true);
  }, [elapsed, mechanicalSpeed, pulseFinished]);

  const reset = () => {
    setAmplitude(DEFAULTS.amplitude);
    setCoupling(DEFAULTS.coupling);
    setDensity(DEFAULTS.density);
    setRunning(true);
    setPlaybackSpeed(1);
    setLaunchStartTime(null);
    setLaunchCount(0);
    setPulseFinished(false);
    setPredictions({});
    setChallengeResult(null);
    setChallengeAttempted(false);
    clock.reset();
    announce('Transmission lab reset.');
  };

  const launch = () => {
    setLaunchStartTime(clock.t);
    setLaunchCount((count) => count + 1);
    setPulseFinished(false);
    setRunning(true);
    setChallengeAttempted(false);
    announce('All three pulses launched. Compare the detector states.');
  };

  const drawScene = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const elapsedNow = elapsed ?? -1;
      const bayHeight = Math.min(116, (height - 42) / 3);
      const startX = 76;
      const detectorX = width - 58;
      const chamberWidth = Math.max(120, detectorX - startX);
      const xFor = (modelX: number) =>
        startX + (Math.min(TRANSMISSION_CHAMBER_LENGTH, Math.max(0, modelX)) / TRANSMISSION_CHAMBER_LENGTH) * chamberWidth;

      const background = ctx.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, 'rgba(7, 18, 38, 0.92)');
      background.addColorStop(1, 'rgba(13, 36, 58, 0.88)');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      runtimeStates.forEach((state, index) => {
        const top = 14 + index * (bayHeight + 8);
        const centreY = top + bayHeight / 2 + 9;
        const activeColour = state.detectorState === 'received' ? '#6de5b5' : '#42d7eb';

        ctx.fillStyle = 'rgba(9, 22, 43, 0.76)';
        ctx.strokeStyle = state.detectorState === 'received' ? 'rgba(109, 229, 181, 0.8)' : 'rgba(148, 180, 205, 0.32)';
        ctx.lineWidth = state.detectorState === 'received' ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(8, top, width - 16, bayHeight, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#d8e8f5';
        ctx.font = '600 12px system-ui, sans-serif';
        ctx.fillText(`${index + 1} · ${state.bay.shortLabel}`, 20, top + 22);

        // Source emitter. It still moves in the mechanical-vacuum bay even
        // though no disturbance can leave it.
        const sourcePulse = elapsedNow >= 0
          ? (amplitude / 100) * Math.exp(-Math.pow((elapsedNow - 0.24) / 0.14, 2))
          : 0;
        ctx.fillStyle = '#9eacc0';
        ctx.fillRect(startX - 15, centreY - 25 - sourcePulse * 10, 8, 50);
        ctx.fillStyle = '#42d7eb';
        ctx.beginPath();
        ctx.arc(startX - 24, centreY, 5 + sourcePulse * 3, 0, Math.PI * 2);
        ctx.fill();

        if (state.bay.id === 'mechanical-medium') {
          const particleCount = lowGraphics ? 18 : 34;
          const points: Array<{ x: number; y: number }> = [];
          for (let particle = 0; particle < particleCount; particle += 1) {
            const modelX = (TRANSMISSION_CHAMBER_LENGTH * particle) / (particleCount - 1);
            const displacement = elapsedNow < 0
              ? 0
              : pulseDisplacement(
                  {
                    amplitude: amplitude / 100,
                    speed: mechanicalSpeed,
                    width: 0.6,
                    startTime: 0,
                  },
                  modelX,
                  elapsedNow,
                );
            points.push({ x: xFor(modelX), y: centreY - displacement * 30 });
          }
          ctx.strokeStyle = 'rgba(103, 210, 225, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          points.forEach((point, pointIndex) =>
            pointIndex === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y),
          );
          ctx.stroke();
          ctx.fillStyle = '#69d3e3';
          for (const point of points) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, lowGraphics ? 3 : 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (state.bay.id === 'mechanical-vacuum') {
          ctx.strokeStyle = 'rgba(158, 172, 192, 0.38)';
          ctx.setLineDash([4, 7]);
          ctx.beginPath();
          ctx.moveTo(startX, centreY);
          ctx.lineTo(detectorX, centreY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#9eacc0';
          ctx.font = '12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('no particles to pass the disturbance on', (startX + detectorX) / 2, centreY - 10);
          ctx.textAlign = 'left';
        } else {
          ctx.strokeStyle = 'rgba(154, 129, 255, 0.55)';
          ctx.beginPath();
          ctx.moveTo(startX, centreY);
          ctx.lineTo(detectorX, centreY);
          ctx.stroke();
          const vectors = lowGraphics ? 16 : 28;
          for (let vector = 0; vector < vectors; vector += 1) {
            const modelX = (TRANSMISSION_CHAMBER_LENGTH * vector) / (vectors - 1);
            const displacement = elapsedNow < 0
              ? 0
              : pulseDisplacement(
                  {
                    amplitude: amplitude / 100,
                    speed: EM_DISPLAY_SPEED,
                    width: 0.6,
                    startTime: 0,
                  },
                  modelX,
                  elapsedNow,
                );
            const x = xFor(modelX);
            const tipY = centreY - displacement * 30;
            ctx.strokeStyle = '#9a81ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, centreY);
            ctx.lineTo(x, tipY);
            ctx.stroke();
          }
        }

        if (state.frontPosition !== null && state.detectorState !== 'received') {
          const frontX = xFor(state.frontPosition);
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.moveTo(frontX, centreY - 25);
          ctx.lineTo(frontX + 6, centreY - 18);
          ctx.lineTo(frontX, centreY - 11);
          ctx.lineTo(frontX - 6, centreY - 18);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = state.detectorState === 'received' ? activeColour : '#293c55';
        ctx.strokeStyle = state.detectorState === 'received' ? '#d9ffef' : '#9eacc0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(detectorX + 12, centreY - 24, 26, 48, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = state.detectorState === 'received' ? '#d9ffef' : '#9eacc0';
        ctx.beginPath();
        ctx.arc(detectorX + 25, centreY, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    [amplitude, elapsed, lowGraphics, mechanicalSpeed, runtimeStates],
  );

  const updatePrediction = (bayId: TransmissionBayId, prediction: boolean) => {
    setPredictions((current) => ({ ...current, [bayId]: prediction }));
    setChallengeResult(null);
    setChallengeAttempted(false);
  };

  const checkChallenge = () => {
    if (!hasDetectorEvidence(launchCount)) {
      setChallengeAttempted(true);
      setChallengeResult(null);
      announce('Launch the pulses to collect detector evidence first.');
      return;
    }
    const result = scoreTransmissionChallenge(predictions);
    setChallengeAttempted(true);
    setChallengeResult(result);
    if (!result) {
      announce('Make a prediction for all three bays.');
      return;
    }
    announce(
      result.correctCount === 3
        ? 'Mission complete. Three out of three predictions correct.'
        : `${result.correctCount} out of three predictions correct. Review the detector evidence and try again.`,
    );
  };

  const replayChallenge = () => {
    setPredictions({});
    setChallengeResult(null);
    setChallengeAttempted(false);
    announce('Challenge ready to replay.');
  };

  const frameKey = `${clock.t}|${amplitude}|${coupling}|${density}|${launchCount}|${lowGraphics}`;
  const outcome = outcomeMap['7.1.1'];

  return (
    <Page
      title="7.1.1 Transmission Lab"
      heading={<><span className="outcome-711__code">7.1.1</span> Medium or vacuum?</>}
      lead={<span className="outcome-711__wording">{outcome.text}</span>}
    >
      <div className="outcome-711">
        <div className="outcome-711__command-row">
          <p className="outcome-711__eyebrow">Transmission Lab · live model</p>
          {tourOpen ? null : (
            <button
              type="button"
              className="outcome-711__text-button"
              data-control-id="outcome-7-1-1.tour-open"
              onClick={() => {
                setTourStep(0);
                setTourOpen(true);
              }}
            >
              Show quick tour
            </button>
          )}
        </div>

        {tourOpen ? (
          <aside className="outcome-711__tour" aria-label="Three-step simulator tour">
            <div className="outcome-711__tour-index" aria-hidden="true">
              {TOUR_STEPS.map((_, index) => (
                <span key={index} data-active={index === tourStep} />
              ))}
            </div>
            <div>
              <p className="outcome-711__tour-kicker">Quick tour · {tourStep + 1} of 3</p>
              <h2>{TOUR_STEPS[tourStep].title}</h2>
              <p>{TOUR_STEPS[tourStep].body}</p>
            </div>
            <div className="outcome-711__tour-actions">
              <button
                type="button"
                className="outcome-711__text-button"
                data-control-id="outcome-7-1-1.tour-dismiss"
                onClick={() => setTourOpen(false)}
              >
                Skip tour
              </button>
              <button
                type="button"
                className="btn"
                data-control-id="outcome-7-1-1.tour-next"
                onClick={() => {
                  if (tourStep === TOUR_STEPS.length - 1) setTourOpen(false);
                  else setTourStep((step) => step + 1);
                }}
              >
                {tourStep === TOUR_STEPS.length - 1 ? 'Start experimenting' : 'Next'}
              </button>
            </div>
          </aside>
        ) : null}

        <section className="outcome-711__deck" aria-labelledby="outcome-711-deck-title">
          <div className="outcome-711__deck-heading">
            <div>
              <p className="outcome-711__eyebrow">Experiment deck</p>
              <h2 id="outcome-711-deck-title">Will the signal reach the detector?</h2>
            </div>
            <button
              type="button"
              className="outcome-711__launch"
              data-control-id="outcome-7-1-1.launch-all"
              data-testid="outcome-711-launch"
              onClick={launch}
            >
              <span aria-hidden="true">▶</span>
              Launch all pulses
            </button>
          </div>

          <div className="outcome-711__viewport">
            <CanvasScene
              label="Three transmission bays comparing a mechanical pulse in material, a mechanical source in vacuum, and an electromagnetic pulse in vacuum"
              height={402}
              frameKey={frameKey}
              draw={drawScene}
              testId="outcome-711-canvas"
              alternative={
                <div className="outcome-711__table-wrap">
                  <table className="outcome-711__status-table">
                    <caption>Live detector status for all three transmission bays</caption>
                    <thead>
                      <tr>
                        <th scope="col">Bay</th>
                        <th scope="col">Source</th>
                        <th scope="col">Environment</th>
                        <th scope="col">Detector</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runtimeStates.map((state) => (
                        <tr key={state.bay.id}>
                          <th scope="row">{state.bay.shortLabel}</th>
                          <td>{sourceText(state.bay.id)}</td>
                          <td>{environmentText(state.bay.id)}</td>
                          <td
                            data-state={state.detectorState}
                            data-testid={`outcome-711-detector-${state.bay.id}`}
                          >
                            {detectorText[state.detectorState]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            />
          </div>

          <div className="outcome-711__instrument-bar" aria-label="Live model readouts">
            <p><span>Elapsed</span><strong>{formatSigFigs(elapsed ?? 0)} s</strong></p>
            <p><span>Mechanical model speed</span><strong>{formatSigFigs(mechanicalSpeed)} m/s</strong></p>
            <p><span>EM display speed</span><strong>{EM_DISPLAY_SPEED} model m/s</strong></p>
            <p><span>Source frequency</span><strong>{SOURCE_FREQUENCY_HZ} Hz · fixed</strong></p>
          </div>

          <SimToolbar
            running={running}
            onToggleRun={() => setRunning((value) => !value)}
            onStep={clock.step}
            speed={playbackSpeed}
            onSpeed={setPlaybackSpeed}
            onReset={reset}
            resetLabel="transmission lab"
          />

          <div className="outcome-711__controls">
            <SimControl
              id="outcome-7-1-1.amplitude"
              label="Pulse amplitude"
              min={10}
              max={100}
              step={5}
              value={amplitude}
              onChange={setAmplitude}
              format={(value) => `${Math.round(value)}%`}
              hint="Changes pulse size only — not speed or frequency."
              testId="outcome-711-amplitude"
            />
            <SimControl
              id="outcome-7-1-1.coupling"
              label="Material coupling"
              min={0}
              max={100}
              step={5}
              value={coupling}
              onChange={setCoupling}
              format={(value) => `${Math.round(value)}% linked`}
              hint="Stronger links pass the mechanical disturbance faster."
              testId="outcome-711-coupling"
            />
            <SimControl
              id="outcome-7-1-1.density"
              label="Model particle density"
              min={0.5}
              max={3}
              step={0.1}
              value={density}
              onChange={setDensity}
              format={(value) => `${value.toFixed(1)}×`}
              hint="In this teaching model, more inertia slows the mechanical pulse."
              testId="outcome-711-density"
            />
          </div>

          <p className="outcome-711__honesty">
            <strong>Model honesty:</strong> display speeds are illustrative and not to scale.
            The EM arrows represent a changing field; they are not particles travelling through space.
          </p>
        </section>

        <section className="outcome-711__challenge" aria-labelledby="outcome-711-challenge-title">
          <div className="outcome-711__challenge-copy">
            <p className="outcome-711__eyebrow">Detector prediction challenge</p>
            <h2 id="outcome-711-challenge-title">Call all three outcomes before launch</h2>
            <p>Objective: predict which detectors receive energy. Score 100 points per correct bay.</p>
          </div>

          <div className="outcome-711__predictions">
            {TRANSMISSION_BAYS.map((bay) => (
              <fieldset
                key={bay.id}
                className="outcome-711__prediction"
                data-control-id={`outcome-7-1-1.prediction-${bay.id}`}
              >
                <legend>{bay.shortLabel}</legend>
                <label>
                  <input
                    type="radio"
                    name={`prediction-${bay.id}`}
                    checked={predictions[bay.id] === true}
                    onChange={() => updatePrediction(bay.id, true)}
                  />
                  Receives
                </label>
                <label>
                  <input
                    type="radio"
                    name={`prediction-${bay.id}`}
                    checked={predictions[bay.id] === false}
                    onChange={() => updatePrediction(bay.id, false)}
                  />
                  Blocked
                </label>
                {challengeResult ? (
                  <p className={challengeResult.results[bay.id] ? 'is-correct' : 'is-incorrect'}>
                    <span aria-hidden="true">{challengeResult.results[bay.id] ? '✓' : '×'}</span>{' '}
                    {challengeResult.results[bay.id] ? 'Prediction confirmed' : 'Compare the detector evidence'}
                  </p>
                ) : null}
              </fieldset>
            ))}
          </div>

          <div className="outcome-711__challenge-actions">
            <button
              type="button"
              className="btn btn--primary"
              data-control-id="outcome-7-1-1.challenge-check"
              data-testid="outcome-711-challenge-check"
              onClick={checkChallenge}
            >
              Check predictions
            </button>
            <button
              type="button"
              className="btn"
              data-control-id="outcome-7-1-1.challenge-replay"
              data-testid="outcome-711-challenge-replay"
              onClick={replayChallenge}
            >
              Replay challenge
            </button>
            {challengeAttempted && !challengeResult ? (
              <p className="outcome-711__challenge-status is-incomplete" role="status">
                {hasDetectorEvidence(launchCount)
                  ? 'Make a prediction for all three bays.'
                  : 'Launch the pulses to collect detector evidence first.'}
              </p>
            ) : null}
          </div>

          {challengeResult ? (
            <div
              className={`outcome-711__reward ${challengeResult.correctCount === 3 ? 'is-complete' : ''}`}
              role="status"
              aria-live="polite"
            >
              <div className="outcome-711__score-ring" aria-hidden="true">
                {challengeResult.score}
              </div>
              <div>
                <p className="outcome-711__reward-title">
                  {challengeResult.correctCount === 3 ? 'Transmission expert unlocked' : 'Evidence collected'}
                </p>
                <p>
                  {challengeResult.score}/{challengeResult.maxScore} points · Mastery: {challengeResult.mastery.replace('-', ' ')}.
                  {challengeResult.correctCount === 3
                    ? ' You used the medium requirement to predict every detector.'
                    : ' Launch again, compare all three detectors, then replay.'}
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </Page>
  );
}
