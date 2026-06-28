import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { PlatformConfig, PlatformId } from '@/constants/platforms';
import { DownloadItem } from '@/store/useDownloads';
import { CobaltError, resolveMedia } from './cobalt';

const ROOT = FileSystem.documentDirectory + 'akrep/';
const VIDEO_DIR = ROOT + 'videos/';
const THUMB_DIR = ROOT + 'thumbs/';

async function ensureDirs() {
  for (const dir of [ROOT, VIDEO_DIR, THUMB_DIR]) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export interface DownloadParams {
  url: string;
  platform: PlatformConfig;
  quality?: string;
  cobaltInstance: string;
  cobaltApiKey?: string;
  fallbacks: string[];
  onProgress?: (ratio: number) => void;
}

export async function downloadVideo(params: DownloadParams): Promise<DownloadItem> {
  const { url, platform, quality, cobaltInstance, cobaltApiKey, fallbacks, onProgress } = params;
  await ensureDirs();

  const media = await resolveMedia(
    {
      url,
      videoQuality: platform.askQuality ? quality ?? '1080' : 'max',
      cleanWatermark: platform.cleanWatermark,
    },
    { instance: cobaltInstance, apiKey: cobaltApiKey || undefined },
    fallbacks
  );

  const id = `${platform.id}_${Date.now()}`;
  const safeName = sanitize(media.filename) || `${id}.mp4`;
  const fileUri = VIDEO_DIR + id + '_' + safeName;

  const resumable = FileSystem.createDownloadResumable(
    media.url,
    fileUri,
    {},
    (p) => {
      if (onProgress && p.totalBytesExpectedToWrite > 0) {
        onProgress(p.totalBytesWritten / p.totalBytesExpectedToWrite);
      }
    }
  );

  const result = await resumable.downloadAsync();
  if (!result || result.status >= 400) {
    throw new CobaltError('download.failed', 'Video dosyası indirilemedi.');
  }

  const info = await FileSystem.getInfoAsync(result.uri, { size: true });
  const thumbUri = await makeThumb(result.uri, id);

  return {
    id,
    platform: platform.id,
    sourceUrl: url,
    fileUri: result.uri,
    thumbUri,
    filename: safeName,
    quality: platform.askQuality ? quality : 'max',
    createdAt: Date.now(),
    sizeBytes: info.exists && !info.isDirectory ? info.size : undefined,
  };
}

async function makeThumb(videoUri: string, id: string): Promise<string | undefined> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 1000, quality: 0.6 });
    const dest = THUMB_DIR + id + '.jpg';
    await FileSystem.moveAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return undefined;
  }
}

function sanitize(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(-60);
}

export function platformOf(id: PlatformId): PlatformId {
  return id;
}
