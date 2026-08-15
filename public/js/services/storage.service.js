/**
 * HUELLAS A CASA — Servicio de Fotos (Firebase Cloud Storage)
 * Gestiona la subida de fotos comprimidas a Cloud Storage y la obtención de downloadURL.
 */

import { isConfigured, firebaseConfig } from '../firebase-config.js';

// Placeholder SVG local autónomo (cero dependencias externas / cero peticiones a Unsplash)
const PLACEHOLDER_SVG_URL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23F3F4F6"><rect width="400" height="300" fill="%23F3F4F6"/><path d="M200 110c-16.5 0-30 13.5-30 30 0 13.5 9 24.8 21.4 28.5L180 200h40l-11.4-31.5c12.4-3.7 21.4-15 21.4-28.5 0-16.5-13.5-30-30-30zm-45-10c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm90 0c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15z" fill="%239CA3AF"/><text x="200" y="240" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="%236B7280" text-anchor="middle">Sin foto disponible</text></svg>';

/**
 * Sube una imagen (Blob o File) a Firebase Cloud Storage y retorna la URL pública.
 * Estructura de almacenamiento: reportes/{reporteId}/{timestamp}.{ext}
 * @param {Blob|File} imageBlob 
 * @param {string} nombreReporteId 
 * @returns {Promise<{downloadUrl: string, storagePath: string}>}
 */
export async function subirFotoReporte(imageBlob, nombreReporteId) {
  if (!imageBlob) {
    return {
      downloadUrl: PLACEHOLDER_SVG_URL,
      storagePath: `reportes/${nombreReporteId}/default.svg`
    };
  }

  // Techo de seguridad: 500KB (el cliente ya comprime a < 300KB)
  if (imageBlob.size && imageBlob.size > 500 * 1024) {
    throw new Error('La imagen excede el límite máximo de 500KB permitido.');
  }

  const timestamp = Date.now();
  const extension = imageBlob.type === 'image/png' ? 'png' : 'jpg';
  // Estructura segura: reporteId como directorio para validación de propiedad en rules
  const storagePath = `reportes/${nombreReporteId}/${timestamp}.${extension}`;

  // 1. En el navegador real: Conexión estricta a Firebase Storage (falla si no hay conexión)
  if (typeof window !== 'undefined' && !window.__TEST__) {
    if (!isConfigured || !window.firebase || !window.firebase.storage) {
      throw new Error('No se pudo conectar con Firebase Storage para subir la foto. Por favor verifica tu conexión a internet o intenta de nuevo.');
    }

    const storageRef = window.firebase.storage().ref(storagePath);
    const metadata = {
      contentType: imageBlob.type || 'image/jpeg',
      customMetadata: {
        reporteId: nombreReporteId,
        subidoEn: new Date().toISOString()
      }
    };

    const snapshot = await storageRef.put(imageBlob, metadata);
    const downloadUrl = await snapshot.ref.getDownloadURL();

    return {
      downloadUrl,
      storagePath
    };
  }

  // 2. Modo Testing Node.js (Sin llamadas de red)
  const bucket = firebaseConfig.storageBucket || 'huellasacasa-23651.firebasestorage.app';
  const mockStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(storagePath)}?alt=media&token=mock-test-token`;

  return {
    downloadUrl: mockStorageUrl,
    storagePath
  };
}

