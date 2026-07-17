import { Page } from '../components/Page';
import { learningMap } from '../content/workspaces';
import { outcomeMap } from '../content/outcomes';
import './HomePage.css';

/**
 * Home / learning map. Shows every planned workspace grouped by strand with
 * the outcomes it will cover. In Stage 1 no workspace is built, so each card
 * is a deliberately NON-interactive panel labelled "In development" — never a
 * clickable control with no effect. Only the shell routes are navigable.
 */
export default function HomePage() {
  return (
    <Page
      title="Home"
      heading="WaveMotion Studio"
      lead="Interactive laboratories for the NSW Year 10 Waves & Motion topic — model waves, sound, light and motion, collect evidence, and check your understanding."
    >
      <p className="home__status-note">
        The laboratories below are being built in stages and will unlock as
        they are completed and verified. The Glossary, Progress, Teacher and
        About pages are available now.
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
                  <h3>{ws.name}</h3>
                  <span className="badge badge--in-development">
                    <span aria-hidden="true">🛠</span> In development
                  </span>
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
