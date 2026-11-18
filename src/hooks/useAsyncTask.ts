import { useState } from 'react';
import { useI18n } from '../i18n/context';

/** Runs one asynchronous user action at a time and keeps its error message. */
export function useAsyncTask() {
  const { errorMessage } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}
