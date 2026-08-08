import { Card, Badge } from '@aion/ui';
import { permissionsForRole } from '@aion/auth';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { initials } from '@/lib/format';

export default function TeamPage() {
  const org = getActiveOrg();
  const roleByProfile = new Map(org.memberships.map((m) => [m.profileId, m.role]));

  return (
    <>
      <PageHeader
        title="Team"
        description="Members, roles, and permissions. Role-based access is enforced by RLS and the RBAC layer."
        actions={
          <button className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright">
            + Invite member
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {org.profiles.map((p) => {
          const role = roleByProfile.get(p.id) ?? 'read_only_analyst';
          const perms = permissionsForRole(role);
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-blue/20 text-sm font-semibold text-blue-200">
                  {initials(p.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{p.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{p.email}</p>
                </div>
                <Badge tone="blue">{role.replace(/_/g, ' ')}</Badge>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                {perms.length} permissions · {perms.slice(0, 4).join(', ')}
                {perms.length > 4 ? '…' : ''}
              </p>
            </Card>
          );
        })}
      </div>
    </>
  );
}
