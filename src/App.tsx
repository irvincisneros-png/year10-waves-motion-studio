import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './routes/Home';
import WaveFoundations from './routes/WaveFoundations';
import EMAndSound from './routes/EMAndSound';
import LightAndOptics from './routes/LightAndOptics';
import MotionAndForces from './routes/MotionAndForces';
import Mastery from './routes/Mastery';
// Import other routes as they are created

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="wave-foundations" element={<WaveFoundations />} />
        <Route path="em-and-sound" element={<EMAndSound />} />
        <Route path="light-optics" element={<LightAndOptics />} />
        <Route path="motion-forces" element={<MotionAndForces />} />
        <Route path="mastery" element={<Mastery />} />
        <Route path="*" element={
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <h2>Module coming soon</h2>
            <p>This module is currently under development.</p>
          </div>
        } />
      </Route>
    </Routes>
  );
}

export default App;
