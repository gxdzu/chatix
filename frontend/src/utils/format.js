import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export const formatTime = (dateStr) => {
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(d, 'HH:mm');
};

export const formatDate = (dateStr) => {
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (isToday(d)) return 'Сегодня';
  if (isYesterday(d)) return 'Вчера';
  return format(d, 'd MMMM yyyy', { locale: ru });
};

export const formatLastSeen = (dateStr) => {
  if (!dateStr) return 'не в сети';
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (isToday(d)) return `был(а) сегодня в ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `был(а) вчера в ${format(d, 'HH:mm')}`;
  return `был(а) ${format(d, 'd MMM', { locale: ru })}`;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};
