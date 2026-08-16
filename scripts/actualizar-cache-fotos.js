/**
 * Script de migración única para actualizar el Cache-Control de todas las fotos
 * existentes en Firebase Cloud Storage bajo la carpeta reportes/
 */

import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function obtenerAccessTokenFirebase() {
  // Intentar leer token de firebase-tools configstore
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const tokens = config.tokens;
      if (tokens && tokens.access_token) {
        return tokens.access_token;
      }
    } catch (e) {
      console.warn('No se pudo leer configstore de firebase-tools:', e.message);
    }
  }
  return null;
}

async function actualizarCacheFotos() {
  const bucketName = 'huellasacasa-23651.firebasestorage.app';
  console.log(`🚀 Iniciando actualización de Cache-Control para fotos en gs://${bucketName}/reportes/ ...`);

  const token = await obtenerAccessTokenFirebase();

  if (token) {
    console.log('🔑 Usando token de autenticación de Firebase CLI...');
    // Usar Google Cloud Storage REST API con el token de Firebase CLI
    const listUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o?prefix=reportes/`;
    const res = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Error listando archivos de Storage (${res.status}):`, errText);
      return;
    }

    const data = await res.json();
    const items = data.items || [];
    console.log(`📦 Encontrados ${items.length} archivos en el bucket.\n`);

    let actualizados = 0;
    for (const item of items) {
      console.log(`🖼️  Procesando: ${item.name} ...`);
      const patchUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(item.name)}`;
      
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cacheControl: 'public, max-age=604800'
        })
      });

      if (patchRes.ok) {
        const updatedItem = await patchRes.json();
        console.log(`   ✅ Cache-Control actualizado a: "${updatedItem.cacheControl}"`);
        actualizados++;
      } else {
        const patchErr = await patchRes.text();
        console.error(`   ❌ Error actualizando ${item.name}:`, patchErr);
      }
    }

    console.log(`\n🎉 Migración finalizada: ${actualizados} archivo(s) actualizados exitosamente con Cache-Control de 7 días.`);
  } else {
    // Intentar con SDK estándar de Google Cloud
    const storage = new Storage({ projectId: 'huellasacasa-23651' });
    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix: 'reportes/' });
    console.log(`📦 Encontrados ${files.length} archivos.`);

    for (const file of files) {
      await file.setMetadata({ cacheControl: 'public, max-age=604800' });
      console.log(`✅ ${file.name} actualizado.`);
    }
  }
}

actualizarCacheFotos().catch(err => {
  console.error('Error durante la migración:', err);
});
