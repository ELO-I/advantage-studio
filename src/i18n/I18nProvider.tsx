import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext } from './context';
import {
  createTranslator,
  defaultLocale,
  isLocale,
  type Locale,
} from './translator';

/** A preference of this browser or desktop app, separate from the library. */
const STORAGE_KEY = 'advantage-studio.locale';

function storedLocale(): Locale {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState(storedLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // The choice simply won't be remembered.
    }
  }, [locale]);
  const value = useMemo(
    () => ({ ...createTranslator(locale), setLocale }),
    [locale],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}
