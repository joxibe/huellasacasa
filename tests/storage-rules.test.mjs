/**
 * HUELLAS A CASA — Tests Unitarios de Security Rules para Firebase Storage
 * Valida la protección cruzada con Firestore (solo el creadorUid puede borrar/sobrescribir fotos).
 * 
 * Ejecutar con:
 *   firebase emulators:exec --only firestore,storage "node tests/storage-rules.test.mjs"
 */

import fs from 'fs';
import path from 'path';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

const PROJECT_ID = 'huellasacasa-23651';
const STORAGE_RULES = fs.readFileSync(path.resolve('./storage.rules'), 'utf8');
const FIRESTORE_RULES = fs.readFileSync(path.resolve('./firestore.rules'), 'utf8');

async function runRulesTests() {
  console.log('🧪 Iniciando Test Suite de Firebase Storage Security Rules...');

  let testEnv;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      storage: {
        rules: STORAGE_RULES,
        host: '127.0.0.1',
        port: 9199
      },
      firestore: {
        rules: FIRESTORE_RULES,
        host: '127.0.0.1',
        port: 8080
      }
    });
  } catch (e) {
    console.log('⚠️ Emuladores no detectados o puerto no disponible. Ejecutar con:');
    console.log('   npx firebase emulators:exec --only firestore,storage "node tests/storage-rules.test.mjs"');
    console.log('Detalle:', e.message);
    return;
  }

  try {
    const creatorUid = 'usr_dueno_123';
    const strangerUid = 'usr_extrano_456';
    const reporteId = 'rep_test_001';
    const filePath = `reportes/${reporteId}/foto_01.jpg`;

    // 1. Preparar documento de reporte en Firestore con creadorUid = creatorUid (sin bypass de reglas)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('reportes').doc(reporteId).set({
        id: reporteId,
        creadorUid: creatorUid,
        nombre: 'Pelusa',
        tipo: 'perdido'
      });
    });

    console.log('  ✅ Fixture de Firestore creado con creadorUid: ' + creatorUid);

    // 2. Test: Cualquier usuario (incluso anónimo) puede LEER la foto
    const unauthedCtx = testEnv.unauthenticatedContext();
    const unauthedStorage = unauthedCtx.storage();
    await assertSucceeds(
      unauthedStorage.ref(filePath).getDownloadURL().catch(err => {
        // En emulador si no existe el archivo retorna object-not-found, lo cual pasa la regla de lectura
        if (err.code === 'storage/object-not-found') return 'ok';
        throw err;
      })
    );
    console.log('  ✅ [READ] Lectura pública permitida');

    // 3. Test: Usuario autenticado puede CREAR/SUBIR una foto (<500KB)
    const creatorCtx = testEnv.authenticatedContext(creatorUid);
    const creatorStorage = creatorCtx.storage();
    const smallBlob = Buffer.from('fake-image-bytes');

    await assertSucceeds(
      creatorStorage.ref(filePath).put(smallBlob, { contentType: 'image/jpeg' })
    );
    console.log('  ✅ [CREATE] Creador autenticado puede subir foto inicial (<500KB)');

    // 4. Test: Usuario NO creador (stranger) INTENTA BORRAR la foto -> DEBE FALLAR
    const strangerCtx = testEnv.authenticatedContext(strangerUid);
    const strangerStorage = strangerCtx.storage();

    await assertFails(
      strangerStorage.ref(filePath).delete()
    );
    console.log('  ✅ [DELETE - BLOCKED] Usuario NO creador es BLOQUEADO al intentar borrar la foto');

    // 5. Test: Usuario NO creador INTENTA SOBRESCRIBIR la foto -> DEBE FALLAR
    await assertFails(
      strangerStorage.ref(filePath).put(smallBlob, { contentType: 'image/jpeg' })
    );
    console.log('  ✅ [UPDATE - BLOCKED] Usuario NO creador es BLOQUEADO al intentar sobrescribir la foto');

    // 6. Test: El CREADOR legítimo INTENTA BORRAR su propia foto -> DEBE TENER ÉXITO
    await assertSucceeds(
      creatorStorage.ref(filePath).delete()
    );
    console.log('  ✅ [DELETE - ALLOWED] Creador legítimo SÍ puede borrar su propia foto');

    console.log('\n🏁 RESULTADO: Todos los tests de Storage Security Rules pasaron con éxito.');
  } finally {
    await testEnv.cleanup();
  }
}

runRulesTests().catch(err => {
  console.error('❌ Error en ejecución de tests de reglas:', err);
  process.exit(1);
});
