/**
 * Demo seed script. Generates the deterministic demo world and prints a summary
 * of what it contains. In a live deployment this is where you would insert the
 * seeded records into Supabase (respecting organization_id / RLS). Run with:
 *   pnpm seed
 */
import { generateDemoWorld } from '../packages/database/src/demo/seed.js';

function main() {
  const world = generateDemoWorld(42);
  console.log('AION demo world generated:\n');
  for (const org of world.orgs) {
    console.log(`Organization: ${org.organization.name} (${org.organization.id})`);
    console.table({
      leads: org.leads.length,
      contacts: org.contacts.length,
      profiles: org.profiles.length,
      pipelines: org.pipelines.length,
      stages: org.stages.length,
      opportunities: org.opportunities.length,
      appointments: org.appointments.length,
      applications: org.applications.length,
      policies: org.policies.length,
      campaigns: org.campaigns.length,
      messages: org.messages.length,
      timelineEvents: org.timeline.length,
    });
  }
  console.log('\nTo load this into Supabase, insert each org’s records scoped by organization_id.');
}

main();
