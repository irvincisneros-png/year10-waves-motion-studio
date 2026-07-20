import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_SAFE_GAIN, ToneAudioController } from '../../../src/simulations/sound/toneAudio';

interface AudioProbe {
  constructed: number;
  started: number;
  closed: number;
  targets: number[];
}

const originalAudioContext = Object.getOwnPropertyDescriptor(window, 'AudioContext');

function installAudioContext(options: { rejectResume?: boolean } = {}) {
  const probe: AudioProbe = { constructed: 0, started: 0, closed: 0, targets: [] };

  class FakeParam {
    value = 0;
    setTargetAtTime(value: number) {
      this.value = value;
      probe.targets.push(value);
    }
  }

  class FakeContext {
    state: AudioContextState = 'suspended';
    currentTime = 0;
    destination = {};
    constructor() {
      probe.constructed += 1;
    }
    createGain() {
      return { gain: new FakeParam(), connect: vi.fn() };
    }
    createOscillator() {
      return {
        type: 'sine',
        frequency: new FakeParam(),
        connect: vi.fn(),
        start: () => {
          probe.started += 1;
        },
        stop: vi.fn(),
      };
    }
    async resume() {
      if (options.rejectResume) throw new Error('audio denied');
      this.state = 'running';
    }
    async close() {
      probe.closed += 1;
      this.state = 'closed';
    }
  }

  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    value: FakeContext,
  });
  return probe;
}

afterEach(() => {
  if (originalAudioContext) Object.defineProperty(window, 'AudioContext', originalAudioContext);
  else Reflect.deleteProperty(window, 'AudioContext');
});

describe('Web Audio safety controller', () => {
  it('constructs no AudioContext before explicit enable and starts muted', async () => {
    const probe = installAudioContext();
    const controller = new ToneAudioController();
    expect(probe.constructed).toBe(0);
    expect(await controller.enable()).toBe(true);
    expect(probe.constructed).toBe(1);
    expect(probe.started).toBe(1);
    expect(probe.targets.at(-1)).toBe(0);
    controller.stop();
  });

  it('hard-caps requested output and returns to zero when muted', async () => {
    const probe = installAudioContext();
    const controller = new ToneAudioController();
    expect(await controller.enable()).toBe(true);
    controller.setLevel(99);
    controller.setMuted(false);
    expect(probe.targets.at(-1)).toBe(MAX_SAFE_GAIN);
    controller.setMuted(true);
    expect(probe.targets.at(-1)).toBe(0);
    controller.stop();
  });

  it('closes the partially built graph and reports failure when resume is denied', async () => {
    const probe = installAudioContext({ rejectResume: true });
    const controller = new ToneAudioController();
    expect(await controller.enable()).toBe(false);
    expect(controller.running).toBe(false);
    expect(probe.closed).toBe(1);
  });
});
