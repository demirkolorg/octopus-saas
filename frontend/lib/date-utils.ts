import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  }

  if (isYesterday(date)) {
    return 'Dün ' + format(date, 'HH:mm', { locale: tr });
  }

  return format(date, 'd MMM yyyy', { locale: tr });
}

export function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'd MMMM yyyy HH:mm', { locale: tr });
}
