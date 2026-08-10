/** Sidebar navigation model. Icons are inline emoji to avoid an icon dependency. */
export interface NavItem {
  href: string;
  label: string;
  icon: string;
  group: 'Pilot' | 'Overview' | 'Sales' | 'Scheduling' | 'Engagement' | 'Operations';
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/presentation', label: 'Presentation', icon: '🎬', group: 'Pilot' },
  { href: '/advisor-scorecard', label: 'Advisor Scorecard', icon: '🧮', group: 'Pilot' },
  { href: '/demo-control', label: 'Demo Control', icon: '🎛️', group: 'Pilot' },
  { href: '/presentation/pricing', label: 'Pricing', icon: '💰', group: 'Pilot' },
  { href: '/presentation/checklist', label: 'Approval Checklist', icon: '✅', group: 'Pilot' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊', group: 'Overview' },
  { href: '/analytics', label: 'Analytics', icon: '📈', group: 'Overview' },
  { href: '/leads', label: 'Leads', icon: '🎯', group: 'Sales' },
  { href: '/pipeline', label: 'Pipeline', icon: '🧭', group: 'Sales' },
  { href: '/appointments', label: 'Appointments', icon: '📅', group: 'Sales' },
  { href: '/clients', label: 'Clients', icon: '🤝', group: 'Sales' },
  { href: '/calendar', label: 'Team Calendar', icon: '🗓️', group: 'Scheduling' },
  { href: '/calendars', label: 'Booking Calendars', icon: '🔗', group: 'Scheduling' },
  { href: '/tasks', label: 'Shared Tasks', icon: '☑️', group: 'Scheduling' },
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

export const NAV_GROUPS = ['Pilot', 'Overview', 'Sales', 'Scheduling', 'Engagement', 'Operations'] as const;
