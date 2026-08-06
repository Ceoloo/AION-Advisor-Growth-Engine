/** Sidebar navigation model. Icons are inline emoji to avoid an icon dependency. */
export interface NavItem {
  href: string;
  label: string;
  icon: string;
  group: 'Overview' | 'Sales' | 'Engagement' | 'Operations';
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', group: 'Overview' },
  { href: '/analytics', label: 'Analytics', icon: '📈', group: 'Overview' },
  { href: '/leads', label: 'Leads', icon: '🎯', group: 'Sales' },
  { href: '/pipeline', label: 'Pipeline', icon: '🧭', group: 'Sales' },
  { href: '/appointments', label: 'Appointments', icon: '📅', group: 'Sales' },
  { href: '/clients', label: 'Clients', icon: '🤝', group: 'Sales' },
  { href: '/conversations', label: 'Conversations', icon: '💬', group: 'Engagement' },
  { href: '/campaigns', label: 'Campaigns', icon: '📣', group: 'Engagement' },
  { href: '/workflows', label: 'Workflows', icon: '⚙️', group: 'Engagement' },
  { href: '/referrals', label: 'Referrals', icon: '🎁', group: 'Engagement' },
  { href: '/applications', label: 'Applications', icon: '📝', group: 'Operations' },
  { href: '/documents', label: 'Documents', icon: '📁', group: 'Operations' },
  { href: '/compliance', label: 'Compliance', icon: '🛡️', group: 'Operations' },
  { href: '/integrations', label: 'Integrations', icon: '🔌', group: 'Operations' },
  { href: '/team', label: 'Team', icon: '👥', group: 'Operations' },
  { href: '/settings', label: 'Settings', icon: '⚙️', group: 'Operations' },
];

export const NAV_GROUPS = ['Overview', 'Sales', 'Engagement', 'Operations'] as const;
