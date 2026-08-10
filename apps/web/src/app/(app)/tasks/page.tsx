import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { TasksBoard } from '@/components/scheduling/tasks-board';

export default function TasksPage() {
  const org = getActiveOrg();
  const members = org.profiles.map((p) => ({ id: p.id, name: p.fullName }));
  return (
    <>
      <PageHeader
        title="Shared Tasks"
        description="A shared team task board — assign, track, and complete work together."
      />
      <TasksBoard members={members} />
    </>
  );
}
