import { useAnnouncer } from '../../accessibility/LiveRegion';
import { MAX_SAFE_GAIN } from './toneAudio';
import type { ToneAudio } from './useToneAudio';

/**
 * The Web Audio safety gate (SCIENCE_REVIEW §12.5, CONTROL_INVENTORY §1/§4):
 * headphone warning → acknowledge → "Enable sound" → mute/unmute. If the API is
 * unsupported or enabling fails, the panel shows a clear "visual mode only"
 * notice and never claims success. Visual-only mode is an explicit, always-
 * available opt-out that is auto-enabled and locked when audio is unavailable.
 *
 * Audio-producing controls (frequency/level sliders) stay fully operable as
 * visual controls at all times — this panel only gates the AUDIO path.
 */
export interface AudioEnablePanelProps {
  audio: ToneAudio;
  /** Headphone-safety acknowledgement state (one-shot per session). */
  acknowledged: boolean;
  onAcknowledge: () => void;
  /** Explicit visual-only opt-in. */
  visualOnly: boolean;
  onVisualOnly: (value: boolean) => void;
  /** Current output level 0–1 (for the gain readout once enabled). */
  level: number;
}

export function AudioEnablePanel({
  audio,
  acknowledged,
  onAcknowledge,
  visualOnly,
  onVisualOnly,
  level,
}: AudioEnablePanelProps) {
  const { announce } = useAnnouncer();

  // Audio is unavailable when the API is absent, enabling failed, or the student
  // chose visual-only. In every case the module is fully usable without sound.
  const audioUnavailable = !audio.supported || audio.phase === 'failed';
  const forcedVisualOnly = audioUnavailable; // auto-enable + lock the toggle
  const effectiveVisualOnly = visualOnly || forcedVisualOnly;

  const enable = () => {
    const ok = audio.enable();
    announce(
      ok
        ? 'Sound enabled and muted. Unmute and raise the level to hear the tone.'
        : 'Sound is unavailable on this device. The activity continues in visual-only mode.',
    );
  };

  const gainPct = Math.round(level * MAX_SAFE_GAIN * 100);

  return (
    <div className="card stack audio-panel" data-testid="audio-panel">
      <h2>Sound (optional)</h2>

      {forcedVisualOnly ? (
        <p className="notice notice--warn" data-testid="audio-unavailable-notice">
          <span aria-hidden="true">🔇</span>
          <span>
            Sound unavailable — visual mode only. Everything in this activity works
            without sound: the oscilloscope, spectrum and readouts show exactly
            what the tone is doing.
          </span>
        </p>
      ) : (
        <>
          <p className="notice notice--warn" data-testid="headphone-warning">
            <span aria-hidden="true">🎧</span>
            <span>
              <strong>Headphone safety:</strong> if you are using headphones, take
              them off or turn the volume right down first. Sound always starts
              muted and at a low, capped level. You can work in visual-only mode
              instead.
            </span>
          </p>

          {!acknowledged ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                onAcknowledge();
                announce('Headphone safety acknowledged.');
              }}
              data-testid="headphone-ack"
              data-control-id="sound-lab.headphone-warning-ack"
            >
              I understand — start at a low level
            </button>
          ) : audio.phase === 'locked' ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={enable}
              disabled={effectiveVisualOnly}
              aria-disabled={effectiveVisualOnly}
              data-testid="enable-sound"
              data-control-id="global.enable-sound-button"
            >
              Enable sound for this activity
            </button>
          ) : audio.phase === 'enabled' ? (
            <div className="audio-panel__enabled">
              <p className="sim-control__value" data-testid="sound-enabled-status" role="status">
                <span aria-hidden="true">✓</span> Sound enabled ·{' '}
                {audio.muted ? 'muted' : `volume ${gainPct}%`}
              </p>
              <button
                type="button"
                className="btn"
                aria-pressed={audio.muted}
                onClick={() => audio.setMuted(!audio.muted)}
                data-testid="mute-sound"
                data-control-id="global.mute-button"
              >
                <span aria-hidden="true">{audio.muted ? '🔇' : '🔊'}</span>
                {audio.muted ? 'Unmute sound' : 'Mute sound'}
              </button>
            </div>
          ) : null}
        </>
      )}

      <label className="check-row" data-control-id="sound-lab.visual-only-mode-toggle">
        <input
          type="checkbox"
          checked={effectiveVisualOnly}
          disabled={forcedVisualOnly}
          aria-disabled={forcedVisualOnly}
          aria-describedby={forcedVisualOnly ? 'visual-only-forced-note' : undefined}
          onChange={(e) => onVisualOnly(e.target.checked)}
          data-testid="visual-only-toggle"
        />
        Visual-only mode (no sound)
      </label>
      {forcedVisualOnly ? (
        <p id="visual-only-forced-note" className="seg-control__note">
          Locked on because Web Audio is not available here.
        </p>
      ) : null}
    </div>
  );
}
