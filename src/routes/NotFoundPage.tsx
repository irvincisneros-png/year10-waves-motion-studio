import { Link } from 'react-router-dom';
import { Page } from '../components/Page';

/** 404 — helpful not-found page with navigation back to real routes. */
export default function NotFoundPage() {
  return (
    <Page
      title="Page not found"
      lead="That address does not exist in this release of WaveMotion Studio. The laboratories unlock in stages, so a link that worked elsewhere may not be available yet."
    >
      <p>You can go to:</p>
      <ul>
        <li>
          <Link to="/">Home — the learning map</Link>
        </li>
        <li>
          <Link to="/glossary">Glossary</Link>
        </li>
        <li>
          <Link to="/progress">Progress</Link>
        </li>
        <li>
          <Link to="/teacher">Teacher tools</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
      </ul>
    </Page>
  );
}
