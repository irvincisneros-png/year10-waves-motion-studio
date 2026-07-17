import { Route, Routes } from 'react-router-dom';
import { AnnouncerProvider } from '../accessibility/LiveRegion';
import { AppLayout } from '../components/AppLayout';
import HomePage from '../routes/HomePage';
import GlossaryPage from '../routes/GlossaryPage';
import ProgressPage from '../routes/ProgressPage';
import TeacherPage from '../routes/TeacherPage';
import AboutPage from '../routes/AboutPage';
import NotFoundPage from '../routes/NotFoundPage';
import { SettingsEffects } from './SettingsEffects';

/**
 * Route table — Stage 1 ships only the shared shell routes. Workspace routes
 * (/waves, /sound, …) are added stage by stage; until then unknown URLs land
 * on the not-found page, which lists what IS available.
 *
 * Router strategy: HashRouter (see main.tsx). Hash URLs (/#/glossary) make
 * cold loads, refreshes and deep links work on ANY static host — including
 * file-less school hosting — without server-side SPA fallback configuration.
 */
export default function App() {
  return (
    <AnnouncerProvider>
      <SettingsEffects />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="glossary" element={<GlossaryPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="teacher" element={<TeacherPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AnnouncerProvider>
  );
}
