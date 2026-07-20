import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './UpdatePrompt.css';

/**
 * Service-worker update UI. The SW is registered with `registerType: 'prompt'`
 * (vite.config.ts): when a new deploy is detected, this banner offers a
 * refresh action instead of silently swapping versions mid-lesson.
 */
export function UpdatePrompt() {
  const [registrationError, setRegistrationError] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError: () => setRegistrationError(true),
  });
  const [manualUpdate, setManualUpdate] = useState<(() => void) | null>(null);

  useEffect(() => {
    const showTestablePrompt = (event: Event) => {
      const detail = (event as CustomEvent<{ update?: () => void }>).detail;
      setManualUpdate(() => detail?.update ?? (() => window.location.reload()));
    };
    const showRegistrationError = () => setRegistrationError(true);
    window.addEventListener('wavemotion:update-available', showTestablePrompt);
    window.addEventListener('wavemotion:sw-registration-error', showRegistrationError);
    return () => {
      window.removeEventListener('wavemotion:update-available', showTestablePrompt);
      window.removeEventListener('wavemotion:sw-registration-error', showRegistrationError);
    };
  }, []);

  if (!needRefresh && !manualUpdate && !registrationError) return null;

  return (
    <>
      {registrationError ? (
        <div className="update-prompt" role="status" data-testid="sw-registration-error">
          <p className="update-prompt__text">
            Offline installation is unavailable in this browser session. Keep a
            connection while using the app; your local progress still works.
          </p>
        </div>
      ) : null}
      {needRefresh || manualUpdate ? <div className="update-prompt" role="status">
      <p className="update-prompt__text">
        A new version of WaveMotion Studio is available.
      </p>
      <div className="update-prompt__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            if (manualUpdate) manualUpdate();
            else void updateServiceWorker(true);
          }}
        >
          Refresh now
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setNeedRefresh(false);
            setManualUpdate(null);
          }}
        >
          Not now
        </button>
      </div>
    </div> : null}
    </>
  );
}
