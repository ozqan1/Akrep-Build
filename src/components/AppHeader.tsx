import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { PlatformConfig } from '@/constants/platforms';
import { useTheme } from '@/theme/useTheme';

const LOGO = require('../../assets/logo.png');

interface Props {
  platform: PlatformConfig;
  onVerify: () => void;
}

/** Brand row (app name + bot-verify action) and the platform "Akrep İndirici" card. */
export function AppHeader({ platform, onVerify }: Props) {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <View>
          <Text style={[styles.brand, { color: c.text }]}>Akrep Galeri 🦂</Text>
          <Text style={[styles.brandSub, { color: c.textDim }]}>Nebi Özkan</Text>
        </View>
        <PressableScale
          onPress={onVerify}
          style={[styles.verifyBtn, { backgroundColor: c.surface, borderColor: c.border }]}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={c.accent} />
          <Text style={[styles.verifyText, { color: c.text }]}>Bot Geçit</Text>
        </PressableScale>
      </View>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Image source={LOGO} style={styles.logo} />
        <View style={styles.cardText}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: c.accent }]}>{platform.title}</Text>
            <Ionicons name="flash" size={16} color={c.accent2} style={{ marginLeft: 4 }} />
          </View>
          <Text style={[styles.subtitle, { color: c.textDim }]} numberOfLines={1}>
            {platform.subtitle}
          </Text>
        </View>
        <Ionicons name={platform.icon} size={26} color={platform.brandColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  brandSub: { fontSize: 12, fontWeight: '600', marginTop: -2 },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  verifyText: { fontSize: 12, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  logo: { width: 46, height: 46, borderRadius: 12 },
  cardText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { fontSize: 12, marginTop: 2 },
});
