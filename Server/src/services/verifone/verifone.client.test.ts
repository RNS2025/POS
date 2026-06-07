import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('Verifone simulator mode', () => {
  it('defaults to simulator enabled in config', async () => {
    process.env.VERIFONE_SIMULATOR = 'true';
    const { config } = await import('../../infra/config.js');
    assert.equal(config.verifoneSimulator, true);
  });
});
