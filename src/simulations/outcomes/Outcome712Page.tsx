import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { SimControl } from '../../components/sim/SimControl';
import { SimToolbar } from '../../components/sim/SimToolbar';
import { WaveRunnerBrief, type WaveRunnerStep } from '../../components/sim/WaveRunnerBrief';
import { useSimClock } from '../../components/sim/useSimClock';
import { outcomeMap } from '../../content/outcomes';
import {
  ENERGY_RELAY_CHAMBER_LENGTH,
  ENERGY_RELAY_PARTICLES,
  ENERGY_RELAY_PROPAGATION_SPEED,
  captureEnergyRelayParticle,
  createEnergyRelayRun,
  energyRelayScenarioForReplay,
  energyRelayStateAt,
  scoreEnergyRelayChallenge,
  type EnergyRelayCapture,
  type EnergyRelayChallengeResult,
  type EnergyRelayParticleId,
  type EnergyRelayRun,
} from '../../science/energyTransfer';
import { formatSigFigs } from '../../science/units';
import { useSettingsStore } from '../../store/settingsStore';
import './Outcome712Page.css';
import './OutcomeGamePolish.css';

const TOUR_STEPS = [
  {
    title: 'Give one particle a passport',
    body: 'Choose B, D, F or H. Its dashed home marker stays fixed while the pulse lifts the particle locally.',
  },
  {
    title: 'Catch two scientific moments',
    body: 'Slow or pause the model. Capture your particle near its peak, then capture it back home after the pulse passes.',
  },
  {
    title: 'Follow what crosses the chamber',
    body: 'The gold marker represents transferred energy. The receiver can light up even though every material particle finishes at home.',
  },
] as const;

const receiverText = {
  ready: 'Ready',
  waiting: 'Waiting for energy',
  received: 'Energy received',
} as const;

function displacementText(value: number): string {
  const clamped = Math.abs(value) < 0.0005 ? 0 : value;
  return `${clamped >= 0 ? '+' : '−'}${formatSigFigs(Math.abs(clamped))} m`;
}

export default function Outcome712Page() {
  const firstScenario = energyRelayScenarioForReplay(0);
  const [amplitude, setAmplitude] = useState(firstScenario.amplitude);
  const [pulseWidth, setPulseWidth] = useState(firstScenario.pulseWidth);
  const [targetParticleId, setTargetParticleId] = useState<EnergyRelayParticleId>(firstScenario.targetParticleId);
  const [replayIndex, setReplayIndex] = useState(0);
  const [run, setRun] = useState<EnergyRelayRun | null>(null);
  const [peakCapture, setPeakCapture] = useState<EnergyRelayCapture | undefined>();
  const [returnCapture, setReturnCapture] = useState<EnergyRelayCapture | undefined>();
  const [challengeResult, setChallengeResult] = useState<EnergyRelayChallengeResult | null>(null);
  const [challengeMessage, setChallengeMessage] = useState('Launch a pulse, then capture the assigned particle at its peak and back at home.');
  const [running, setRunning] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.25);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [announcedCompletion, setAnnouncedCompletion] = useState<string | null>(null);

  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const lowGraphics = useSettingsStore((state) => state.lowGraphics);
  const { announce } = useAnnouncer();
  const clock = useSimClock({
    running,
    speed: playbackSpeed,
    reducedMotion,
    active: run !== null,
  });

  const previewRun = useMemo(
    () => createEnergyRelayRun({
      replayIndex,
      launchTime: 0,
      controls: { amplitude, pulseWidth },
      targetParticleId,
    }),
    [amplitude, pulseWidth, replayIndex, targetParticleId],
  );
  const relayState = useMemo(
    () => run ? energyRelayStateAt(run, clock.t) : energyRelayStateAt(previewRun, -1),
    [clock.t, previewRun, run],
  );
  const targetParticle = relayState.particles.find((particle) => particle.id === targetParticleId)!;

  useEffect(() => {
    if (!run || !relayState.eventComplete || announcedCompletion === run.runKey) return;
    setAnnouncedCompletion(run.runKey);
    setRunning(false);
    announce(`Energy reached the receiver. Particle ${targetParticleId} and every material particle finished at home.`);
  }, [announce, announcedCompletion, relayState.eventComplete, run, targetParticleId]);

  const clearEvidence = useCallback(() => {
    setPeakCapture(undefined);
    setReturnCapture(undefined);
    setChallengeResult(null);
    setChallengeMessage('Launch a pulse, then capture the assigned particle at its peak and back at home.');
  }, []);

  const prepareControlChange = useCallback(() => {
    setRun(null);
    clearEvidence();
    setAnnouncedCompletion(null);
    clock.reset();
    setRunning(true);
  }, [clearEvidence, clock]);

  const launch = () => {
    const nextRun = createEnergyRelayRun({
      replayIndex,
      launchTime: clock.t,
      controls: { amplitude, pulseWidth },
      targetParticleId,
    });
    setRun(nextRun);
    clearEvidence();
    setRunning(true);
    setAnnouncedCompletion(null);
    announce(`Energy pulse launched. Track particle ${targetParticleId}.`);
  };

  const reset = () => {
    const scenario = energyRelayScenarioForReplay(0);
    setReplayIndex(0);
    setAmplitude(scenario.amplitude);
    setPulseWidth(scenario.pulseWidth);
    setTargetParticleId(scenario.targetParticleId);
    setRun(null);
    clearEvidence();
    setRunning(true);
    setPlaybackSpeed(0.25);
    setAnnouncedCompletion(null);
    clock.reset();
    announce('Energy Relay reset to the first particle passport.');
  };

  const replayChallenge = () => {
    const nextIndex = replayIndex + 1;
    const scenario = energyRelayScenarioForReplay(nextIndex);
    setReplayIndex(nextIndex);
    setAmplitude(scenario.amplitude);
    setPulseWidth(scenario.pulseWidth);
    setTargetParticleId(scenario.targetParticleId);
    setRun(null);
    clearEvidence();
    setRunning(true);
    setAnnouncedCompletion(null);
    clock.reset();
    announce(`New Energy Relay passport: track particle ${scenario.targetParticleId}.`);
  };

  const capturePeak = () => {
    if (!run) {
      setChallengeMessage('Launch the pulse before capturing a particle state.');
      announce('Launch the pulse before capturing the peak.');
      return;
    }
    const capture = captureEnergyRelayParticle(relayState, targetParticleId);
    setPeakCapture(capture);
    setChallengeResult(null);
    setChallengeMessage(`Peak snapshot recorded for particle ${targetParticleId} at ${formatSigFigs(relayState.elapsed)} s.`);
    setRunning(false);
    announce(`Peak snapshot recorded. Displacement ${displacementText(capture.displacement)}.`);
  };

  const captureReturn = () => {
    if (!run) {
      setChallengeMessage('Launch the pulse before capturing a particle state.');
      announce('Launch the pulse before capturing the return home.');
      return;
    }
    const capture = captureEnergyRelayParticle(relayState, targetParticleId);
    setReturnCapture(capture);
    setChallengeResult(null);
    setChallengeMessage(`Home snapshot recorded for particle ${targetParticleId} at ${formatSigFigs(relayState.elapsed)} s.`);
    setRunning(false);
    announce(`Home snapshot recorded. Displacement ${displacementText(capture.displacement)}.`);
  };

  const checkChallenge = () => {
    if (!run) {
      setChallengeMessage('Launch the pulse to collect simulated evidence first.');
      announce('Launch the pulse to collect simulated evidence first.');
      return;
    }
    const result = scoreEnergyRelayChallenge(relayState, { peakCapture, returnCapture });
    setChallengeResult(result);
    if (!result.checks.completedSimulatedEvidence) {
      setChallengeMessage('Let the pulse finish at the receiver before checking your passport.');
      announce('The complete receiver and final particle evidence is not available yet.');
    } else if (!result.checks.peakCapturedNearMaximum) {
      setChallengeMessage('Peak snapshot missed. Replay, slow down, and capture when the particle displacement is near its maximum.');
      announce('Peak snapshot missed. Use slow motion and try again.');
    } else if (!result.checks.returnCapturedAfterPeak) {
      setChallengeMessage('Home snapshot missed. Capture after the pulse passes when displacement is below one percent of amplitude.');
      announce('Home snapshot missed. Wait until the particle returns to equilibrium.');
    } else {
      setChallengeMessage('Energy Relay complete: energy crossed the chamber while the particle returned home.');
      announce('Energy Relay complete. One hundred out of one hundred points.');
    }
  };

  const drawScene = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const left = 58;
      const right = width - 68;
      const trackWidth = Math.max(120, right - left);
      const equilibriumY = height * 0.58;
      const xFor = (position: number) => left + (position / ENERGY_RELAY_CHAMBER_LENGTH) * trackWidth;
      const yFor = (displacement: number) => equilibriumY - displacement * Math.min(105, height * 0.32);

      const background = ctx.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, '#07172a');
      background.addColorStop(0.58, '#0c2d3d');
      background.addColorStop(1, '#171e42');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      const dotCount = lowGraphics ? 18 : 44;
      for (let index = 0; index < dotCount; index += 1) {
        const x = (index * 83) % Math.max(1, width);
        const y = 20 + ((index * 47) % Math.max(1, height - 40));
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(188, 218, 230, 0.32)';
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(left, equilibriumY);
      ctx.lineTo(right, equilibriumY);
      ctx.stroke();
      ctx.setLineDash([]);

      const visualParticles = lowGraphics ? 26 : 48;
      const points: Array<{ x: number; y: number }> = [];
      for (let index = 0; index < visualParticles; index += 1) {
        const position = (ENERGY_RELAY_CHAMBER_LENGTH * index) / (visualParticles - 1);
        const displacement = run
          ? Math.max(0, run.controls.amplitude * Math.exp(-Math.pow((position - (relayState.pulseCentrePosition ?? -5)) / run.controls.pulseWidth, 2)))
          : 0;
        points.push({ x: xFor(position), y: yFor(displacement) });
      }

      ctx.strokeStyle = 'rgba(87, 209, 222, 0.72)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
      ctx.stroke();

      ctx.fillStyle = '#61d1df';
      for (const point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, lowGraphics ? 2.8 : 3.8, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const particle of relayState.particles) {
        const x = xFor(particle.equilibrium);
        const y = yFor(particle.currentDisplacement);
        ctx.strokeStyle = particle.id === targetParticleId ? '#ffe08a' : 'rgba(202, 215, 228, 0.42)';
        ctx.lineWidth = particle.id === targetParticleId ? 2.5 : 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(x, equilibriumY - 22);
        ctx.lineTo(x, equilibriumY + 22);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = particle.id === targetParticleId ? '#ffe08a' : '#d3e2ea';
        ctx.beginPath();
        ctx.arc(x, y, particle.id === targetParticleId ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f5fbff';
        ctx.font = '700 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(particle.id, x, equilibriumY + 43);
      }

      if (run && relayState.pulseCentrePosition !== null && !relayState.eventComplete) {
        const markerX = xFor(Math.min(ENERGY_RELAY_CHAMBER_LENGTH, relayState.pulseCentrePosition));
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.moveTo(markerX, 38);
        ctx.lineTo(markerX + 9, 48);
        ctx.lineTo(markerX, 58);
        ctx.lineTo(markerX - 9, 48);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff2bf';
        ctx.font = '600 12px system-ui, sans-serif';
        ctx.textAlign = markerX > width * 0.7 ? 'right' : 'left';
        ctx.fillText('energy transfer marker', markerX + (markerX > width * 0.7 ? -14 : 14), 52);
      }

      ctx.fillStyle = '#8194a8';
      ctx.fillRect(left - 32, equilibriumY - 34, 18, 68);
      ctx.fillStyle = relayState.receiver.state === 'received' ? '#44d39f' : '#283c55';
      ctx.strokeStyle = relayState.receiver.state === 'received' ? '#d9ffef' : '#9fb0c1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(right + 18, equilibriumY - 31, 32, 62, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = relayState.receiver.state === 'received' ? '#d9ffef' : '#9fb0c1';
      ctx.beginPath();
      ctx.arc(right + 34, equilibriumY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#dceaf2';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('source', left - 40, equilibriumY + 54);
      ctx.textAlign = 'right';
      ctx.fillText('receiver', right + 52, equilibriumY + 54);
    },
    [lowGraphics, relayState.eventComplete, relayState.particles, relayState.pulseCentrePosition, relayState.receiver.state, run, targetParticleId],
  );

  const changeAmplitude = (value: number) => {
    setAmplitude(value);
    prepareControlChange();
  };

  const changePulseWidth = (value: number) => {
    setPulseWidth(value);
    prepareControlChange();
  };

  const changeParticle = (value: EnergyRelayParticleId) => {
    setTargetParticleId(value);
    prepareControlChange();
  };

  const outcome = outcomeMap['7.1.2'];
  const finalOffset = targetParticle.finalNetDisplacement;
  const frameKey = `${clock.t}|${amplitude}|${pulseWidth}|${targetParticleId}|${run?.runKey ?? 'ready'}|${lowGraphics}`;
  const missionComplete = challengeResult?.score === challengeResult?.maxScore;
  const missionSteps: readonly WaveRunnerStep[] = [
    { label: 'Release pulse', state: run ? 'complete' : 'active' },
    { label: 'Capture peak', state: peakCapture ? 'complete' : run ? 'active' : 'locked' },
    { label: 'Verify return', state: missionComplete ? 'complete' : peakCapture ? 'active' : 'locked' },
  ];

  return (
    <Page
      title="7.1.2 Energy Relay"
      heading={<><span className="outcome-712__code">7.1.2</span> Energy Relay</>}
      lead={<span>{outcome.text}</span>}
    >
      <div className="outcome-712">
        <div className="outcome-712__command-row">
          <p className="outcome-712__eyebrow">Particle passport lab · live model</p>
          {tourOpen ? null : (
            <button
              type="button"
              className="outcome-712__text-button"
              data-control-id="outcome-7-1-2.tour-open"
              onClick={() => { setTourStep(0); setTourOpen(true); }}
            >
              Show quick tour
            </button>
          )}
        </div>

        <WaveRunnerBrief
          sector="Energy Relay"
          title={`Track particle ${targetParticleId} without losing the energy pulse`}
          objective="Release the pulse, capture the assigned particle near maximum displacement, then prove it returned home after energy reached the receiver."
          status={missionComplete ? 'Energy delivered; every material particle returned home.' : returnCapture ? 'Return captured. Run the evidence check.' : peakCapture ? 'Peak secured. Wait for the particle to return home.' : run ? `Track particle ${targetParticleId} as the pulse passes.` : 'The source plate is charged and ready.'}
          points={100}
          complete={missionComplete}
          theme="relay"
          steps={missionSteps}
        />

        {tourOpen ? (
          <aside className="outcome-712__tour" aria-label="Three-step simulator tour">
            <div className="outcome-712__tour-index" aria-hidden="true">
              {TOUR_STEPS.map((_, index) => <span key={index} data-active={index === tourStep} />)}
            </div>
            <div>
              <p className="outcome-712__tour-kicker">Quick tour · {tourStep + 1} of 3</p>
              <h2>{TOUR_STEPS[tourStep].title}</h2>
              <p>{TOUR_STEPS[tourStep].body}</p>
            </div>
            <div className="outcome-712__tour-actions">
              <button
                type="button"
                className="outcome-712__text-button"
                data-control-id="outcome-7-1-2.tour-dismiss"
                onClick={() => setTourOpen(false)}
              >
                Skip tour
              </button>
              <button
                type="button"
                className="btn"
                data-control-id="outcome-7-1-2.tour-next"
                onClick={() => tourStep === TOUR_STEPS.length - 1
                  ? setTourOpen(false)
                  : setTourStep((step) => step + 1)}
              >
                {tourStep === TOUR_STEPS.length - 1 ? 'Start experimenting' : 'Next'}
              </button>
            </div>
          </aside>
        ) : null}

        <section className="outcome-712__deck" aria-labelledby="outcome-712-deck-title">
          <div className="outcome-712__deck-heading">
            <div>
              <p className="outcome-712__eyebrow">Energy relay deck</p>
              <h2 id="outcome-712-deck-title">What travels to the receiver?</h2>
            </div>
            <button
              type="button"
              className="outcome-712__launch"
              data-control-id="outcome-7-1-2.launch"
              data-testid="outcome-712-launch"
              onClick={launch}
            >
              <span aria-hidden="true">▶</span>
              Launch energy pulse
            </button>
          </div>

          <div className="outcome-712__viewport">
            <CanvasScene
              label={`A travelling pulse crosses a material particle chain. Particle ${targetParticleId} is tagged with a fixed home marker and the receiver reports transferred energy.`}
              height={320}
              frameKey={frameKey}
              draw={drawScene}
              testId="outcome-712-canvas"
              teacherLayer="particles"
              alternative={
                <div className="outcome-712__table-wrap">
                  <table className="outcome-712__state-table">
                    <caption>Live Energy Relay particle and receiver state</caption>
                    <thead>
                      <tr>
                        <th scope="col">Particle</th>
                        <th scope="col">Home position</th>
                        <th scope="col">Displacement now</th>
                        <th scope="col">Final net displacement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relayState.particles.map((particle) => (
                        <tr key={particle.id} data-testid={`outcome-712-particle-${particle.id}`}>
                          <th scope="row">Particle {particle.id}{particle.id === targetParticleId ? ' · passport target' : ''}</th>
                          <td>{formatSigFigs(particle.equilibrium)} m · fixed</td>
                          <td>{displacementText(particle.currentDisplacement)}</td>
                          <td>{particle.finalNetDisplacement === null
                            ? 'Event not complete'
                            : `${displacementText(particle.finalNetDisplacement)} · returned home`}</td>
                        </tr>
                      ))}
                      <tr>
                        <th scope="row">Energy receiver</th>
                        <td>{ENERGY_RELAY_CHAMBER_LENGTH} m</td>
                        <td colSpan={2} data-testid="outcome-712-receiver">{receiverText[relayState.receiver.state]}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
            />
          </div>

          <div className="outcome-712__instrument-bar" aria-label="Live Energy Relay readouts">
            <p><span>Elapsed</span><strong>{formatSigFigs(Math.max(0, relayState.elapsed))} s</strong></p>
            <p><span>Energy front</span><strong>{relayState.pulseCentrePosition === null ? 'Ready' : `${formatSigFigs(Math.min(ENERGY_RELAY_CHAMBER_LENGTH, relayState.pulseCentrePosition))} m`}</strong></p>
            <p><span>Receiver</span><strong>{receiverText[relayState.receiver.state]}</strong></p>
            <p><span>Particle {targetParticleId}</span><strong>{displacementText(targetParticle.currentDisplacement)}</strong></p>
          </div>

          <SimToolbar
            running={running}
            onToggleRun={() => setRunning((value) => !value)}
            onStep={clock.step}
            speed={playbackSpeed}
            onSpeed={setPlaybackSpeed}
            onReset={reset}
            resetLabel="Energy Relay"
          />

          <div className="outcome-712__controls">
            <SimControl
              id="outcome-7-1-2.amplitude"
              label="Pulse amplitude"
              min={0.2}
              max={1}
              step={0.05}
              value={amplitude}
              onChange={changeAmplitude}
              format={(value) => `${value.toFixed(2)} model m`}
              hint="Changes local particle displacement, not propagation speed."
              testId="outcome-712-amplitude"
            />
            <SimControl
              id="outcome-7-1-2.width"
              label="Pulse width"
              min={0.35}
              max={1.2}
              step={0.05}
              value={pulseWidth}
              onChange={changePulseWidth}
              format={(value) => `${value.toFixed(2)} model m`}
              hint="Changes how long each particle is displaced, not wave speed."
              testId="outcome-712-width"
            />
            <fieldset className="outcome-712__particle-picker" data-control-id="outcome-7-1-2.particle-picker">
              <legend>Particle passport</legend>
              <div className="outcome-712__particle-options">
                {ENERGY_RELAY_PARTICLES.map((particle) => (
                  <label key={particle.id}>
                    <input
                      type="radio"
                      name="energy-relay-particle"
                      checked={targetParticleId === particle.id}
                      onChange={() => changeParticle(particle.id)}
                    />
                    {particle.id}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="outcome-712__capture-panel">
            <div>
              <p className="outcome-712__eyebrow">Particle passport · target {targetParticleId}</p>
              <h3>Freeze the peak, then the return home</h3>
              <p>Use quarter speed, Pause and Step for precise captures. Peak target: near {amplitude.toFixed(2)} m. Home target: below {(amplitude * 0.01).toFixed(3)} m after the peak.</p>
            </div>
            <div className="outcome-712__capture-actions">
              <button
                type="button"
                className="btn"
                data-captured={peakCapture !== undefined}
                data-control-id="outcome-7-1-2.capture-peak"
                onClick={capturePeak}
              >
                {peakCapture ? '✓ Peak snapshot saved' : 'Capture peak snapshot'}
              </button>
              <button
                type="button"
                className="btn"
                data-captured={returnCapture !== undefined}
                data-control-id="outcome-7-1-2.capture-home"
                onClick={captureReturn}
              >
                {returnCapture ? '✓ Home snapshot saved' : 'Capture return home'}
              </button>
            </div>
          </div>

          <p className="outcome-712__honesty">
            <strong>Model honesty:</strong> the gold energy marker is a representation of transferred energy, not a material object. This ideal medium is uniform, linear, non-dispersive and lossless; the fixed {ENERGY_RELAY_PROPAGATION_SPEED} m/s display speed is illustrative.
          </p>
        </section>

        <section className="outcome-712__challenge" aria-labelledby="outcome-712-challenge-title">
          <div className="outcome-712__challenge-copy">
            <p className="outcome-712__eyebrow">Particle passport challenge</p>
            <h2 id="outcome-712-challenge-title">Prove that energy moved but matter did not</h2>
            <p>Objective: collect a valid peak snapshot and a valid return-home snapshot from the same assigned particle, then confirm the receiver obtained energy.</p>
          </div>

          <div className="outcome-712__predictions" aria-label="Challenge evidence checks">
            <div className="outcome-712__prediction">
              <strong>1 · Peak displacement</strong>
              <p className={`outcome-712__prediction-result ${challengeResult?.checks.peakCapturedNearMaximum ? 'is-correct' : 'is-incorrect'}`}>
                {challengeResult?.checks.peakCapturedNearMaximum ? '✓ Captured near maximum' : peakCapture ? 'Snapshot recorded · check after event' : 'No peak snapshot yet'}
              </p>
            </div>
            <div className="outcome-712__prediction">
              <strong>2 · Return home</strong>
              <p className={`outcome-712__prediction-result ${challengeResult?.checks.returnCapturedAfterPeak ? 'is-correct' : 'is-incorrect'}`}>
                {challengeResult?.checks.returnCapturedAfterPeak ? '✓ Below 1% of amplitude' : returnCapture ? 'Snapshot recorded · check after event' : 'No home snapshot yet'}
              </p>
            </div>
            <div className="outcome-712__prediction">
              <strong>3 · Energy received</strong>
              <p className={`outcome-712__prediction-result ${challengeResult?.checks.completedSimulatedEvidence ? 'is-correct' : 'is-incorrect'}`}>
                {relayState.receiver.state === 'received' ? '✓ Receiver obtained energy' : 'Receiver is still waiting'}
              </p>
            </div>
          </div>

          <div className="outcome-712__challenge-actions">
            <button
              type="button"
              className="btn btn--primary"
              data-control-id="outcome-7-1-2.challenge-check"
              data-testid="outcome-712-challenge-check"
              onClick={checkChallenge}
            >
              Check particle passport
            </button>
            <button
              type="button"
              className="btn"
              data-control-id="outcome-7-1-2.challenge-replay"
              data-testid="outcome-712-challenge-replay"
              onClick={replayChallenge}
            >
              New relay challenge
            </button>
          </div>

          <p className="outcome-712__challenge-status" role="status">{challengeMessage}</p>

          {challengeResult ? (
            <div className={`outcome-712__reward ${challengeResult.score === challengeResult.maxScore ? 'is-complete' : ''}`} role="status" aria-live="polite">
              <div className="outcome-712__score-ring" aria-hidden="true">{challengeResult.score}</div>
              <div>
                <p className="outcome-712__reward-title">
                  {challengeResult.score === challengeResult.maxScore ? 'Energy Relay expert unlocked' : 'Evidence needs another pass'}
                </p>
                <p>{challengeResult.score}/{challengeResult.maxScore} points. {challengeResult.score === challengeResult.maxScore
                  ? `Energy reached 10 m while particle ${targetParticleId} finished ${finalOffset === null ? '' : displacementText(finalOffset)} from home.`
                  : 'Use the model feedback, then launch or capture again.'}</p>
              </div>
            </div>
          ) : null}

          <details data-control-id="outcome-7-1-2.how-it-works">
            <summary>How the model separates particle motion, wave motion and energy</summary>
            <p>Each particle oscillates around one fixed equilibrium. The pulse pattern and energy travel left to right at the medium speed. Once the pulse has passed, the particle returns to the same home position, so there is no net transfer of matter.</p>
          </details>
        </section>
      </div>
    </Page>
  );
}
