/**
 * HUELLAS A CASA — Servicio de Reportes
 * Gestiona la persistencia de reportes en Cloud Firestore con validación de cuotas,
 * coincidencia bilateral, estados de adopción/reunión y protección de datos privados.
 */

import { isConfigured } from '../firebase-config.js';
import { subirFotoReporte } from './storage.service.js';
import { getCurrentUser } from './auth.service.js';
import { normalizarTexto } from '../utils/formato.js';

export const LIMITE_PERDIDOS = 3;
export const LIMITE_ENCONTRADOS = 3;
export const LIMITE_ADOPCION = 3;
export const LIMITE_REPORTES_ACTIVOS = 9;

// Almacén en memoria exclusivo para tests unitarios en Node.js
let testStore = [];
let testContactosStore = {};
let testSeguridadStore = {};

function asegurarFirestore() {
  if (typeof window !== 'undefined' && !window.__TEST__) {
    if (!isConfigured || !window.firebase || !window.firebase.firestore) {
      throw new Error('No se pudo conectar con Firebase Firestore. Por favor verifica tu conexión a internet o intenta de nuevo.');
    }
    return window.firebase.firestore();
  }
  return null;
}

/**
 * Helper para testing en Node.js (npm test)
 */
export function resetTestStore() {
  testStore = [];
  testContactosStore = {};
  testSeguridadStore = {};
}

export function setFechaCreacionTest(id, fechaIso) {
  const rep = testStore.find(r => r.id === id);
  if (rep) rep.fechaCreacion = fechaIso;
}

/**
 * Obtiene la lista de reportes de una ciudad seleccionada, aplicando filtros
 * @param {Object} filtros { ciudad, barrioTexto, tipo, especie, texto }
 */
export async function obtenerReportes(filtros = {}) {
  const { ciudad = 'Cali', barrioTexto, tipo, especie, texto } = filtros;
  const ciudadKey = normalizarTexto(ciudad);

  const db = asegurarFirestore();
  if (db) {
    // 1. Filtrar en el servidor por ciudadLower normalizado
    let query = db.collection('reportes').where('ciudadLower', '==', ciudadKey);

    if (tipo && tipo !== 'todos') {
      if (tipo === 'en_adopcion') {
        query = query.where('estado', '==', 'en_adopcion');
      } else if (tipo === 'adoptado') {
        query = query.where('estado', '==', 'adoptado');
      } else if (tipo === 'reunido') {
        query = query.where('estado', '==', 'reunido');
      } else {
        query = query.where('tipo', '==', tipo);
      }
    }
    if (especie && especie !== 'todos') {
      query = query.where('especie', '==', especie);
    }

    const snapshot = await query.orderBy('fechaCreacion', 'desc').get();
    let lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. Filtrar en el cliente por barrioTexto (sin importar tildes/mayúsculas)
    if (barrioTexto && barrioTexto.trim()) {
      const bNorm = normalizarTexto(barrioTexto);
      lista = lista.filter(r => (r.barrioLower && r.barrioLower.includes(bNorm)) || (r.barrio && normalizarTexto(r.barrio).includes(bNorm)));
    }

    // 3. Filtrar en el cliente por texto general
    if (texto && texto.trim()) {
      const txtNorm = normalizarTexto(texto);
      lista = lista.filter(r => 
        (r.nombre && normalizarTexto(r.nombre).includes(txtNorm)) ||
        (r.barrio && normalizarTexto(r.barrio).includes(txtNorm)) ||
        (r.color && normalizarTexto(r.color).includes(txtNorm)) ||
        (r.senasVisibles && normalizarTexto(r.senasVisibles).includes(txtNorm))
      );
    }
    return lista;
  }

  // Modo Testing Node.js
  let lista = [...testStore];

  // 1. Filtro principal por ciudad
  lista = lista.filter(r => normalizarTexto(r.ciudadLower || r.ciudad) === ciudadKey);

  // 2. Filtro por tipo
  if (tipo && tipo !== 'todos') {
    if (tipo === 'en_adopcion') {
      lista = lista.filter(r => r.estado === 'en_adopcion');
    } else if (tipo === 'adoptado') {
      lista = lista.filter(r => r.estado === 'adoptado');
    } else if (tipo === 'reunido') {
      lista = lista.filter(r => r.estado === 'reunido');
    } else {
      lista = lista.filter(r => r.tipo === tipo);
    }
  }

  // 3. Filtro por especie
  if (especie && especie !== 'todos') {
    lista = lista.filter(r => r.especie === especie);
  }

  // 4. Filtro por barrio
  if (barrioTexto && barrioTexto.trim()) {
    const bNorm = normalizarTexto(barrioTexto);
    lista = lista.filter(r => (r.barrioLower && r.barrioLower.includes(bNorm)) || (r.barrio && normalizarTexto(r.barrio).includes(bNorm)));
  }

  // 5. Filtro por texto libre
  if (texto && texto.trim()) {
    const txtNorm = normalizarTexto(texto);
    lista = lista.filter(r => 
      (r.nombre && normalizarTexto(r.nombre).includes(txtNorm)) ||
      (r.barrio && normalizarTexto(r.barrio).includes(txtNorm)) ||
      (r.color && normalizarTexto(r.color).includes(txtNorm)) ||
      (r.senasVisibles && normalizarTexto(r.senasVisibles).includes(txtNorm))
    );
  }

  // Ordenar más recientes primero
  lista.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
  return lista;
}

/**
 * Obtiene un reporte público por ID
 */
export async function obtenerReportePorId(id) {
  const db = asegurarFirestore();
  if (db) {
    const doc = await db.collection('reportes').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  return testStore.find(r => r.id === id) || null;
}

/**
 * Crea un nuevo reporte verificando límite de cuota (3 perdidos, 3 encontrados, 3 adopción, máx 9 activos)
 */
export async function crearReporte(datos, imageBlob) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión con Google para crear un reporte.');
  }

  const idReporte = 'rep_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  // 1. Subir foto comprimida
  const { downloadUrl, storagePath } = await subirFotoReporte(imageBlob, idReporte);

  const ciudad = datos.ciudad ? datos.ciudad.trim() : 'Cali';
  const ciudadLower = normalizarTexto(ciudad);
  const barrio = datos.barrio ? datos.barrio.trim() : null;
  const barrioLower = barrio ? normalizarTexto(barrio) : null;

  const nuevoReporte = {
    id: idReporte,
    tipo: datos.tipo,
    estado: datos.tipo,
    especie: datos.especie,
    tamano: datos.tamano,
    sexo: datos.sexo,
    color: datos.color,
    raza: datos.raza || 'Mestizo / No especificado',
    nombre: datos.nombre || '',
    ciudad: ciudad,
    ciudadLower: ciudadLower,
    barrio: barrio,
    barrioLower: barrioLower,
    fechaEvento: datos.fechaEvento || new Date().toISOString().split('T')[0],
    senasVisibles: datos.senasVisibles || '',
    fotoUrl: downloadUrl,
    fotoPath: storagePath,
    nombrePublicador: datos.nombrePublicador || user.displayName,
    necesitaVet: datos.tipo === 'encontrado' ? Boolean(datos.necesitaVet) : false,
    situacionLugar: datos.tipo === 'encontrado' ? (datos.situacionLugar || 'en_casa_temporal') : null,
    creadorUid: user.uid,
    reportesAbusoCount: 0,
    coincidenciaConReporteId: null,
    confirmadoPorCreador: false,
    confirmadoPorContraparte: false,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString()
  };

  const db = asegurarFirestore();
  if (db) {
    const userRef = db.collection('usuarios').doc(user.uid);
    const reporteRef = db.collection('reportes').doc(idReporte);
    const contactoRef = reporteRef.collection('privado').doc('contacto');
    const privadoRef = reporteRef.collection('privado').doc('seguridad');

    // Transacción para validar límite de cuota diferenciada del lado del servidor
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.exists ? userDoc.data() : {};
      const activos = userData.reportesActivosCount || 0;
      const perdidosActivos = userData.perdidosActivosCount || 0;
      const encontradosActivos = userData.encontradosActivosCount || 0;
      const adopcionActivos = userData.adopcionActivosCount || 0;

      if (datos.tipo === 'perdido' && perdidosActivos >= LIMITE_PERDIDOS) {
        throw new Error(`Has alcanzado el límite máximo de ${LIMITE_PERDIDOS} reportes de mascotas perdidas por cuenta.`);
      }
      if (datos.tipo === 'encontrado' && encontradosActivos >= LIMITE_ENCONTRADOS) {
        throw new Error(`Has alcanzado el límite máximo de ${LIMITE_ENCONTRADOS} reportes de mascotas encontradas por cuenta.`);
      }
      if (datos.tipo === 'en_adopcion' && adopcionActivos >= LIMITE_ADOPCION) {
        throw new Error(`Has alcanzado el límite máximo de ${LIMITE_ADOPCION} reportes en adopción por cuenta.`);
      }
      if (activos >= LIMITE_REPORTES_ACTIVOS) {
        throw new Error(`Has alcanzado el límite máximo total de ${LIMITE_REPORTES_ACTIVOS} reportes activos por cuenta.`);
      }

      transaction.set(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        reportesActivosCount: activos + 1,
        perdidosActivosCount: datos.tipo === 'perdido' ? perdidosActivos + 1 : perdidosActivos,
        encontradosActivosCount: datos.tipo === 'encontrado' ? (userData.encontradosActivosCount || 0) + 1 : (userData.encontradosActivosCount || 0),
        adopcionActivosCount: datos.tipo === 'en_adopcion' ? (userData.adopcionActivosCount || 0) + 1 : (userData.adopcionActivosCount || 0),
        ultimoAcceso: new Date().toISOString()
      }, { merge: true });

      // 1. Guardar documento público sin datos de contacto
      transaction.set(reporteRef, nuevoReporte);

      // 2. Guardar subcolección protegida de contacto (legible solo por autenticados)
      transaction.set(contactoRef, {
        telefonoContacto: datos.telefonoContacto,
        medioContacto: datos.medioContacto || 'whatsapp',
        creadoEn: new Date().toISOString()
      });

      // 3. Guardar subcolección privada de seguridad (legible solo por el creador)
      transaction.set(privadoRef, {
        senaVerificacionPrivada: datos.senaVerificacionPrivada,
        consentimientoAceptado: true,
        consentimientoFecha: new Date().toISOString(),
        creadorUid: user.uid,
        creadoEn: new Date().toISOString()
      });
    });

    return nuevoReporte;
  }

  // Modo Testing Node.js: validar conteo diferenciado
  const reportesUsuarioActivos = testStore.filter(r => r.creadorUid === user.uid && r.estado !== 'reunido' && r.estado !== 'adoptado');
  const perdidosUsuario = reportesUsuarioActivos.filter(r => r.tipo === 'perdido' && r.estado !== 'en_adopcion').length;
  const encontradosUsuario = reportesUsuarioActivos.filter(r => r.tipo === 'encontrado' && r.estado !== 'en_adopcion').length;
  const adopcionUsuario = reportesUsuarioActivos.filter(r => r.tipo === 'en_adopcion' || r.estado === 'en_adopcion').length;

  if (datos.tipo === 'perdido' && perdidosUsuario >= LIMITE_PERDIDOS) {
    throw new Error(`Has alcanzado el límite máximo de ${LIMITE_PERDIDOS} reportes de mascotas perdidas por cuenta.`);
  }
  if (datos.tipo === 'encontrado' && encontradosUsuario >= LIMITE_ENCONTRADOS) {
    throw new Error(`Has alcanzado el límite máximo de ${LIMITE_ENCONTRADOS} reportes de mascotas encontradas por cuenta.`);
  }
  if (datos.tipo === 'en_adopcion' && adopcionUsuario >= LIMITE_ADOPCION) {
    throw new Error(`Has alcanzado el límite máximo de ${LIMITE_ADOPCION} reportes en adopción por cuenta.`);
  }
  if (reportesUsuarioActivos.length >= LIMITE_REPORTES_ACTIVOS) {
    throw new Error(`Has alcanzado el límite máximo total de ${LIMITE_REPORTES_ACTIVOS} reportes activos por cuenta.`);
  }

  testStore.unshift(nuevoReporte);
  testContactosStore[idReporte] = {
    telefonoContacto: datos.telefonoContacto,
    medioContacto: datos.medioContacto || 'whatsapp'
  };
  testSeguridadStore[idReporte] = {
    senaVerificacionPrivada: datos.senaVerificacionPrivada,
    creadorUid: user.uid
  };

  return nuevoReporte;
}

/**
 * Obtiene el estado de cuotas diferenciadas del usuario
 */
export async function obtenerCuotasUsuario(uid) {
  if (!uid) {
    return {
      perdidosActivos: 0,
      encontradosActivos: 0,
      adopcionActivos: 0,
      totalActivos: 0,
      limitePerdidos: LIMITE_PERDIDOS,
      limiteEncontrados: LIMITE_ENCONTRADOS,
      limiteAdopcion: LIMITE_ADOPCION,
      limiteTotal: LIMITE_REPORTES_ACTIVOS
    };
  }

  const db = asegurarFirestore();
  if (db) {
    const userDoc = await db.collection('usuarios').doc(uid).get();
    if (userDoc.exists) {
      const d = userDoc.data();
      return {
        perdidosActivos: d.perdidosActivosCount || 0,
        encontradosActivos: d.encontradosActivosCount || 0,
        adopcionActivos: d.adopcionActivosCount || 0,
        totalActivos: d.reportesActivosCount || 0,
        limitePerdidos: LIMITE_PERDIDOS,
        limiteEncontrados: LIMITE_ENCONTRADOS,
        limiteAdopcion: LIMITE_ADOPCION,
        limiteTotal: LIMITE_REPORTES_ACTIVOS
      };
    }
  }

  // Modo Testing Node.js
  const activos = testStore.filter(r => r.creadorUid === uid && r.estado !== 'reunido' && r.estado !== 'adoptado');
  const perdidos = activos.filter(r => r.tipo === 'perdido' && r.estado !== 'en_adopcion').length;
  const encontrados = activos.filter(r => r.tipo === 'encontrado' && r.estado !== 'en_adopcion').length;
  const adopcion = activos.filter(r => r.tipo === 'en_adopcion' || r.estado === 'en_adopcion').length;

  return {
    perdidosActivos: perdidos,
    encontradosActivos: encontrados,
    adopcionActivos: adopcion,
    totalActivos: activos.length,
    limitePerdidos: LIMITE_PERDIDOS,
    limiteEncontrados: LIMITE_ENCONTRADOS,
    limiteAdopcion: LIMITE_ADOPCION,
    limiteTotal: LIMITE_REPORTES_ACTIVOS
  };
}

/**
 * Obtiene los reportes creados por el usuario activo
 */
export async function obtenerMisReportes(uid) {
  const targetUid = uid || (getCurrentUser() ? getCurrentUser().uid : null);
  if (!targetUid) return [];

  const db = asegurarFirestore();
  if (db) {
    const snapshot = await db.collection('reportes')
      .where('creadorUid', '==', targetUid)
      .orderBy('fechaCreacion', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  return testStore.filter(r => r.creadorUid === targetUid)
    .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
}

/**
 * Cambia un reporte de tipo 'encontrado' a 'en_adopcion' tras 20 días
 */
export async function cambiarAEnAdopcion(reporteId) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión para actualizar el reporte.');
  }

  const db = asegurarFirestore();
  if (db) {
    const reporteRef = db.collection('reportes').doc(reporteId);
    const userRef = db.collection('usuarios').doc(user.uid);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(reporteRef);
      if (!doc.exists) throw new Error('Reporte no encontrado');
      const data = doc.data();

      if (data.creadorUid !== user.uid) {
        throw new Error('Solo el autor puede cambiar el estado a Adopción.');
      }
      if (data.tipo !== 'encontrado') {
        throw new Error('Solo los reportes de tipo encontrado pueden pasar a Adopción.');
      }

      const dias = (Date.now() - new Date(data.fechaCreacion).getTime()) / (1000 * 3600 * 24);
      if (dias < 20) {
        throw new Error(`Se requieren al menos 20 días desde el reporte inicial (han pasado ${Math.floor(dias)} días).`);
      }

      transaction.update(reporteRef, {
        estado: 'en_adopcion',
        tipo: 'en_adopcion',
        fechaActualizacion: new Date().toISOString()
      });

      transaction.update(userRef, {
        encontradosActivosCount: window.firebase.firestore.FieldValue.increment(-1),
        adopcionActivosCount: window.firebase.firestore.FieldValue.increment(1)
      });
    });

    return { success: true };
  }

  // Modo Testing Node.js
  const rep = testStore.find(r => r.id === reporteId);
  if (!rep) throw new Error('Reporte no encontrado');
  if (rep.creadorUid !== user.uid) throw new Error('Solo el autor puede cambiar el estado a Adopción.');
  if (rep.tipo !== 'encontrado') throw new Error('Solo los reportes de tipo encontrado pueden pasar a Adopción.');

  const dias = (Date.now() - new Date(rep.fechaCreacion).getTime()) / (1000 * 3600 * 24);
  if (dias < 20) {
    throw new Error(`Se requieren al menos 20 días desde el reporte inicial (han pasado ${Math.floor(dias)} días).`);
  }

  rep.estado = 'en_adopcion';
  rep.tipo = 'en_adopcion';
  rep.fechaActualizacion = new Date().toISOString();
  return { success: true };
}

/**
 * Marca un reporte de adopción como Adoptado (cierre definitivo y libera cupo)
 */
export async function marcarComoAdoptado(reporteId) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión para cerrar el caso.');
  }

  const db = asegurarFirestore();
  if (db) {
    const reporteRef = db.collection('reportes').doc(reporteId);
    const userRef = db.collection('usuarios').doc(user.uid);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(reporteRef);
      if (!doc.exists) throw new Error('Reporte no encontrado');
      const data = doc.data();

      if (data.creadorUid !== user.uid) {
        throw new Error('Solo el autor puede marcar como adoptado.');
      }

      transaction.update(reporteRef, {
        estado: 'adoptado',
        fechaActualizacion: new Date().toISOString()
      });

      transaction.update(userRef, {
        reportesActivosCount: window.firebase.firestore.FieldValue.increment(-1),
        adopcionActivosCount: window.firebase.firestore.FieldValue.increment(-1)
      });
    });

    return { success: true };
  }

  // Modo Testing Node.js
  const rep = testStore.find(r => r.id === reporteId);
  if (!rep) throw new Error('Reporte no encontrado');
  if (rep.creadorUid !== user.uid) throw new Error('Solo el autor puede marcar como adoptado.');

  rep.estado = 'adoptado';
  rep.fechaActualizacion = new Date().toISOString();
  return { success: true };
}

/**
 * Obtiene los datos de contacto protegidos de un reporte
 */
export async function obtenerContactoReporte(reporteId) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión con Google para ver los datos de contacto.');
  }

  const db = asegurarFirestore();
  if (db) {
    const doc = await db.collection('reportes').doc(reporteId)
      .collection('privado').doc('contacto').get();
    if (!doc.exists) return null;
    return doc.data();
  }

  return testContactosStore[reporteId] || null;
}

/**
 * Obtiene la seña secreta privada de verificación (Solo legible por el autor)
 */
export async function obtenerSenaPrivada(reporteId) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión para consultar este dato.');
  }

  const db = asegurarFirestore();
  if (db) {
    const doc = await db.collection('reportes').doc(reporteId)
      .collection('privado').doc('seguridad').get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (data.creadorUid !== user.uid) {
      throw new Error('Acceso no autorizado: Solo el autor del reporte puede ver la seña secreta.');
    }
    return data.senaVerificacionPrivada || '';
  }

  const datosPrivados = testSeguridadStore[reporteId];
  if (!datosPrivados) return null;
  if (datosPrivados.creadorUid !== user.uid) {
    throw new Error('Acceso no autorizado: Solo el autor del reporte puede ver la seña secreta.');
  }
  return datosPrivados.senaVerificacionPrivada || '';
}

/**
 * Sugiere una coincidencia entre dos reportes (Perdido <-> Encontrado)
 */
export async function sugerirCoincidencia(reporteIdA, reporteIdB) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión con Google para sugerir una coincidencia.');
  }

  if (reporteIdA === reporteIdB) {
    throw new Error('No puedes sugerir coincidencia de un reporte consigo mismo.');
  }

  const repA = await obtenerReportePorId(reporteIdA);
  const repB = await obtenerReportePorId(reporteIdB);

  if (!repA || !repB) {
    throw new Error('Uno o ambos reportes no existen.');
  }

  if (repA.estado === 'reunido' || repA.estado === 'adoptado' || repB.estado === 'reunido' || repB.estado === 'adoptado') {
    throw new Error('No se puede sugerir coincidencia con un caso que ya fue cerrado.');
  }

  if (repA.coincidenciaConReporteId || repB.coincidenciaConReporteId) {
    throw new Error('Uno de los reportes ya tiene una sugerencia en proceso.');
  }

  const updatesA = {
    coincidenciaConReporteId: reporteIdB,
    estado: 'coincidencia_sugerida',
    confirmadoPorCreador: repA.creadorUid === user.uid,
    confirmadoPorContraparte: false,
    fechaActualizacion: new Date().toISOString()
  };

  const updatesB = {
    coincidenciaConReporteId: reporteIdA,
    estado: 'coincidencia_sugerida',
    confirmadoPorCreador: repB.creadorUid === user.uid,
    confirmadoPorContraparte: false,
    fechaActualizacion: new Date().toISOString()
  };

  const db = asegurarFirestore();
  if (db) {
    await db.collection('reportes').doc(reporteIdA).update(updatesA);
    await db.collection('reportes').doc(reporteIdB).update(updatesB);
    return { success: true };
  }

  // Modo Testing Node.js
  Object.assign(repA, updatesA);
  Object.assign(repB, updatesB);
  return { success: true };
}

/**
 * Responde a una sugerencia de coincidencia (Aceptar / Rechazar)
 */
export async function responderCoincidencia(reporteId, aceptar) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión para responder a la coincidencia.');
  }

  const rep = await obtenerReportePorId(reporteId);
  if (!rep) throw new Error('Reporte no encontrado.');

  if (rep.creadorUid !== user.uid) {
    throw new Error('Solo el autor de este reporte puede responder a la sugerencia.');
  }

  const idContraparte = rep.coincidenciaConReporteId;
  const contraparte = idContraparte ? await obtenerReportePorId(idContraparte) : null;

  const db = asegurarFirestore();

  if (!aceptar) {
    const updateRechazo = {
      coincidenciaConReporteId: null,
      confirmadoPorCreador: false,
      confirmadoPorContraparte: false,
      estado: rep.tipo,
      fechaActualizacion: new Date().toISOString()
    };

    if (db) {
      await db.collection('reportes').doc(reporteId).update(updateRechazo);
      if (contraparte) {
        await db.collection('reportes').doc(contraparte.id).update({
          coincidenciaConReporteId: null,
          confirmadoPorCreador: false,
          confirmadoPorContraparte: false,
          estado: contraparte.tipo,
          fechaActualizacion: new Date().toISOString()
        });
      }
      return { success: true, estado: rep.tipo };
    }

    // Modo Testing Node.js
    Object.assign(rep, updateRechazo);
    if (contraparte) {
      Object.assign(contraparte, {
        coincidenciaConReporteId: null,
        confirmadoPorCreador: false,
        confirmadoPorContraparte: false,
        estado: contraparte.tipo,
        fechaActualizacion: new Date().toISOString()
      });
    }
    return { success: true, estado: rep.tipo };
  }

  // ACEPTAR
  const contraYaConfirmo = contraparte && (contraparte.confirmadoPorCreador || rep.confirmadoPorContraparte);
  const nuevoEstado = contraYaConfirmo ? 'confirmado_ambas_partes' : 'coincidencia_sugerida';

  const updatePayloadA = {
    confirmadoPorCreador: true,
    estado: nuevoEstado,
    fechaActualizacion: new Date().toISOString()
  };

  const updatePayloadB = {
    confirmadoPorContraparte: true,
    estado: nuevoEstado,
    fechaActualizacion: new Date().toISOString()
  };

  if (db) {
    await db.collection('reportes').doc(reporteId).update(updatePayloadA);
    if (contraparte) {
      await db.collection('reportes').doc(contraparte.id).update(updatePayloadB);
    }
    return { success: true, estado: nuevoEstado };
  }

  // Modo Testing Node.js
  Object.assign(rep, updatePayloadA);
  if (contraparte) {
    Object.assign(contraparte, updatePayloadB);
  }
  return { success: true, estado: nuevoEstado };
}

/**
 * Cierra un caso marcándolo como Reunido (libera cupo de reportes activos)
 */
export async function marcarComoReunido(reporteId) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión para cerrar el reporte.');
  }

  const rep = await obtenerReportePorId(reporteId);
  if (!rep) throw new Error('Reporte no encontrado.');

  if (rep.creadorUid !== user.uid) {
    throw new Error('Solo el autor puede marcar este reporte como reunido.');
  }

  const idContraparte = rep.coincidenciaConReporteId;
  const contraparte = idContraparte ? await obtenerReportePorId(idContraparte) : null;

  const db = asegurarFirestore();
  if (db) {
    await db.runTransaction(async (transaction) => {
      const repRef = db.collection('reportes').doc(reporteId);
      const userRefA = db.collection('usuarios').doc(user.uid);

      transaction.update(repRef, {
        estado: 'reunido',
        fechaActualizacion: new Date().toISOString()
      });

      const isPerdido = rep.tipo === 'perdido';
      const isAdopcion = rep.tipo === 'en_adopcion';
      transaction.update(userRefA, {
        reportesActivosCount: window.firebase.firestore.FieldValue.increment(-1),
        perdidosActivosCount: isPerdido ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0),
        encontradosActivosCount: (!isPerdido && !isAdopcion) ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0),
        adopcionActivosCount: isAdopcion ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0)
      });

      if (contraparte) {
        const contraRef = db.collection('reportes').doc(contraparte.id);
        const userRefB = db.collection('usuarios').doc(contraparte.creadorUid);

        transaction.update(contraRef, {
          estado: 'reunido',
          fechaActualizacion: new Date().toISOString()
        });

        const isContraPerdido = contraparte.tipo === 'perdido';
        const isContraAdopcion = contraparte.tipo === 'en_adopcion';
        transaction.update(userRefB, {
          reportesActivosCount: window.firebase.firestore.FieldValue.increment(-1),
          perdidosActivosCount: isContraPerdido ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0),
          encontradosActivosCount: (!isContraPerdido && !isContraAdopcion) ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0),
          adopcionActivosCount: isContraAdopcion ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0)
        });
      }
    });

    return { success: true };
  }

  // Modo Testing Node.js
  rep.estado = 'reunido';
  rep.fechaActualizacion = new Date().toISOString();

  if (contraparte) {
    contraparte.estado = 'reunido';
    contraparte.fechaActualizacion = new Date().toISOString();
  }

  return { success: true };
}

/**
 * Registra una denuncia o reporte de abuso sobre una publicación
 */
export async function reportarAbuso(reporteId, motivo, comentario = '') {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión con Google para reportar una publicación.');
  }

  const nuevoAbuso = {
    reporteId: reporteId,
    motivo: motivo,
    comentario: comentario.trim(),
    usuarioDenuncianteUid: user.uid,
    usuarioDenuncianteEmail: user.email,
    fechaCreacion: new Date().toISOString()
  };

  const db = asegurarFirestore();
  if (db) {
    await db.collection('reportes_abuso').add(nuevoAbuso);
    await db.collection('reportes').doc(reporteId).update({
      reportesAbusoCount: window.firebase.firestore.FieldValue.increment(1)
    });
    return { success: true };
  }

  // Modo Testing Node.js
  return { success: true };
}
