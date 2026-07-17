import { useEffect, useState } from 'react';
import { isStorageDegraded, onStorageDegraded } from '../store/safeStorage';

/**
 * Polite, visible notice shown when browser storage is denied or full and the
 * app has degraded to in-memory persistence (Stage 1 gate: storage failure
 * must not crash the app and must be communicated).
 */
export function StorageNotice() {
  const [degraded, setDegraded] = useState(isStorageDegraded());

  useEffect(() => onStorageDegraded(setDegraded), []);

  if (!degraded) return null;

  return (
    <div className="notice notice--warn" role="status">
      <p>
        <strong>Saving is unavailable on this device right now.</strong> Your
        settings and progress will work for this session but will not be kept
        after you close the page. This usually happens in private browsing or
        when storage is full.
      </p>
    </div>
  );
}
