import clsx from 'clsx';

const STATUS_STYLES = {
  // Assessment statuses
  draft: 'bg-gray-100 text-gray-700 border border-gray-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  submitted: 'bg-amber-50 text-amber-700 border border-amber-200',
  under_review: 'bg-purple-50 text-purple-700 border border-purple-200',
  correction_requested: 'bg-orange-50 text-orange-700 border border-orange-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  closed: 'bg-gray-100 text-gray-600 border border-gray-200',
  // Action plan statuses
  not_started: 'bg-gray-100 text-gray-700 border border-gray-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  overdue: 'bg-red-50 text-red-700 border border-red-200',
  blocked: 'bg-orange-50 text-orange-700 border border-orange-200',
  // Round statuses
  active: 'bg-green-50 text-green-700 border border-green-200',
  archived: 'bg-gray-100 text-gray-600 border border-gray-200',
  // User statuses
  invited: 'bg-blue-50 text-blue-700 border border-blue-200',
  inactive: 'bg-gray-100 text-gray-600 border border-gray-200',
  suspended: 'bg-red-50 text-red-700 border border-red-200',
};

const LABELS = {
  in_progress: 'In Progress',
  under_review: 'Under Review',
  correction_requested: 'Correction Requested',
  not_started: 'Not Started',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
  const label = LABELS[status] || status?.replace(/_/g, ' ');
  return (
    <span className={clsx('badge capitalize font-bold tracking-tight', style)}>{label}</span>
  );
}
