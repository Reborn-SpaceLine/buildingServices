/**
 * Compression des photos avant l'envoi, directement dans le navigateur (aucune dépendance) :
 * - redimensionnement à 1920 px maximum (largeur ou hauteur) ;
 * - conversion en WebP (≈ 3 à 10 fois plus léger qu'une photo de téléphone).
 * La photo d'origine est gardée si le résultat n'est pas plus léger, et pour les formats
 * qu'on ne peut pas convertir sans perte (GIF animé, SVG).
 */
const MAX_SIDE = 1920;
const QUALITY = 0.82;
const CONVERTIBLE = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];

export async function compressImage(file: File): Promise<File> {
  if (!CONVERTIBLE.includes(file.type) || typeof createImageBitmap !== 'function') return file;
  try {
    // imageOrientation : les photos de téléphone gardent le bon sens
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', QUALITY));
    // Navigateur sans encodeur WebP (il renvoie alors du PNG) ou gain nul : on garde l'original
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;
    const name = `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.webp`;
    return new File([blob], name, { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file; // format illisible par le navigateur : envoyé tel quel
  }
}
