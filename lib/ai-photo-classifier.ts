/**
 * Akrep Galeri - AI Photo Classifier
 * Google ML Kit kullanarak fotoğraf sınıflandırması ve nesne tanıma
 */

import * as FileSystem from 'expo-file-system';

export type PhotoCategory = 
  | 'person'
  | 'landscape'
  | 'food'
  | 'document'
  | 'screenshot'
  | 'selfie'
  | 'animal'
  | 'building'
  | 'vehicle'
  | 'nature'
  | 'other';

export interface PhotoClassification {
  photoId: string;
  uri: string;
  categories: {
    category: PhotoCategory;
    confidence: number; // 0-1
  }[];
  detectedObjects: {
    label: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  isScreenshot: boolean;
  screenshotConfidence: number;
  faceCount: number;
  dominantColor: string;
  classifiedAt: number;
}

interface ClassificationCache {
  [photoId: string]: PhotoClassification;
}

const CLASSIFICATION_CACHE_DIR = FileSystem.documentDirectory + 'akrep/photo-classifications/';

/**
 * AI Sınıflandırma sistemini başlat
 */
export async function initializePhotoClassifier(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(CLASSIFICATION_CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CLASSIFICATION_CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Fotoğraf sınıflandırıcı başlatılamadı:', error);
  }
}

/**
 * Fotoğrafı sınıflandır (ML Kit entegrasyonu)
 */
export async function classifyPhoto(
  photoUri: string,
  photoId: string
): Promise<PhotoClassification> {
  try {
    // Gerçek uygulamada: Google ML Kit Vision API kullanılacak
    // const image = await MLKitVision.imageFromUri(photoUri);
    // const labeler = MLKitVision.createImageLabeler();
    // const labels = await labeler.processImage(image);

    // Simüle edilmiş sınıflandırma
    const classification = await performClassification(photoUri, photoId);

    // Cache'e kaydet
    await saveClassificationToCache(classification);

    return classification;
  } catch (error) {
    console.error('Fotoğraf sınıflandırılamadı:', error);
    throw error;
  }
}

/**
 * Toplu fotoğraf sınıflandırması
 */
export async function classifyPhotoBatch(
  photoUris: Array<{ uri: string; id: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<PhotoClassification[]> {
  try {
    const results: PhotoClassification[] = [];

    for (let i = 0; i < photoUris.length; i++) {
      const { uri, id } = photoUris[i];
      const classification = await classifyPhoto(uri, id);
      results.push(classification);
      onProgress?.(i + 1, photoUris.length);
    }

    return results;
  } catch (error) {
    console.error('Toplu sınıflandırma başarısız:', error);
    throw error;
  }
}

/**
 * Ekran görüntüsü tespiti
 */
export async function detectScreenshot(
  photoUri: string,
  photoId: string
): Promise<{ isScreenshot: boolean; confidence: number }> {
  try {
    // Gerçek uygulamada: ML Kit veya özel model kullanılacak
    // Ekran görüntüsü özellikleri:
    // - Keskin kenarlar
    // - Tipik ekran oranları (16:9, 9:16, 4:3)
    // - Metin yoğunluğu
    // - Renk paletinin sınırlılığı

    const isScreenshot = Math.random() > 0.7; // Simüle edilmiş
    const confidence = isScreenshot ? 0.85 : 0.15;

    return { isScreenshot, confidence };
  } catch (error) {
    console.error('Ekran görüntüsü tespiti başarısız:', error);
    return { isScreenshot: false, confidence: 0 };
  }
}

/**
 * Yüz tanıma ve sayma
 */
export async function detectFaces(
  photoUri: string
): Promise<{ faceCount: number; confidence: number }> {
  try {
    // Gerçek uygulamada: ML Kit Face Detection API kullanılacak
    // const image = await MLKitVision.imageFromUri(photoUri);
    // const faceDetector = MLKitVision.createFaceDetector();
    // const faces = await faceDetector.processImage(image);

    // Simüle edilmiş yüz tespiti
    const faceCount = Math.floor(Math.random() * 5);
    const confidence = faceCount > 0 ? 0.9 : 0.95;

    return { faceCount, confidence };
  } catch (error) {
    console.error('Yüz tespiti başarısız:', error);
    return { faceCount: 0, confidence: 0 };
  }
}

/**
 * Baskın rengi belirle
 */
export async function getDominantColor(photoUri: string): Promise<string> {
  try {
    // Gerçek uygulamada: Görüntü işleme kütüphanesi kullanılacak
    // Basit bir renk analizi yapılacak

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C9A8'
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  } catch (error) {
    console.error('Baskın renk belirlenemedi:', error);
    return '#808080';
  }
}

/**
 * Nesne tanıma
 */
export async function detectObjects(
  photoUri: string
): Promise<Array<{ label: string; confidence: number }>> {
  try {
    // Gerçek uygulamada: ML Kit Object Detection API kullanılacak
    // const image = await MLKitVision.imageFromUri(photoUri);
    // const objectDetector = MLKitVision.createObjectDetector();
    // const objects = await objectDetector.processImage(image);

    // Simüle edilmiş nesne tespiti
    const possibleObjects = [
      'Kişi', 'Ağaç', 'Ev', 'Araba', 'Köpek', 'Kedi',
      'Telefon', 'Bilgisayar', 'Kitap', 'Çiçek'
    ];

    const detectedObjects = [];
    const objectCount = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < objectCount; i++) {
      detectedObjects.push({
        label: possibleObjects[Math.floor(Math.random() * possibleObjects.length)],
        confidence: 0.7 + Math.random() * 0.25,
      });
    }

    return detectedObjects;
  } catch (error) {
    console.error('Nesne tespiti başarısız:', error);
    return [];
  }
}

/**
 * Fotoğrafı kategorize et
 */
async function performClassification(
  photoUri: string,
  photoId: string
): Promise<PhotoClassification> {
  try {
    // Tüm sınıflandırma işlemlerini yap
    const [
      screenshotResult,
      faceResult,
      dominantColor,
      detectedObjects,
    ] = await Promise.all([
      detectScreenshot(photoUri, photoId),
      detectFaces(photoUri),
      getDominantColor(photoUri),
      detectObjects(photoUri),
    ]);

    // Kategori belirle
    const categories = determineCategories(
      screenshotResult.isScreenshot,
      faceResult.faceCount,
      detectedObjects
    );

    return {
      photoId,
      uri: photoUri,
      categories,
      detectedObjects,
      isScreenshot: screenshotResult.isScreenshot,
      screenshotConfidence: screenshotResult.confidence,
      faceCount: faceResult.faceCount,
      dominantColor,
      classifiedAt: Date.now(),
    };
  } catch (error) {
    console.error('Sınıflandırma başarısız:', error);
    throw error;
  }
}

/**
 * Kategorileri belirle
 */
function determineCategories(
  isScreenshot: boolean,
  faceCount: number,
  detectedObjects: Array<{ label: string; confidence: number }>
): Array<{ category: PhotoCategory; confidence: number }> {
  const categories: Array<{ category: PhotoCategory; confidence: number }> = [];

  if (isScreenshot) {
    categories.push({ category: 'screenshot', confidence: 0.9 });
  }

  if (faceCount > 0) {
    if (faceCount === 1) {
      categories.push({ category: 'selfie', confidence: 0.7 });
    }
    categories.push({ category: 'person', confidence: 0.85 });
  }

  // Nesne tabanlı kategorilendirme
  const objectLabels = detectedObjects.map(o => o.label.toLowerCase());

  if (objectLabels.some(l => l.includes('ağaç') || l.includes('çiçek') || l.includes('doğa'))) {
    categories.push({ category: 'nature', confidence: 0.8 });
  }

  if (objectLabels.some(l => l.includes('ev') || l.includes('bina') || l.includes('yapı'))) {
    categories.push({ category: 'building', confidence: 0.8 });
  }

  if (objectLabels.some(l => l.includes('araba') || l.includes('bisiklet') || l.includes('uçak'))) {
    categories.push({ category: 'vehicle', confidence: 0.8 });
  }

  if (objectLabels.some(l => l.includes('köpek') || l.includes('kedi') || l.includes('hayvan'))) {
    categories.push({ category: 'animal', confidence: 0.8 });
  }

  if (objectLabels.some(l => l.includes('yemek') || l.includes('içecek'))) {
    categories.push({ category: 'food', confidence: 0.8 });
  }

  if (categories.length === 0) {
    categories.push({ category: 'other', confidence: 0.5 });
  }

  return categories;
}

/**
 * Sınıflandırmayı cache'e kaydet
 */
async function saveClassificationToCache(classification: PhotoClassification): Promise<void> {
  try {
    const filePath = CLASSIFICATION_CACHE_DIR + `${classification.photoId}.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(classification));
  } catch (error) {
    console.error('Sınıflandırma cache\'e kaydedilemedi:', error);
  }
}

/**
 * Cache'den sınıflandırmayı yükle
 */
export async function loadClassificationFromCache(
  photoId: string
): Promise<PhotoClassification | null> {
  try {
    const filePath = CLASSIFICATION_CACHE_DIR + `${photoId}.json`;
    const content = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Kategoriye göre fotoğrafları filtrele
 */
export async function filterPhotosByCategory(
  classifications: PhotoClassification[],
  category: PhotoCategory
): Promise<PhotoClassification[]> {
  return classifications.filter(c =>
    c.categories.some(cat => cat.category === category)
  );
}

/**
 * Ekran görüntülerini ayırt et ve ayrı albüme taşı
 */
export async function separateScreenshots(
  classifications: PhotoClassification[]
): Promise<{
  screenshots: PhotoClassification[];
  others: PhotoClassification[];
}> {
  const screenshots = classifications.filter(c => c.isScreenshot);
  const others = classifications.filter(c => !c.isScreenshot);

  return { screenshots, others };
}
