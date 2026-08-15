/**
 * HUELLAS A CASA — Controlador UI de Vista de Detalle
 * Muestra ficha técnica de la mascota, botón de WhatsApp autenticado y sugerencia de coincidencia por ID.
 */

import { obtenerReportePorId, sugerirCoincidencia, reportarAbuso, obtenerContactoReporte } from '../services/reportes.service.js';
import { formatoTiempoRelativo, formatearEspecie, formatearEstado, generarEnlaceWhatsApp } from '../utils/formato.js';
import { exigirAutenticacion } from './auth-modal.ui.js';

export async function inicializarDetalle() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const container = document.getElementById('detalle-container');

  if (!id) {
    container.innerHTML = `
      <div class="ui-state-empty">
        <div class="ui-state-icon">❓</div>
        <h3 class="ui-state-title">No se especificó un reporte</h3>
        <a href="index.html" class="btn btn-primary btn-sm" style="margin-top: 8px;">Volver al inicio</a>
      </div>
    `;
    return;
  }

  try {
    const reporte = await obtenerReportePorId(id);
    if (!reporte) {
      container.innerHTML = `
        <div class="ui-state-empty">
          <div class="ui-state-icon">🐾 ❌</div>
          <h3 class="ui-state-title">Reporte no encontrado</h3>
          <p class="ui-state-desc">Este reporte pudo haber sido eliminado o el enlace es incorrecto.</p>
          <a href="index.html" class="btn btn-primary btn-sm" style="margin-top: 8px;">Volver a explorar</a>
        </div>
      `;
      return;
    }

    renderDetalleContenido(container, reporte);
  } catch (err) {
    console.error('Error cargando detalle:', err);
    container.innerHTML = `
      <div class="ui-state-error">
        <h3 class="ui-state-title">Error al cargar el reporte</h3>
        <button onclick="location.reload()" class="btn btn-primary btn-sm">Reintentar</button>
      </div>
    `;
  }
}

function renderDetalleContenido(container, reporte) {
  const infoEspecie = formatearEspecie(reporte.especie);
  const estadoLabel = formatearEstado(reporte.estado);
  const tiempo = formatoTiempoRelativo(reporte.fechaCreacion);
  const esCerrado = reporte.estado === 'reunido' || reporte.estado === 'adoptado';

  const tamanoMap = { pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' };
  const sexoMap = { macho: 'Macho', hembra: 'Hembra', no_se: 'Desconocido' };

  container.innerHTML = `
    <div style="margin-bottom: var(--space-md);">
      <a href="index.html" style="display: inline-flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--space-md);">
        &larr; Volver al listado de reportes
      </a>
      
      <div class="detail-desktop-grid" style="background-color: var(--color-bg-card); border-radius: var(--radius-xl); overflow: hidden; border: 1px solid var(--color-border); box-shadow: var(--shadow-card);">
        <div style="position: relative; width: 100%; height: 100%; min-height: 300px; background-color: var(--color-bg-muted);">
          <img src="${reporte.fotoUrl}" alt="${reporte.nombre || 'Mascota'}" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="position: absolute; top: 12px; left: 12px;">
            <span class="badge-status" data-status="${reporte.estado}">${estadoLabel}</span>
          </div>
          ${reporte.necesitaVet ? `<div style="position: absolute; top: 12px; right: 12px;" class="pet-card-urgent-pill">🚨 Requiere Vet</div>` : ''}
        </div>

        <div style="padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-md);">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <h1 style="font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text-primary);">
              ${reporte.nombre || (reporte.tipo === 'encontrado' ? 'Mascota Encontrada' : 'Mascota Perdida')}
            </h1>
            <span style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">${tiempo}</span>
          </div>

          <!-- Identificador Único de Publicación -->
          <div style="background-color: var(--color-bg-muted); padding: 8px 12px; border-radius: var(--radius-md); font-size: var(--font-size-xs); color: var(--color-text-secondary); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px; border: 1px dashed var(--color-border);">
            <div>
              <strong>🆔 ID de publicación:</strong> <code style="font-weight: 700; color: var(--color-primary);">${reporte.id}</code>
            </div>
            <span style="font-size: 11px; color: var(--color-text-muted);">Cópialo para sugerir coincidencia</span>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span class="pet-pill">${infoEspecie.icon} ${infoEspecie.label}</span>
            <span class="pet-pill">📏 ${tamanoMap[reporte.tamano] || 'Mediano'}</span>
            <span class="pet-pill">⚧ ${sexoMap[reporte.sexo] || 'Macho'}</span>
            <span class="pet-pill">🎨 ${reporte.color}</span>
            ${reporte.raza ? `<span class="pet-pill">🏷️ ${reporte.raza}</span>` : ''}
          </div>

          <div style="background-color: var(--color-bg-muted); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: var(--font-size-sm); color: var(--color-text-primary);">
              📍 Ubicación:
            </div>
            <div style="font-size: var(--font-size-base); color: var(--color-text-primary); font-weight: 700;">
              ${reporte.barrio ? `${reporte.barrio}, ` : ''}${reporte.ciudad}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
              Fecha del suceso: ${reporte.fechaEvento || 'No especificada'}
            </div>
          </div>

          ${reporte.situacionLugar ? `
            <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
              <strong>Estado de resguardo:</strong> ${reporte.situacionLugar === 'en_casa_temporal' ? '🏠 En casa temporal segura' : '⚠️ Sigue suelta en la zona'}
            </div>
          ` : ''}

          <div>
            <h3 style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; margin-bottom: 4px;">
              Señas Particulares Visibles
            </h3>
            <p style="font-size: var(--font-size-base); color: var(--color-text-primary); line-height: 1.4;">
              ${reporte.senasVisibles || 'Sin señas adicionales descritas.'}
            </p>
          </div>

          <div class="privacy-alert-box">
            <div class="privacy-alert-icon">🔒</div>
            <div class="privacy-alert-text">
              <strong>Consejo anti-fraude:</strong> Si vas a contactar a esta persona para reclamar la mascota, te pedirá que describas la <em>seña secreta privada</em> antes de acordar la entrega.
            </div>
          </div>

          <!-- Acciones Principales -->
          <div style="display: flex; flex-direction: column; gap: var(--space-xs); margin-top: var(--space-xs);">
            ${!esCerrado ? `
              <button id="btn-contactar-whatsapp" class="btn btn-whatsapp">
                💬 Contactar por WhatsApp
              </button>
              <button id="btn-sugerir-coincidencia" class="btn btn-secondary">
                🔗 Sugerir coincidencia con otro caso
              </button>
            ` : `
              <div style="background-color: var(--status-reunido-bg); border: 1px solid var(--status-reunido-border); border-radius: var(--radius-md); padding: var(--space-sm); text-align: center; font-size: var(--font-size-sm); color: var(--status-reunido-color); font-weight: 700;">
                🎉 Este caso ya fue cerrado exitosamente (${estadoLabel}).
              </div>
            `}
            <button id="btn-reportar-anuncio" class="btn btn-secondary btn-sm" style="color: var(--color-text-secondary); border: none; margin-top: 4px;">
              🚩 Reportar este anuncio
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Contactar por WhatsApp (Protegido por login de Google y consulta a subcolección /privado/contacto)
  const btnWhatsapp = document.getElementById('btn-contactar-whatsapp');
  if (btnWhatsapp) {
    btnWhatsapp.addEventListener('click', () => {
      exigirAutenticacion(async () => {
        try {
          btnWhatsapp.disabled = true;
          btnWhatsapp.innerHTML = '<span>⏳</span> Obteniendo contacto seguro...';
          const contacto = await obtenerContactoReporte(reporte.id);
          const url = generarEnlaceWhatsApp(contacto.telefonoContacto, reporte);
          window.open(url, '_blank');
        } catch (e) {
          alert('No se pudo obtener el contacto: ' + e.message);
        } finally {
          btnWhatsapp.disabled = false;
          btnWhatsapp.innerHTML = `
            <span style="font-size: 1.2rem;">💬</span>
            Contactar por WhatsApp
          `;
        }
      });
    });
  }

  // Sugerir coincidencia simplificada pegando ID
  const btnSugerir = document.getElementById('btn-sugerir-coincidencia');
  if (btnSugerir) {
    btnSugerir.addEventListener('click', () => {
      exigirAutenticacion(async () => {
        const modalHtml = `
          <div id="modal-sugerir-match" class="modal-overlay open">
            <div class="modal-sheet" style="max-height: 90vh;">
              <div class="modal-handle"></div>
              <div class="modal-header">
                <h3 class="modal-title">🔗 Sugerir Coincidencia</h3>
                <button type="button" id="btn-cerrar-modal-match" class="modal-close-btn">&times;</button>
              </div>
              <p style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: var(--space-sm); line-height: 1.4;">
                Pega el <strong>ID</strong> de la otra publicación (ej: <code>rep_cali_001</code>) o su enlace completo.
              </p>

              <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; padding: 8px 12px; border-radius: var(--radius-md); font-size: var(--font-size-xs); color: #92400E; margin-bottom: var(--space-md);">
                💡 <strong>¿Dónde encuentro el ID?</strong> Está visible al final de cada tarjeta en el explorador o en la ficha técnica de la otra publicación.
              </div>

              <div id="box-error-match" style="display: none; background-color: #FEE2E2; border: 1px solid #FCA5A5; padding: 8px 12px; border-radius: var(--radius-md); font-size: var(--font-size-xs); color: #B91C1C; margin-bottom: var(--space-md);"></div>

              <div class="form-group">
                <label class="form-label" for="input-id-otro-reporte">ID o enlace de la otra publicación:</label>
                <input 
                  type="text" 
                  id="input-id-otro-reporte" 
                  class="form-control" 
                  placeholder="Ej: rep_cali_001 o https://.../detalle.html?id=..." 
                  autofocus
                />
              </div>

              <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: var(--space-md);">
                <button type="button" id="btn-cancelar-match" class="btn btn-secondary btn-sm">Cancelar</button>
                <button type="button" id="btn-enviar-match" class="btn btn-primary btn-sm">Vincular Coincidencia</button>
              </div>
            </div>
          </div>
        `;

        // Inyectar modal
        const modalWrapper = document.createElement('div');
        modalWrapper.innerHTML = modalHtml;
        document.body.appendChild(modalWrapper);

        const closeModal = () => modalWrapper.remove();
        document.getElementById('btn-cerrar-modal-match').addEventListener('click', closeModal);
        document.getElementById('btn-cancelar-match').addEventListener('click', closeModal);
        
        const modalOverlay = document.getElementById('modal-sugerir-match');
        modalOverlay.addEventListener('click', (e) => {
          if (e.target === modalOverlay) closeModal();
        });

        document.getElementById('btn-enviar-match').addEventListener('click', async () => {
          const inputId = document.getElementById('input-id-otro-reporte');
          const errorBox = document.getElementById('box-error-match');
          let targetId = inputId?.value.trim();

          if (errorBox) errorBox.style.display = 'none';

          // Extraer id si pegaron URL completa
          if (targetId && targetId.includes('id=')) {
            targetId = new URLSearchParams(targetId.split('?')[1]).get('id') || targetId;
          }

          if (!targetId) {
            if (errorBox) {
              errorBox.textContent = 'Por favor ingresa el ID o enlace del otro reporte.';
              errorBox.style.display = 'block';
            }
            return;
          }

          try {
            const btn = document.getElementById('btn-enviar-match');
            btn.disabled = true;
            btn.textContent = '⏳ Vinculando...';
            await sugerirCoincidencia(reporte.id, targetId);
            alert('¡Coincidencia vinculada exitosamente! Los dueños de ambos reportes podrán validarla en la sección "Mis Reportes".');
            closeModal();
            location.reload();
          } catch (e) {
            if (errorBox) {
              errorBox.textContent = e.message;
              errorBox.style.display = 'block';
            }
            const btn = document.getElementById('btn-enviar-match');
            if (btn) {
              btn.disabled = false;
              btn.textContent = 'Vincular Coincidencia';
            }
          }
        });
      });
    });
  }

  // Reportar abuso
  document.getElementById('btn-reportar-anuncio').addEventListener('click', () => {
    exigirAutenticacion(async () => {
      const motivo = prompt('Por favor escribe el motivo del reporte (ej: datos falsos, anuncio duplicado, spam):');
      if (!motivo) return;
      try {
        await reportarAbuso(reporte.id, 'comunitario', motivo);
        alert('Gracias por tu reporte. Nuestro equipo lo revisará para mantener segura la comunidad.');
      } catch (e) {
        alert('Error al reportar: ' + e.message);
      }
    });
  });
}
