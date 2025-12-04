import { Music } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, className, icon }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className,
      )}
    >
      <div className="mb-4 rounded-full bg-spotify-light-gray p-4">
        {icon || <Music className="h-8 w-8 text-spotify-text-subdued" />}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-spotify-text-subdued">{description}</p>
      )}
    </div>
  );
}
