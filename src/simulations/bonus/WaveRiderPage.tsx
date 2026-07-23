import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CirclePause,
  Gauge,
  Heart,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useReducedMotion } from '../../accessibility/useReducedMotion';
import { Page } from '../../components/Page';
import {
  clampWaveRiderLane,
  isCorrectWaveRiderLane,
  WAVE_RIDER_COURSE,
  WAVE_RIDER_GATES,
  WAVE_RIDER_POWERUP_QUESTIONS,
  WAVE_RIDER_STAGES,
  waveRiderEventY,
  waveRiderSpeed,
  type WaveRiderCourseEvent,
  type WaveRiderPowerupKind,
} from '../../science/waveRider';
import { useSettingsStore } from '../../store/settingsStore';
import './WaveRiderPage.css';

type GamePhase = 'intro' | 'running' | 'paused' | 'question' | 'stageComplete' | 'over' | 'complete';
type Lane = 0 | 1 | 2;
type PowerupEvent = Extract<WaveRiderCourseEvent, { type: 'powerup' }>;

const LOOK_AHEAD_METRES = 180;
const PLAYER_Y_PERCENT = 86;
const MAX_LIVES = 5;

const RIDERS = [
  { id: 'pulse', name: 'Pulse', symbol: '⚡', description: 'WaveMotion mascot' },
  { id: 'nova', name: 'Nova', symbol: '🌟', description: 'Star navigator' },
  { id: 'orbit', name: 'Orbit', symbol: '🤖', description: 'Robot rider' },
  { id: 'reef', name: 'Reef', symbol: '🤿', description: 'Ocean explorer' },
] as const;

const hazardSymbols = { shark: '🦈', debris: '🪵', whirlpool: '🌀', reef: '🪸' } as const;
const powerupSymbols: Record<WaveRiderPowerupKind, string> = { speed: '⚡', life: '❤️', jump: '⬆️', shield: '🛡️' };
const powerupNames: Record<WaveRiderPowerupKind, string> = { speed: 'speed boost', life: 'extra life', jump: 'super jump', shield: 'shield' };
const laneLeft = (lane: Lane) => `${16.667 + lane * 33.333}%`;

export default function WaveRiderPage() {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [stageIndex, setStageIndex] = useState(0);
  const [lane, setLane] = useState<Lane>(1);
  const [distance, setDistance] = useState(0);
  const [lives, setLives] = useState(3);
  const [boosts, setBoosts] = useState(1);
  const [jumps, setJumps] = useState(0);
  const [shields, setShields] = useState(0);
  const [boosting, setBoosting] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [slowed, setSlowed] = useState(false);
  const [bonusScore, setBonusScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [clearedGates, setClearedGates] = useState(0);
  const [gateIndex, setGateIndex] = useState(0);
  const [message, setMessage] = useState('Build your rider, then begin Stage 1.');
  const [activePowerup, setActivePowerup] = useState<PowerupEvent | null>(null);
  const [calmSpeed, setCalmSpeed] = useState(false);
  const [highVisibility, setHighVisibility] = useState(false);
  const [riderId, setRiderId] = useState<(typeof RIDERS)[number]['id']>('pulse');
  const [boardColour, setBoardColour] = useState('#ffdc5e');
  const [trail, setTrail] = useState('spark');
  const [callSign, setCallSign] = useState('Pulse');

  const boardRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<GamePhase>('intro');
  const stageRef = useRef(0);
  const laneRef = useRef<Lane>(1);
  const distanceRef = useRef(0);
  const livesRef = useRef(3);
  const boostsRef = useRef(1);
  const jumpsRef = useRef(0);
  const shieldsRef = useRef(0);
  const resolvedRef = useRef(new Set<string>());
  const boostUntilRef = useRef(0);
  const jumpUntilRef = useRef(0);
  const slowUntilRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const manualReducedMotion = useSettingsStore((state) => state.reducedMotion);
  const reducedMotion = useReducedMotion(manualReducedMotion);
  const { announce } = useAnnouncer();

  useEffect(() => {
    if (reducedMotion) setCalmSpeed(true);
  }, [reducedMotion]);

  const changePhase = (next: GamePhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const focusCourse = () => window.setTimeout(() => boardRef.current?.focus(), 0);

  const resetRun = () => {
    stageRef.current = 0;
    laneRef.current = 1;
    distanceRef.current = 0;
    livesRef.current = 3;
    boostsRef.current = 1;
    jumpsRef.current = 0;
    shieldsRef.current = 0;
    resolvedRef.current = new Set();
    boostUntilRef.current = 0;
    jumpUntilRef.current = 0;
    slowUntilRef.current = 0;
    lastFrameRef.current = null;
    setStageIndex(0);
    setLane(1);
    setDistance(0);
    setLives(3);
    setBoosts(1);
    setJumps(0);
    setShields(0);
    setBoosting(false);
    setJumping(false);
    setSlowed(false);
    setBonusScore(0);
    setStreak(0);
    setClearedGates(0);
    setGateIndex(0);
    setActivePowerup(null);
    setMessage('Stage 1 live. Track what the wave transfers.');
  };

  const startRun = () => {
    resetRun();
    changePhase('running');
    announce(`Wave Rider started for ${callSign || 'your rider'}. Stage 1, Particle Lagoon.`);
    focusCourse();
  };

  const continueStage = () => {
    const next = Math.min(stageRef.current + 1, WAVE_RIDER_STAGES.length - 1);
    stageRef.current = next;
    setStageIndex(next);
    laneRef.current = 1;
    setLane(1);
    lastFrameRef.current = null;
    setMessage(`Stage ${next + 1} live. ${WAVE_RIDER_STAGES[next].tagline}`);
    changePhase('running');
    announce(`Stage ${next + 1}, ${WAVE_RIDER_STAGES[next].name}.`);
    focusCourse();
  };

  const moveLane = (change: number) => {
    if (phaseRef.current !== 'running') return;
    const next = clampWaveRiderLane(laneRef.current + change);
    laneRef.current = next;
    setLane(next);
  };

  const activateBoost = () => {
    if (phaseRef.current !== 'running' || boostsRef.current <= 0 || performance.now() < boostUntilRef.current) return;
    boostsRef.current -= 1;
    setBoosts(boostsRef.current);
    boostUntilRef.current = performance.now() + 1600;
    setBoosting(true);
    setMessage('Speed boost active. This changes the arcade marker, not the modelled wave speed.');
  };

  const activateJump = () => {
    if (phaseRef.current !== 'running' || jumpsRef.current <= 0 || performance.now() < jumpUntilRef.current) return;
    jumpsRef.current -= 1;
    setJumps(jumpsRef.current);
    jumpUntilRef.current = performance.now() + 2300;
    setJumping(true);
    setMessage('Super jump active. You can clear every hazard while airborne.');
  };

  const togglePause = () => {
    if (phaseRef.current === 'running') {
      changePhase('paused');
      setBoosting(false);
      setJumping(false);
      announce('Wave Rider paused.');
    } else if (phaseRef.current === 'paused') {
      lastFrameRef.current = null;
      changePhase('running');
      announce('Wave Rider resumed.');
      focusCourse();
    }
  };

  const answerPowerup = (answerIndex: number) => {
    if (!activePowerup) return;
    const question = WAVE_RIDER_POWERUP_QUESTIONS[activePowerup.questionIndex];
    const correct = answerIndex === question.correctIndex;
    if (correct) {
      const kind = activePowerup.powerup;
      if (kind === 'speed') {
        boostsRef.current = Math.min(3, boostsRef.current + 1);
        setBoosts(boostsRef.current);
      } else if (kind === 'life') {
        livesRef.current = Math.min(MAX_LIVES, livesRef.current + 1);
        setLives(livesRef.current);
      } else if (kind === 'jump') {
        jumpsRef.current = Math.min(3, jumpsRef.current + 1);
        setJumps(jumpsRef.current);
      } else {
        shieldsRef.current = Math.min(2, shieldsRef.current + 1);
        setShields(shieldsRef.current);
      }
      setBonusScore((score) => score + 100);
      setMessage(`Correct: ${question.explanation} ${powerupNames[kind]} awarded.`);
      announce(`Correct. ${powerupNames[kind]} awarded.`);
    } else {
      setStreak(0);
      setMessage(`No power-up: ${question.explanation}`);
      announce(`Not this time. ${question.explanation}`);
    }
    setActivePowerup(null);
    lastFrameRef.current = null;
    changePhase('running');
    focusCourse();
  };

  const handleBoardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      event.preventDefault(); moveLane(-1);
    } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      event.preventDefault(); moveLane(1);
    } else if (event.key.toLowerCase() === 'f') {
      event.preventDefault(); activateBoost();
    } else if (event.key.toLowerCase() === 'j') {
      event.preventDefault(); activateJump();
    } else if (event.key === ' ') {
      event.preventDefault(); togglePause();
    }
  };

  useEffect(() => {
    if (phase !== 'running') return;
    let animationFrame = 0;

    const takeHit = (feedback: string) => {
      const nextLives = livesRef.current - 1;
      livesRef.current = nextLives;
      setLives(nextLives);
      setStreak(0);
      setMessage(feedback);
      announce(feedback);
      if (nextLives <= 0) {
        changePhase('over');
        announce('Run over. Review the feedback and try the five-stage course again.');
      }
    };

    const resolveHazard = (event: Extract<WaveRiderCourseEvent, { type: 'hazard' }>, now: number) => {
      if (event.lane !== laneRef.current) return;
      if (now < jumpUntilRef.current) {
        setBonusScore((score) => score + 35);
        setMessage(`Super jump cleared the ${event.kind}.`);
        return;
      }
      if (shieldsRef.current > 0) {
        shieldsRef.current -= 1;
        setShields(shieldsRef.current);
        setMessage(`Shield absorbed the ${event.kind}.`);
        return;
      }
      if (event.kind === 'debris') {
        slowUntilRef.current = now + 3300;
        setSlowed(true);
        setStreak(0);
        setMessage('Debris drag: steering still works, but speed is reduced for 3 seconds.');
      } else if (event.kind === 'whirlpool') {
        const stageStart = WAVE_RIDER_STAGES[stageRef.current].startDistance;
        distanceRef.current = Math.max(stageStart, distanceRef.current - 55);
        setDistance(distanceRef.current);
        setStreak(0);
        setMessage('Whirlpool! The current pulled your rider 55 m backwards.');
      } else if (event.kind === 'shark') {
        const pushedLane = clampWaveRiderLane(laneRef.current + (laneRef.current === 2 ? -1 : 1));
        laneRef.current = pushedLane;
        setLane(pushedLane);
        takeHit('Shark strike: one heart lost and your rider was knocked into the next lane.');
      } else {
        takeHit('Reef collision: one heart lost. A super jump or shield can clear reefs safely.');
      }
    };

    const resolveEvent = (event: WaveRiderCourseEvent, now: number) => {
      resolvedRef.current.add(event.id);
      if (event.type === 'hazard') {
        resolveHazard(event, now);
        return;
      }
      if (event.type === 'powerup') {
        if (event.lane === laneRef.current) {
          setActivePowerup(event);
          setMessage(`Answer correctly to earn a ${powerupNames[event.powerup]}.`);
          changePhase('question');
          announce(`Power-up challenge. Answer correctly to earn a ${powerupNames[event.powerup]}.`);
        }
        return;
      }
      const challenge = WAVE_RIDER_GATES[event.gateIndex];
      setGateIndex(event.gateIndex + 1);
      if (isCorrectWaveRiderLane(event.gateIndex, laneRef.current)) {
        setClearedGates((count) => count + 1);
        setStreak((current) => {
          const next = current + 1;
          setBonusScore((score) => score + 100 + next * 25);
          return next;
        });
        setMessage(`Gate cleared: ${challenge.explanation}`);
        announce(`Correct. ${challenge.explanation}`);
      } else {
        takeHit(`Gate missed. ${challenge.explanation}`);
      }
    };

    const frame = (now: number) => {
      if (phaseRef.current !== 'running') return;
      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const deltaSeconds = Math.min((now - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = now;
      const isBoosting = now < boostUntilRef.current;
      const isJumping = now < jumpUntilRef.current;
      const isSlowed = now < slowUntilRef.current;
      setBoosting(isBoosting);
      setJumping(isJumping);
      setSlowed(isSlowed);
      const stage = WAVE_RIDER_STAGES[stageRef.current];
      const previousDistance = distanceRef.current;
      const nextDistance = Math.min(
        stage.finishDistance,
        previousDistance + waveRiderSpeed(previousDistance, calmSpeed || reducedMotion, isBoosting, stage.speedMultiplier, isSlowed) * deltaSeconds,
      );
      distanceRef.current = nextDistance;
      setDistance(nextDistance);

      for (const event of WAVE_RIDER_COURSE) {
        if (!resolvedRef.current.has(event.id) && event.distance > previousDistance && event.distance <= nextDistance) {
          resolveEvent(event, now);
          if (phaseRef.current !== 'running') break;
        }
      }

      if (nextDistance >= stage.finishDistance && phaseRef.current === 'running') {
        if (stageRef.current === WAVE_RIDER_STAGES.length - 1) {
          changePhase('complete');
          setBonusScore((score) => score + livesRef.current * 200);
          setMessage('All five stages complete. The mastery patch is yours.');
          announce('All five Wave Rider stages complete. Mastery patch earned.');
        } else {
          changePhase('stageComplete');
          setBonusScore((score) => score + 250);
          setMessage(`Stage ${stageRef.current + 1} complete.`);
          announce(`Stage ${stageRef.current + 1} complete.`);
        }
        return;
      }
      animationFrame = requestAnimationFrame(frame);
    };

    animationFrame = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animationFrame);
      lastFrameRef.current = null;
    };
  }, [announce, calmSpeed, phase, reducedMotion]);

  const currentStage = WAVE_RIDER_STAGES[stageIndex];
  const visibleEvents = useMemo(
    () => WAVE_RIDER_COURSE.filter((event) => {
      if (event.distance < currentStage.startDistance || event.distance > currentStage.finishDistance) return false;
      if (event.type === 'gate' && event.gateIndex !== gateIndex) return false;
      const relative = event.distance - distance;
      return relative >= -18 && relative <= LOOK_AHEAD_METRES;
    }),
    [currentStage, distance, gateIndex],
  );
  const nextGate = WAVE_RIDER_GATES[Math.min(gateIndex, WAVE_RIDER_GATES.length - 1)];
  const rider = RIDERS.find((option) => option.id === riderId) ?? RIDERS[0];
  const score = Math.floor(distance) + bonusScore;
  const stageProgress = Math.min(100, Math.max(0, ((distance - currentStage.startDistance) / (currentStage.finishDistance - currentStage.startDistance)) * 100));
  const powerupQuestion = activePowerup ? WAVE_RIDER_POWERUP_QUESTIONS[activePowerup.questionIndex] : null;

  return (
    <Page title="Wave Rider five-stage mastery game" heading="Wave Rider" lead="Build a rider, master five progressively harder wave-physics stages, and earn power-ups by answering science questions.">
      <div className="wave-rider__topline">
        <span><Sparkles size={15} aria-hidden="true" /> Bonus mastery game</span>
        <Link to="/" className="wave-rider__back">Back to all simulators</Link>
      </div>

      <section className="wave-rider__game" aria-labelledby="wave-rider-course-title">
        <header className="wave-rider__hud">
          <div>
            <p className="wave-rider__kicker">Stage {stageIndex + 1} of 5 &middot; {currentStage.name}</p>
            <h2 id="wave-rider-course-title">Ride the energy front</h2>
          </div>
          <div className="wave-rider__stats" aria-label="Current game statistics">
            <span aria-label={`${lives} hearts remaining`}><Heart size={18} aria-hidden="true" /> {lives}</span>
            <span aria-label={`${Math.floor(distance)} metres travelled`}><Gauge size={18} aria-hidden="true" /> {Math.floor(distance)} m</span>
            <span aria-label={`${shields} shields available`}><Shield size={18} aria-hidden="true" /> {shields}</span>
            <span aria-label={`${score} points`}><Sparkles size={18} aria-hidden="true" /> {score}</span>
          </div>
        </header>

        <ol className="wave-rider__stages" aria-label="Five-stage course progress">
          {WAVE_RIDER_STAGES.map((stage, index) => <li key={stage.id} data-state={index < stageIndex ? 'complete' : index === stageIndex ? 'active' : 'locked'}><strong>{index + 1}</strong><span>{stage.name}</span></li>)}
        </ol>
        <div className="wave-rider__progress" aria-hidden="true"><span style={{ width: `${stageProgress}%` }} /></div>

        <div ref={boardRef} className="wave-rider__course" data-phase={phase} data-stage={stageIndex + 1} data-high-visibility={highVisibility} data-boosting={boosting} data-jumping={jumping} data-slowed={slowed} tabIndex={phase === 'running' || phase === 'paused' ? 0 : -1} onKeyDown={handleBoardKeyDown} aria-label="Wave Rider course. Use left and right arrows or A and D to change lanes. Press F to boost, J to super jump and Space to pause.">
          <div className="wave-rider__water-lines" aria-hidden="true" />
          <div className="wave-rider__lane-lines" aria-hidden="true"><span /><span /></div>

          {(phase === 'running' || phase === 'paused') && gateIndex < WAVE_RIDER_GATES.length && (
            <div className="wave-rider__question" role="status"><span>Outcome {nextGate.outcome}</span><strong>{nextGate.prompt}</strong></div>
          )}

          <div className="wave-rider__objects" aria-hidden="true">
            {visibleEvents.map((event) => {
              const y = waveRiderEventY(event.distance, distance);
              if (event.type === 'gate') {
                const gate = WAVE_RIDER_GATES[event.gateIndex];
                return <div className="wave-rider__gate-row" key={event.id} style={{ top: `${y}%` }}>{gate.options.map((option, optionLane) => <div className="wave-rider__gate" key={option} data-lane={optionLane}><span>{option}</span></div>)}</div>;
              }
              if (event.type === 'powerup') {
                return <div className="wave-rider__pickup" data-kind={event.powerup} key={event.id} style={{ left: laneLeft(event.lane), top: `${y}%` }}><span>{powerupSymbols[event.powerup]}</span><small>QUIZ</small></div>;
              }
              return <div className="wave-rider__hazard" data-kind={event.kind} key={event.id} style={{ left: laneLeft(event.lane), top: `${y}%` }}><span>{hazardSymbols[event.kind]}</span></div>;
            })}
          </div>

          <div className={`wave-rider__rider trail-${trail}`} style={{ left: laneLeft(lane), top: `${PLAYER_Y_PERCENT}%` }} aria-hidden="true">
            <div className="wave-rider__trail" />
            <div className="wave-rider__board" style={{ background: boardColour }} />
            {rider.id === 'pulse' ? <img src={`${import.meta.env.BASE_URL}assets/game/pulse-wave-runner.png`} alt="" /> : <span className="wave-rider__avatar">{rider.symbol}</span>}
            <span>{(callSign || rider.name).toUpperCase()} &middot; ENERGY TRACKER</span>
          </div>

          {phase === 'intro' && (
            <div className="wave-rider__overlay wave-rider__builder">
              <p className="wave-rider__overlay-eyebrow">Build your rider</p>
              <h3>Choose your style</h3>
              <fieldset className="wave-rider__rider-picks" data-control-id="bonus-wave-rider.character"><legend>Character</legend>{RIDERS.map((option) => <label key={option.id}><input type="radio" name="rider" value={option.id} checked={riderId === option.id} onChange={() => { setRiderId(option.id); if (callSign === 'Pulse' || !callSign) setCallSign(option.name); }} /><span aria-hidden="true">{option.symbol}</span><strong>{option.name}</strong><small>{option.description}</small></label>)}</fieldset>
              <div className="wave-rider__design-grid">
                <label>Call sign<input value={callSign} maxLength={12} onChange={(event) => setCallSign(event.target.value.replace(/[^a-zA-Z0-9 -]/g, ''))} data-control-id="bonus-wave-rider.call-sign" /></label>
                <label>Board colour<select value={boardColour} onChange={(event) => setBoardColour(event.target.value)} data-control-id="bonus-wave-rider.board-colour"><option value="#ffdc5e">Solar yellow</option><option value="#55ecdc">Current teal</option><option value="#ff6f91">Coral pink</option><option value="#a988ff">Violet pulse</option></select></label>
                <label>Trail style<select value={trail} onChange={(event) => setTrail(event.target.value)} data-control-id="bonus-wave-rider.trail"><option value="spark">Energy sparks</option><option value="bubble">Bubbles</option><option value="rainbow">Spectrum</option></select></label>
              </div>
              <p>Five stages get faster and denser. Correct power-up answers earn abilities; wrong answers give feedback but no reward.</p>
              <div className="wave-rider__keymap" aria-label="Game controls"><span><kbd>←</kbd><kbd>→</kbd> steer</span><span><kbd>F</kbd> boost</span><span><kbd>J</kbd> jump</span><span><kbd>Space</kbd> pause</span></div>
              <button type="button" className="wave-rider__primary" onClick={startRun} data-control-id="bonus-wave-rider.start"><Play size={20} aria-hidden="true" /> Start Stage 1</button>
            </div>
          )}

          {phase === 'question' && activePowerup && powerupQuestion && (
            <div className="wave-rider__overlay is-question">
              <div className="wave-rider__powerup-prize" aria-hidden="true">{powerupSymbols[activePowerup.powerup]}</div>
              <p className="wave-rider__overlay-eyebrow">Outcome {powerupQuestion.outcome} &middot; win a {powerupNames[activePowerup.powerup]}</p>
              <h3>Power-up challenge</h3>
              <p><strong>{powerupQuestion.prompt}</strong></p>
              <div className="wave-rider__answer-grid" data-control-id="bonus-wave-rider.powerup-answer">{powerupQuestion.options.map((option, index) => <button type="button" key={option} onClick={() => answerPowerup(index)}>{option}</button>)}</div>
            </div>
          )}

          {phase === 'stageComplete' && (
            <div className="wave-rider__overlay is-compact"><Sparkles size={36} aria-hidden="true" /><p className="wave-rider__overlay-eyebrow">Stage {stageIndex + 1} clear</p><h3>{currentStage.name} mastered</h3><p>Next: <strong>{WAVE_RIDER_STAGES[stageIndex + 1].name}</strong>. {WAVE_RIDER_STAGES[stageIndex + 1].tagline}</p><button type="button" className="wave-rider__primary" onClick={continueStage} data-control-id="bonus-wave-rider.next-stage">Start Stage {stageIndex + 2}</button></div>
          )}

          {phase === 'paused' && <div className="wave-rider__overlay is-compact"><CirclePause size={36} aria-hidden="true" /><h3>Run paused</h3><button type="button" className="wave-rider__primary" onClick={togglePause} data-control-id="bonus-wave-rider.resume">Resume run</button></div>}

          {(phase === 'over' || phase === 'complete') && <div className="wave-rider__overlay"><p className="wave-rider__overlay-eyebrow">{phase === 'complete' ? 'Five-stage mastery patch earned' : 'Course interrupted'}</p><h3>{phase === 'complete' ? 'Maelstrom mastered!' : 'Out of hearts'}</h3><p>{phase === 'complete' ? `${callSign || rider.name} cleared ${clearedGates}/10 gates and scored ${score} points.` : `You reached Stage ${stageIndex + 1} and ${Math.floor(distance)} m. Review the feedback, then try again.`}</p><button type="button" className="wave-rider__primary" onClick={startRun} data-control-id="bonus-wave-rider.restart"><RotateCcw size={19} aria-hidden="true" /> Ride again</button></div>}
        </div>

        <div className="wave-rider__control-deck">
          <div className="wave-rider__mobile-controls" aria-label="Steering and power controls">
            <button type="button" onClick={() => moveLane(-1)} disabled={phase !== 'running'} aria-label="Steer left" data-control-id="bonus-wave-rider.steer-left"><ArrowLeft aria-hidden="true" /></button>
            <button type="button" onClick={() => moveLane(1)} disabled={phase !== 'running'} aria-label="Steer right" data-control-id="bonus-wave-rider.steer-right"><ArrowRight aria-hidden="true" /></button>
            <button type="button" className="is-boost" onClick={activateBoost} disabled={phase !== 'running' || boosts === 0 || boosting} aria-label={`Use speed boost. ${boosts} remaining`} data-control-id="bonus-wave-rider.boost"><Zap aria-hidden="true" /> {boosts}</button>
            <button type="button" className="is-jump" onClick={activateJump} disabled={phase !== 'running' || jumps === 0 || jumping} aria-label={`Use super jump. ${jumps} remaining`} data-control-id="bonus-wave-rider.jump"><Waves aria-hidden="true" /> {jumps}</button>
          </div>
          <div className="wave-rider__options"><label><input type="checkbox" checked={calmSpeed} onChange={(event) => setCalmSpeed(event.target.checked)} data-control-id="bonus-wave-rider.calm-speed" /> Calm speed</label><label><input type="checkbox" checked={highVisibility} onChange={(event) => setHighVisibility(event.target.checked)} data-control-id="bonus-wave-rider.high-visibility" /> High visibility</label><button type="button" onClick={togglePause} disabled={phase !== 'running' && phase !== 'paused'} data-control-id="bonus-wave-rider.pause">{phase === 'paused' ? <Play size={17} aria-hidden="true" /> : <CirclePause size={17} aria-hidden="true" />}{phase === 'paused' ? 'Resume' : 'Pause'}</button></div>
        </div>

        <div className="wave-rider__feedback"><p className="wave-rider__message" role="status"><span aria-hidden="true" /> {message}</p><p><strong>{clearedGates}/10</strong> gates &middot; <strong>{streak}×</strong> streak</p></div>
      </section>

      <section className="wave-rider__science" aria-labelledby="wave-rider-science-title">
        <div><p className="wave-rider__kicker">Why this is mastery</p><h2 id="wave-rider-science-title">Every stage raises both the game and science challenge.</h2></div>
        <ul><li><strong>Stages 1–2:</strong> mechanical media, energy transfer, particle motion and wave features.</li><li><strong>Stage 3:</strong> numerical and proportional reasoning with λ = v/f.</li><li><strong>Stage 4:</strong> compare EM wave forms and connect properties with uses.</li><li><strong>Stage 5:</strong> retrieve and apply mixed sound, light and wave ideas under pressure.</li></ul>
        <div className="wave-rider__hazard-key"><span>🦈 <strong>Shark:</strong> heart + lane</span><span>🪵 <strong>Debris:</strong> slows</span><span>🌀 <strong>Whirlpool:</strong> sends back</span><span>🪸 <strong>Reef:</strong> costs a heart</span></div>
        <p className="wave-rider__model-note"><strong>Model limit:</strong> the rider and board are arcade markers for an energy front. They are not matter, a photon, or a literal surfer transported by a wave. Game speed, jumping and hazards are reward mechanics, not claims about wave behaviour.</p>
      </section>
    </Page>
  );
}
