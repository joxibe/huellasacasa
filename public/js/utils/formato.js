/**
 * Normaliza una cadena de texto a minúsculas y sin acentos/tildes para búsquedas exactas
 * @param {string} str 
 * @returns {string}
 */
export function normalizarTexto(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Retorna una cadena relativa de tiempo transcurrido (ej: "Hace 2 horas")
 * @param {string|number|Date} fecha 
 * @returns {string}
 */
export function formatoTiempoRelativo(fecha) {
  if (!fecha) return 'Reciente';
  const fechaObj = typeof fecha === 'string' || typeof fecha === 'number' ? new Date(fecha) : fecha;
  const ahora = new Date();
  const diferenciaSegundos = Math.floor((ahora - fechaObj) / 1000);

  if (diferenciaSegundos < 60) return 'Hace un momento';
  const minutos = Math.floor(diferenciaSegundos / 60);
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  return fechaObj.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

/**
 * Construye enlace directo de WhatsApp con mensaje contextual optimizado
 * @param {string} telefono 
 * @param {Object} reporte 
 * @returns {string}
 */
export function generarEnlaceWhatsApp(telefono, reporte = {}) {
  const numeroLimpio = (telefono || '').replace(/\D/g, '');
  const prefijo = numeroLimpio.startsWith('57') ? numeroLimpio : `57${numeroLimpio}`;
  
  // 1. Identificar nombre o descripción natural (sin palabras de estado técnico)
  let nombreODescripcion;
  if (reporte.nombre && reporte.nombre.trim()) {
    nombreODescripcion = reporte.nombre.trim();
  } else if (reporte.tipo === 'perdido') {
    nombreODescripcion = 'una mascota perdida';
  } else if (reporte.tipo === 'en_adopcion') {
    nombreODescripcion = 'una mascota en adopción';
  } else {
    nombreODescripcion = 'una mascota encontrada';
  }

  // 2. Formatear zona evitando duplicar la ciudad si el barrio ya la contiene o es idéntica
  const barrio = (reporte.barrio || '').trim();
  const ciudad = (reporte.ciudad || 'Cali').trim();
  let zona = ciudad;

  if (barrio) {
    const barrioLower = barrio.toLowerCase();
    const ciudadLower = ciudad.toLowerCase();
    if (barrioLower === ciudadLower || barrioLower.includes(ciudadLower)) {
      zona = barrio;
    } else {
      zona = `${barrio}, ${ciudad}`;
    }
  }

  // 3. Link directo al reporte
  const url = reporte.id 
    ? `https://huellasacasa-23651.web.app/detalle.html?id=${reporte.id}` 
    : 'https://huellasacasa-23651.web.app';

  // 4. Mensaje natural, claro y amigable
  const textoMensaje = `Hola 👋, te escribo desde Huellas a Casa sobre el reporte de ${nombreODescripcion} en ${zona}. Aquí está el reporte: ${url} ¿Sigue activo el caso?`;
  
  return `https://wa.me/${prefijo}?text=${encodeURIComponent(textoMensaje)}`;
}

/**
 * Retorna la etiqueta legible y badge de especie
 */
export function formatearEspecie(especie) {
  const mapa = {
    perro: { label: 'Perro', icon: '🐶' },
    gato: { label: 'Gato', icon: '🐱' },
    otro: { label: 'Otro', icon: '🐾' }
  };
  return mapa[especie] || { label: 'Mascota', icon: '🐾' };
}

/**
 * Retorna la etiqueta legible del estado
 */
export function formatearEstado(estado) {
  const mapa = {
    perdido: 'Perdido',
    encontrado: 'Encontrado',
    coincidencia_sugerida: 'Coincidencia sugerida',
    confirmado_ambas_partes: 'Confirmado por ambas partes',
    reunido: 'Reunido',
    en_adopcion: 'En adopción',
    adoptado: 'Adoptado'
  };
  return mapa[estado] || estado;
}
