/**
 * HUELLAS A CASA — Controlador UI de Vista de Detalle
 * Muestra ficha técnica de la mascota, botón de WhatsApp autenticado,
 * buscador visual interactivo para sugerir coincidencias y botón de eliminación para el dueño.
 */

import { 
  obtenerReportePorId, 
  obtenerReportes,
  sugerirCoincidencia, 
  reportarAbuso, 
  obtenerContactoReporte,
  eliminarReporte 
} from '../services/reportes.service.js';
import { 
  formatoTiempoRelativo, 
  formatearEspecie, 
  formatearEstado, 
  generarEnlaceWhatsApp 
} from '../utils/formato.js';
import { exigirAutenticacion } from './auth-modal.ui.js';
import { getCurrentUser, onAuthStateChanged } from '../services/auth.service.js';
import { mostrarModalConfirmacion } from './confirm-modal.ui.js';

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

    // Re-renderizar barra de dueño cuando se detecte sesión
    onAuthStateChanged((user) => {
      const ownerBanner = document.getElementById('banner-dueno-reporte');
      if (user && user.uid === reporte.creadorUid) {
        if (ownerBanner) ownerBanner.style.display = 'flex';
      } else if (ownerBanner) {
        ownerBanner.style.display = 'none';
      }
    });

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
  const user = getCurrentUser();
  const esDuenio = Boolean(user && user.uid === reporte.creadorUid);
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

      <!-- Banner exclusivo para el creador del reporte -->
      <div id="banner-dueno-reporte" style="display: ${esDuenio ? 'flex' : 'none'}; background: #FEF2F2; border: 1px solid #FCA5A5; padding: 10px 14px; border-radius: var(--radius-lg); margin-bottom: var(--space-md); justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 6px; font-size: var(--font-size-xs); color: #991B1B; font-weight: 700;">
          <span>👑</span> Eres el autor de este reporte
        </div>
        <button id="btn-eliminar-detalle" class="btn btn-secondary btn-sm" style="color: #DC2626; border-color: #FCA5A5;">
          🗑️ Eliminar publicación
        </button>
      </div>
      
      <div class="detail-desktop-grid" style="background-color: var(--color-bg-card); border-radius: var(--radius-xl); overflow: hidden; border: 1px solid var(--color-border); box-shadow: var(--shadow-card);">
        <div style="position: relative; width: 100%; height: 100%; min-height: 300px; background-color: var(--color-bg-muted);">
          <img src="${reporte.fotoUrl}" alt="${reporte.nombre || 'Mascota'}" decoding="async" style="width: 100%; height: 100%; object-fit: cover;" />
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

  // Eliminar reporte desde detalle (exclusivo para el creador)
  const btnEliminarDetalle = document.getElementById('btn-eliminar-detalle');
  if (btnEliminarDetalle) {
    btnEliminarDetalle.addEventListener('click', () => {
      mostrarModalConfirmacion({
        titulo: '¿Eliminar esta publicación?',
        mensaje: 'Se borrarán sus datos y foto, y se liberará tu cupo de publicación. Esta acción no se puede deshacer.',
        textoConfirmar: '🗑️ Eliminar',
        textoCancelar: 'Cancelar',
        esPeligro: true,
        onConfirm: async () => {
          try {
            btnEliminarDetalle.disabled = true;
            btnEliminarDetalle.textContent = 'Eliminando...';
            await eliminarReporte(reporte.id);
            alert('Tu reporte ha sido eliminado correctamente.');
            window.location.href = 'mis-reportes.html';
          } catch (e) {
            alert('Error al eliminar: ' + e.message);
            btnEliminarDetalle.disabled = false;
            btnEliminarDetalle.textContent = '🗑️ Eliminar publicación';
          }
        }
      });
    });
  }

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

  // Sugerir coincidencia con Buscador Visual Interactivo
  const btnSugerir = document.getElementById('btn-sugerir-coincidencia');
  if (btnSugerir) {
    btnSugerir.addEventListener('click', () => {
      exigirAutenticacion(async () => {
        abrirModalBuscadorVisualCoincidencia(reporte);
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

/**
 * Abre el modal con buscador visual y fotos para sugerir coincidencia sin necesidad de copiar IDs
 * @param {Object} reporteActual 
 */
async function abrirModalBuscadorVisualCoincidencia(reporteActual) {
  const tipoOpuesto = reporteActual.tipo === 'perdido' ? 'encontrado' : 'perdido';
  const tipoOpuestoTexto = tipoOpuesto === 'perdido' ? 'mascotas perdidas' : 'mascotas encontradas';

  const modalHtml = `
    <div id="modal-sugerir-match" class="modal-overlay open">
      <div class="modal-sheet" style="max-height: 90vh; display: flex; flex-direction: column;">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <h3 class="modal-title">🔗 Sugerir Coincidencia Visual</h3>
          <button type="button" id="btn-cerrar-modal-match" class="modal-close-btn">&times;</button>
        </div>

        <p style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 8px; line-height: 1.4;">
          Busca y selecciona la foto de la mascota que crees que coincide con <strong>${reporteActual.nombre || 'este caso'}</strong>:
        </p>

        <!-- Filtro rápido en tiempo real -->
        <div style="margin-bottom: 10px;">
          <input 
            type="text" 
            id="input-filtro-match-visual" 
            class="form-control" 
            placeholder="🔍 Filtrar por barrio, color o nombre..." 
            style="font-size: var(--font-size-xs); padding: 8px 12px;"
          />
        </div>

        <div id="box-error-match" style="display: none; background-color: #FEE2E2; border: 1px solid #FCA5A5; padding: 8px 12px; border-radius: var(--radius-md); font-size: var(--font-size-xs); color: #B91C1C; margin-bottom: 8px;"></div>

        <!-- Lista scrolleable de candidatos visuales -->
        <div id="lista-candidatos-match" style="flex: 1; overflow-y: auto; max-height: 320px; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
          <div style="padding: 20px; text-align: center; color: var(--color-text-secondary); font-size: var(--font-size-xs);">
            ⏳ Cargando ${tipoOpuestoTexto} en ${reporteActual.ciudad}...
          </div>
        </div>

        <!-- Opción manual con ID (desplegable) -->
        <details style="margin-top: 10px; font-size: var(--font-size-xs); color: var(--color-text-secondary); border-top: 1px solid var(--color-border); padding-top: 8px;">
          <summary style="cursor: pointer; font-weight: 600;">✏️ O pegar un ID / enlace directamente</summary>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <input type="text" id="input-id-manual-match" class="form-control" placeholder="Ej: rep_cali_002 o enlace" style="font-size: var(--font-size-xs);" />
            <button type="button" id="btn-enviar-match-manual" class="btn btn-secondary btn-sm" style="white-space: nowrap;">Vincular</button>
          </div>
        </details>
      </div>
    </div>
  `;

  // Inyectar modal
  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = modalHtml;
  document.body.appendChild(modalWrapper);

  const closeModal = () => modalWrapper.remove();
  document.getElementById('btn-cerrar-modal-match').addEventListener('click', closeModal);
  
  const modalOverlay = document.getElementById('modal-sugerir-match');
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  const listaContainer = document.getElementById('lista-candidatos-match');
  const errorBox = document.getElementById('box-error-match');
  let candidatos = [];

  try {
    const listado = await obtenerReportes({ ciudad: reporteActual.ciudad, tipo: tipoOpuesto });
    // Excluir el reporte actual y los que ya están cerrados
    candidatos = listado.filter(r => r.id !== reporteActual.id && r.estado !== 'reunido' && r.estado !== 'adoptado');
    renderListaCandidatos(candidatos);
  } catch (err) {
    listaContainer.innerHTML = `
      <div style="padding: 16px; text-align: center; color: var(--color-error); font-size: var(--font-size-xs);">
        No se pudieron cargar los reportes sugeridos: ${err.message}
      </div>
    `;
  }

  function renderListaCandidatos(items) {
    if (!items || items.length === 0) {
      listaContainer.innerHTML = `
        <div style="padding: 24px 12px; text-align: center; color: var(--color-text-secondary); font-size: var(--font-size-xs); background: var(--color-bg-muted); border-radius: var(--radius-md);">
          🐾 No hay ${tipoOpuestoTexto} activas en ${reporteActual.ciudad} en este momento.
        </div>
      `;
      return;
    }

    listaContainer.innerHTML = items.map(c => `
      <div style="display: flex; gap: 10px; align-items: center; background: var(--color-bg-card); border: 1px solid var(--color-border); padding: 8px 10px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
        <img src="${c.fotoUrl}" alt="${c.nombre || 'Mascota'}" loading="lazy" decoding="async" style="width: 60px; height: 60px; border-radius: var(--radius-sm); object-fit: cover; flex-shrink: 0;" />
        <div style="flex: 1; font-size: var(--font-size-xs); line-height: 1.3;">
          <div style="font-weight: 700; color: var(--color-text-primary);">${c.nombre || (c.tipo === 'encontrado' ? 'Encontrada' : 'Perdida')}</div>
          <div style="color: var(--color-text-secondary);">${formatearEspecie(c.especie).icon} ${c.barrio ? `${c.barrio}, ` : ''}${c.ciudad}</div>
          <div style="color: var(--color-text-muted); font-size: 11px;">🎨 ${c.color || 'Color no especificado'}</div>
        </div>
        <button type="button" class="btn btn-primary btn-sm btn-vincular-candidato" data-target-id="${c.id}" style="padding: 6px 10px; font-size: 11px; white-space: nowrap;">
          🔗 Vincular
        </button>
      </div>
    `).join('');

    // Escuchar clics en Vincular
    document.querySelectorAll('.btn-vincular-candidato').forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-target-id');
        ejecutarVinculacion(targetId, btn);
      });
    });
  }

  // Filtrado reactivo en el buscador visual
  const inputFiltro = document.getElementById('input-filtro-match-visual');
  if (inputFiltro) {
    inputFiltro.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderListaCandidatos(candidatos);
        return;
      }
      const filtrados = candidatos.filter(c => 
        (c.nombre && c.nombre.toLowerCase().includes(q)) ||
        (c.barrio && c.barrio.toLowerCase().includes(q)) ||
        (c.color && c.color.toLowerCase().includes(q)) ||
        (c.senasVisibles && c.senasVisibles.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q))
      );
      renderListaCandidatos(filtrados);
    });
  }

  // Envío manual de ID
  const btnManual = document.getElementById('btn-enviar-match-manual');
  if (btnManual) {
    btnManual.addEventListener('click', () => {
      const inputManual = document.getElementById('input-id-manual-match');
      let targetId = inputManual ? inputManual.value.trim() : '';
      if (targetId && targetId.includes('id=')) {
        targetId = new URLSearchParams(targetId.split('?')[1]).get('id') || targetId;
      }
      if (!targetId) {
        if (errorBox) {
          errorBox.textContent = 'Ingresa el ID del otro reporte.';
          errorBox.style.display = 'block';
        }
        return;
      }
      ejecutarVinculacion(targetId, btnManual);
    });
  }

  async function ejecutarVinculacion(targetId, botonAccion) {
    if (errorBox) errorBox.style.display = 'none';
    try {
      if (botonAccion) {
        botonAccion.disabled = true;
        botonAccion.textContent = '⏳ Vinculando...';
      }
      await sugerirCoincidencia(reporteActual.id, targetId);
      alert('¡Coincidencia vinculada exitosamente! Ambos creadores podrán confirmarla o rechazarla en "Mis Reportes".');
      closeModal();
      location.reload();
    } catch (e) {
      if (errorBox) {
        errorBox.textContent = e.message;
        errorBox.style.display = 'block';
      }
      if (botonAccion) {
        botonAccion.disabled = false;
        botonAccion.textContent = '🔗 Vincular';
      }
    }
  }
}
