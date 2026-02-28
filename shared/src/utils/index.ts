import type { ReferralNode } from '../types';

export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + (minutes === 1 ? ' min ago' : ' mins ago');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
  const days = Math.floor(hours / 24);
  if (days < 7) return days + (days === 1 ? ' day ago' : ' days ago');
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks + (weeks === 1 ? ' week ago' : ' weeks ago');
  const months = Math.floor(days / 30);
  if (months < 12) return months + (months === 1 ? ' month ago' : ' months ago');
  const years = Math.floor(days / 365);
  return years + (years === 1 ? ' year ago' : ' years ago');
}

export function formatPoints(pts: number | null | undefined): string {
  if (pts == null) return '0';
  const num = Number(pts);
  if (num > 0) return '+' + num;
  return String(num);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '--';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function countDescendants(node: ReferralNode): number {
  const children = node.children || [];
  return children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

export function getInitial(name?: string | null, email?: string | null): string {
  return ((name || email || '?')[0] || '?').toUpperCase();
}
