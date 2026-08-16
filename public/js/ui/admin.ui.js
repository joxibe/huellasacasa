/**
 * HUELLAS A CASA — Controlador UI del Panel de Administración
 * Permite al administrador revisar denuncias comunitarias, inspeccionar publicaciones,
 * descartar reportes o eliminar casos fraudulentos con liberación de recursos.
 */

import { 
  ADMIN_UID, 
  obtenerDenunciasAbuso, 
  descartarDenuncia, 
  eliminarReporteDenunciado 
} from '../services/reportes.service.js';
import { onAuthStateChanged, getCurrentUser } from '../services/auth.service.js';
import { formatoTiempoRelativo } from '../utils/formato.js';
import { mostrarModalConfirmacion } from './confirm-modal.ui.js';

export async function inicializarAdmin() {
  const container = document.getElementById('admin-container');
  if (!container) return;

  // Estado de carga inicial
  container.innerHTML = `
    <div style="padding: 40px 20px; text-align: center; color: var(--color-text-secondary);">
      <div style="font-size: 2.5rem; margin-bottom: 8px;">⏳</div>
      <p style="font-size: var(--font-size-sm); font-weight: 600;">Verificando permisos de administración...</p>
    </div>
  `;

  onAuthStateChanged(async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
      container.innerHTML = `
        <div class="ui-state-empty" style="padding: 60px 20px; text-align: center;">
          <div style="font-size: 3.5rem; margin-bottom: 12px;">🚫</div>
          <h2 style="color: #991B1B; font-size: var(--font-size-xl); font-weight: 800; margin-bottom: 8px;">
            Acceso no autorizado
          </h2>
          <p style="color: var(--color-text-secondary); max-width: 420px; margin: 0 auto 20px; font-size: var(--font-size-sm); line-height: 1.5;">
            Esta sección es de acceso restringido para la moderación comunitaria de <strong>Huellas a Casa</strong>. Si eres administrador, inicia sesión con la cuenta autorizada.
          </p>
          <a href="index.html" class="btn btn-primary btn-sm">Volver al explorador público</a>
        </div>
      `;
      return;
    }

    // Usuario es Admin legítimo -> Cargar Denuncias
    await cargarPanelDenuncias(container);
  });
}

async function cargarPanelDenuncias(container) {
  try {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--color-text-secondary);">
        <p style="font-size: var(--font-size-sm);">🛡️ Cargando denuncias de la comunidad...</p>
      </div>
    `;

    const denuncias = await obtenerDenunciasAbuso();

    if (denuncias.length === 0) {
      container.innerHTML = `
        <div class="ui-state-empty" style="padding: 50px 20px; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 10px;">🛡️ ✨</div>
          <h2 style="font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px;">
            No hay denuncias pendientes
          </h2>
          <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); max-width: 400px; margin: 0 auto 16px;">
            No existen alertas de abuso o fraude pendientes de moderación en este momento.
          </p>
          <button id="btn-refrescar-admin" class="btn btn-secondary btn-sm">🔄 Actualizar lista</button>
        </div>
      `;
      document.getElementById('btn-refrescar-admin')?.addEventListener('click', () => cargarPanelDenuncias(container));
      return;
    }

    const motivoMap = {
      spam_o_fraude: '🚨 Posible Spam o Fraude',
      datos_falsos: '⚠️ Datos o fotos falsas',
      foto_inapropiada: '🔞 Foto inapropiada',
      anuncio_duplicado: '📄 Anuncio duplicado',
      comunitario: '🚩 Alerta comunitaria',
      otro: '❓ Otro motivo'
    };

    container.innerHTML = `
      <div style="margin-bottom: var(--space-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h1 style="font-size: var(--font-size-lg); font-weight: 800; color: var(--color-text-primary);">
            🛡️ Cola de Moderación (${denuncias.length})
          </h1>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
            Revisa cada denuncia comunitaria y decide si eliminar la publicación o archivar la alerta.
          </p>
        </div>
        <button id="btn-refrescar-admin" class="btn btn-secondary btn-sm">🔄 Actualizar</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: var(--space-md);">
        ${denuncias.map(d => {
          const motivoTexto = motivoMap[d.motivo] || d.motivo || '🚩 Denuncia comunitaria';
          const fechaTexto = d.fechaCreacion ? formatoTiempoRelativo(d.fechaCreacion) : 'Fecha no registrada';

          return `
            <div class="card-denuncia" style="background: var(--color-bg-card); border: 1px solid var(--color-border); border-left: 4px solid #DC2626; border-radius: var(--radius-md); padding: var(--space-md); box-shadow: var(--shadow-sm);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                <span style="font-weight: 800; font-size: var(--font-size-sm); color: #991B1B;">
                  ${motivoTexto}
                </span>
                <span style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
                  ${fechaTexto}
                </span>
              </div>

              ${d.comentario ? `
                <div style="background: var(--color-bg-muted); padding: 10px 12px; border-radius: var(--radius-sm); font-size: var(--font-size-sm); color: var(--color-text-primary); margin-bottom: 10px; font-style: italic; border-left: 2px solid var(--color-border);">
                  "${d.comentario}"
                </div>
              ` : ''}

              <div style="display: flex; flex-direction: column; gap: 4px; font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 12px;">
                <div>
                  <strong>🆔 Reporte:</strong> <a href="detalle.html?id=${d.reporteId}" target="_blank" style="color: var(--color-primary); font-weight: 700; text-decoration: underline;">${d.reporteId}</a>
                </div>
                <div>
                  <strong>👤 Denunciante:</strong> ${d.usuarioDenuncianteEmail || d.usuarioDenuncianteUid || 'Anónimo'}
                </div>
              </div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; border-top: 1px solid var(--color-border); padding-top: 10px;">
                <a href="detalle.html?id=${d.reporteId}" target="_blank" class="btn btn-secondary btn-sm">
                  🔍 Inspeccionar publicación
                </a>
                <button type="button" class="btn btn-secondary btn-sm btn-descartar-denuncia" data-abuso-id="${d.id}">
                  ✓ Descartar alerta
                </button>
                <button type="button" class="btn btn-sm btn-eliminar-publicacion-denunciada" data-reporte-id="${d.reporteId}" data-abuso-id="${d.id}" style="background-color: #DC2626; color: #FFFFFF; border: none; font-weight: 700;">
                  🗑️ Eliminar publicación
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Listeners
    document.getElementById('btn-refrescar-admin')?.addEventListener('click', () => cargarPanelDenuncias(container));

    // Descartar denuncia
    document.querySelectorAll('.btn-descartar-denuncia').forEach(btn => {
      btn.addEventListener('click', async () => {
        const abusoId = btn.getAttribute('data-abuso-id');
        try {
          btn.disabled = true;
          btn.textContent = 'Descartando...';
          await descartarDenuncia(abusoId);
          await cargarPanelDenuncias(container);
        } catch (e) {
          alert('Error al descartar denuncia: ' + e.message);
          btn.disabled = false;
          btn.textContent = '✓ Descartar alerta';
        }
      });
    });

    // Eliminar publicación denunciada (con modal custom)
    document.querySelectorAll('.btn-eliminar-publicacion-denunciada').forEach(btn => {
      btn.addEventListener('click', () => {
        const reporteId = btn.getAttribute('data-reporte-id');
        const abusoId = btn.getAttribute('data-abuso-id');

        mostrarModalConfirmacion({
          titulo: '¿Eliminar publicación infractora?',
          mensaje: `Se borrará completamente el reporte "${reporteId}", su foto en Storage y sus subcolecciones privadas. Esta acción resolverá la denuncia.`,
          textoConfirmar: '🗑️ Eliminar definitivamente',
          textoCancelar: 'Cancelar',
          esPeligro: true,
          onConfirm: async () => {
            try {
              btn.disabled = true;
              btn.textContent = 'Eliminando...';
              await eliminarReporteDenunciado(reporteId, abusoId);
              alert(`La publicación ${reporteId} fue eliminada y la denuncia quedó resuelta.`);
              await cargarPanelDenuncias(container);
            } catch (e) {
              alert('Error al eliminar publicación: ' + e.message);
              btn.disabled = false;
              btn.textContent = '🗑️ Eliminar publicación';
            }
          }
        });
      });
    });

  } catch (err) {
    console.error('Error cargando panel de admin:', err);
    container.innerHTML = `
      <div class="ui-state-error" style="padding: 30px 20px; text-align: center;">
        <h3 style="color: #991B1B;">Error al cargar las denuncias</h3>
        <p style="font-size: var(--font-size-sm); margin-bottom: 12px;">${err.message}</p>
        <button id="btn-reintentar-admin" class="btn btn-primary btn-sm">Reintentar</button>
      </div>
    `;
    document.getElementById('btn-reintentar-admin')?.addEventListener('click', () => cargarPanelDenuncias(container));
  }
}
