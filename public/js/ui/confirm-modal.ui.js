/**
 * HUELLAS A CASA — Modal de Confirmación Personalizado
 * Reemplaza los confirm() nativos del navegador por un modal consistente con el theme system.
 */

export function mostrarModalConfirmacion({
  titulo = '¿Eliminar reporte?',
  mensaje = 'Se borrarán sus datos y foto, y se liberará tu cupo de publicación. Esta acción no se puede deshacer.',
  textoConfirmar = '🗑️ Eliminar',
  textoCancelar = 'Cancelar',
  esPeligro = true,
  onConfirm = () => {}
}) {
  const modalHtml = `
    <div id="modal-confirmacion-custom" class="modal-overlay open">
      <div class="modal-sheet" style="max-width: 420px; padding: var(--space-lg);">
        <div class="modal-handle"></div>
        <div style="text-align: center; margin-bottom: var(--space-md);">
          <div style="font-size: 2.5rem; margin-bottom: 6px;">${esPeligro ? '⚠️' : '❓'}</div>
          <h3 style="font-size: var(--font-size-lg); font-weight: 800; color: ${esPeligro ? '#991B1B' : 'var(--color-text-primary)'}; margin-bottom: 6px;">
            ${titulo}
          </h3>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: 1.4;">
            ${mensaje}
          </p>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: var(--space-md);">
          <button type="button" id="btn-modal-cancelar" class="btn btn-secondary btn-sm" style="flex: 1; padding: 10px;">
            ${textoCancelar}
          </button>
          <button type="button" id="btn-modal-confirmar" class="btn btn-sm" style="flex: 1; padding: 10px; background-color: ${esPeligro ? '#DC2626' : 'var(--color-primary)'}; color: #FFFFFF; border: none; font-weight: 700;">
            ${textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  `;

  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = modalHtml;
  document.body.appendChild(modalWrapper);

  const closeModal = () => modalWrapper.remove();

  document.getElementById('btn-modal-cancelar').addEventListener('click', closeModal);
  const overlay = document.getElementById('modal-confirmacion-custom');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.getElementById('btn-modal-confirmar').addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}
