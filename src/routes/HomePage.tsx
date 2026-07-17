import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import { learningMap } from '../content/workspaces';
import { outcomeMap } from '../content/outcomes';
import './HomePage.css';

/**
 * Home / learning map. Shows every planned workspace grouped by strand with
 * the outcomes it will cover. Available workspaces link to their route; the
 * rest are deliberately NON-interactive panels labelled "In development" —
 * never a clickable control with no effect.
 */
export default function HomePage() {
  return (
    <Page
      title="Home"
      heading="WaveMotion Studio"
      lead="Interactive laboratories for the NSW Year 10 Waves & Motion topic — model waves, sound, light and motion, collect evidence, and check your understanding."
    >
      <p className="home__status-note">
        The laboratories below unlock as they are completed and verified. The
        Wave foundations laboratory is open now, along with the Glossary,
        Progress, Teacher and About pages.
      </p>

      {learningMap.map((group) => (
        <section
          key={group.id}
          className={`strand strand--${group.accent}`}
          aria-labelledby={`strand-${group.id}`}
        >
          <h2 id={`strand-${group.id}`}>{group.title}</h2>
          <p className="strand__blurb">{group.blurb}</p>
          <div className="strand__grid">
            {group.workspaces.map((ws) => (
              <article key={ws.id} className="card workspace-card">
                <div className="workspace-card__top">
                  <h3>
                    {ws.status === 'available' && ws.route ? (
                      <Link to={ws.route}>{ws.name}</Link>
                    ) : (
                      ws.name
                    )}
                  </h3>
                  {ws.status === 'available' ? (
                    <span className="badge badge--available">
                      <span aria-hidden="true">✓</span> Available
                    </span>
                  ) : (
                    <span className="badge badge--in-development">
                      <span aria-hidden="true">🛠</span> In development
                    </span>
                  )}
                </div>
                <p>{ws.summary}</p>
                {ws.outcomeCodes.length > 0 ? (
                  <ul
                    role="list"
                    className="workspace-card__outcomes"
                    aria-label={`Syllabus outcomes covered by ${ws.name}`}
                  >
                    {ws.outcomeCodes.map((code) => (
                      <li key={code}>
                        <span className="chip" title={outcomeMap[code]?.text}>
                          {code}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {ws.note ? (
                  <p className="workspace-card__note">{ws.note}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </Page>
  );
}
