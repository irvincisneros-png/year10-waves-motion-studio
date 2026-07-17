import { useState } from 'react';
import styles from './EMSpectrumExplorer.module.css';

interface SpectrumRegion {
  name: string;
  minFreqLog: number;
  maxFreqLog: number;
  color: string;
  applications: string[];
  description: string;
}

const spectrumRegions: SpectrumRegion[] = [
  {
    name: 'Radio Waves',
    minFreqLog: 3, // 1 kHz
    maxFreqLog: 9, // 1 GHz
    color: '#ff6b6b', // red-ish
    applications: ['AM/FM Radio', 'Television Broadcasts', 'Maritime Communication'],
    description: 'Lowest frequency and energy, longest wavelength. Used for long-distance communication.'
  },
  {
    name: 'Microwaves',
    minFreqLog: 9, 
    maxFreqLog: 11.47, // ~300 GHz
    color: '#f06595', // pink
    applications: ['Wi-Fi', 'Mobile Phones', 'Microwave Ovens', 'Radar'],
    description: 'Used in radar systems and to heat water molecules in food.'
  },
  {
    name: 'Infrared',
    minFreqLog: 11.47,
    maxFreqLog: 14.6, // ~430 THz
    color: '#cc5de8', // purple
    applications: ['Thermal Imaging', 'Night Vision', 'TV Remote Controls'],
    description: 'Sensed as heat. Emitted by all warm objects.'
  },
  {
    name: 'Visible Light',
    minFreqLog: 14.6,
    maxFreqLog: 14.9, // ~750 THz
    color: '#339af0', // blue/rainbow proxy
    applications: ['Human Vision', 'Photography', 'Optical Fibres'],
    description: 'The narrow band of the spectrum that the human eye can detect.'
  },
  {
    name: 'Ultraviolet (UV)',
    minFreqLog: 14.9,
    maxFreqLog: 16.47, // ~30 PHz
    color: '#20c997', // teal
    applications: ['Sterilisation', 'Fluorescent Lamps', 'Forensics'],
    description: 'Can cause sunburn and damage DNA, but also helps humans produce Vitamin D.'
  },
  {
    name: 'X-Rays',
    minFreqLog: 16.47,
    maxFreqLog: 19, // ~10 EHz
    color: '#94d82d', // lime
    applications: ['Medical Imaging', 'Airport Security', 'Crystallography'],
    description: 'High energy waves that can pass through soft tissue but are absorbed by bone.'
  },
  {
    name: 'Gamma Rays',
    minFreqLog: 19,
    maxFreqLog: 24, // Up to infinity, cap at 10^24
    color: '#fcc419', // yellow
    applications: ['Cancer Radiotherapy', 'Sterilising Medical Equipment', 'Astronomy'],
    description: 'Highest frequency and energy, shortest wavelength. Highly penetrating and dangerous.'
  }
];

export default function EMSpectrumExplorer() {
  // Use log10 of frequency for the slider (range: 3 to 22)
  const [freqLog, setFreqLog] = useState<number>(14.75); // Start in visible light

  const frequency = Math.pow(10, freqLog);
  const speedOfLight = 299792458; // m/s
  const wavelength = speedOfLight / frequency;

  // Find active region
  const activeRegion = spectrumRegions.find(r => freqLog >= r.minFreqLog && freqLog < r.maxFreqLog) || spectrumRegions[0];

  const formatScientific = (num: number, unit: string) => {
    return (
      <span>
        {num.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-')} {unit}
      </span>
    );
  };

  const getWavelengthScale = (wl: number) => {
    if (wl > 100) return 'Building / Football Field';
    if (wl > 1) return 'Human';
    if (wl > 1e-2) return 'Honey Bee';
    if (wl > 1e-4) return 'Pinhead';
    if (wl > 1e-6) return 'Cells';
    if (wl > 1e-8) return 'Virus / Molecules';
    if (wl > 1e-10) return 'Atoms';
    return 'Atomic Nucleus';
  };

  return (
    <div className={styles.container}>
      <div className={styles.spectrumBar}>
        {spectrumRegions.map((region, idx) => {
          const width = ((region.maxFreqLog - region.minFreqLog) / (24 - 3)) * 100;
          const isActive = activeRegion.name === region.name;
          return (
            <div 
              key={idx} 
              className={`${styles.regionBlock} ${isActive ? styles.activeBlock : ''}`}
              style={{ 
                width: `${width}%`,
                backgroundColor: isActive ? region.color : 'var(--color-bg-tertiary)'
              }}
              onClick={() => setFreqLog((region.maxFreqLog + region.minFreqLog) / 2)}
            >
              <span className={styles.regionLabel}>{region.name}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.sliderContainer}>
        <label htmlFor="freqLog" className={styles.srOnly}>Frequency Log (Hz)</label>
        <input 
          id="freqLog"
          type="range" 
          min="3" 
          max="22" 
          step="0.01" 
          value={freqLog}
          onChange={(e) => setFreqLog(Number(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.sliderLabels}>
          <span>Low f, Long λ, Low Energy</span>
          <span>High f, Short λ, High Energy</span>
        </div>
      </div>

      <div className={styles.dashboard}>
        <div className={styles.metricsPanel}>
          <h3>Current Wave Properties</h3>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Frequency (f)</span>
            <span className={styles.metricValue}>{formatScientific(frequency, 'Hz')}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Wavelength (λ)</span>
            <span className={styles.metricValue}>{formatScientific(wavelength, 'm')}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Speed (c)</span>
            <span className={styles.metricValue}>3.00 × 10^8 m/s (Constant)</span>
          </div>
          <div className={styles.scaleIndicator}>
            <strong>Approximate scale:</strong> {getWavelengthScale(wavelength)}
          </div>
        </div>

        <div className={styles.infoPanel} style={{ borderTop: `4px solid ${activeRegion.color}` }}>
          <h2>{activeRegion.name}</h2>
          <p className={styles.description}>{activeRegion.description}</p>
          
          <div className={styles.applications}>
            <h4>Common Applications</h4>
            <ul>
              {activeRegion.applications.map((app, i) => (
                <li key={i}>{app}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
