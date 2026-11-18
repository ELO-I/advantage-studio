import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 5500;

export function useToast() {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setMessage('');
  }, []);
  const notify = useCallback((text: string) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(''), TOAST_DURATION_MS);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { message, notify, dismiss };
}
