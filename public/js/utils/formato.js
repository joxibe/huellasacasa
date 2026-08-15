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
 * Construye enlace directo de WhatsApp con mensaje contextual
 * @param {string} telefono 
 * @param {Object} reporte 
 * @returns {string}
 */
export function generarEnlaceWhatsApp(telefono, reporte) {
  const numeroLimpio = telefono.replace(/\D/g, '');
  const prefijo = numeroLimpio.startsWith('57') ? numeroLimpio : `57${numeroLimpio}`;
  
  const nombreMascota = reporte.nombre ? `(${reporte.nombre})` : '';
  const tipoTexto = reporte.tipo === 'perdido' ? 'tu reporte de mascota perdida' : 'la mascota encontrada que publicaste';
  const ubicacionTexto = reporte.barrio ? `${reporte.barrio}, ${reporte.ciudad}` : `${reporte.ciudad}`;
  const textoMensaje = `Hola, te contacto desde Huellas a Casa sobre ${tipoTexto} ${nombreMascota} en ${ubicacionTexto}. ¿Aún sigue activo el caso?`;
  
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
