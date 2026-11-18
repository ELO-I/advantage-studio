import { createContext, useContext } from 'react';
import {
  createTranslator,
  defaultLocale,
  type Locale,
  type Translator,
} from './translator';

export interface I18n extends Translator {
  setLocale: (locale: Locale) => void;
}
export const I18nContext = createContext<I18n>({
  ...createTranslator(defaultLocale),
  setLocale: () => {},
});
export const useI18n = () => useContext(I18nContext);
