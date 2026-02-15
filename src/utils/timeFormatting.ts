export const formatRelativeTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return formatAsOfDate(date);
};

export const formatAsOfDate = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatAsOfLabel = (value: string | Date, mode: 'relative' | 'absolute'): string => {
  if (mode === 'relative') {
    return `Data as of ${formatRelativeTime(value)}`;
  }
  return `Data as of ${formatAsOfDate(value)}`;
};

