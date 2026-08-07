/**
 * In-memory presentation control state for the pilot demo. This is a thin,
 * process-local pointer used by /demo-control and /presentation — it does not
 * mutate the deterministic demo data (Marcus is always regenerated identically),
 * it just tracks which stage the presenter has advanced to and whether external
 * sending is (pretend-)enabled. No database, no new architecture.
 */
import { TOTAL_STAGES } from './presentation';

export interface PresentationState {
  /** 0 = not started; 1..TOTAL_STAGES = current stage reached. */
  currentStage: number;
  /** External sending is OFF by default and stays off until the pilot is approved. */
  externalSendingEnabled: boolean;
  /** Marcus is always present (deterministic seed); shown for operator clarity. */
  marcusSeeded: boolean;
  updatedAt: string;
}

const DEFAULT_STATE: PresentationState = {
  currentStage: 0,
  externalSendingEnabled: false,
  marcusSeeded: true,
  updatedAt: new Date().toISOString(),
};

// Module singleton (per server process).
let state: PresentationState = { ...DEFAULT_STATE };

export function getPresentationState(): PresentationState {
  return state;
}

export type DemoControlAction =
  | { type: 'reset_marcus' }
  | { type: 'seed_stage'; stage: number }
  | { type: 'set_external_sending'; enabled: boolean }
  | { type: 'restore' };

export function applyDemoControl(action: DemoControlAction): PresentationState {
  switch (action.type) {
    case 'reset_marcus':
      // Marcus data is immutable/deterministic; "reset" returns the pointer to
      // the start of his journey so the demo can be re-run cleanly.
      state = { ...state, currentStage: 0, updatedAt: new Date().toISOString() };
      break;
    case 'seed_stage':
      state = {
        ...state,
        currentStage: Math.max(0, Math.min(TOTAL_STAGES, Math.floor(action.stage))),
        updatedAt: new Date().toISOString(),
      };
      break;
    case 'set_external_sending':
      state = { ...state, externalSendingEnabled: action.enabled, updatedAt: new Date().toISOString() };
      break;
    case 'restore':
      state = { ...DEFAULT_STATE, updatedAt: new Date().toISOString() };
      break;
  }
  return state;
}
