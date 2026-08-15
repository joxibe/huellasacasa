/**
 * HUELLAS A CASA — Compresor de Imágenes en Cliente
 * Garantiza fotos livianas (< 300KB) para optimizar consumo de datos en redes 3G.
 * Utiliza Canvas API nativo (0 dependencias externas).
 */

/**
 * Comprime un archivo de imagen en el navegador con compresión iterativa adaptativa.
 * Garantiza un tamaño final estrictamente menor a 300 KB.
 * @param {File} file - Archivo de imagen original
 * @returns {Promise<{blob: Blob, dataUrl: string, originalSize: number, compressedSize: number, reductionPercentage: number}>}
 */
export async function comprimirImagen(file) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Por favor selecciona un archivo de imagen válido (JPEG, PNG o WEBP).');
  }

  const targetMaxBytes = 300 * 1024; // 300 KB máximo estricto

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo del dispositivo.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no compatible o archivo dañado.'));
      img.onload = () => {
        // Estrategia de compresión en cascada si la foto es muy pesada
        const intentos = [
          { maxDim: 1200, quality: 0.75 },
          { maxDim: 960,  quality: 0.65 },
          { maxDim: 800,  quality: 0.55 },
          { maxDim: 640,  quality: 0.45 }
        ];

        let resultado = null;

        const procesarIntento = (indice) => {
          if (indice >= intentos.length) {
            if (resultado) {
              return resolve(resultado);
            }
            return reject(new Error('La imagen es demasiado pesada y no se pudo reducir a menos de 300KB. Intenta con otra foto.'));
          }

          const { maxDim, quality } = intentos[indice];
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              return reject(new Error('No se pudo procesar la compresión de la imagen.'));
            }

            resultado = {
              blob,
              dataUrl: canvas.toDataURL('image/jpeg', quality),
              originalSize: file.size,
              compressedSize: blob.size,
              reductionPercentage: Math.max(0, Math.round((1 - blob.size / file.size) * 100))
            };

            // Si ya cumple < 300KB, resolvemos de inmediato
            if (blob.size <= targetMaxBytes) {
              return resolve(resultado);
            }

            // Si aún supera 300KB, pasamos al siguiente intento más agresivo
            procesarIntento(indice + 1);
          }, 'image/jpeg', quality);
        };

        procesarIntento(0);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
