import { ArrowRight, Check, Gamepad2, LockKeyhole, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import './WaveRunnerBrief.css';

export type WaveRunnerStepState = 'complete' | 'active' | 'locked';

export interface WaveRunnerStep {
  label: string;
  state: WaveRunnerStepState;
}

export function WaveRunnerBrief({
  sector,
  title,
  objective,
  status,
  points,
  complete = false,
  theme,
  steps,
}: {
  sector: string;
  title: string;
  objective: string;
  status: string;
  points: number;
  complete?: boolean;
  theme: 'transmission' | 'relay' | 'observatory' | 'spectrum';
  steps: readonly WaveRunnerStep[];
}) {
  return (
    <aside
      className={`wave-runner wave-runner--${theme}${complete ? ' is-complete' : ''}`}
      aria-label={`${title} mission status`}
    >
      <div className="wave-runner__art" aria-hidden="true">
        <div className="wave-runner__orbit wave-runner__orbit--outer" />
        <div className="wave-runner__orbit wave-runner__orbit--inner" />
        <img
          src={`${import.meta.env.BASE_URL}assets/game/pulse-wave-runner.png`}
          alt=""
          loading="eager"
          decoding="async"
        />
      </div>

      <div className="wave-runner__brief">
        <div className="wave-runner__topline">
          <p><Sparkles size={15} aria-hidden="true" /> Wave Runner mission · {sector}</p>
          <span className="wave-runner__xp"><Star size={14} aria-hidden="true" /> {points} XP</span>
        </div>
        <h2>{title}</h2>
        <p className="wave-runner__objective">{objective}</p>

        <ol className="wave-runner__steps" aria-label="Mission progress">
          {steps.map((step, index) => (
            <li key={step.label} data-state={step.state}>
              <span className="wave-runner__step-icon" aria-hidden="true">
                {step.state === 'complete' ? <Check size={15} /> : step.state === 'locked' ? <LockKeyhole size={13} /> : index + 1}
              </span>
              <span>{step.label}</span>
            </li>
          ))}
        </ol>

        <p className="wave-runner__status" role="status">
          <span aria-hidden="true" />
          {complete ? 'Mission mastered · ' : 'Pulse says · '}{status}
        </p>
        {complete ? (
          <Link to="/bonus/wave-rider" className="wave-runner__bonus">
            <Gamepad2 size={16} aria-hidden="true" /> Bonus unlocked: play Wave Rider
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
