export function confirm(title: string, message: string): Promise<boolean> {
  return Promise.resolve(window.confirm(`${title}\n\n${message}`));
}

export function notify(title: string, message?: string) {
  window.alert(message ? `${title}\n\n${message}` : title);
}

export function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return String(e);
}
