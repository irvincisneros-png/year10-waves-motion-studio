import { Link } from 'react-router-dom';
import { Page } from '../components/Page';

/** 404 — helpful not-found page with navigation back to real routes. */
export default function NotFoundPage() {
  return (
    <Page
      title="Page not found"
      lead="That address does not exist in this release of WaveMotion Studio. Choose an active outcome simulator from the gallery."
    >
      <p>You can go to:</p>
      <ul>
        <li>
          <Link to="/">All outcome simulators</Link>
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
