export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Project statuses
    planning: 'default',
    bidding: 'primary',
    in_progress: 'accent',
    completed: 'primary',
    on_hold: 'warn',
    // Scope statuses
    open: 'default',
    awarded: 'accent',
    // Bid statuses
    pending: 'default',
    submitted: 'primary',
    under_review: 'primary',
    accepted: 'accent',
    rejected: 'warn',
    withdrawn: 'warn',
    // Contract/Invoice statuses
    draft: 'default',
    active: 'accent',
    approved: 'accent',
    paid: 'accent',
    terminated: 'warn',
  };
  return colors[status] || 'default';
}

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
