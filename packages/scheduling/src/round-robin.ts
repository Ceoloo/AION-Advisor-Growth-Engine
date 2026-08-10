/**
 * Round-robin ("round table") assignment. Deterministic: given the members
 * available for a slot and how many appointments each already holds, pick the
 * least-busy member, breaking ties by the member's order on the calendar. This
 * distributes bookings evenly and reproducibly.
 */
export interface RoundRobinInput {
  /** Members eligible for this slot, in calendar order. */
  availableMemberIds: string[];
  /** Current appointment counts by member id (missing = 0). */
  countsByMember?: Record<string, number>;
  /** Optional explicit choice (e.g., client picked a specific member). */
  preferredMemberId?: string;
}

export function pickRoundRobin(input: RoundRobinInput): string | null {
  const { availableMemberIds, countsByMember = {}, preferredMemberId } = input;
  if (availableMemberIds.length === 0) return null;
  if (preferredMemberId && availableMemberIds.includes(preferredMemberId)) return preferredMemberId;

  let best = availableMemberIds[0]!;
  let bestCount = countsByMember[best] ?? 0;
  for (let i = 1; i < availableMemberIds.length; i++) {
    const id = availableMemberIds[i]!;
    const count = countsByMember[id] ?? 0;
    if (count < bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}
