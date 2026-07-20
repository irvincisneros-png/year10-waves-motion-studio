const ACKNOWLEDGEMENT_KEY = 'wavemotion.audio-safety-acknowledged';

/**
 * The headphone warning is acknowledged once per browser session. Session
 * storage is deliberately best-effort: privacy modes may deny it, in which
 * case the warning is simply shown again (the safer fallback).
 */
export function hasAudioSafetyAcknowledgement(): boolean {
  try {
    return window.sessionStorage.getItem(ACKNOWLEDGEMENT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function rememberAudioSafetyAcknowledgement(): void {
  try {
    window.sessionStorage.setItem(ACKNOWLEDGEMENT_KEY, 'true');
  } catch {
    // A denied session store must never block the learning activity.
  }
}
