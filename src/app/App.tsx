import { Route, Routes } from 'react-router-dom';
import { AnnouncerProvider } from '../accessibility/LiveRegion';
import { AppLayout } from '../components/AppLayout';
import HomePage from '../routes/HomePage';
import GlossaryPage from '../routes/GlossaryPage';
import ProgressPage from '../routes/ProgressPage';
import TeacherPage from '../routes/TeacherPage';
import AboutPage from '../routes/AboutPage';
import NotFoundPage from '../routes/NotFoundPage';
import { WavesLayout } from '../simulations/wave-foundations/WavesLayout';
import WavesHubPage from '../simulations/wave-foundations/WavesHubPage';
import MediumChambersPage from '../simulations/wave-foundations/MediumChambersPage';
import EnergyTransferPage from '../simulations/wave-foundations/EnergyTransferPage';
import WaveTypesPage from '../simulations/wave-foundations/WaveTypesPage';
import MeasurementLabPage from '../simulations/wave-foundations/MeasurementLabPage';
import WaveCheckPage from '../simulations/wave-foundations/WaveCheckPage';
import WaveExplainPage from '../simulations/wave-foundations/WaveExplainPage';
import WaveConnectPage from '../simulations/wave-foundations/WaveConnectPage';
import { SettingsEffects } from './SettingsEffects';

/**
 * Route table — shell routes (Stage 1) + the wave-foundations workspace
 * (Stage 2). Later workspace routes (/sound, /light, …) are added stage by
 * stage; until then unknown URLs land on the not-found page, which lists what
 * IS available.
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
          <Route path="waves" element={<WavesLayout />}>
            <Route index element={<WavesHubPage />} />
            <Route path="medium" element={<MediumChambersPage />} />
            <Route path="energy" element={<EnergyTransferPage />} />
            <Route path="types" element={<WaveTypesPage />} />
            <Route path="measure" element={<MeasurementLabPage />} />
            <Route path="check" element={<WaveCheckPage />} />
            <Route path="explain" element={<WaveExplainPage />} />
            <Route path="connect" element={<WaveConnectPage />} />
          </Route>
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
