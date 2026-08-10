'use client';

import { useEffect, useState } from 'react';
import { Card, Badge } from '@aion/ui';
import type { SharedTask, TaskStatus } from '@aion/scheduling';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export function TasksBoard({ members }: { members: { id: string; name: string }[] }) {
  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [due, setDue] = useState('');
  const nameOf = (id?: string | null) => members.find((m) => m.id === id)?.name ?? 'Unassigned';

  async function load() {
    const res = await fetch('/api/tasks');
    const json = await res.json();
    setTasks(json.tasks ?? []);
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        assigneeId: assigneeId || undefined,
        dueAt: due ? new Date(due).toISOString() : undefined,
      }),
    });
    setTitle('');
    setAssigneeId('');
    setDue('');
    await load();
  }

  async function setStatus(taskId: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    await fetch('/api/tasks/status', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ taskId, status }),
    });
    void load();
  }

  return (
    <div>
      {/* Create */}
      <Card className="mb-4 p-4">
        <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-400">New task</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Confirm Thursday’s bookings"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-blue"
            >
              <option value="" className="bg-navy">
                Unassigned
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-navy">
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Due</label>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-blue"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-bright"
          >
            + Add
          </button>
        </form>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500">Loading tasks…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-200">{col.label}</p>
                  <Badge tone="neutral">{items.length}</Badge>
                </div>
                <div className="space-y-2 p-2">
                  {items.map((t) => (
                    <div key={t.id} className="rounded-lg border border-white/10 bg-navy-elevated p-3">
                      <p className={`text-sm ${t.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {t.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{nameOf(t.assigneeId)}</span>
                        {t.dueAt && <span>· due {new Date(t.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        {COLUMNS.filter((c) => c.key !== t.status).map((c) => (
                          <button
                            key={c.key}
                            onClick={() => setStatus(t.id, c.key)}
                            className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-white/10"
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="px-1 py-4 text-center text-[11px] text-slate-600">Empty</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
