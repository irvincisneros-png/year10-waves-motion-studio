import { describe, it, expect } from 'vitest';
import {
  nextLevelAfterSuccess,
  nextLevelAfterAttempt,
} from '../../src/store/evidenceHelpers';

describe('evidence-level progression', () => {
  it('success promotes one level and caps at secure', () => {
    expect(nextLevelAfterSuccess('not-attempted')).toBe('developing');
    expect(nextLevelAfterSuccess('developing')).toBe('secure');
    expect(nextLevelAfterSuccess('secure')).toBe('secure');
  });

  it('an incorrect attempt records the attempt but never promotes to secure or demotes', () => {
    expect(nextLevelAfterAttempt('not-attempted')).toBe('developing');
    expect(nextLevelAfterAttempt('developing')).toBe('developing');
    expect(nextLevelAfterAttempt('secure')).toBe('secure');
  });
});
