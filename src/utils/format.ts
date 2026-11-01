export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}