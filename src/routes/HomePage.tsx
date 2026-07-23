import { ArrowRight, Beaker, Gamepad2, Sparkles, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import {
  OUTCOME_LAUNCHERS,
  OUTCOME_LAUNCHER_GROUPS,
} from '../content/outcomeLaunchers';
import './HomePage.css';

/** Outcome-first launcher gallery. Each card represents one active dot point. */
export default function HomePage() {
  const canonicalLaunchers = OUTCOME_LAUNCHERS.filter(
    (launcher) => launcher.experienceStatus !== 'legacy',
  );

  return (
    <Page title="Simulators" heading="Choose a science simulator">
      <section className="gallery-hero" aria-labelledby="gallery-intro">
        <div>
          <p className="gallery-hero__eyebrow">
            <Sparkles size={16} aria-hidden="true" /> WaveMotion Studio
          </p>
          <h2 id="gallery-intro">One outcome. One interactive world.</h2>
          <p>
            Launch a syllabus dot point directly, change the science, and see
            the result. No lesson sequence or worksheet stands between you and
            the experiment.
          </p>
        </div>
        <div className="gallery-hero__prototype" aria-label="Purpose-built simulator status">
          <span>Purpose-built simulators</span>
          <strong>{canonicalLaunchers.map((launcher) => launcher.code).join(' and ')} are ready</strong>
        </div>
      </section>

      <p className="gallery-status" role="status">
        <strong>24 active outcomes</strong> are represented below. The new
        simulator-first design is live for {canonicalLaunchers.length} outcomes; existing models remain
        available while each outcome receives its purpose-built mode.
      </p>

      {OUTCOME_LAUNCHER_GROUPS.map((group) => {
        const launchers = OUTCOME_LAUNCHERS.filter((item) =>
          item.code.startsWith(group.id),
        );
        return (
          <section
            key={group.id}
            className={`outcome-group outcome-group--${group.accent}`}
            aria-labelledby={`outcome-group-${group.id}`}
          >
            <div className="outcome-group__heading">
              <span>{group.id}</span>
              <h2 id={`outcome-group-${group.id}`}>{group.title}</h2>
            </div>
            <div className="outcome-gallery">
              {launchers.map((launcher) => {
                const isCanonical = launcher.experienceStatus !== 'legacy';
                return (
                  <article
                    key={launcher.code}
                    className={`outcome-card${isCanonical ? ' outcome-card--gold' : ''}`}
                  >
                    <div className="outcome-card__meta">
                      <span className="outcome-card__code">{launcher.code}</span>
                      <span
                        className={`outcome-card__status outcome-card__status--${launcher.experienceStatus}`}
                      >
                        {isCanonical ? 'New simulator' : 'Existing model'}
                      </span>
                    </div>
                    <h3>{launcher.wording}</h3>
                    <p className="outcome-card__activity">
                      <Beaker size={16} aria-hidden="true" />
                      {launcher.activity}
                    </p>
                    <Link
                      to={launcher.route}
                      className={`outcome-card__launch${isCanonical ? ' outcome-card__launch--primary' : ''}`}
                      aria-label={`${isCanonical ? 'Launch simulator' : 'Open existing model'} for outcome ${launcher.code}: ${launcher.wording}`}
                    >
                      {isCanonical ? 'Launch simulator' : 'Open existing model'}
                      <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="bonus-rider" aria-labelledby="bonus-rider-title">
        <div className="bonus-rider__art" aria-hidden="true">
          <div className="bonus-rider__orbit" />
          <img
            src={`${import.meta.env.BASE_URL}assets/game/pulse-wave-runner.png`}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="bonus-rider__copy">
          <p className="bonus-rider__eyebrow"><Gamepad2 size={16} aria-hidden="true" /> Bonus challenge</p>
          <h2 id="bonus-rider-title">Surf the science in Wave Rider</h2>
          <p>
            Steer through a fast arcade course, dodge hazards, collect boosts
            and choose the correct science gates before your hearts run out.
          </p>
          <div className="bonus-rider__tags" aria-label="Wave Rider topics">
            <span><Waves size={14} aria-hidden="true" /> Energy transfer</span>
            <span>λ = v/f</span>
            <span>Wave features</span>
          </div>
          <Link to="/bonus/wave-rider" className="bonus-rider__launch">
            Play Wave Rider <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

    </Page>
  );
}
