/**
 * HUELLAS A CASA — Controlador UI de Formulario de Publicación
 * Gestiona el formulario interactivo con selector de chips y compresión en cliente.
 */

import { crearReporte } from '../services/reportes.service.js';
import { comprimirImagen } from '../utils/image-compress.js';
import { validarReporteForm } from '../utils/validaciones.js';
import { exigirAutenticacion } from './auth-modal.ui.js';
import { getCurrentUser } from '../services/auth.service.js';

let tipoSeleccionado = 'perdido';
let blobFotoComprimida = null;

export function inicializarFormulario() {
  const form = document.getElementById('form-publicar-reporte');
  const btnLost = document.getElementById('btn-toggle-lost');
  const btnFound = document.getElementById('btn-toggle-found');
  const btnAdopt = document.getElementById('btn-toggle-adopt');
  const camposExclusivosEncontrado = document.getElementById('campos-exclusivos-encontrado');
  const camposExclusivosAdopcion = document.getElementById('campos-exclusivos-adopcion');
  const labelNombreMascota = document.getElementById('label-nombre-mascota');
  const inputNombreMascota = document.getElementById('input-nombre');
  const inputFoto = document.getElementById('input-foto-mascota');
  const photoUploadZone = document.getElementById('photo-upload-zone');
  const photoPreviewContainer = document.getElementById('photo-preview-container');
  const photoPreviewImg = document.getElementById('photo-preview-img');
  const photoCompressionBadge = document.getElementById('photo-compression-badge');
  const btnSubmit = document.getElementById('btn-submit-reporte');

  // Toggle Selector (Perdido vs Encontrado vs En Adopción)
  function setTipo(tipo) {
    tipoSeleccionado = tipo;
    if (tipo === 'perdido') {
      btnLost.className = 'type-toggle-btn active-lost';
      btnFound.className = 'type-toggle-btn';
      if (btnAdopt) btnAdopt.className = 'type-toggle-btn';
      if (camposExclusivosEncontrado) camposExclusivosEncontrado.style.display = 'none';
      if (camposExclusivosAdopcion) camposExclusivosAdopcion.style.display = 'none';
      if (labelNombreMascota) labelNombreMascota.textContent = 'Nombre de tu mascota';
      if (inputNombreMascota) inputNombreMascota.placeholder = 'Ej: Toby, Luna';
      if (btnSubmit) btnSubmit.textContent = '🐾 Publicar Reporte de Mascota Perdida';
      
      // Limpiar campos residuales de Encontrado
      const selVet = document.getElementById('select-necesita-vet');
      const selSit = document.getElementById('select-situacion-lugar');
      if (selVet) selVet.value = 'no';
      if (selSit) selSit.value = 'en_casa_temporal';
    } else if (tipo === 'encontrado') {
      btnLost.className = 'type-toggle-btn';
      btnFound.className = 'type-toggle-btn active-found';
      if (btnAdopt) btnAdopt.className = 'type-toggle-btn';
      if (camposExclusivosEncontrado) camposExclusivosEncontrado.style.display = 'block';
      if (camposExclusivosAdopcion) camposExclusivosAdopcion.style.display = 'none';
      if (labelNombreMascota) labelNombreMascota.textContent = 'Nombre provisional / apodo';
      if (inputNombreMascota) inputNombreMascota.placeholder = 'Ej: Manchas (o déjalo en blanco si no sabes)';
      if (btnSubmit) btnSubmit.textContent = '🐾 Publicar Mascota Encontrada';
    } else if (tipo === 'en_adopcion') {
      btnLost.className = 'type-toggle-btn';
      btnFound.className = 'type-toggle-btn';
      if (btnAdopt) btnAdopt.className = 'type-toggle-btn active-adopcion';
      if (camposExclusivosEncontrado) camposExclusivosEncontrado.style.display = 'none';
      if (camposExclusivosAdopcion) camposExclusivosAdopcion.style.display = 'block';
      if (labelNombreMascota) labelNombreMascota.textContent = 'Nombre de la mascota en adopción';
      if (inputNombreMascota) inputNombreMascota.placeholder = 'Ej: Simón, Dulce, Mateo...';
      if (btnSubmit) btnSubmit.textContent = '💜 Publicar Mascota en Adopción';
    }
  }

  if (btnLost) btnLost.addEventListener('click', () => setTipo('perdido'));
  if (btnFound) btnFound.addEventListener('click', () => setTipo('encontrado'));
  if (btnAdopt) btnAdopt.addEventListener('click', () => setTipo('en_adopcion'));

  // Carga y compresión adaptativa de imagen en cliente
  photoUploadZone.addEventListener('click', () => inputFoto.click());

  inputFoto.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const textoOriginalZone = photoUploadZone.innerHTML;
    try {
      // Feedback visual inmediato de compresión
      photoUploadZone.innerHTML = `
        <div style="padding: var(--space-md); text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 6px;">⏳</div>
          <div style="font-weight: 700; color: var(--color-primary);">Comprimiendo imagen de forma local...</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 4px;">Optimizando peso a menos de 300KB para ahorro en redes 3G</div>
        </div>
      `;
      photoUploadZone.style.opacity = '0.7';

      const resultado = await comprimirImagen(file);
      blobFotoComprimida = resultado.blob;

      photoPreviewImg.src = resultado.dataUrl;
      photoPreviewContainer.style.display = 'block';
      photoUploadZone.style.display = 'none';

      const kbOriginal = Math.round(resultado.originalSize / 1024);
      const kbComprimido = Math.round(resultado.compressedSize / 1024);
      photoCompressionBadge.textContent = `⚡ Optimizada para 3G: de ${kbOriginal}KB a ${kbComprimido}KB (-${resultado.reductionPercentage}%)`;
    } catch (err) {
      alert('Error con la imagen: ' + err.message);
      photoUploadZone.innerHTML = textoOriginalZone;
    } finally {
      photoUploadZone.style.opacity = '1';
      photoUploadZone.innerHTML = textoOriginalZone;
    }
  });

  // Botón para cambiar foto
  const btnCambiarFoto = document.getElementById('btn-cambiar-foto');
  if (btnCambiarFoto) {
    btnCambiarFoto.addEventListener('click', () => {
      blobFotoComprimida = null;
      photoPreviewContainer.style.display = 'none';
      photoUploadZone.style.display = 'block';
      inputFoto.value = '';
    });
  }

  // Control de selector de ciudad y campo de otra ciudad
  const selectCiudad = document.getElementById('select-ciudad');
  const inputCiudadOtra = document.getElementById('input-ciudad-otra');
  const headerSubtitle = document.getElementById('header-ciudad-subtitle');

  function actualizarSubtituloCiudad() {
    if (!headerSubtitle) return;
    const val = selectCiudad ? selectCiudad.value : 'Cali';
    if (val === '__otra__') {
      const otraVal = inputCiudadOtra ? inputCiudadOtra.value.trim() : '';
      headerSubtitle.textContent = otraVal ? `${otraVal}, Colombia` : 'Colombia';
    } else {
      headerSubtitle.textContent = val ? `${val}, Colombia` : 'Colombia';
    }
  }

  if (selectCiudad && inputCiudadOtra) {
    selectCiudad.addEventListener('change', (e) => {
      actualizarSubtituloCiudad();
      if (e.target.value === '__otra__') {
        inputCiudadOtra.style.display = 'block';
        inputCiudadOtra.required = true;
        inputCiudadOtra.focus();
      } else {
        inputCiudadOtra.style.display = 'none';
        inputCiudadOtra.required = false;
        inputCiudadOtra.value = '';
      }
    });

    inputCiudadOtra.addEventListener('input', actualizarSubtituloCiudad);
    actualizarSubtituloCiudad();
  }

  // Envío del Formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Validar foto
    if (!blobFotoComprimida) {
      alert('Por favor selecciona una foto de la mascota.');
      photoUploadZone.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // 2. Validar Consentimiento de Privacidad (Ley 1581 de 2012)
    const checkConsentimiento = document.getElementById('consentimiento-datos');
    const errorConsentimiento = document.getElementById('consentimiento-error');
    if (checkConsentimiento && !checkConsentimiento.checked) {
      if (errorConsentimiento) errorConsentimiento.style.display = 'block';
      checkConsentimiento.scrollIntoView({ behavior: 'smooth' });
      return;
    } else if (errorConsentimiento) {
      errorConsentimiento.style.display = 'none';
    }

    // 3. Extraer valores
    const especie = document.querySelector('input[name="especie"]:checked')?.value;
    const tamano = document.getElementById('select-tamano')?.value || document.querySelector('select[name="tamano"]')?.value || document.querySelector('input[name="tamano"]:checked')?.value;
    const sexo = document.getElementById('select-sexo')?.value || document.querySelector('select[name="sexo"]')?.value || document.querySelector('input[name="sexo"]:checked')?.value;
    const medioContacto = document.querySelector('input[name="medioContacto"]:checked')?.value || 'whatsapp';

    let ciudad = selectCiudad ? selectCiudad.value : 'Cali';
    if (ciudad === '__otra__') {
      ciudad = inputCiudadOtra ? inputCiudadOtra.value.trim() : '';
      if (!ciudad) {
        alert('Por favor escribe el nombre de tu ciudad o municipio.');
        inputCiudadOtra?.focus();
        return;
      }
    }

    const barrio = document.getElementById('input-barrio')?.value.trim() || null;

    // Reconstrucción limpia del objeto según el tipo final
    const datosFormulario = {
      tipo: tipoSeleccionado,
      especie,
      tamano,
      sexo,
      color: document.getElementById('input-color').value.trim(),
      raza: document.getElementById('input-raza').value.trim() || 'Mestizo / Criollo',
      nombre: document.getElementById('input-nombre').value.trim(),
      ciudad,
      barrio,
      fechaEvento: document.getElementById('input-fecha').value || new Date().toISOString().split('T')[0],
      senasVisibles: document.getElementById('input-senas-visibles').value.trim(),
      senaVerificacionPrivada: document.getElementById('input-sena-privada').value.trim(),
      telefonoContacto: document.getElementById('input-telefono').value.trim(),
      medioContacto,
      nombrePublicador: document.getElementById('input-nombre-dueno')?.value.trim() || '',
      consentimientoAceptado: true,
      // Campos condicionales limpios (nunca residuales)
      necesitaVet: tipoSeleccionado === 'encontrado' ? (document.getElementById('select-necesita-vet')?.value === 'si') : false,
      situacionLugar: tipoSeleccionado === 'encontrado' ? (document.getElementById('select-situacion-lugar')?.value || 'en_casa_temporal') : null,
      esterilizado: tipoSeleccionado === 'en_adopcion' ? (document.getElementById('select-esterilizado')?.value || 'no_se') : null,
      vacunado: tipoSeleccionado === 'en_adopcion' ? (document.getElementById('select-vacunado')?.value || 'no_se') : null
    };

    // 4. Validar reglas de negocio
    const validacion = validarReporteForm(datosFormulario);
    if (!validacion.valido) {
      alert('Por favor completa todos los campos requeridos:\n- ' + validacion.errores.join('\n- '));
      return;
    }

    // 5. Exigir sesión de Google antes de guardar
    exigirAutenticacion(async () => {
      try {
        btnSubmit.disabled = true;
        btnSubmit.textContent = '⏳ Guardando reporte y foto...';

        const nuevoReporte = await crearReporte(datosFormulario, blobFotoComprimida);
        alert(`¡Reporte publicado con éxito! Tu mascota ya está visible en ${datosFormulario.ciudad}.`);
        window.location.href = `detalle.html?id=${nuevoReporte.id}`;
      } catch (error) {
        alert('Error al publicar: ' + error.message);
        btnSubmit.disabled = false;
        btnSubmit.textContent = '🐾 Publicar Reporte';
      }
    });
  });
}
