import { useEffect, useState } from 'react';

export function useEvent(target: any, eventName: string, initialValue?: any): any {
  const [value, setValue] = useState<any>(initialValue);
  useEffect(() => {
    const handler = (event: any) => setValue(event?.detail ?? event);
    target?.addEventListener?.(eventName, handler);
    return () => target?.removeEventListener?.(eventName, handler);
  }, [target, eventName]);
  return value;
}

export function useEventListener(target: any, eventName: string, listener: (event: any) => void) {
  useEffect(() => {
    target?.addEventListener?.(eventName, listener);
    return () => target?.removeEventListener?.(eventName, listener);
  }, [target, eventName, listener]);
}
