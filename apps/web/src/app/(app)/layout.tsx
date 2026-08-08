import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';
import { DemoBanner } from '@/components/demo-banner';
import { getActiveOrg, isDemoMode } from '@/lib/demo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const org = getActiveOrg();
  const admin = org.profiles[0];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {isDemoMode() && <DemoBanner />}
        <TopBar orgName={org.organization.name} userName={admin?.fullName ?? 'Demo User'} />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
