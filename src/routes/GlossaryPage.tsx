import { Page } from '../components/Page';
import { glossary } from '../content/glossary';
import './GlossaryPage.css';

const STRAND_LABELS: Record<string, string> = {
  waves: 'Waves',
  sound: 'Sound',
  light: 'Light',
  motion: 'Motion',
  forces: 'Forces',
};

/** Glossary of key terms, alphabetical, with the strand shown as a text chip. */
export default function GlossaryPage() {
  const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term));

  return (
    <Page
      title="Glossary"
      lead="Key terms for the Waves & Motion topic, in plain language. Each laboratory restates the exact scientific definition where you use it."
    >
      <dl className="glossary">
        {sorted.map((entry) => (
          <div key={entry.term} className="glossary__entry card">
            <dt>
              {entry.term}{' '}
              <span className="chip">{STRAND_LABELS[entry.strand]}</span>
            </dt>
            <dd>{entry.definition}</dd>
          </div>
        ))}
      </dl>
    </Page>
  );
}
