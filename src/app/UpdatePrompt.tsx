import { useRegisterSW } from 'virtual:pwa-register/react';
import './UpdatePrompt.css';

/**
 * Service-worker update UI. The SW is registered with `registerType: 'prompt'`
 * (vite.config.ts): when a new deploy is detected, this banner offers a
 * refresh action instead of silently swapping versions mid-lesson.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  if (!needRefresh) return null;

  return (
    <div className="update-prompt" role="status">
      <p className="update-prompt__text">
        A new version of WaveMotion Studio is available.
      </p>
      <div className="update-prompt__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            void updateServiceWorker(true);
          }}
        >
          Refresh now
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setNeedRefresh(false)}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
