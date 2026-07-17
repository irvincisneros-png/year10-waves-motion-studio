import { useState, useEffect, useRef } from 'react';
import styles from './SoundPropertiesSimulator.module.css';

export default function SoundPropertiesSimulator() {
  const [frequency, setFrequency] = useState(440); // A4
  const [amplitude, setAmplitude] = useState(50); // 0-100 scale
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialise audio context on first play to respect browser autoplay policies
  const togglePlay = () => {
    if (!isPlaying) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = frequency;
      
      // Convert amplitude 0-100 to gain 0-1 (with some logarithmic scaling for natural hearing)
      const normalizedVolume = amplitude / 100;
      gain.gain.value = normalizedVolume * normalizedVolume; // squared for exponential feel
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      
      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      setIsPlaying(true);
    } else {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      setIsPlaying(false);
    }
  };

  // Update properties live
  useEffect(() => {
    if (isPlaying && oscillatorRef.current && gainNodeRef.current) {
      oscillatorRef.current.frequency.setTargetAtTime(frequency, audioCtxRef.current!.currentTime, 0.1);
      const normalizedVolume = amplitude / 100;
      gainNodeRef.current.gain.setTargetAtTime(normalizedVolume * normalizedVolume, audioCtxRef.current!.currentTime, 0.1);
    }
  }, [frequency, amplitude, isPlaying]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch(e) {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className={styles.simulator}>
      <div className={styles.visualizerContainer}>
        <div className={styles.waveformContainer}>
           {/* Pure CSS waveform visualization */}
           <div 
             className={styles.waveform} 
             style={{ 
               transform: `scaleY(${amplitude / 50})`,
               backgroundSize: `${10000 / frequency}px 100%`,
               opacity: isPlaying ? 1 : 0.2
             }} 
           />
        </div>
      </div>
      
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Pitch (Frequency): {frequency} Hz</label>
          <input 
            type="range" 
            min="100" 
            max="1000" 
            value={frequency} 
            onChange={(e) => setFrequency(Number(e.target.value))} 
            className={styles.slider}
          />
          <div className={styles.helpText}>Higher frequency = Higher pitch. Waves are closer together.</div>
        </div>

        <div className={styles.controlGroup}>
          <label>Loudness (Amplitude): {amplitude}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={amplitude} 
            onChange={(e) => setAmplitude(Number(e.target.value))} 
            className={styles.slider}
          />
          <div className={styles.helpText}>Higher amplitude = Louder sound. Waves are taller.</div>
        </div>

        <button 
          className={`${styles.playButton} ${isPlaying ? styles.stop : ''}`} 
          onClick={togglePlay}
        >
          {isPlaying ? 'Stop Audio' : 'Play Audio Tone'}
        </button>
      </div>
    </div>
  );
}
