import { isConfigured } from '../firebase-config.js';
import { subirFotoReporte } from './storage.service.js';
import { getCurrentUser } from './auth.service.js';
import { normalizarTexto } from '../utils/formato.js';

export const LIMITE_PERDIDOS = 3;
export const LIMITE_ENCONTRADOS = 3;
export const LIMITE_ADOPCION = 3;
export const LIMITE_REPORTES_ACTIVOS = 9;

// Mock inicial realista de emergencia multiciudad para modo local/demo (Sin datos sensibles expuestos)
const SEED_REPORTES = [
  {
    id: 'rep_cali_001',
    tipo: 'perdido',
    estado: 'perdido',
    especie: 'perro',
    tamano: 'mediano',
    sexo: 'macho',
    color: 'Dorado / Caramelo con patas blancas',
    raza: 'Criollo / Golden Mestizo',
    nombre: 'Simba',
    ciudad: 'Cali',
    ciudadLower: 'cali',
    barrio: 'San Antonio',
    barrioLower: 'san antonio',
    fechaEvento: '2026-08-11',
    senasVisibles: 'Collar azul gastado, mancha blanca en forma de estrella en el pecho',
    fotoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
    fotoPath: 'reportes/rep_cali_001.jpg',
    nombrePublicador: 'Valentina',
    creadorUid: 'usr_demo_1',
    reportesAbusoCount: 0,
    coincidenciaConReporteId: null,
    confirmadoPorCreador: false,
    confirmadoPorContraparte: false,
    fechaCreacion: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: 'rep_pereira_002',
    tipo: 'encontrado',
    estado: 'encontrado',
    especie: 'gato',
    tamano: 'pequeno',
    sexo: 'hembra',
    color: 'Blanco con manchas atigradas grises',
    raza: 'Mestizo',
    nombre: 'No identificado',
    ciudad: 'Pereira',
    ciudadLower: 'pereira',
    barrio: 'Circunvalar',
    barrioLower: 'circunvalar',
    fechaEvento: '2026-08-12',
    senasVisibles: 'Ojos verdes, muy dócil, maúlla bajito',
    fotoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    fotoPath: 'reportes/rep_pereira_002.jpg',
    nombrePublicador: 'Andrés Morales',
    necesitaVet: false,
    situacionLugar: 'en_casa_temporal',
    creadorUid: 'usr_demo_2',
    reportesAbusoCount: 0,
    coincidenciaConReporteId: null,
    confirmadoPorCreador: false,
    confirmadoPorContraparte: false,
    fechaCreacion: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: 'rep_manizales_003',
    tipo: 'encontrado',
    estado: 'en_adopcion',
    especie: 'perro',
    tamano: 'grande',
    sexo: 'macho',
    color: 'Negro azabache',
    raza: 'Labrador Mestizo',
    nombre: 'Rocky',
    ciudad: 'Manizales',
    ciudadLower: 'manizales',
    barrio: 'Chipre',
    barrioLower: 'chipre',
    fechaEvento: '2026-08-10',
    senasVisibles: 'Cola larga, cicatriz antigua y sana en oreja izquierda',
    fotoUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
    fotoPath: 'reportes/rep_manizales_003.jpg',
    nombrePublicador: 'Fundación Huellitas Eje',
    necesitaVet: false,
    situacionLugar: 'en_casa_temporal',
    creadorUid: 'usr_demo_3',
    reportesAbusoCount: 0,
    coincidenciaConReporteId: null,
    confirmadoPorCreador: false,
    confirmadoPorContraparte: false,
    fechaCreacion: new Date(Date.now() - 3600 * 1000 * 24 * 22).toISOString(),
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: 'rep_armenia_004',
    tipo: 'perdido',
    estado: 'reunido',
    especie: 'perro',
    tamano: 'pequeno',
    sexo: 'macho',
    color: 'Blanco con orejas café',
    raza: 'Jack Russell Terrier',
    nombre: 'Max',
    ciudad: 'Armenia',
    ciudadLower: 'armenia',
    barrio: 'Norte',
    barrioLower: 'norte',
    fechaEvento: '2026-08-10',
    senasVisibles: 'Placa con nombre Max',
    fotoUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
    fotoPath: 'reportes/rep_armenia_004.jpg',
    nombrePublicador: 'Diana P.',
    creadorUid: 'usr_demo_4',
    reportesAbusoCount: 0,
    coincidenciaConReporteId: null,
    confirmadoPorCreador: true,
    confirmadoPorContraparte: true,
    fechaCreacion: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: 'rep_quibdo_005',
    tipo: 'perdido',
    estado: 'perdido',
    especie: 'gato',
    tamano: 'pequeno',
    sexo: 'macho',
    color: 'Naranja atigrado',
    raza: 'Criollo',
    nombre: 'Michi',
    ciudad: 'Quibdó',
    ciudadLower: 'quibdo',
    barrio: 'El Silencio',
    barrioLower: 'el silencio',
    fechaEvento: '2026-08-12',
    senasVisibles: 'Puntas de las patas blancas',
    fotoUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&auto=format&fit=crop&q=80',
    fotoPath: 'reportes/rep_quibdo_005.jpg',
    nombrePublicador: 'Camilo J.',
    creadorUid: 'usr_demo_5',
    reportesAbusoCount: 0,
    coincidenciaConReporteId: null,
    confirmadoPorCreador: false,
    confirmadoPorContraparte: false,
    fechaCreacion: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    fechaActualizacion: new Date().toISOString()
  }
];

// Contactos aislados de los seeds para modo demo
const SEED_CONTACTOS = {
  'rep_cali_001': { telefonoContacto: '3165551234', medioContacto: 'whatsapp' },
  'rep_pereira_002': { telefonoContacto: '3157778899', medioContacto: 'ambos' },
  'rep_manizales_003': { telefonoContacto: '3104445566', medioContacto: 'whatsapp' },
  'rep_armenia_004': { telefonoContacto: '3189991122', medioContacto: 'whatsapp' },
  'rep_quibdo_005': { telefonoContacto: '3173334455', medioContacto: 'whatsapp' }
};

// Base de datos local en localStorage si no hay Firebase configurado
function obtenerStoreLocal() {
  try {
    const data = localStorage.getItem('huellas_reportes_store');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Error al leer store local:', e);
  }
  localStorage.setItem('huellas_reportes_store', JSON.stringify(SEED_REPORTES));
  return SEED_REPORTES;
}

function guardarStoreLocal(reportes) {
  localStorage.setItem('huellas_reportes_store', JSON.stringify(reportes));
}

/**
 * Obtiene la lista de reportes de una ciudad seleccionada, aplicando filtros
 * @param {Object} filtros { ciudad, barrioTexto, tipo, especie, texto }
 */
export async function obtenerReportes(filtros = {}) {
  const { ciudad = 'Cali', barrioTexto, tipo, especie, texto } = filtros;
  const ciudadKey = normalizarTexto(ciudad);

  if (isConfigured && window.firebase && window.firebase.firestore) {
    // 1. Filtrar en el servidor por ciudadLower normalizado
    let query = window.firebase.firestore().collection('reportes')
      .where('ciudadLower', '==', ciudadKey);

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

  // Fallback reactivo local
  let lista = [...obtenerStoreLocal()];

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

  // 4. Filtro por barrio en el cliente
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
  if (isConfigured && window.firebase && window.firebase.firestore) {
    const doc = await window.firebase.firestore().collection('reportes').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  const lista = obtenerStoreLocal();
  return lista.find(r => r.id === id) || null;
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

  if (isConfigured && window.firebase && window.firebase.firestore) {
    const db = window.firebase.firestore();
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

  // Modo Local: validar conteo diferenciado (3 perdidos, 3 encontrados, 3 adopción, máx 9 total)
  const lista = obtenerStoreLocal();
  const reportesUsuarioActivos = lista.filter(r => r.creadorUid === user.uid && r.estado !== 'reunido' && r.estado !== 'adoptado');
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

  lista.unshift(nuevoReporte);
  guardarStoreLocal(lista);

  // Guardar datos de contacto en store aislado protegido
  localStorage.setItem(`huellas_contacto_${idReporte}`, JSON.stringify({
    telefonoContacto: datos.telefonoContacto,
    medioContacto: datos.medioContacto || 'whatsapp'
  }));

  // Guardar seña privada en store aislado
  localStorage.setItem(`huellas_privado_${idReporte}`, JSON.stringify({
    senaVerificacionPrivada: datos.senaVerificacionPrivada,
    creadorUid: user.uid
  }));

  return nuevoReporte;
}

/**
 * Obtiene el estado de cuotas diferenciadas del usuario
 */
export async function obtenerCuotasUsuario(uid) {
  if (!uid) {
    return {
      perdidosActivos: 0,
      limitePerdidos: LIMITE_PERDIDOS,
      encontradosActivos: 0,
      limiteEncontrados: LIMITE_ENCONTRADOS,
      adopcionActivos: 0,
      limiteAdopcion: LIMITE_ADOPCION,
      totalActivos: 0,
      limiteTotal: LIMITE_REPORTES_ACTIVOS
    };
  }

  const mis = await obtenerMisReportes(uid);
  const activos = mis.filter(r => r.estado !== 'reunido' && r.estado !== 'adoptado');
  const perdidos = activos.filter(r => r.tipo === 'perdido' && r.estado !== 'en_adopcion').length;
  const encontrados = activos.filter(r => r.tipo === 'encontrado' && r.estado !== 'en_adopcion').length;
  const adopcion = activos.filter(r => r.tipo === 'en_adopcion' || r.estado === 'en_adopcion').length;

  return {
    perdidosActivos: perdidos,
    limitePerdidos: LIMITE_PERDIDOS,
    encontradosActivos: encontrados,
    limiteEncontrados: LIMITE_ENCONTRADOS,
    adopcionActivos: adopcion,
    limiteAdopcion: LIMITE_ADOPCION,
    totalActivos: perdidos + encontrados + adopcion,
    limiteTotal: LIMITE_REPORTES_ACTIVOS
  };
}

/**
 * Obtiene los reportes creados por el usuario (o el usuario autenticado actual)
 */
export async function obtenerMisReportes(uid) {
  const targetUid = uid || (getCurrentUser() ? getCurrentUser().uid : null);
  if (!targetUid) return [];

  if (isConfigured && window.firebase && window.firebase.firestore) {
    const snapshot = await window.firebase.firestore().collection('reportes')
      .where('creadorUid', '==', targetUid)
      .orderBy('fechaCreacion', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  const lista = obtenerStoreLocal();
  return lista.filter(r => r.creadorUid === targetUid);
}

/**
 * Cambia el estado de un reporte de "encontrado" a "en_adopcion" si pasaron 20+ días
 */
export async function cambiarAEnAdopcion(reporteId) {
  const user = getCurrentUser();
  if (!user) throw new Error('Sesión requerida.');

  const reporte = await obtenerReportePorId(reporteId);
  if (!reporte) throw new Error('Reporte no encontrado.');
  if (reporte.creadorUid !== user.uid) throw new Error('Solo el autor puede cambiar el estado.');

  const dias = (Date.now() - new Date(reporte.fechaCreacion).getTime()) / (1000 * 3600 * 24);
  if (dias < 20) {
    throw new Error(`Deben transcurrir al menos 20 días para pasar a adopción (han pasado ${Math.floor(dias)} días).`);
  }

  // Validar cuota de adopción
  const cuotas = await obtenerCuotasUsuario(user.uid);
  if (cuotas.adopcionActivos >= LIMITE_ADOPCION) {
    throw new Error(`Has alcanzado el límite máximo de ${LIMITE_ADOPCION} reportes en adopción.`);
  }

  if (isConfigured && window.firebase && window.firebase.firestore) {
    const db = window.firebase.firestore();
    const batch = db.batch();
    const repRef = db.collection('reportes').doc(reporteId);
    batch.update(repRef, {
      estado: 'en_adopcion',
      tipo: 'en_adopcion',
      fechaActualizacion: new Date().toISOString()
    });

    const userRef = db.collection('usuarios').doc(user.uid);
    batch.set(userRef, {
      encontradosActivosCount: window.firebase.firestore.FieldValue.increment(-1),
      adopcionActivosCount: window.firebase.firestore.FieldValue.increment(1)
    }, { merge: true });

    await batch.commit();
    return;
  }

  const lista = obtenerStoreLocal();
  const idx = lista.findIndex(r => r.id === reporteId);
  if (idx !== -1) {
    lista[idx].estado = 'en_adopcion';
    lista[idx].tipo = 'en_adopcion';
    lista[idx].fechaActualizacion = new Date().toISOString();
    guardarStoreLocal(lista);
  }
}

/**
 * Cierra un reporte en adopción marcándolo como Adoptado (Liberando cupo)
 */
export async function marcarComoAdoptado(reporteId) {
  const user = getCurrentUser();
  if (!user) throw new Error('Sesión requerida.');

  const reporte = await obtenerReportePorId(reporteId);
  if (!reporte) throw new Error('Reporte no encontrado.');
  if (reporte.creadorUid !== user.uid) {
    throw new Error('Solo el autor puede marcar este reporte como Adoptado.');
  }
  if (reporte.estado !== 'en_adopcion') {
    throw new Error('Solo los reportes en adopción pueden cerrarse como Adoptados.');
  }

  const updateAdoptado = {
    estado: 'adoptado',
    fechaActualizacion: new Date().toISOString()
  };

  if (isConfigured && window.firebase && window.firebase.firestore) {
    const db = window.firebase.firestore();
    const batch = db.batch();

    const repRef = db.collection('reportes').doc(reporteId);
    batch.update(repRef, updateAdoptado);

    const userRef = db.collection('usuarios').doc(user.uid);
    batch.set(userRef, {
      reportesActivosCount: window.firebase.firestore.FieldValue.increment(-1),
      adopcionActivosCount: window.firebase.firestore.FieldValue.increment(-1)
    }, { merge: true });

    await batch.commit();
    return;
  }

  const lista = obtenerStoreLocal();
  const repIdx = lista.findIndex(r => r.id === reporteId);
  if (repIdx !== -1) {
    lista[repIdx].estado = 'adoptado';
    lista[repIdx].fechaActualizacion = new Date().toISOString();
    guardarStoreLocal(lista);
  }
}

/**
 * Obtiene los datos de contacto protegidos del reporte (Requiere sesión iniciada)
 * @param {string} reporteId 
 * @returns {Promise<{telefonoContacto: string, medioContacto: string}>}
 */
export async function obtenerContactoReporte(reporteId) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión con Google para ver los datos de contacto.');
  }

  const reporte = await obtenerReportePorId(reporteId);
  if (!reporte) throw new Error('Reporte no encontrado.');

  if (isConfigured && window.firebase && window.firebase.firestore) {
    const doc = await window.firebase.firestore()
      .collection('reportes').doc(reporteId)
      .collection('privado').doc('contacto')
      .get();
    if (doc.exists) {
      return {
        telefonoContacto: doc.data().telefonoContacto || '',
        medioContacto: doc.data().medioContacto || 'whatsapp'
      };
    }
    throw new Error('No se encontraron datos de contacto para este reporte.');
  }

  // Modo local / demo
  const datosContacto = localStorage.getItem(`huellas_contacto_${reporteId}`);
  if (datosContacto) {
    try {
      return JSON.parse(datosContacto);
    } catch (e) {}
  }

  // Fallback para seeds en modo demo
  if (typeof SEED_CONTACTOS !== 'undefined' && SEED_CONTACTOS[reporteId]) {
    return SEED_CONTACTOS[reporteId];
  }

  throw new Error('No se encontraron datos de contacto para este reporte.');
}

/**
 * Obtiene la seña privada de verificación (Solo para el autor autenticado)
 */
export async function obtenerSenaPrivada(reporteId) {
  const user = getCurrentUser();
  if (!user) throw new Error('Sesión requerida.');

  const reporte = await obtenerReportePorId(reporteId);
  if (!reporte) throw new Error('Reporte no encontrado.');
  if (reporte.creadorUid !== user.uid) {
    throw new Error('Acceso no autorizado: Solo el autor del reporte puede ver la seña secreta.');
  }

  if (isConfigured && window.firebase && window.firebase.firestore) {
    const doc = await window.firebase.firestore()
      .collection('reportes').doc(reporteId)
      .collection('privado').doc('seguridad')
      .get();
    if (doc.exists) {
      return doc.data().senaVerificacionPrivada || 'Sin seña registrada.';
    }
    return 'Sin seña registrada.';
  }

  const datosPrivados = localStorage.getItem(`huellas_privado_${reporteId}`);
  if (datosPrivados) {
    try {
      const parsed = JSON.parse(datosPrivados);
      return parsed.senaVerificacionPrivada || 'Sin seña registrada.';
    } catch (e) {}
  }
  return 'Sin seña registrada.';
}

/**
 * Sugerir coincidencia entre dos reportes con validaciones estrictas anti-fraude
 */
export async function sugerirCoincidencia(reporteIdA, reporteIdB) {
  const user = getCurrentUser();
  if (!user) throw new Error('Debes iniciar sesión con Google para sugerir coincidencias.');

  if (reporteIdA === reporteIdB) {
    throw new Error('No puedes vincular un reporte consigo mismo.');
  }

  const repA = await obtenerReportePorId(reporteIdA);
  const repB = await obtenerReportePorId(reporteIdB);

  if (!repA || !repB) {
    throw new Error('Uno o ambos reportes no existen. Verifica los IDs introducidos.');
  }

  // 1. Validar que no estén ya reunidos o adoptados (cerrados)
  if (repA.estado === 'reunido' || repB.estado === 'reunido' || repA.estado === 'adoptado' || repB.estado === 'adoptado') {
    throw new Error('No se puede sugerir coincidencia con un caso que ya fue cerrado.');
  }

  // 2. Validar que uno sea Perdido y el otro Encontrado (o En Adopción)
  const tiposValidos = (repA.tipo === 'perdido' && (repB.tipo === 'encontrado' || repB.tipo === 'en_adopcion')) ||
                       (repB.tipo === 'perdido' && (repA.tipo === 'encontrado' || repA.tipo === 'en_adopcion'));
  
  if (!tiposValidos) {
    throw new Error('Una coincidencia solo puede ser entre una mascota Perdida y una mascota Encontrada o en Adopción.');
  }

  // 3. Validar que no tengan ya otra coincidencia activa en curso
  if (repA.estado === 'coincidencia_sugerida' || repB.estado === 'coincidencia_sugerida') {
    throw new Error('Uno de los reportes ya tiene una sugerencia de coincidencia en revisión. Debe confirmarse o rechazarse antes de vincular otro caso.');
  }

  const updatesA = {
    estado: 'coincidencia_sugerida',
    coincidenciaConReporteId: reporteIdB,
    confirmadoPorCreador: false,
    confirmadoPorContraparte: false,
    fechaActualizacion: new Date().toISOString()
  };

  const updatesB = {
    estado: 'coincidencia_sugerida',
    coincidenciaConReporteId: reporteIdA,
    confirmadoPorCreador: false,
    confirmadoPorContraparte: false,
    fechaActualizacion: new Date().toISOString()
  };

  if (isConfigured && window.firebase && window.firebase.firestore) {
    await window.firebase.firestore().collection('reportes').doc(reporteIdA).update(updatesA);
    await window.firebase.firestore().collection('reportes').doc(reporteIdB).update(updatesB);
    return;
  }

  const lista = obtenerStoreLocal();
  lista.forEach(r => {
    if (r.id === reporteIdA) Object.assign(r, updatesA);
    if (r.id === reporteIdB) Object.assign(r, updatesB);
  });
  guardarStoreLocal(lista);
}

/**
 * Valida o rechaza una coincidencia bilateralmente (Requiere que ambas partes confirmen)
 */
export async function responderCoincidencia(reporteId, esAprobada) {
  const user = getCurrentUser();
  if (!user) throw new Error('Sesión requerida.');

  const reporte = await obtenerReportePorId(reporteId);
  if (!reporte || !reporte.coincidenciaConReporteId) {
    throw new Error('Este reporte no tiene una coincidencia vinculada.');
  }

  const contraparte = await obtenerReportePorId(reporte.coincidenciaConReporteId);

  const lista = obtenerStoreLocal();
  const repIdx = lista.findIndex(r => r.id === reporteId);
  const contraIdx = contraparte ? lista.findIndex(r => r.id === contraparte.id) : -1;

  if (!esAprobada) {
    // Si se rechaza, ambos reportes se desvinculan limpiamente y vuelven a su tipo original
    const resetUpdates = {
      coincidenciaConReporteId: null,
      confirmadoPorCreador: false,
      confirmadoPorContraparte: false,
      fechaActualizacion: new Date().toISOString()
    };

    if (isConfigured && window.firebase && window.firebase.firestore) {
      await window.firebase.firestore().collection('reportes').doc(reporteId).update({
        ...resetUpdates,
        estado: reporte.tipo
      });
      if (contraparte) {
        await window.firebase.firestore().collection('reportes').doc(contraparte.id).update({
          ...resetUpdates,
          estado: contraparte.tipo
        });
      }
    } else {
      if (repIdx !== -1) {
        lista[repIdx].estado = lista[repIdx].tipo;
        Object.assign(lista[repIdx], resetUpdates);
      }
      if (contraIdx !== -1) {
        lista[contraIdx].estado = lista[contraIdx].tipo;
        Object.assign(lista[contraIdx], resetUpdates);
      }
      guardarStoreLocal(lista);
    }
    return;
  }

  // Si se aprueba por esta parte
  const esAutorReporteActual = reporte.creadorUid === user.uid;
  const esAutorContraparte = contraparte ? contraparte.creadorUid === user.uid : false;

  // Actualizar banderas en memoria/local
  if (repIdx !== -1) {
    if (esAutorReporteActual) lista[repIdx].confirmadoPorCreador = true;
    if (esAutorContraparte) lista[repIdx].confirmadoPorContraparte = true;
  }
  if (contraIdx !== -1) {
    if (esAutorContraparte) lista[contraIdx].confirmadoPorCreador = true;
    if (esAutorReporteActual) lista[contraIdx].confirmadoPorContraparte = true;
  }

  // Verificar si AMBAS partes han confirmado
  const repConfirmado = lista[repIdx] ? (lista[repIdx].confirmadoPorCreador && lista[repIdx].confirmadoPorContraparte) : false;
  const contraConfirmado = contraIdx !== -1 ? (lista[contraIdx].confirmadoPorCreador && lista[contraIdx].confirmadoPorContraparte) : false;
  const ambosConfirmaron = repConfirmado || contraConfirmado || (esAutorReporteActual && reporte.confirmadoPorContraparte) || (esAutorContraparte && reporte.confirmadoPorCreador);

  const nuevoEstado = ambosConfirmaron ? 'confirmado_ambas_partes' : 'coincidencia_sugerida';

  if (isConfigured && window.firebase && window.firebase.firestore) {
    const updatePayloadA = {
      confirmadoPorCreador: repIdx !== -1 ? lista[repIdx].confirmadoPorCreador : true,
      confirmadoPorContraparte: repIdx !== -1 ? lista[repIdx].confirmadoPorContraparte : false,
      estado: nuevoEstado,
      fechaActualizacion: new Date().toISOString()
    };
    const updatePayloadB = {
      confirmadoPorCreador: contraIdx !== -1 ? lista[contraIdx].confirmadoPorCreador : true,
      confirmadoPorContraparte: contraIdx !== -1 ? lista[contraIdx].confirmadoPorContraparte : false,
      estado: nuevoEstado,
      fechaActualizacion: new Date().toISOString()
    };
    await window.firebase.firestore().collection('reportes').doc(reporteId).update(updatePayloadA);
    if (contraparte) {
      await window.firebase.firestore().collection('reportes').doc(contraparte.id).update(updatePayloadB);
    }
  } else {
    if (repIdx !== -1) lista[repIdx].estado = nuevoEstado;
    if (contraIdx !== -1) lista[contraIdx].estado = nuevoEstado;
    guardarStoreLocal(lista);
  }
}

/**
 * Cierra el caso y lo marca como Reunido (Actualiza ambos reportes vinculados y libera cupos)
 */
export async function marcarComoReunido(reporteId) {
  const user = getCurrentUser();
  if (!user) throw new Error('Sesión requerida.');

  const reporte = await obtenerReportePorId(reporteId);
  if (!reporte) throw new Error('Reporte no encontrado.');

  // Si está en coincidencia sugerida pero no confirmado por ambas partes, evitar cierre unilateral
  if (reporte.estado === 'coincidencia_sugerida') {
    throw new Error('Para cerrar un caso con coincidencia, ambas partes deben confirmar primero.');
  }

  const contraparteId = reporte.coincidenciaConReporteId;
  const contraparte = contraparteId ? await obtenerReportePorId(contraparteId) : null;

  if (isConfigured && window.firebase && window.firebase.firestore) {
    const db = window.firebase.firestore();
    const batch = db.batch();

    const updateReunido = {
      estado: 'reunido',
      fechaActualizacion: new Date().toISOString()
    };

    // 1. Actualizar estado del reporte principal
    const repRef = db.collection('reportes').doc(reporteId);
    batch.update(repRef, updateReunido);

    // 2. Liberar cupo activo para el creador principal
    if (reporte.creadorUid) {
      const userRef = db.collection('usuarios').doc(reporte.creadorUid);
      const isPerdido = reporte.tipo === 'perdido';
      const isAdopcion = reporte.tipo === 'en_adopcion' || reporte.estado === 'en_adopcion';
      batch.set(userRef, {
        reportesActivosCount: window.firebase.firestore.FieldValue.increment(-1),
        perdidosActivosCount: isPerdido ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0),
        encontradosActivosCount: (!isPerdido && !isAdopcion) ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0),
        adopcionActivosCount: isAdopcion ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0)
      }, { merge: true });
    }

    // 3. Si hubo coincidencia bilateral, actualizar y liberar cupo de la contraparte
    if (contraparteId && contraparte) {
      const contraRef = db.collection('reportes').doc(contraparteId);
      batch.update(contraRef, updateReunido);

      if (contraparte.creadorUid && contraparte.creadorUid !== reporte.creadorUid) {
        const contraUserRef = db.collection('usuarios').doc(contraparte.creadorUid);
        const isContraPerdido = contraparte.tipo === 'perdido';
        const isContraAdopcion = contraparte.tipo === 'en_adopcion' || contraparte.estado === 'en_adopcion';
        batch.set(contraUserRef, {
          reportesActivosCount: window.firebase.firestore.FieldValue.increment(-1),
          perdidosActivosCount: isContraPerdido ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0),
          encontradosActivosCount: (!isContraPerdido && !isContraAdopcion) ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0),
          adopcionActivosCount: isContraAdopcion ? window.firebase.firestore.FieldValue.increment(-1) : window.firebase.firestore.FieldValue.increment(0)
        }, { merge: true });
      }
    }

    await batch.commit();
    return;
  }

  const lista = obtenerStoreLocal();
  const repIdx = lista.findIndex(r => r.id === reporteId);
  if (repIdx !== -1) {
    lista[repIdx].estado = 'reunido';
    lista[repIdx].fechaActualizacion = new Date().toISOString();
  }
  if (contraparteId) {
    const contraIdx = lista.findIndex(r => r.id === contraparteId);
    if (contraIdx !== -1) {
      lista[contraIdx].estado = 'reunido';
      lista[contraIdx].fechaActualizacion = new Date().toISOString();
    }
  }
  guardarStoreLocal(lista);
}

/**
 * Envía un reporte de abuso para moderación
 */
export async function reportarAbuso(reporteId, motivo, comentario) {
  const user = getCurrentUser();
  if (!user) throw new Error('Debes iniciar sesión para reportar un anuncio.');

  const nuevoAbuso = {
    id: 'abuso_' + Date.now(),
    reporteId,
    usuarioDenuncianteUid: user.uid,
    motivo,
    comentario: comentario || '',
    fecha: new Date().toISOString()
  };

  if (isConfigured && window.firebase && window.firebase.firestore) {
    await window.firebase.firestore().collection('reportes_abuso').add(nuevoAbuso);
  }
  return true;
}
