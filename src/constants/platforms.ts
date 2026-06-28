import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type PlatformId = 'tiktok' | 'twitter' | 'instagram';

export interface PlatformConfig {
  id: PlatformId;
  /** Bottom-tab label. */
  tabLabel: string;
  /** Full title shown in the screen header. */
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  brandColor: string;
  /** Whether the user picks a quality (true = X/Twitter) or we auto-pick best. */
  askQuality: boolean;
  /** Remove watermark / username overlay (TikTok & Instagram). */
  cleanWatermark: boolean;
  inputPlaceholder: string;
  /** Hostnames that indicate a link belongs to this platform. */
  hosts: string[];
}

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  tiktok: {
    id: 'tiktok',
    tabLabel: 'TikTok',
    title: 'AKREP İNDİRİCİ',
    subtitle: 'TikTok • Filigransız • En Yüksek Kalite',
    icon: 'logo-tiktok',
    brandColor: '#25F4EE',
    askQuality: false,
    cleanWatermark: true,
    inputPlaceholder: 'TikTok video linkini buraya bırakın...',
    hosts: ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
  },
  twitter: {
    id: 'twitter',
    tabLabel: 'X / Twitter',
    title: 'AKREP İNDİRİCİ',
    subtitle: 'X / Twitter Medya • Bot Geçit Bypass',
    icon: 'logo-twitter',
    brandColor: '#1D9BF0',
    askQuality: true,
    cleanWatermark: false,
    inputPlaceholder: 'X / Twitter video linkini buraya bırakın...',
    hosts: ['twitter.com', 'x.com', 't.co', 'mobile.twitter.com'],
  },
  instagram: {
    id: 'instagram',
    tabLabel: 'Instagram',
    title: 'AKREP İNDİRİCİ',
    subtitle: 'Instagram Reels • Filigransız • En Yüksek Kalite',
    icon: 'logo-instagram',
    brandColor: '#E1306C',
    askQuality: false,
    cleanWatermark: true,
    inputPlaceholder: 'Instagram video linkini buraya bırakın...',
    hosts: ['instagram.com', 'instagr.am', 'ig.me'],
  },
};

export const QUALITY_OPTIONS = [
  { value: '1080', label: '1080p (Full HD)', tag: 'HD' },
  { value: '720', label: '720p (HD)', tag: 'HD' },
  { value: '480', label: '480p (Standart)', tag: 'SD' },
  { value: '360', label: '360p (Veri Dostu)', tag: 'SD' },
];

export function detectPlatform(url: string): PlatformId | null {
  const lower = url.toLowerCase();
  for (const p of Object.values(PLATFORMS)) {
    if (p.hosts.some((h) => lower.includes(h))) return p.id;
  }
  return null;
}
