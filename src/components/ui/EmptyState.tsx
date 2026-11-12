import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => (
  <div role="status" className="flex flex-col items-center gap-2 px-4 py-10 text-center">
    <div className="text-slate-400" aria-hidden="true">
      {icon ?? <Inbox className="h-10 w-10" />}
    </div>
    <p className="text-base font-semibold text-slate-900">{title}</p>
    {description && <p className="max-w-sm text-sm text-slate-600">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
