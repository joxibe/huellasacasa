/**
 * HUELLAS A CASA — Validaciones Puras (Sin dependencias)
 */

export const CIUDADES_EMERGENCIA = ['Cali', 'Pereira', 'Manizales', 'Quibdó', 'Armenia'];

export const CIUDADES_PRINCIPALES = [
  'Bogotá', 'Medellín', 'Barranquilla', 'Cartagena', 'Bucaramanga',
  'Cúcuta', 'Ibagué', 'Villavicencio', 'Pasto', 'Montería',
  'Neiva', 'Popayán', 'Valledupar', 'Santa Marta', 'Sincelejo',
  'Tunja', 'Riohacha', 'Florencia', 'Yopal'
];

export const OTRA_CIUDAD = '__otra__';

export function validarReporteForm(datos) {
  const errores = [];

  // 1. Tipo obligatorio
  if (!datos.tipo || !['perdido', 'encontrado', 'en_adopcion'].includes(datos.tipo)) {
    errores.push('Debes seleccionar si la mascota está perdida, encontrada o en adopción.');
  }

  // 2. Ciudad obligatoria
  if (!datos.ciudad || datos.ciudad.trim().length < 2) {
    errores.push('Debes indicar la ciudad o municipio donde ocurrió.');
  }

  // 3. Especie
  if (!datos.especie || !['perro', 'gato', 'otro'].includes(datos.especie)) {
    errores.push('Debes seleccionar la especie de la mascota.');
  }

  // 4. Tamaño
  if (!datos.tamano || !['pequeno', 'mediano', 'grande'].includes(datos.tamano)) {
    errores.push('Debes indicar el tamaño aproximado.');
  }

  // 5. Sexo
  if (!datos.sexo || !['macho', 'hembra', 'no_se'].includes(datos.sexo)) {
    errores.push('Debes indicar el sexo de la mascota.');
  }

  // 6. Color(es)
  if (!datos.color || datos.color.trim().length < 3) {
    errores.push('Describe el o los colores principales de la mascota.');
  }

  // 8. Seña de verificación privada
  if (!datos.senaVerificacionPrivada || datos.senaVerificacionPrivada.trim().length < 4) {
    errores.push('La seña de verificación privada es obligatoria para proteger la identidad de la mascota.');
  }

  // 9. Teléfono
  if (!datos.telefonoContacto || datos.telefonoContacto.replace(/\D/g, '').length < 10) {
    errores.push('Ingresa un número de teléfono o celular válido (mínimo 10 dígitos).');
  }

  // 10. Exclusivo Encontrado: Urgencia y situación
  if (datos.tipo === 'encontrado') {
    if (typeof datos.necesitaVet !== 'boolean') {
      errores.push('Indica si la mascota necesita atención veterinaria urgente.');
    }
    if (!datos.situacionLugar || !['en_casa_temporal', 'suelta_en_zona'].includes(datos.situacionLugar)) {
      errores.push('Indica si la mascota está en casa temporal o sigue suelta en la zona.');
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

export function sanitizarTexto(texto) {
  if (typeof texto !== 'string') return '';
  return texto.trim().replace(/[<>]/g, '');
}
