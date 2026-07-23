import { useEffect, useRef, useState } from 'react';
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
  waveRiderSpeed,
  type WaveRiderCourseEvent,
  type WaveRiderPowerupKind,
} from '../../science/waveRider';
import { useSettingsStore } from '../../store/settingsStore';
import './WaveRiderPage.css';

type GamePhase = 'intro' | 'running' | 'paused' | 'question' | 'stageComplete' | 'over' | 'complete';
type Lane = 0 | 1 | 2;
type PowerupEvent = Extract<WaveRiderCourseEvent, { type: 'powerup' }>;

const PLAYER_Y_PERCENT = 43;
const MAX_LIVES = 5;

const RIDERS = [
  { id: 'pulse', name: 'Pulse', asset: 'rider-pulse.webp', description: 'WaveMotion mascot' },
  { id: 'nova', name: 'Nova', asset: 'rider-nova.webp', description: 'Star navigator' },
  { id: 'orbit', name: 'Orbit', asset: 'rider-orbit.webp', description: 'Robot rider' },
  { id: 'reef', name: 'Reef', asset: 'rider-reef.webp', description: 'Ocean explorer' },
] as const;

const hazardAssets = { shark: 'hazard-shark.webp', debris: 'hazard-debris.webp', whirlpool: 'hazard-whirlpool.webp', reef: 'hazard-reef.webp' } as const;
const powerupAssets: Record<WaveRiderPowerupKind, string> = { speed: 'power-speed.webp', life: 'power-life.webp', jump: 'power-jump.webp', shield: 'power-shield.webp' };
const powerupNames: Record<WaveRiderPowerupKind, string> = { speed: 'speed boost', life: 'extra life', jump: 'super jump', shield: 'shield' };
const laneX = (lane: Lane) => (lane + 0.5) / 3;
const nearestLane = (position: number) => clampWaveRiderLane(Math.round(position * 3 - 0.5));
const assetUrl = (file: string) => `${import.meta.env.BASE_URL}assets/game/wave-rider/${file}`;
const allSpriteFiles = [...RIDERS.map((rider) => rider.asset), ...Object.values(hazardAssets), ...Object.values(powerupAssets)];

const fitCanvas = (canvas: HTMLCanvasElement) => {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(canvas.clientWidth));
  const height = Math.max(1, Math.round(canvas.clientHeight));
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const context = canvas.getContext('2d');
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width, height };
};

const wrapCanvasText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
};

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<GamePhase>('intro');
  const stageRef = useRef(0);
  const laneRef = useRef<Lane>(1);
  const playerXRef = useRef(0.5);
  const playerVelocityRef = useRef(0);
  const targetXRef = useRef<number | null>(0.5);
  const steerRef = useRef({ left: false, right: false });
  const distanceRef = useRef(0);
  const livesRef = useRef(3);
  const boostsRef = useRef(1);
  const jumpsRef = useRef(0);
  const shieldsRef = useRef(0);
  const resolvedRef = useRef(new Set<string>());
  const boostUntilRef = useRef(0);
  const jumpUntilRef = useRef(0);
  const slowUntilRef = useRef(0);
  const impactUntilRef = useRef(0);
  const lastHudRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});
  const manualReducedMotion = useSettingsStore((state) => state.reducedMotion);
  const reducedMotion = useReducedMotion(manualReducedMotion);
  const { announce } = useAnnouncer();

  useEffect(() => {
    if (reducedMotion) setCalmSpeed(true);
  }, [reducedMotion]);

  useEffect(() => {
    for (const file of allSpriteFiles) {
      const image = new Image();
      image.decoding = 'async';
      image.src = assetUrl(file);
      spritesRef.current[file] = image;
    }
  }, []);

  const changePhase = (next: GamePhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const focusCourse = () => window.setTimeout(() => boardRef.current?.focus(), 0);

  const resetRun = () => {
    stageRef.current = 0;
    laneRef.current = 1;
    playerXRef.current = 0.5;
    playerVelocityRef.current = 0;
    targetXRef.current = 0.5;
    steerRef.current = { left: false, right: false };
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
    playerXRef.current = 0.5;
    playerVelocityRef.current = 0;
    targetXRef.current = 0.5;
    setLane(1);
    lastFrameRef.current = null;
    setMessage(`Stage ${next + 1} live. ${WAVE_RIDER_STAGES[next].tagline}`);
    changePhase('running');
    announce(`Stage ${next + 1}, ${WAVE_RIDER_STAGES[next].name}.`);
    focusCourse();
  };

  const moveLane = (change: number) => {
    if (phaseRef.current !== 'running') return;
    const next = clampWaveRiderLane(nearestLane(playerXRef.current) + change);
    laneRef.current = next;
    targetXRef.current = laneX(next);
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
      event.preventDefault();
      if (!event.repeat) targetXRef.current = Math.max(0.08, playerXRef.current - 1 / 3);
      steerRef.current.left = true;
    } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      event.preventDefault();
      if (!event.repeat) targetXRef.current = Math.min(0.92, playerXRef.current + 1 / 3);
      steerRef.current.right = true;
    } else if (event.key.toLowerCase() === 'f') {
      event.preventDefault(); activateBoost();
    } else if (event.key.toLowerCase() === 'j') {
      event.preventDefault(); activateJump();
    } else if (event.key === ' ') {
      event.preventDefault(); togglePause();
    }
  };

  const handleBoardKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') steerRef.current.left = false;
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') steerRef.current.right = false;
  };

  const steerToPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'running') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    targetXRef.current = Math.max(0.08, Math.min(0.92, (event.clientX - bounds.left) / bounds.width));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    steerToPointer(event);
  };

  useEffect(() => {
    if (phase !== 'running') return;
    let animationFrame = 0;

    const drawCourse = (now: number, isBoosting: boolean, isJumping: boolean, isSlowed: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { context, width, height } = fitCanvas(canvas);
      if (!context) return;
      const stage = stageRef.current;
      const palettes = [
        ['#69cdea', '#54c3e3', '#43b6da'],
        ['#62d5df', '#4ac3d3', '#35adc6'],
        ['#65c5e5', '#55acd8', '#468fc7'],
        ['#6ab8df', '#5898ce', '#5079bc'],
        ['#65aace', '#5685b9', '#4a68a5'],
      ];
      const [sky, middle, deep] = highVisibility ? ['#65daf4', '#1595c4', '#08709e'] : palettes[stage];
      const distanceNow = distanceRef.current;
      context.clearRect(0, 0, width, height);
      context.save();
      if (now < impactUntilRef.current && !reducedMotion) {
        const shake = Math.sin(now * 0.11) * 5 * ((impactUntilRef.current - now) / 360);
        context.translate(shake, shake * 0.35);
      }
      const ocean = context.createLinearGradient(0, 0, 0, height);
      ocean.addColorStop(0, sky);
      ocean.addColorStop(0.52, middle);
      ocean.addColorStop(1, deep);
      context.fillStyle = ocean;
      context.fillRect(-8, -8, width + 16, height + 16);

      const scroll = reducedMotion ? 0 : (now * (isBoosting ? 0.055 : isSlowed ? 0.018 : 0.032)) % 94;
      context.lineCap = 'round';
      for (let row = -2; row < 11; row += 1) {
        const y = row * 86 + scroll;
        const perspective = Math.max(0.22, y / height);
        context.beginPath();
        for (let x = -30; x <= width + 30; x += 12) {
          const wave = Math.sin(x * 0.022 + now * 0.0012 + row * 0.8) * (2.5 + perspective * 3);
          if (x === -30) context.moveTo(x, y + wave);
          else context.lineTo(x, y + wave);
        }
        context.strokeStyle = `rgba(226, 253, 255, ${0.12 + perspective * 0.08})`;
        context.lineWidth = 1.2;
        context.stroke();
      }
      const glow = context.createRadialGradient(width / 2, height * 0.88, 0, width / 2, height * 0.88, width * 0.55);
      glow.addColorStop(0, 'rgba(82,255,221,.22)');
      glow.addColorStop(1, 'rgba(82,255,221,0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      const worldScroll = distanceNow * 2.1;
      for (let cell = -2; cell < 8; cell += 1) {
        const worldIndex = Math.floor(worldScroll / 175) + cell;
        const seed = Math.abs(Math.sin(worldIndex * 91.713) * 43758.5453) % 1;
        const x = width * (0.08 + ((seed * 7.31) % 0.84));
        const y = ((worldIndex * 175 + worldScroll) % (height + 260)) - 130;
        const kind = Math.abs(worldIndex) % 4;
        context.save();
        context.translate(x, y);
        if (kind === 0) {
          context.fillStyle = 'rgba(245,255,255,.55)';
          context.beginPath(); context.ellipse(0, 18, 76, 18, 0, 0, Math.PI * 2); context.fill();
          context.fillStyle = '#f3dfaa';
          context.beginPath(); context.ellipse(0, 8, 64, 30, -0.08, 0, Math.PI * 2); context.fill();
          context.fillStyle = '#5b986d';
          context.beginPath(); context.ellipse(-4, -1, 35, 14, 0, 0, Math.PI * 2); context.fill();
          context.fillStyle = '#665f5b';
          for (const rock of [-28, 3, 26]) { context.beginPath(); context.arc(rock, 5 + Math.abs(rock) * 0.1, 8, 0, Math.PI * 2); context.fill(); }
          context.strokeStyle = '#7b5b3b'; context.lineWidth = 6; context.beginPath(); context.moveTo(17, 1); context.lineTo(22, -31); context.stroke();
          context.fillStyle = '#39765a';
          for (let leaf = 0; leaf < 6; leaf += 1) { context.save(); context.translate(22, -31); context.rotate(leaf * Math.PI / 3); context.beginPath(); context.ellipse(13, 0, 16, 5, 0, 0, Math.PI * 2); context.fill(); context.restore(); }
        } else if (kind === 1) {
          context.fillStyle = '#876d58';
          for (let plank = -2; plank <= 2; plank += 1) context.fillRect(plank * 20 - 9, -13, 18, 72);
          context.strokeStyle = '#5c493d'; context.lineWidth = 2;
          context.strokeRect(-49, -13, 98, 72);
          context.fillStyle = '#d85a55'; context.fillRect(54, -30, 6, 40);
          context.fillStyle = '#fff'; context.beginPath(); context.moveTo(60, -28); context.lineTo(82, -20); context.lineTo(60, -10); context.fill();
        } else if (kind === 2) {
          context.fillStyle = 'rgba(245,255,255,.58)'; context.beginPath(); context.ellipse(0, 12, 39, 12, 0, 0, Math.PI * 2); context.fill();
          context.fillStyle = '#68777b';
          for (const rock of [-19, 0, 20]) { context.beginPath(); context.arc(rock, 2 + Math.abs(rock) * 0.12, 13, 0, Math.PI * 2); context.fill(); }
        } else {
          context.fillStyle = 'rgba(245,255,255,.55)'; context.beginPath(); context.ellipse(0, 10, 24, 10, 0, 0, Math.PI * 2); context.fill();
          context.fillStyle = '#e15f5b'; context.beginPath(); context.ellipse(0, 1, 14, 11, 0, 0, Math.PI * 2); context.fill();
          context.fillStyle = '#fff'; context.fillRect(-11, -2, 22, 6);
          context.strokeStyle = '#555'; context.lineWidth = 3; context.beginPath(); context.moveTo(0, -10); context.lineTo(0, -29); context.stroke();
          context.fillStyle = '#fff'; context.beginPath(); context.moveTo(0, -29); context.lineTo(18, -21); context.lineTo(0, -15); context.fill();
        }
        context.restore();
      }

      const activeGate = WAVE_RIDER_COURSE.find(
        (courseEvent): courseEvent is Extract<WaveRiderCourseEvent, { type: 'gate' }> => courseEvent.type === 'gate' && !resolvedRef.current.has(courseEvent.id),
      );
      const activeGateIndex = activeGate?.gateIndex;
      for (const courseEvent of WAVE_RIDER_COURSE) {
        if (resolvedRef.current.has(courseEvent.id)) continue;
        if (courseEvent.type === 'gate' && courseEvent.gateIndex !== activeGateIndex) continue;
        if (courseEvent.distance < WAVE_RIDER_STAGES[stage].startDistance || courseEvent.distance > WAVE_RIDER_STAGES[stage].finishDistance) continue;
        const relative = courseEvent.distance - distanceNow;
        if (relative < -18 || relative > 180) continue;
        const progress = 1 - relative / 180;
        const y = height * (0.10 + progress * (PLAYER_Y_PERCENT / 100 - 0.10));
        const scale = 0.44 + Math.max(0, progress) * 0.68;
        if (courseEvent.type === 'gate') {
          const gate = WAVE_RIDER_GATES[courseEvent.gateIndex];
          const gap = Math.max(8, width * 0.012);
          const gateWidth = (width - gap * 6) / 3;
          const gateHeight = Math.max(50, Math.min(76, height * 0.1)) * scale;
          gate.options.forEach((option, optionLane) => {
            const x = gap * 3 + optionLane * (gateWidth + gap);
            context.fillStyle = 'rgba(255,255,255,.83)';
            context.strokeStyle = '#143b57';
            context.lineWidth = Math.max(2, 3 * scale);
            context.beginPath();
            context.roundRect(x, y - gateHeight / 2, gateWidth, gateHeight, 12);
            context.fill();
            context.stroke();
            context.fillStyle = '#142d3f';
            context.font = `800 ${Math.max(10, 14 * scale)}px Lexend, sans-serif`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            const lines = wrapCanvasText(context, option, gateWidth - 22);
            lines.forEach((line, index) => context.fillText(line, x + gateWidth / 2, y + (index - (lines.length - 1) / 2) * 16 * scale));
          });
          continue;
        }
        const file = courseEvent.type === 'hazard' ? hazardAssets[courseEvent.kind] : powerupAssets[courseEvent.powerup];
        const image = spritesRef.current[file];
        const size = (courseEvent.type === 'powerup' ? 68 : 82) * scale;
        const x = laneX(courseEvent.lane) * width;
        context.save();
        context.translate(x, y);
        if (courseEvent.type === 'powerup') {
          const pulse = reducedMotion ? 1 : 1 + Math.sin(now * 0.006) * 0.07;
          context.scale(pulse, pulse);
          context.shadowColor = '#ffe66d';
          context.shadowBlur = 22;
        } else if (courseEvent.kind === 'whirlpool' && !reducedMotion) context.rotate(now * 0.0012);
        if (image?.complete && image.naturalWidth) context.drawImage(image, -size / 2, -size / 2, size, size);
        context.restore();
      }

      const playerX = playerXRef.current * width;
      const baseY = height * PLAYER_Y_PERCENT / 100;
      const jumpLift = isJumping ? (reducedMotion ? 28 : 48 + Math.sin(now * 0.01) * 9) : 0;
      const playerY = baseY - jumpLift;
      const trailGradient = context.createLinearGradient(playerX - 150, 0, playerX - 15, 0);
      if (trail === 'rainbow') {
        trailGradient.addColorStop(0, 'rgba(168,131,255,0)'); trailGradient.addColorStop(0.45, '#a883ff'); trailGradient.addColorStop(0.72, '#55e6ff'); trailGradient.addColorStop(1, '#ffe66d');
      } else {
        trailGradient.addColorStop(0, trail === 'bubble' ? 'rgba(220,252,255,0)' : 'rgba(255,230,93,0)');
        trailGradient.addColorStop(1, trail === 'bubble' ? '#d9fbff' : '#ffe65d');
      }
      context.strokeStyle = trailGradient;
      context.lineWidth = isBoosting ? 12 : 7;
      context.shadowColor = trail === 'rainbow' ? '#7de8ff' : '#ffe65d';
      context.shadowBlur = isBoosting ? 24 : 12;
      context.beginPath();
      context.moveTo(playerX - (isBoosting ? 205 : 130), playerY + 24);
      context.quadraticCurveTo(playerX - 70, playerY + 12 + Math.sin(now * 0.01) * 7, playerX - 17, playerY + 20);
      context.stroke();
      context.shadowBlur = 0;
      context.fillStyle = boardColour;
      context.strokeStyle = '#0b3769';
      context.lineWidth = 4;
      context.beginPath();
      context.ellipse(playerX, playerY + 28, 48, 11, -playerVelocityRef.current * 0.2, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      const riderAsset = RIDERS.find((option) => option.id === riderId)?.asset ?? RIDERS[0].asset;
      const riderImage = spritesRef.current[riderAsset];
      const riderSize = Math.min(94, Math.max(68, width * 0.085));
      context.save();
      context.translate(playerX, playerY);
      context.rotate(playerVelocityRef.current * 0.16);
      context.globalAlpha = isSlowed ? 0.72 : 1;
      if (riderImage?.complete && riderImage.naturalWidth) context.drawImage(riderImage, -riderSize / 2, -riderSize * 0.72, riderSize, riderSize);
      context.restore();
      context.restore();
    };

    const takeHit = (feedback: string) => {
      const nextLives = livesRef.current - 1;
      livesRef.current = nextLives;
      setLives(nextLives);
      setStreak(0);
      setMessage(feedback);
      impactUntilRef.current = performance.now() + 360;
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
        impactUntilRef.current = now + 360;
        setStreak(0);
        setMessage('Whirlpool! The current pulled your rider 55 m backwards.');
      } else if (event.kind === 'shark') {
        const pushedLane = clampWaveRiderLane(laneRef.current + (laneRef.current === 2 ? -1 : 1));
        laneRef.current = pushedLane;
        targetXRef.current = laneX(pushedLane);
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
      const steerDirection = Number(steerRef.current.right) - Number(steerRef.current.left);
      if (steerDirection !== 0) {
        playerVelocityRef.current += steerDirection * 2.2 * deltaSeconds;
      }
      playerVelocityRef.current *= Math.exp(-6.2 * deltaSeconds);
      if (targetXRef.current !== null) {
        const easing = 1 - Math.exp(-10.5 * deltaSeconds);
        playerXRef.current += (targetXRef.current - playerXRef.current) * easing;
        if (Math.abs(targetXRef.current - playerXRef.current) < 0.002) targetXRef.current = null;
      }
      playerXRef.current = Math.max(0.075, Math.min(0.925, playerXRef.current + playerVelocityRef.current * deltaSeconds));
      if (playerXRef.current <= 0.076 || playerXRef.current >= 0.924) playerVelocityRef.current *= -0.24;
      laneRef.current = nearestLane(playerXRef.current);
      const stage = WAVE_RIDER_STAGES[stageRef.current];
      const previousDistance = distanceRef.current;
      const nextDistance = Math.min(
        stage.finishDistance,
        previousDistance + waveRiderSpeed(previousDistance, calmSpeed || reducedMotion, isBoosting, stage.speedMultiplier, isSlowed) * deltaSeconds,
      );
      distanceRef.current = nextDistance;

      if (now - lastHudRef.current > 90) {
        lastHudRef.current = now;
        setDistance(nextDistance);
        setLane(laneRef.current);
        setBoosting(isBoosting);
        setJumping(isJumping);
        setSlowed(isSlowed);
      }

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
      drawCourse(now, isBoosting, isJumping, isSlowed);
      animationFrame = requestAnimationFrame(frame);
    };

    animationFrame = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animationFrame);
      lastFrameRef.current = null;
    };
  }, [announce, boardColour, calmSpeed, highVisibility, phase, reducedMotion, riderId, trail]);

  const currentStage = WAVE_RIDER_STAGES[stageIndex];
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

        <div ref={boardRef} className="wave-rider__course" data-phase={phase} data-stage={stageIndex + 1} data-high-visibility={highVisibility} data-boosting={boosting} data-jumping={jumping} data-slowed={slowed} data-player-lane={lane} tabIndex={phase === 'running' || phase === 'paused' ? 0 : -1} onKeyDown={handleBoardKeyDown} onKeyUp={handleBoardKeyUp} onBlur={() => { steerRef.current = { left: false, right: false }; }} aria-label="Wave Rider course. Hold left and right arrows or A and D for smooth steering. Drag or tap the water to steer. Press F to boost, J to super jump and Space to pause.">
          <canvas ref={canvasRef} className="wave-rider__canvas" aria-hidden="true" onPointerDown={handlePointerDown} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) steerToPointer(event); }} />

          {(phase === 'running' || phase === 'paused') && gateIndex < WAVE_RIDER_GATES.length && (
            <div className="wave-rider__question" role="status"><span>Outcome {nextGate.outcome}</span><strong>{nextGate.prompt}</strong></div>
          )}

          {phase === 'intro' && (
            <div className="wave-rider__overlay wave-rider__builder">
              <p className="wave-rider__overlay-eyebrow">Build your rider</p>
              <h3>Let's ride waves</h3>
              <fieldset className="wave-rider__rider-picks" data-control-id="bonus-wave-rider.character"><legend>Character</legend>{RIDERS.map((option) => <label key={option.id}><input type="radio" name="rider" value={option.id} checked={riderId === option.id} onChange={() => { setRiderId(option.id); if (callSign === 'Pulse' || !callSign) setCallSign(option.name); }} /><img src={assetUrl(option.asset)} alt="" /><strong>{option.name}</strong><small>{option.description}</small></label>)}</fieldset>
              <div className="wave-rider__design-grid">
                <label>Call sign<input value={callSign} maxLength={12} onChange={(event) => setCallSign(event.target.value.replace(/[^a-zA-Z0-9 -]/g, ''))} data-control-id="bonus-wave-rider.call-sign" /></label>
                <label>Board colour<select value={boardColour} onChange={(event) => setBoardColour(event.target.value)} data-control-id="bonus-wave-rider.board-colour"><option value="#ffdc5e">Solar yellow</option><option value="#55ecdc">Current teal</option><option value="#ff6f91">Coral pink</option><option value="#a988ff">Violet pulse</option></select></label>
                <label>Trail style<select value={trail} onChange={(event) => setTrail(event.target.value)} data-control-id="bonus-wave-rider.trail"><option value="spark">Energy sparks</option><option value="bubble">Bubbles</option><option value="rainbow">Spectrum</option></select></label>
              </div>
              <p>Surf an open-water course through five progressively harder science stages.</p>
              <div className="wave-rider__keymap" aria-label="Game controls"><span><kbd>←</kbd><kbd>→</kbd> steer</span><span><kbd>F</kbd> boost</span><span><kbd>J</kbd> jump</span></div>
              <button type="button" className="wave-rider__primary" aria-label="Start Stage 1" onClick={startRun} data-control-id="bonus-wave-rider.start"><Play size={20} aria-hidden="true" /> Start surfing</button>
            </div>
          )}

          {phase === 'question' && activePowerup && powerupQuestion && (
            <div className="wave-rider__overlay is-question">
              <div className="wave-rider__powerup-prize" aria-hidden="true"><img src={assetUrl(powerupAssets[activePowerup.powerup])} alt="" /></div>
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
