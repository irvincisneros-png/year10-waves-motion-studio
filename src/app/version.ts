/**
 * Build/service-worker version, surfaced in the About page so users and the
 * teacher can confirm which build is cached on a device. `__APP_VERSION__` and
 * `__BUILD_TIME__` are injected at build time by Vite (see vite.config.ts).
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0-dev';

export const BUILD_TIME: string =
  typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'development build';
