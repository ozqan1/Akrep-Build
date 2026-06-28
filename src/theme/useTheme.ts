import { useSettings } from '@/store/useSettings';
import { resolveTheme, Theme } from './themes';

/** Resolves the active theme from persisted settings. */
export function useTheme(): Theme {
  const themeId = useSettings((s) => s.themeId);
  const appearance = useSettings((s) => s.appearance);
  return resolveTheme(themeId, appearance);
}
