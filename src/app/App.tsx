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
import { SoundLayout } from '../simulations/sound/SoundLayout';
import SoundHubPage from '../simulations/sound/SoundHubPage';
import CompressionPage from '../simulations/sound/CompressionPage';
import PitchLoudnessPage from '../simulations/sound/PitchLoudnessPage';
import DopplerPage from '../simulations/sound/DopplerPage';
import SoundCheckPage from '../simulations/sound/SoundCheckPage';
import SoundExplainPage from '../simulations/sound/SoundExplainPage';
import SoundConnectPage from '../simulations/sound/SoundConnectPage';
import { LightVisionLayout } from '../simulations/optics/LightVisionLayout';
import LightHubPage from '../simulations/optics/LightHubPage';
import VisionPage from '../simulations/optics/VisionPage';
import LightPropertiesPage from '../simulations/optics/LightPropertiesPage';
import LightApplicationsPage from '../simulations/optics/LightApplicationsPage';
import LightCheckPage from '../simulations/optics/LightCheckPage';
import LightExplainPage from '../simulations/optics/LightExplainPage';
import LightConnectPage from '../simulations/optics/LightConnectPage';
import { MotionForcesLayout } from '../simulations/motion-forces/MotionForcesLayout';
import { ForcesHubPage, MotionHubPage } from '../simulations/motion-forces/MotionForcesHubPages';
import MotionTrackPage from '../simulations/motion-forces/MotionTrackPage';
import MotionDiagramsPage from '../simulations/motion-forces/MotionDiagramsPage';
import MotionGraphsPage from '../simulations/motion-forces/MotionGraphsPage';
import ForceVectorsPage from '../simulations/motion-forces/ForceVectorsPage';
import CartInvestigationPage from '../simulations/motion-forces/CartInvestigationPage';
import NewtonApplicationsPage from '../simulations/motion-forces/NewtonApplicationsPage';
import ForcesCalculationsPage from '../simulations/motion-forces/ForcesCalculationsPage';
import { MotionForcesCheckPage } from '../simulations/motion-forces/MotionForcesCheckPage';
import { MotionForcesExplainPage } from '../simulations/motion-forces/MotionForcesExplainPage';
import { ForcesConnectPage, MotionConnectPage } from '../simulations/motion-forces/MotionForcesConnectPage';
import { SettingsEffects } from './SettingsEffects';
import { AstronomyPage, HearingPage, SocietyPage, SpectrumPage, UltrasoundPage } from '../simulations/completion/StageSixPages';
import MasteryPage from '../simulations/completion/MasteryPage';
import Outcome711Page from '../simulations/outcomes/Outcome711Page';
import Outcome712Page from '../simulations/outcomes/Outcome712Page';
import Outcome713Page from '../simulations/outcomes/Outcome713Page';
import Outcome714Page from '../simulations/outcomes/Outcome714Page';

/**
 * Route table — shell routes (Stage 1) + the wave-foundations workspace
 * (Stages 2–4). Later workspace routes (/motion, …) are added stage by
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
          <Route path="simulators/7.1.1" element={<Outcome711Page />} />
          <Route path="simulators/7.1.2" element={<Outcome712Page />} />
          <Route path="simulators/7.1.3" element={<Outcome713Page />} />
          <Route path="simulators/7.1.4" element={<Outcome714Page />} />
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
          <Route path="sound" element={<SoundLayout />}>
            <Route index element={<SoundHubPage />} />
            <Route path="compression" element={<CompressionPage />} />
            <Route path="pitch-loudness" element={<PitchLoudnessPage />} />
            <Route path="doppler" element={<DopplerPage />} />
            <Route path="check" element={<SoundCheckPage />} />
            <Route path="explain" element={<SoundExplainPage />} />
            <Route path="connect" element={<SoundConnectPage />} />
          </Route>
          <Route element={<LightVisionLayout />}>
            <Route path="light" element={<LightHubPage />} />
            <Route path="vision" element={<VisionPage />} />
            <Route path="light/properties" element={<LightPropertiesPage />} />
            <Route path="light/applications" element={<LightApplicationsPage />} />
            <Route path="light/check" element={<LightCheckPage />} />
            <Route path="light/explain" element={<LightExplainPage />} />
            <Route path="light/connect" element={<LightConnectPage />} />
          </Route>
          <Route element={<MotionForcesLayout />}>
            <Route path="motion" element={<MotionHubPage />} />
            <Route path="motion/track" element={<MotionTrackPage />} />
            <Route path="motion/diagrams" element={<MotionDiagramsPage />} />
            <Route path="motion/graphs" element={<MotionGraphsPage />} />
            <Route path="motion/check" element={<MotionForcesCheckPage group="motion" />} />
            <Route path="motion/explain" element={<MotionForcesExplainPage group="motion" />} />
            <Route path="motion/connect" element={<MotionConnectPage />} />
            <Route path="forces" element={<ForcesHubPage />} />
            <Route path="forces/vectors" element={<ForceVectorsPage />} />
            <Route path="forces/cart" element={<CartInvestigationPage />} />
            <Route path="forces/applications" element={<NewtonApplicationsPage />} />
            <Route path="forces/calculations" element={<ForcesCalculationsPage />} />
            <Route path="forces/check" element={<MotionForcesCheckPage group="forces" />} />
            <Route path="forces/explain" element={<MotionForcesExplainPage group="forces" />} />
            <Route path="forces/connect" element={<ForcesConnectPage />} />
          </Route>
          <Route path="spectrum" element={<SpectrumPage />} />
          <Route path="hearing" element={<HearingPage />} />
          <Route path="ultrasound" element={<UltrasoundPage />} />
          <Route path="astronomy" element={<AstronomyPage />} />
          <Route path="society" element={<SocietyPage />} />
          <Route path="mastery" element={<MasteryPage />} />
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
