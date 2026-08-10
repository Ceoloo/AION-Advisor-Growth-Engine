import { describe, expect, it } from 'vitest';
import {
  CLIENT_CONFIGS,
  ClientConfigSchema,
  defaultLeadOwner,
  getActiveClient,
  getClientById,
  getClientByOrg,
  getPrimaryClient,
  isClientLiveApproved,
  leadPool,
  parseClientConfig,
  type ClientConfig,
} from '../index.js';
import { benPeretz } from '../configs/ben-peretz.js';

describe('client registry', () => {
  it('registers at least Ben (primary) and a second advisor', () => {
    expect(CLIENT_CONFIGS.length).toBeGreaterThanOrEqual(2);
    expect(getPrimaryClient().clientId).toBe('ben-peretz');
  });

  it('every registered config passes schema validation', () => {
    for (const c of CLIENT_CONFIGS) {
      expect(ClientConfigSchema.safeParse(c).success).toBe(true);
    }
  });

  it('looks clients up by id and organization', () => {
    expect(getClientById('ben-peretz')?.displayName).toContain('Ben Peretz');
    expect(getClientByOrg('org_ben-peretz')?.clientId).toBe('ben-peretz');
    expect(getClientById('nope')).toBeUndefined();
  });

  it('has a demo journey only on the primary pilot client', () => {
    expect(getClientById('ben-peretz')?.demoJourney).toBe('marcus-johnson');
    expect(getClientById('maria-santos')?.demoJourney).toBeUndefined();
  });
});

describe('active client resolution', () => {
  it('defaults to the primary client with no env override', () => {
    expect(getActiveClient({} as NodeJS.ProcessEnv).clientId).toBe('ben-peretz');
  });

  it('honors AION_ACTIVE_CLIENT when it names a registered client', () => {
    expect(getActiveClient({ AION_ACTIVE_CLIENT: 'maria-santos' } as NodeJS.ProcessEnv).clientId).toBe(
      'maria-santos',
    );
  });

  it('falls back to primary for an unknown client id (safe by default)', () => {
    expect(getActiveClient({ AION_ACTIVE_CLIENT: 'ghost' } as NodeJS.ProcessEnv).clientId).toBe(
      'ben-peretz',
    );
  });
});

describe('lead routing helpers', () => {
  it('Ben is a solo practice — one lead owner', () => {
    const ben = getClientById('ben-peretz')!;
    expect(defaultLeadOwner(ben)?.name).toBe('Ben Peretz');
    expect(leadPool(ben)).toHaveLength(1);
  });

  it('Maria has a two-person lead pool', () => {
    const maria = getClientById('maria-santos')!;
    expect(leadPool(maria).map((m) => m.name)).toEqual(['Maria Santos', 'Luis Ramirez']);
  });
});

describe('go-live gating via config', () => {
  it('Ben is approved + compliance-approved → live-approved', () => {
    expect(isClientLiveApproved(getClientById('ben-peretz')!)).toBe(true);
  });
  it('Maria is mid-onboarding → NOT live-approved', () => {
    expect(isClientLiveApproved(getClientById('maria-santos')!)).toBe(false);
  });
});

describe('schema validation guards', () => {
  it('rejects a config whose organizationId does not match its slug', () => {
    const bad = { ...benPeretz, organizationId: 'org_wrong' } as ClientConfig;
    expect(() => parseClientConfig(bad)).toThrow(/organizationId must equal/);
  });

  it('rejects a config with no lead-receiving team member', () => {
    const bad = {
      ...benPeretz,
      team: benPeretz.team.map((m) => ({ ...m, receivesLeads: false })),
    } as ClientConfig;
    expect(() => parseClientConfig(bad)).toThrow(/must receive leads/);
  });

  it('rejects a non-kebab-case clientId', () => {
    const bad = { ...benPeretz, clientId: 'Ben Peretz' } as ClientConfig;
    expect(() => parseClientConfig(bad)).toThrow(/Invalid ClientConfig/);
  });
});
