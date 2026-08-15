/**
 * HUELLAS A CASA — Tests Unitarios de Security Rules para Cloud Firestore
 * Valida las reglas declarativas de Firestore en emulador con @firebase/rules-unit-testing.
 * 
 * Casos evaluados:
 * 1. [BLOCKED] Un usuario NO autenticado no puede leer /reportes/{id}/privado/contacto.
 * 2. [ALLOWED] Un usuario autenticado SÍ puede leer /reportes/{id}/privado/contacto (aunque no sea el creador).
 * 3. [BLOCKED] Un usuario NO autenticado no puede leer /reportes/{id}/privado/seguridad.
 * 4. [BLOCKED] Un usuario autenticado que NO es el creador no puede leer /reportes/{id}/privado/seguridad.
 * 5. [ALLOWED] Solo el creador puede leer /reportes/{id}/privado/seguridad.
 * 6. [BLOCKED] Un usuario no puede crear un 4to reporte activo del mismo tipo si ya tiene 3 en esa categoría (validado en rules).
 * 7. [BLOCKED] Un usuario ajeno no puede escribir directamente el campo estado a 'reunido' para forzar el cierre sin pasar por confirmado_ambas_partes.
 * 8. [ALLOWED] Cualquiera, autenticado o no, puede leer el documento público /reportes/{id}.
 * 9. [BLOCKED] /reportes_abuso/{id} no puede leerse por ningún cliente (autenticado o anónimo).
 */

import fs from 'fs';
import path from 'path';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

const PROJECT_ID = 'demo-huellasacasa-firestore-test';
const FIRESTORE_RULES = fs.readFileSync(path.resolve('./firestore.rules'), 'utf8');

async function runFirestoreRulesTests() {
  console.log('🧪 Iniciando Test Suite de Firestore Security Rules...\n');

  let testEnv;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: FIRESTORE_RULES,
        host: '127.0.0.1',
        port: 8080
      }
    });
  } catch (e) {
    console.log('⚠️ Error al inicializar emulador de Firestore:', e.message);
    process.exit(1);
  }

  const results = [];

  function record(id, description, passed, detail = '') {
    results.push({ id, description, passed, detail });
    if (passed) {
      console.log(`  ✅ CASO ${id}: ${description}`);
    } else {
      console.log(`  ❌ CASO ${id} [FALLÓ]: ${description} — ${detail}`);
    }
  }

  try {
    const creatorUid = 'usr_dueno_123';
    const strangerUid = 'usr_extrano_456';
    const reporteId = 'rep_test_001';

    // ── Fixture: Preparar documento de reporte y usuario en Firestore (sin reglas) ──
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('usuarios').doc(creatorUid).set({
        uid: creatorUid,
        perdidosActivosCount: 3,
        encontradosActivosCount: 0,
        adopcionActivosCount: 0,
        reportesActivosCount: 3
      });

      await db.collection('reportes').doc(reporteId).set({
        id: reporteId,
        creadorUid: creatorUid,
        tipo: 'perdido',
        estado: 'perdido',
        nombre: 'Pelusa',
        ciudad: 'Cali',
        ciudadLower: 'cali',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        confirmadoPorCreador: false,
        confirmadoPorContraparte: false,
        coincidenciaConReporteId: null
      });

      await db.collection('reportes').doc(reporteId).collection('privado').doc('contacto').set({
        telefonoContacto: '3161234567',
        medioContacto: 'whatsapp',
        creadorUid: creatorUid
      });

      await db.collection('reportes').doc(reporteId).collection('privado').doc('seguridad').set({
        senaVerificacionPrivada: 'Cicatriz pata trasera',
        creadorUid: creatorUid
      });

      await db.collection('reportes_abuso').doc('abuso_001').set({
        reporteId: reporteId,
        motivo: 'Spam',
        usuarioDenuncianteUid: strangerUid
      });
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const creatorDb = testEnv.authenticatedContext(creatorUid).firestore();
    const strangerDb = testEnv.authenticatedContext(strangerUid).firestore();

    // ── CASO 1: [BLOCKED] Un usuario NO autenticado no puede leer /reportes/{id}/privado/contacto ──
    try {
      await assertFails(unauthedDb.collection('reportes').doc(reporteId).collection('privado').doc('contacto').get());
      record(1, '[BLOCKED] Usuario anónimo bloqueado de leer /privado/contacto', true);
    } catch (e) {
      record(1, '[BLOCKED] Usuario anónimo bloqueado de leer /privado/contacto', false, e.message);
    }

    // ── CASO 2: [ALLOWED] Un usuario autenticado SÍ puede leer /reportes/{id}/privado/contacto ──
    try {
      await assertSucceeds(strangerDb.collection('reportes').doc(reporteId).collection('privado').doc('contacto').get());
      record(2, '[ALLOWED] Usuario autenticado ajeno puede leer /privado/contacto para contactar', true);
    } catch (e) {
      record(2, '[ALLOWED] Usuario autenticado ajeno puede leer /privado/contacto para contactar', false, e.message);
    }

    // ── CASO 3: [BLOCKED] Un usuario NO autenticado no puede leer /reportes/{id}/privado/seguridad ──
    try {
      await assertFails(unauthedDb.collection('reportes').doc(reporteId).collection('privado').doc('seguridad').get());
      record(3, '[BLOCKED] Usuario anónimo bloqueado de leer /privado/seguridad', true);
    } catch (e) {
      record(3, '[BLOCKED] Usuario anónimo bloqueado de leer /privado/seguridad', false, e.message);
    }

    // ── CASO 4: [BLOCKED] Un usuario autenticado que NO es el creador no puede leer /reportes/{id}/privado/seguridad ──
    try {
      await assertFails(strangerDb.collection('reportes').doc(reporteId).collection('privado').doc('seguridad').get());
      record(4, '[BLOCKED] Usuario autenticado no-creador bloqueado de leer /privado/seguridad', true);
    } catch (e) {
      record(4, '[BLOCKED] Usuario autenticado no-creador bloqueado de leer /privado/seguridad', false, e.message);
    }

    // ── CASO 5: [ALLOWED] Solo el creador puede leer /reportes/{id}/privado/seguridad ──
    try {
      await assertSucceeds(creatorDb.collection('reportes').doc(reporteId).collection('privado').doc('seguridad').get());
      record(5, '[ALLOWED] El creador legítimo sí puede leer /privado/seguridad', true);
    } catch (e) {
      record(5, '[ALLOWED] El creador legítimo sí puede leer /privado/seguridad', false, e.message);
    }

    // ── CASO 6: [BLOCKED] Un usuario no puede crear un 4to reporte activo del mismo tipo si ya tiene 3 en esa categoría ──
    try {
      // creatorUid ya tiene 3 perdidos activos en el documento de usuarios/creatorUid
      await assertFails(creatorDb.collection('reportes').doc('rep_test_004').set({
        id: 'rep_test_004',
        creadorUid: creatorUid,
        tipo: 'perdido',
        estado: 'perdido',
        nombre: '4to Reporte Ilegal',
        ciudad: 'Cali',
        ciudadLower: 'cali',
        fechaCreacion: new Date().toISOString()
      }));
      record(6, '[BLOCKED] Reglas bloquean creación de 4to reporte si cuota de 3 está agotada', true);
    } catch (e) {
      record(6, '[BLOCKED] Reglas bloquean creación de 4to reporte si cuota de 3 está agotada', false, 'Las reglas actuales no validan cuota de usuarios/uid: ' + e.message);
    }

    // ── CASO 7: [BLOCKED] Un usuario ajeno no puede escribir directamente el campo estado a 'reunido' ──
    try {
      // El usuario ajeno intenta forzar el estado a 'reunido' sin pasar por confirmación bilateral
      await assertFails(strangerDb.collection('reportes').doc(reporteId).update({
        estado: 'reunido',
        fechaActualizacion: new Date().toISOString()
      }));
      record(7, '[BLOCKED] Usuario ajeno no puede forzar estado a reunido directamente', true);
    } catch (e) {
      record(7, '[BLOCKED] Usuario ajeno no puede forzar estado a reunido directamente', false, 'Vulnerabilidad detectada: el usuario ajeno pudo forzar estado a reunido: ' + e.message);
    }

    // ── CASO 8: [ALLOWED] Cualquiera (autenticado o no) puede leer el documento público /reportes/{id} ──
    try {
      await assertSucceeds(unauthedDb.collection('reportes').doc(reporteId).get());
      record(8, '[ALLOWED] Cualquier visitante puede leer el documento público /reportes/{id}', true);
    } catch (e) {
      record(8, '[ALLOWED] Cualquier visitante puede leer el documento público /reportes/{id}', false, e.message);
    }

    // ── CASO 9: [BLOCKED] /reportes_abuso/{id} no puede leerse por ningún cliente (autenticado o anónimo) ──
    try {
      await assertFails(unauthedDb.collection('reportes_abuso').doc('abuso_001').get());
      await assertFails(strangerDb.collection('reportes_abuso').doc('abuso_001').get());
      record(9, '[BLOCKED] Lectura de /reportes_abuso bloqueada para clientes anónimos y autenticados', true);
    } catch (e) {
      record(9, '[BLOCKED] Lectura de /reportes_abuso bloqueada para clientes anónimos y autenticados', false, e.message);
    }

    // ── CASO 10: [BLOCKED] Un usuario no puede resetear arbitrariamente sus contadores en /usuarios/{uid} de 3 a 0 ──
    try {
      await assertFails(creatorDb.collection('usuarios').doc(creatorUid).update({
        perdidosActivosCount: 0,
        reportesActivosCount: 0
      }));
      record(10, '[BLOCKED] Usuario bloqueado de resetear arbitrariamente sus contadores en /usuarios/{uid}', true);
    } catch (e) {
      record(10, '[BLOCKED] Usuario bloqueado de resetear arbitrariamente sus contadores en /usuarios/{uid}', false, e.message);
    }

    // ── CASO 11: [BLOCKED] Un usuario ajeno NO contraparte no puede alterar confirmadoPorContraparte ──
    try {
      // Intento de un extraño de poner confirmadoPorContraparte = true en un reporte sin match o sin ser contraparte
      await assertFails(strangerDb.collection('reportes').doc(reporteId).update({
        confirmadoPorContraparte: true,
        fechaActualizacion: new Date().toISOString()
      }));
      record(11, '[BLOCKED] Extraño no puede alterar confirmadoPorContraparte en reporte ajeno', true);
    } catch (e) {
      record(11, '[BLOCKED] Extraño no puede alterar confirmadoPorContraparte en reporte ajeno', false, e.message);
    }

    // ── CASO 12: [BLOCKED] El creador de un reporte NO puede alterar confirmadoPorContraparte (suplantar el voto del otro) ──
    try {
      await assertFails(creatorDb.collection('reportes').doc(reporteId).update({
        confirmadoPorContraparte: true,
        fechaActualizacion: new Date().toISOString()
      }));
      record(12, '[BLOCKED] Creador no puede alterar confirmadoPorContraparte (suplantar voto contraparte)', true);
    } catch (e) {
      record(12, '[BLOCKED] Creador no puede alterar confirmadoPorContraparte (suplantar voto contraparte)', false, e.message);
    }

    // ── CASO 13: [BLOCKED] Un reporte con vínculo activo pendiente NO puede saltar directo a reunido ──
    const reporteConVinculoId = 'rep_test_vinculado_01';
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('reportes').doc(reporteConVinculoId).set({
        id: reporteConVinculoId,
        creadorUid: creatorUid,
        tipo: 'perdido',
        estado: 'coincidencia_sugerida',
        nombre: 'Max',
        ciudad: 'Cali',
        ciudadLower: 'cali',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        confirmadoPorCreador: false,
        confirmadoPorContraparte: false,
        coincidenciaConReporteId: 'rep_otro_002' // Vínculo pendiente activo
      });
    });

    try {
      // El creador intenta forzar el cierre a 'reunido' teniendo un vínculo pendiente activo
      await assertFails(creatorDb.collection('reportes').doc(reporteConVinculoId).update({
        estado: 'reunido',
        fechaActualizacion: new Date().toISOString()
      }));
      record(13, '[BLOCKED] Reporte con vínculo activo pendiente NO puede saltar directo a reunido', true);
    } catch (e) {
      record(13, '[BLOCKED] Reporte con vínculo activo pendiente NO puede saltar directo a reunido', false, e.message);
    }

    // ── CASO 14: [ALLOWED] Creador SÍ puede cerrar a reunido si desvincula primero (coincidenciaConReporteId = null) ──
    try {
      // Paso 1: Rechaza/desvincula limpiando coincidenciaConReporteId y reseteando estado a su tipo base
      await assertSucceeds(creatorDb.collection('reportes').doc(reporteConVinculoId).update({
        estado: 'perdido',
        coincidenciaConReporteId: null,
        confirmadoPorCreador: false,
        confirmadoPorContraparte: false,
        fechaActualizacion: new Date().toISOString()
      }));
      // Paso 2: Ya desvinculado (coincidenciaConReporteId == null), SÍ puede cerrar directamente a reunido
      await assertSucceeds(creatorDb.collection('reportes').doc(reporteConVinculoId).update({
        estado: 'reunido',
        fechaActualizacion: new Date().toISOString()
      }));
      record(14, '[ALLOWED] Creador puede cerrar a reunido tras desvincularse limpiando coincidenciaConReporteId', true);
    } catch (e) {
      record(14, '[ALLOWED] Creador puede cerrar a reunido tras desvincularse limpiando coincidenciaConReporteId', false, e.message);
    }

    // ── CASO 15: [ALLOWED] Creación atómica en una sola transacción/batch de /reportes/{id}, /privado/contacto y /privado/seguridad ──
    const newUserId = 'usr_nuevo_batch_01';
    const newReportId = 'rep_nuevo_batch_01';
    const newUserDb = testEnv.authenticatedContext(newUserId).firestore();

    // Inicializar usuario con cuota disponible (0 activos)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('usuarios').doc(newUserId).set({
        uid: newUserId,
        perdidosActivosCount: 0,
        encontradosActivosCount: 0,
        adopcionActivosCount: 0,
        reportesActivosCount: 0
      });
    });

    try {
      const batch = newUserDb.batch();
      // 1. Incremento de cuota en usuario
      batch.update(newUserDb.collection('usuarios').doc(newUserId), {
        reportesActivosCount: 1,
        perdidosActivosCount: 1
      });
      // 2. Documento principal público
      batch.set(newUserDb.collection('reportes').doc(newReportId), {
        id: newReportId,
        creadorUid: newUserId,
        tipo: 'perdido',
        estado: 'perdido',
        nombre: 'Kira',
        ciudad: 'Cali',
        ciudadLower: 'cali',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        confirmadoPorCreador: false,
        confirmadoPorContraparte: false,
        coincidenciaConReporteId: null
      });
      // 3. Subcolección contacto
      batch.set(newUserDb.collection('reportes').doc(newReportId).collection('privado').doc('contacto'), {
        telefonoContacto: '3187654321',
        medioContacto: 'whatsapp',
        creadorUid: newUserId,
        creadoEn: new Date().toISOString()
      });
      // 4. Subcolección seguridad
      batch.set(newUserDb.collection('reportes').doc(newReportId).collection('privado').doc('seguridad'), {
        senaVerificacionPrivada: 'Mancha en oreja derecha',
        creadorUid: newUserId,
        creadoEn: new Date().toISOString()
      });

      await assertSucceeds(batch.commit());
      record(15, '[ALLOWED] Creación atómica en batch de /reportes/{id}, /privado/contacto y /privado/seguridad', true);
    } catch (e) {
      record(15, '[ALLOWED] Creación atómica en batch de /reportes/{id}, /privado/contacto y /privado/seguridad', false, e.message);
    }

    // ── CASO 16: [BLOCKED] Usuario NO puede crear /privado/contacto con creadorUid ajeno ──
    try {
      const spoofReportId = 'rep_spoof_01';
      await assertFails(strangerDb.collection('reportes').doc(spoofReportId).collection('privado').doc('contacto').set({
        telefonoContacto: '3110000000',
        medioContacto: 'whatsapp',
        creadorUid: creatorUid // Intento de suplantar al creador
      }));
      record(16, '[BLOCKED] Usuario bloqueado de crear /privado/contacto con creadorUid ajeno', true);
    } catch (e) {
      record(16, '[BLOCKED] Usuario bloqueado de crear /privado/contacto con creadorUid ajeno', false, e.message);
    }

    console.log('\n════════════════════════════════════════════════════════════');
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;
    console.log(`🏁 RESULTADO: ${passedCount} ✅ PASARON | ${failedCount} ❌ FALLARON`);
    console.log('════════════════════════════════════════════════════════════');

  } finally {
    await testEnv.cleanup();
  }
}

runFirestoreRulesTests().catch(err => {
  console.error('❌ Error general:', err);
  process.exit(1);
});
