/**
 * Thin client for the open-source "cobalt" media extraction API (v10+).
 * Given a public post URL it returns a direct, downloadable media URL.
 * Docs: https://github.com/imputnet/cobalt/blob/main/docs/api.md
 */

export interface CobaltRequest {
  url: string;
  /** "1080" | "720" | "480" | "360" | "max" */
  videoQuality?: string;
  /** Strip platform watermark when supported (TikTok/Instagram). */
  cleanWatermark?: boolean;
}

export interface CobaltMedia {
  url: string;
  filename: string;
  thumb?: string;
}

interface CobaltOptions {
  instance: string;
  apiKey?: string;
}

type CobaltResponse =
  | { status: 'tunnel' | 'redirect'; url: string; filename?: string }
  | { status: 'picker'; picker: { type: string; url: string; thumb?: string }[]; audio?: string }
  | { status: 'local-processing'; tunnel?: string[]; output?: { filename?: string } }
  | { status: 'error'; error?: { code?: string } };

const TIMEOUT_MS = 25000;

export class CobaltError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'CobaltError';
  }
}

async function callInstance(req: CobaltRequest, opts: CobaltOptions): Promise<CobaltMedia> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (opts.apiKey) headers.Authorization = `Api-Key ${opts.apiKey}`;

    const body = {
      url: req.url,
      videoQuality: req.videoQuality ?? 'max',
      downloadMode: 'auto',
      filenameStyle: 'basic',
      allowH265: true,
      tiktokFullAudio: false,
      // cobalt returns watermark-free media by default for TikTok/Instagram.
    };

    const res = await fetch(opts.instance.replace(/\/+$/, '') + '/', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = (await res.json()) as CobaltResponse;

    if (data.status === 'error') {
      throw new CobaltError(data.error?.code ?? 'api.error', 'Servis bağlantıyı çözemedi.');
    }
    if (data.status === 'tunnel' || data.status === 'redirect') {
      return { url: data.url, filename: data.filename ?? defaultName(req.url) };
    }
    if (data.status === 'local-processing' && data.tunnel && data.tunnel.length > 0) {
      return { url: data.tunnel[0], filename: data.output?.filename ?? defaultName(req.url) };
    }
    if (data.status === 'picker') {
      const video = data.picker.find((p) => p.type === 'video') ?? data.picker[0];
      if (video) return { url: video.url, filename: defaultName(req.url), thumb: video.thumb };
      throw new CobaltError('picker.empty', 'İndirilecek medya bulunamadı.');
    }
    throw new CobaltError('api.unknown', 'Servisten beklenmeyen yanıt alındı.');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolves a direct media URL, trying the primary instance first and then the
 * provided fallbacks. Throws CobaltError when every instance fails.
 */
export async function resolveMedia(
  req: CobaltRequest,
  primary: CobaltOptions,
  fallbacks: string[]
): Promise<CobaltMedia> {
  const instances: CobaltOptions[] = [
    primary,
    ...fallbacks
      .filter((u) => u && u !== primary.instance)
      .map((instance) => ({ instance, apiKey: undefined })),
  ];

  let lastError: unknown;
  for (const opts of instances) {
    try {
      return await callInstance(req, opts);
    } catch (err) {
      lastError = err;
    }
  }
  if (lastError instanceof CobaltError) throw lastError;
  throw new CobaltError(
    'network',
    'Hiçbir indirme sunucusuna ulaşılamadı. İnternetinizi kontrol edin veya Ayarlar > Gelişmiş bölümünden sunucu adresini değiştirin.'
  );
}

function defaultName(url: string): string {
  const stamp = Date.now();
  return `akrep_${stamp}.mp4`;
}
