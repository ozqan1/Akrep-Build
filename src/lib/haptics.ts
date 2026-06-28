import * as Haptics from 'expo-haptics';
import { useSettings } from '@/store/useSettings';

type Kind = 'light' | 'medium' | 'success' | 'error' | 'select';

/** Fires a haptic pulse, respecting the user's haptics setting. */
export function haptic(kind: Kind = 'light') {
  if (!useSettings.getState().hapticsEnabled) return;
  switch (kind) {
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'select':
      Haptics.selectionAsync();
      break;
  }
}
