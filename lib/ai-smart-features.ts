/**
 * Akrep Galeri - AI Smart Features
 * Akıllı arama, yüz tanıma ve benzer dosya bulma sistemleri
 */

import * as FileSystem from 'expo-file-system';

export interface SmartSearchResult {
  mediaId: string;
  uri: string;
  filename: string;
  matchScore: number; // 0-1
  matchedTags: string[];
}

export interface FaceAlbum {
  id: string;
  name: string;
  faceId: string;
  photoCount: number;
  thumbnailUri?: string;
  createdAt: number;
}

export interface DuplicateGroup {
  groupId: string;
  mediaType: 'photo' | 'video';
  items: {
    mediaId: string;
    uri: string;
    filename: string;
    similarity: number; // 0-1
    fileSize: number;
  }[];
  potentialSavings: number; // bytes
}

const SEARCH_INDEX_DIR = FileSystem.documentDirectory + 'akrep/search-index/';
const FACE_ALBUMS_DIR = FileSystem.documentDirectory + 'akrep/face-albums/';
const DUPLICATES_CACHE_DIR = FileSystem.documentDirectory + 'akrep/duplicates-cache/';

/**
 * AI Smart Features'ı başlat
 */
export async function initializeSmartFeatures(): Promise<void> {
  try {
    for (const dir of [SEARCH_INDEX_DIR, FACE_ALBUMS_DIR, DUPLICATES_CACHE_DIR]) {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    }

    console.log('AI Smart Features başlatıldı');
  } catch (error) {
    console.error('AI Smart Features başlatılamadı:', error);
  }
}

/**
 * Akıllı Arama: Doğal dil sorgusuyla medya arama
 */
export async function smartSearch(
  query: string,
  mediaLibrary: any[]
): Promise<SmartSearchResult[]> {
  try {
    // Sorguyu analiz et
    const queryTags = parseSearchQuery(query);

    const results: SmartSearchResult[] = [];

    for (const media of mediaLibrary) {
      // Gerçek uygulamada: ML Kit Natural Language Processing kullanılacak
      const matchScore = calculateMatchScore(media, queryTags);

      if (matchScore > 0.3) {
        results.push({
          mediaId: media.id,
          uri: media.uri,
          filename: media.filename,
          matchScore,
          matchedTags: queryTags,
        });
      }
    }

    // Sonuçları skor'a göre sırala
    results.sort((a, b) => b.matchScore - a.matchScore);

    return results;
  } catch (error) {
    console.error('Akıllı arama başarısız:', error);
    return [];
  }
}

/**
 * Sorgu stringini tag'lere ayır
 */
function parseSearchQuery(query: string): string[] {
  // Örnek: "mavi araba" → ["mavi", "araba", "vehicle", "blue"]
  const tags = query.toLowerCase().split(' ').filter(t => t.length > 0);

  // Türkçe → İngilizce çevirisi (simüle edilmiş)
  const translationMap: Record<string, string[]> = {
    'mavi': ['blue', 'color'],
    'araba': ['car', 'vehicle', 'automobile'],
    'deniz': ['sea', 'ocean', 'beach'],
    'ağaç': ['tree', 'nature', 'forest'],
    'kişi': ['person', 'people', 'human'],
    'köpek': ['dog', 'animal', 'pet'],
    'kedi': ['cat', 'animal', 'pet'],
    'ev': ['house', 'building', 'home'],
  };

  let expandedTags = [...tags];
  tags.forEach(tag => {
    if (translationMap[tag]) {
      expandedTags.push(...translationMap[tag]);
    }
  });

  return expandedTags;
}

/**
 * Medya ile sorgu arasındaki eşleşme skorunu hesapla
 */
function calculateMatchScore(media: any, queryTags: string[]): number {
  // Gerçek uygulamada: ML Kit Vision API ile görüntü analizi yapılacak
  // Simüle edilmiş skor hesaplaması
  const mediaName = (media.filename || '').toLowerCase();
  const matchedTags = queryTags.filter(tag => mediaName.includes(tag));

  return Math.min(1, matchedTags.length / queryTags.length);
}

/**
 * Yüz Tanıma: Yüzleri tanıyıp albüm oluştur
 */
export async function detectAndGroupFaces(
  mediaLibrary: any[]
): Promise<FaceAlbum[]> {
  try {
    // Gerçek uygulamada: ML Kit Face Detection API kullanılacak
    // Simüle edilmiş yüz tanıma

    const faceAlbums: FaceAlbum[] = [];

    // Örnek: 3 farklı yüz grubu oluştur
    for (let i = 0; i < 3; i++) {
      const faceId = `face_${i}`;
      const photoCount = Math.floor(Math.random() * 20) + 5;

      const album: FaceAlbum = {
        id: `album_${faceId}`,
        name: `Kişi ${i + 1}`,
        faceId,
        photoCount,
        createdAt: Date.now(),
      };

      faceAlbums.push(album);

      // Albümü kaydet
      await saveFaceAlbum(album);
    }

    return faceAlbums;
  } catch (error) {
    console.error('Yüz tanıma başarısız:', error);
    return [];
  }
}

/**
 * Benzer/Kopya Dosya Bulucu
 */
export async function findDuplicateFiles(
  mediaLibrary: any[]
): Promise<DuplicateGroup[]> {
  try {
    const duplicateGroups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();

    // Gerçek uygulamada: Perceptual Hashing (pHash) veya ML Kit kullanılacak
    // Simüle edilmiş benzer dosya tespiti

    for (let i = 0; i < mediaLibrary.length; i++) {
      if (processedIds.has(mediaLibrary[i].id)) continue;

      const group: DuplicateGroup = {
        groupId: `dup_group_${i}`,
        mediaType: mediaLibrary[i].mediaType,
        items: [
          {
            mediaId: mediaLibrary[i].id,
            uri: mediaLibrary[i].uri,
            filename: mediaLibrary[i].filename,
            similarity: 1.0,
            fileSize: mediaLibrary[i].fileSize || 0,
          },
        ],
        potentialSavings: 0,
      };

      // Benzer dosyaları ara
      for (let j = i + 1; j < mediaLibrary.length; j++) {
        if (processedIds.has(mediaLibrary[j].id)) continue;

        const similarity = calculateSimilarity(mediaLibrary[i], mediaLibrary[j]);

        if (similarity > 0.85) {
          group.items.push({
            mediaId: mediaLibrary[j].id,
            uri: mediaLibrary[j].uri,
            filename: mediaLibrary[j].filename,
            similarity,
            fileSize: mediaLibrary[j].fileSize || 0,
          });

          processedIds.add(mediaLibrary[j].id);
          group.potentialSavings += mediaLibrary[j].fileSize || 0;
        }
      }

      if (group.items.length > 1) {
        duplicateGroups.push(group);
        processedIds.add(mediaLibrary[i].id);
      }
    }

    return duplicateGroups;
  } catch (error) {
    console.error('Benzer dosya bulma başarısız:', error);
    return [];
  }
}

/**
 * İki medya arasındaki benzerlik skorunu hesapla
 */
function calculateSimilarity(media1: any, media2: any): number {
  // Gerçek uygulamada: pHash, SIFT veya ML Kit kullanılacak
  // Basit simülasyon: dosya boyutu ve adı benzerliğine bakma

  const sizeDiff = Math.abs(media1.fileSize - media2.fileSize);
  const maxSize = Math.max(media1.fileSize, media2.fileSize);
  const sizeScore = 1 - (sizeDiff / maxSize);

  // Dosya adı benzerliği
  const name1 = (media1.filename || '').toLowerCase();
  const name2 = (media2.filename || '').toLowerCase();
  const nameScore = name1 === name2 ? 1 : 0;

  return (sizeScore * 0.6 + nameScore * 0.4);
}

/**
 * Yüz albümünü kaydet
 */
async function saveFaceAlbum(album: FaceAlbum): Promise<void> {
  try {
    const filePath = FACE_ALBUMS_DIR + `${album.id}.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(album));
  } catch (error) {
    console.error('Yüz albümü kaydedilemedi:', error);
  }
}

/**
 * Tüm yüz albümlerini yükle
 */
export async function loadFaceAlbums(): Promise<FaceAlbum[]> {
  try {
    const files = await FileSystem.readDirectoryAsync(FACE_ALBUMS_DIR);
    const albums: FaceAlbum[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await FileSystem.readAsStringAsync(FACE_ALBUMS_DIR + file);
        albums.push(JSON.parse(content));
      }
    }

    return albums;
  } catch (error) {
    console.error('Yüz albümleri yüklenemedi:', error);
    return [];
  }
}

/**
 * Benzer dosya grubundan en iyi kalite olanı seç
 */
export function selectBestQualityFromDuplicates(group: DuplicateGroup): any {
  // Dosya boyutu en büyük olanı seç (genellikle en iyi kalite)
  return group.items.reduce((prev, current) =>
    prev.fileSize > current.fileSize ? prev : current
  );
}

/**
 * Benzer dosya grubundan gereksizleri sil
 */
export async function deleteRedundantDuplicates(
  group: DuplicateGroup
): Promise<number> {
  try {
    const bestQuality = selectBestQualityFromDuplicates(group);
    let deletedCount = 0;
    let freedSpace = 0;

    for (const item of group.items) {
      if (item.mediaId !== bestQuality.mediaId) {
        await FileSystem.deleteAsync(item.uri, { idempotent: true });
        deletedCount++;
        freedSpace += item.fileSize;
      }
    }

    console.log(`${deletedCount} benzer dosya silindi, ${freedSpace} byte yer boşaltıldı`);
    return freedSpace;
  } catch (error) {
    console.error('Benzer dosyalar silinemedi:', error);
    return 0;
  }
}

/**
 * Arama indexini temizle
 */
export async function clearSearchIndex(): Promise<void> {
  try {
    const files = await FileSystem.readDirectoryAsync(SEARCH_INDEX_DIR);
    for (const file of files) {
      await FileSystem.deleteAsync(SEARCH_INDEX_DIR + file, { idempotent: true });
    }
  } catch (error) {
    console.error('Arama indexi temizlenemedi:', error);
  }
}
