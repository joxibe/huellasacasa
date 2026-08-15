/**
 * HUELLAS A CASA — Suite de Tests Unitarios Automatizados
 * Ejecutar con: node tests/huellas.test.mjs
 */

// ─── 1. Polyfills de entorno navegador (deben crearse antes de importar módulos) ───
const _store = {};
global.localStorage = {
  getItem: (k) => _store[k] ?? null,
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
  clear: () => { Object.keys(_store).forEach(k => delete _store[k]); }
};

global.window = {
  firebase: null,
  location: { href: '' }
};

// ─── 2. Carga dinámica de módulos del proyecto ──────────────────────────────
const { normalizarTexto, formatearEstado, formatearEspecie, generarEnlaceWhatsApp, formatoTiempoRelativo } =
  await import('../public/js/utils/formato.js');

const { setTestUser, logout, getCurrentUser } =
  await import('../public/js/services/auth.service.js');

const {
  crearReporte, obtenerMisReportes, obtenerReportes, obtenerReportePorId,
  sugerirCoincidencia, responderCoincidencia, marcarComoReunido,
  marcarComoAdoptado, cambiarAEnAdopcion, obtenerCuotasUsuario,
  LIMITE_PERDIDOS, LIMITE_ENCONTRADOS, LIMITE_ADOPCION, LIMITE_REPORTES_ACTIVOS
} = await import('../public/js/services/reportes.service.js');

const { subirFotoReporte } = await import('../public/js/services/storage.service.js');

// ─── 3. Utilidades de testing ───────────────────────────────────────────────
let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}${detail ? ' — ' + detail : ''}`);
    failed++;
    errors.push({ testName, detail });
  }
}

async function assertThrows(fn, expectedMsg, testName) {
  try {
    await fn();
    console.log(`  ❌ FAIL: ${testName} — Se esperaba un error pero no se lanzó`);
    failed++;
    errors.push({ testName, detail: 'No se lanzó error' });
  } catch (e) {
    if (!expectedMsg || e.message.toLowerCase().includes(expectedMsg.toLowerCase())) {
      console.log(`  ✅ ${testName}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${testName} — Error inesperado: "${e.message}"`);
      failed++;
      errors.push({ testName, detail: e.message });
    }
  }
}

function suite(name) {
  console.log(`\n🧪 ${name}`);
  console.log('─'.repeat(60));
}

function resetStore() {
  localStorage.clear();
  setTestUser(null);
}

function datosBase(tipo = 'perdido', overrides = {}) {
  return {
    tipo,
    especie: 'perro',
    tamano: 'mediano',
    sexo: 'macho',
    color: 'Negro',
    nombre: 'Test',
    ciudad: 'Cali',
    ciudadLower: 'cali',
    barrio: 'San Antonio',
    barrioLower: 'san antonio',
    fechaEvento: '2026-08-10',
    senasVisibles: 'Collar rojo',
    telefonoContacto: '3001234567',
    medioContacto: 'whatsapp',
    senaVerificacionPrivada: 'Cicatriz pata',
    ...overrides
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 1: Utilitarios y Formateo
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 1 — Utilitarios y Formateo');

assert(normalizarTexto('Cali') === 'cali', 'normalizarTexto — Minúsculas');
assert(normalizarTexto('Bogotá') === 'bogota', 'normalizarTexto — Elimina tildes');
assert(normalizarTexto('  Medellín  ') === 'medellin', 'normalizarTexto — Trim y sin tilde');
assert(normalizarTexto('') === '', 'normalizarTexto — Cadena vacía');
assert(normalizarTexto(null) === '', 'normalizarTexto — null');

assert(formatearEstado('perdido') === 'Perdido', 'formatearEstado — perdido');
assert(formatearEstado('encontrado') === 'Encontrado', 'formatearEstado — encontrado');
assert(formatearEstado('coincidencia_sugerida') === 'Coincidencia sugerida', 'formatearEstado — coincidencia_sugerida');
assert(formatearEstado('confirmado_ambas_partes') === 'Confirmado por ambas partes', 'formatearEstado — confirmado_ambas_partes');
assert(formatearEstado('reunido') === 'Reunido', 'formatearEstado — reunido');
assert(formatearEstado('en_adopcion') === 'En adopción', 'formatearEstado — en_adopcion');
assert(formatearEstado('adoptado') === 'Adoptado', 'formatearEstado — adoptado (nuevo)');
assert(formatearEstado('desconocido') === 'desconocido', 'formatearEstado — fallback');

assert(formatearEspecie('perro').label === 'Perro', 'formatearEspecie — perro label');
assert(formatearEspecie('gato').icon === '🐱', 'formatearEspecie — gato icon');
assert(formatearEspecie('otro').label === 'Otro', 'formatearEspecie — otro label');
assert(formatearEspecie('desconocido').label === 'Mascota', 'formatearEspecie — fallback');

const urlWA = generarEnlaceWhatsApp('3001234567', { nombre: 'Toby', tipo: 'perdido', ciudad: 'Cali', barrio: null });
assert(urlWA.startsWith('https://wa.me/573001234567'), 'generarEnlaceWhatsApp — prefijo 57');
assert(urlWA.includes('Toby'), 'generarEnlaceWhatsApp — incluye nombre');

const tiempoReciente = formatoTiempoRelativo(new Date(Date.now() - 30000).toISOString());
assert(tiempoReciente === 'Hace un momento', 'formatoTiempoRelativo — hace un momento');

// Verificación de subida a Storage (URL corta de Firebase Storage y path por directorio)
const fallbackFoto = await subirFotoReporte(null, 'rep_test_foto');
assert(fallbackFoto.downloadUrl.startsWith('data:image/svg+xml'), 'subirFotoReporte (null) — Retorna placeholder SVG local autónomo');
assert(fallbackFoto.storagePath === 'reportes/rep_test_foto/default.svg', 'subirFotoReporte (null) — Path por carpeta de reporte');

const mockBlob = { size: 150 * 1024, type: 'image/jpeg' };
const resFoto = await subirFotoReporte(mockBlob, 'rep_test_foto_01');
assert(resFoto.downloadUrl.includes('firebasestorage.googleapis.com'), 'subirFotoReporte (blob) — Retorna URL de Firebase Storage');
assert(!resFoto.downloadUrl.startsWith('data:image/jpeg'), 'subirFotoReporte (blob) — NO retorna DataURL Base64');
assert(resFoto.storagePath.startsWith('reportes/rep_test_foto_01/'), 'subirFotoReporte (blob) — Genera storagePath con carpeta de reporteId');

const blobPesado = { size: 600 * 1024, type: 'image/jpeg' };
await assertThrows(
  () => subirFotoReporte(blobPesado, 'rep_test_excede'),
  'excede el límite máximo de 500KB',
  'subirFotoReporte — Rechaza imágenes que excedan 500KB'
);

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 2: Constantes de Cuota Diferenciada
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 2 — Constantes de Cuota');

assert(LIMITE_PERDIDOS === 3, `LIMITE_PERDIDOS = 3 (actual: ${LIMITE_PERDIDOS})`);
assert(LIMITE_ENCONTRADOS === 3, `LIMITE_ENCONTRADOS = 3 (actual: ${LIMITE_ENCONTRADOS})`);
assert(LIMITE_ADOPCION === 3, `LIMITE_ADOPCION = 3 (actual: ${LIMITE_ADOPCION})`);
assert(LIMITE_REPORTES_ACTIVOS === 9, `LIMITE_REPORTES_ACTIVOS = 9 (actual: ${LIMITE_REPORTES_ACTIVOS})`);

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 3: Cuotas sin usuario autenticado
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 3 — Cuotas sin usuario autenticado');

const cuotasVacias = await obtenerCuotasUsuario(null);
assert(cuotasVacias.perdidosActivos === 0, 'Cuotas vacías — perdidosActivos = 0');
assert(cuotasVacias.encontradosActivos === 0, 'Cuotas vacías — encontradosActivos = 0');
assert(cuotasVacias.adopcionActivos === 0, 'Cuotas vacías — adopcionActivos = 0');
assert(cuotasVacias.limitePerdidos === 3, 'Cuotas vacías — limitePerdidos = 3');
assert(cuotasVacias.limiteEncontrados === 3, 'Cuotas vacías — limiteEncontrados = 3');
assert(cuotasVacias.limiteAdopcion === 3, 'Cuotas vacías — limiteAdopcion = 3');
assert(cuotasVacias.limiteTotal === 9, 'Cuotas vacías — limiteTotal = 9');

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 4: Creación de Reportes y Validación de Cuota (3 Perdidos / 3 Encontrados / 3 Adopción)
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 4 — Creación de Reportes y Límites de Cuota');

resetStore();
const user1 = { uid: 'usr_test_001', email: 'test1@test.com', displayName: 'Test 1' };
setTestUser(user1);

// Crear 3 reportes perdidos (máximo permitido)
const repP1 = await crearReporte(datosBase('perdido', { nombre: 'Luna' }));
assert(repP1.id != null, 'crearReporte — ID generado para 1er perdido');
assert(repP1.tipo === 'perdido', 'crearReporte — tipo = perdido');
assert(repP1.creadorUid === user1.uid, 'crearReporte — creadorUid registrado');

const repP2 = await crearReporte(datosBase('perdido', { nombre: 'Max' }));
assert(repP2.id != null, 'crearReporte — ID generado para 2do perdido');

const repP3 = await crearReporte(datosBase('perdido', { nombre: 'Thor' }));
assert(repP3.id != null, 'crearReporte — ID generado para 3er perdido');

// 4to reporte de perdido debe ser RECHAZADO
await assertThrows(
  () => crearReporte(datosBase('perdido', { nombre: 'Rocky' })),
  'límite máximo de 3',
  'crearReporte — 4to reporte de perdido rechazado por cuota (máx 3)'
);

// Con el mismo usuario, debe poder crear hasta 3 encontrados
const repE1 = await crearReporte(datosBase('encontrado', { nombre: 'Enc1' }));
const repE2 = await crearReporte(datosBase('encontrado', { nombre: 'Enc2' }));
const repE3 = await crearReporte(datosBase('encontrado', { nombre: 'Enc3' }));
assert(repE3.id != null, 'crearReporte — Permite crear 3 reportes encontrados');

// 4to reporte de encontrado debe ser RECHAZADO
await assertThrows(
  () => crearReporte(datosBase('encontrado', { nombre: 'Enc4' })),
  'límite máximo de 3',
  'crearReporte — 4to reporte de encontrado rechazado por cuota (máx 3)'
);

// Con el mismo usuario, debe poder crear hasta 3 adopción
const repA1 = await crearReporte(datosBase('en_adopcion', { nombre: 'Adop1' }));
const repA2 = await crearReporte(datosBase('en_adopcion', { nombre: 'Adop2' }));
const repA3 = await crearReporte(datosBase('en_adopcion', { nombre: 'Adop3' }));
assert(repA3.id != null, 'crearReporte — Permite crear 3 reportes en adopción');

// 4to reporte de adopción debe ser RECHAZADO
await assertThrows(
  () => crearReporte(datosBase('en_adopcion', { nombre: 'Adop4' })),
  'límite máximo de 3',
  'crearReporte — 4to reporte de adopción rechazado por cuota (máx 3)'
);

// Validar conteo total de cuotas del usuario (3 + 3 + 3 = 9)
const cuotasUser1 = await obtenerCuotasUsuario(user1.uid);
assert(cuotasUser1.perdidosActivos === 3, 'obtenerCuotasUsuario — perdidosActivos = 3');
assert(cuotasUser1.encontradosActivos === 3, 'obtenerCuotasUsuario — encontradosActivos = 3');
assert(cuotasUser1.adopcionActivos === 3, 'obtenerCuotasUsuario — adopcionActivos = 3');
assert(cuotasUser1.totalActivos === 9, 'obtenerCuotasUsuario — totalActivos = 9');

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 5: Filtros de Búsqueda
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 5 — Filtros de Búsqueda (obtenerReportes)');

const todos = await obtenerReportes({ ciudad: 'Cali' });
assert(todos.length >= 5, `obtenerReportes — Retorna reportes para Cali (total: ${todos.length})`);

const soloPerdidos = await obtenerReportes({ ciudad: 'Cali', tipo: 'perdido' });
assert(soloPerdidos.length > 0 && soloPerdidos.every(r => r.tipo === 'perdido'), 'obtenerReportes — Filtro tipo: perdido');

const soloEncontrados = await obtenerReportes({ ciudad: 'Cali', tipo: 'encontrado' });
assert(soloEncontrados.length > 0 && soloEncontrados.every(r => r.tipo === 'encontrado'), 'obtenerReportes — Filtro tipo: encontrado');

const porBarrio = await obtenerReportes({ ciudad: 'Cali', barrioTexto: 'San Antonio' });
assert(porBarrio.length > 0 && porBarrio.every(r => r.barrio && r.barrio.toLowerCase().includes('san antonio')), 'obtenerReportes — Filtro por barrio');

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 6: Flujo de Coincidencias Bilateral y Cierre "Reunido"
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 6 — Flujo de Coincidencias Bilateral e ID');

resetStore();
const userA = { uid: 'usr_A', email: 'a@test.com', displayName: 'Dueño Perdido' };
const userB = { uid: 'usr_B', email: 'b@test.com', displayName: 'Rescatista' };

// Dueño publica perdido
setTestUser(userA);
const repPerdido = await crearReporte(datosBase('perdido', { nombre: 'Firulais' }));

// Rescatista publica encontrado
setTestUser(userB);
const repEncontrado = await crearReporte(datosBase('encontrado', { nombre: 'Perrito Callejero' }));

// Rescatista sugiere coincidencia usando el ID del reporte perdido
setTestUser(userB);
await sugerirCoincidencia(repEncontrado.id, repPerdido.id);

let rA = await obtenerReportePorId(repPerdido.id);
let rB = await obtenerReportePorId(repEncontrado.id);
assert(rA.estado === 'coincidencia_sugerida', 'sugerirCoincidencia — repPerdido pasa a coincidencia_sugerida');
assert(rB.estado === 'coincidencia_sugerida', 'sugerirCoincidencia — repEncontrado pasa a coincidencia_sugerida');
assert(rA.coincidenciaConReporteId === repEncontrado.id, 'sugerirCoincidencia — repPerdido vinculado a repEncontrado.id');
assert(rB.coincidenciaConReporteId === repPerdido.id, 'sugerirCoincidencia — repEncontrado vinculado a repPerdido.id');

// Validación: no se puede sugerir coincidencia si ya tiene una pendiente
await assertThrows(
  () => sugerirCoincidencia(repEncontrado.id, repPerdido.id),
  'ya tiene una sugerencia',
  'sugerirCoincidencia — Bloquea doble sugerencia'
);

// Validación: no se puede sugerir coincidencia consigo mismo
await assertThrows(
  () => sugerirCoincidencia(repPerdido.id, repPerdido.id),
  'consigo mismo',
  'sugerirCoincidencia — Bloquea coincidencia consigo mismo'
);

// Dueño Perdido (User A) confirma
setTestUser(userA);
await responderCoincidencia(repPerdido.id, true);

// Rescatista (User B) confirma -> Estado debe avanzar a 'confirmado_ambas_partes'
setTestUser(userB);
await responderCoincidencia(repEncontrado.id, true);

rA = await obtenerReportePorId(repPerdido.id);
rB = await obtenerReportePorId(repEncontrado.id);
assert(rA.estado === 'confirmado_ambas_partes', 'responderCoincidencia bilateral — repPerdido pasa a confirmado_ambas_partes');
assert(rB.estado === 'confirmado_ambas_partes', 'responderCoincidencia bilateral — repEncontrado pasa a confirmado_ambas_partes');

// Cierre: Marcar como Reunido
setTestUser(userA);
await marcarComoReunido(repPerdido.id);

rA = await obtenerReportePorId(repPerdido.id);
rB = await obtenerReportePorId(repEncontrado.id);
assert(rA.estado === 'reunido', 'marcarComoReunido — repPerdido pasa a reunido');
assert(rB.estado === 'reunido', 'marcarComoReunido — repEncontrado también pasa a reunido bilateralmente');

// Validación de liberación de cupo tras reunión
const cuotasA = await obtenerCuotasUsuario(userA.uid);
assert(cuotasA.perdidosActivos === 0, 'marcarComoReunido — Libera cupo de perdidos para User A (activos = 0)');

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 7: Rechazo de Coincidencia Restaura Estados Anteriores
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 7 — Rechazo de Coincidencia');

resetStore();
const userC = { uid: 'usr_C', email: 'c@test.com', displayName: 'User C' };
const userD = { uid: 'usr_D', email: 'd@test.com', displayName: 'User D' };

setTestUser(userC);
const repC = await crearReporte(datosBase('perdido', { nombre: 'Caso C' }));

setTestUser(userD);
const repD = await crearReporte(datosBase('encontrado', { nombre: 'Caso D' }));

// Sugerir coincidencia
await sugerirCoincidencia(repC.id, repD.id);

// User D rechaza la sugerencia (no es la misma mascota)
setTestUser(userD);
await responderCoincidencia(repD.id, false);

const rC_restaurado = await obtenerReportePorId(repC.id);
const rD_restaurado = await obtenerReportePorId(repD.id);

assert(rC_restaurado.estado === 'perdido', 'responderCoincidencia(false) — repC vuelve a perdido');
assert(rD_restaurado.estado === 'encontrado', 'responderCoincidencia(false) — repD vuelve a encontrado');
assert(rC_restaurado.coincidenciaConReporteId === null, 'responderCoincidencia(false) — repC limpia referencia');
assert(rD_restaurado.coincidenciaConReporteId === null, 'responderCoincidencia(false) — repD limpia referencia');

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 8: Flujo En Adopción y Cierre "Adoptado"
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 8 — Flujo En Adopción y Cierre Adoptado');

resetStore();
const userE = { uid: 'usr_E', email: 'e@test.com', displayName: 'User E' };
setTestUser(userE);

const repAdop = await crearReporte(datosBase('encontrado', { nombre: 'Perrito Albergado' }));

// Regla de negocio: No se puede pasar a en_adopcion antes de los 20 días
await assertThrows(
  () => cambiarAEnAdopcion(repAdop.id),
  'al menos 20 días',
  'cambiarAEnAdopcion — Bloquea paso a adopción antes de 20 días'
);

// Simular paso de 21 días
const store = JSON.parse(localStorage.getItem('huellas_reportes_store'));
const itemIdx = store.findIndex(r => r.id === repAdop.id);
store[itemIdx].fechaCreacion = new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString();
localStorage.setItem('huellas_reportes_store', JSON.stringify(store));

// Ahora cambiarAEnAdopcion debe tener éxito
await cambiarAEnAdopcion(repAdop.id);
const rEnAdop = await obtenerReportePorId(repAdop.id);
assert(rEnAdop.estado === 'en_adopcion', 'cambiarAEnAdopcion — Estado actualizado a en_adopcion');
assert(rEnAdop.tipo === 'en_adopcion', 'cambiarAEnAdopcion — Tipo actualizado a en_adopcion');

// Al pasar a en_adopcion, la mascota ocupa 1 cupo activo dentro del pool de adopción (y libera el de encontrados)
const cuotasDuranteAdop = await obtenerCuotasUsuario(userE.uid);
assert(cuotasDuranteAdop.adopcionActivos === 1, 'cambiarAEnAdopcion — Ocupa 1 cupo activo en adopción');
assert(cuotasDuranteAdop.encontradosActivos === 0, 'cambiarAEnAdopcion — Libera cupo en encontrados');
assert(cuotasDuranteAdop.totalActivos === 1, 'cambiarAEnAdopcion — Total activos = 1');

// Marcar como Adoptado
await marcarComoAdoptado(repAdop.id);
const rAdoptado = await obtenerReportePorId(repAdop.id);
assert(rAdoptado.estado === 'adoptado', 'marcarComoAdoptado — Estado final = adoptado');

// Liberación de cupo tras adopción
const cuotasE = await obtenerCuotasUsuario(userE.uid);
assert(cuotasE.adopcionActivos === 0, 'marcarComoAdoptado — Libera cupo de adopción (activos = 0)');
assert(cuotasE.totalActivos === 0, 'marcarComoAdoptado — Libera total de activos (activos = 0)');

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 9: Bloqueos de Seguridad para Casos Cerrados
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 9 — Bloqueo de Operaciones en Casos Cerrados');

const userH = { uid: 'usr_H', email: 'h@test.com', displayName: 'User H' };
setTestUser(userH);
const repH = await crearReporte(datosBase('perdido', { nombre: 'Caso H' }));

// No se puede sugerir coincidencia con un caso que ya está 'adoptado' o 'reunido'
await assertThrows(
  () => sugerirCoincidencia(repH.id, repAdop.id),
  'ya fue cerrado',
  'sugerirCoincidencia — Bloquea vinculación con reporte cerrado (adoptado)'
);

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 10: Cierre Directo de Caso Perdido sin Coincidencia
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 10 — Cierre Directo de Caso (El dueño lo encuentra por su cuenta)');

resetStore();
const userDirecto = { uid: 'usr_directo', email: 'directo@test.com', displayName: 'Dueño Directo' };
setTestUser(userDirecto);

const repDirecto = await crearReporte(datosBase('perdido', { nombre: 'Pelusa' }));
assert(repDirecto.estado === 'perdido', 'crearReporte — Caso inicial en estado perdido');

// El dueño cierra su propio caso directamente
await marcarComoReunido(repDirecto.id);
const rDirectoActualizado = await obtenerReportePorId(repDirecto.id);
assert(rDirectoActualizado.estado === 'reunido', 'marcarComoReunido — Pasa directamente a reunido');

const cuotasDirecto = await obtenerCuotasUsuario(userDirecto.uid);
assert(cuotasDirecto.perdidosActivos === 0, 'marcarComoReunido directo — Libera cupo activo a 0');

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 11: obtenerMisReportes
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 11 — Listado en Mis Reportes');

resetStore();
const userMis = { uid: 'usr_mis_001', email: 'mis@test.com', displayName: 'Usuario Mis Reportes' };
setTestUser(userMis);

await crearReporte(datosBase('perdido', { nombre: 'Mascota 1' }));
await crearReporte(datosBase('encontrado', { nombre: 'Mascota 2' }));

const misReps = await obtenerMisReportes();
assert(misReps.length === 2, `obtenerMisReportes — Retorna los 2 reportes creados por el usuario (actual: ${misReps.length})`);
assert(misReps.every(r => r.creadorUid === userMis.uid), 'obtenerMisReportes — Todos pertenecen al usuario logueado');

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 12: Seguridad y Privacidad de la Seña Secreta
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 12 — Seguridad de Seña Secreta Privada (Anti-Fraude)');

const { obtenerSenaPrivada } = await import('../public/js/services/reportes.service.js');

const repPrivado = await crearReporte(datosBase('perdido', {
  nombre: 'Secreto',
  senaVerificacionPrivada: 'Mancha en forma de luna en la pata trasera izquierda'
}));

// El autor puede leer su propia seña privada
const senaAutor = await obtenerSenaPrivada(repPrivado.id);
assert(senaAutor === 'Mancha en forma de luna en la pata trasera izquierda', 'obtenerSenaPrivada — Autor puede ver la seña privada');

// Otro usuario NO debe tener acceso a la seña privada
const userIntruso = { uid: 'usr_intruso', email: 'intruso@test.com', displayName: 'Intruso' };
setTestUser(userIntruso);

await assertThrows(
  () => obtenerSenaPrivada(repPrivado.id),
  'Solo el autor del reporte puede ver la seña secreta',
  'obtenerSenaPrivada — Rechaza acceso a usuarios no autorizados'
);

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 13: Protección de Datos de Contacto (/privado/contacto)
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 13 — Protección de Datos de Contacto (/privado/contacto)');

const { obtenerContactoReporte } = await import('../public/js/services/reportes.service.js');

resetStore();
const userPublicador = { uid: 'usr_pub_001', email: 'pub@test.com', displayName: 'Publicador' };
setTestUser(userPublicador);

const repContacto = await crearReporte(datosBase('perdido', {
  nombre: 'Caso Contacto',
  telefonoContacto: '3169998877',
  medioContacto: 'whatsapp'
}));

// Caso A: Usuario autenticado (incluso si es un tercero) puede consultar el contacto para ayudar
const userLector = { uid: 'usr_lector_002', email: 'lector@test.com', displayName: 'Lector Interesado' };
setTestUser(userLector);

const contactoObtenido = await obtenerContactoReporte(repContacto.id);
assert(contactoObtenido.telefonoContacto === '3169998877', 'obtenerContactoReporte — Usuario autenticado puede leer telefonoContacto');
assert(contactoObtenido.medioContacto === 'whatsapp', 'obtenerContactoReporte — Usuario autenticado puede leer medioContacto');

// Caso B: Usuario NO autenticado (anónimo) debe ser bloqueado con error
setTestUser(null);
await assertThrows(
  () => obtenerContactoReporte(repContacto.id),
  'Debes iniciar sesión con Google',
  'obtenerContactoReporte — Bloquea lectura a visitantes anónimos sin sesión'
);

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 14: Verificación de No-Exposición en Documentos Públicos
// ═══════════════════════════════════════════════════════════════════════════
suite('BLOQUE 14 — Verificación de No-Exposición de Datos Sensibles en Feed/Búsqueda');

setTestUser(userPublicador);
const reportePublico = await obtenerReportePorId(repContacto.id);

assert(reportePublico.telefonoContacto === undefined, 'Documento público — NO expone telefonoContacto');
assert(reportePublico.medioContacto === undefined, 'Documento público — NO expone medioContacto');
assert(reportePublico.creadorEmail === undefined, 'Documento público — NO expone creadorEmail');
assert(reportePublico.senaVerificacionPrivada === undefined, 'Documento público — NO expone senaVerificacionPrivada');

// Validar también en el listado general
const listaPublica = await obtenerReportes({ ciudad: 'Cali' });
assert(
  listaPublica.every(r => r.telefonoContacto === undefined && r.creadorEmail === undefined),
  'obtenerReportes (Feed público) — Ningún reporte expone telefonoContacto ni creadorEmail'
);

// ═══════════════════════════════════════════════════════════════════════════
// RESUMEN
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log(`🏁 RESULTADO FINAL: ${passed} ✅ PASARON | ${failed} ❌ FALLARON`);
if (errors.length > 0) {
  console.log('\n🔍 Errores detectados:');
  errors.forEach(({ testName, detail }) => {
    console.log(`  ❌ ${testName}: ${detail}`);
  });
}
console.log('═'.repeat(60));

process.exit(failed > 0 ? 1 : 0);
