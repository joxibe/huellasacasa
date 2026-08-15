/**
 * HUELLAS A CASA — Modal / Prompt de Autenticación
 * Provee una pantalla/modal clara y amigable cuando una acción requiere Google Auth.
 */

import { loginWithGoogle, isAuthenticated } from '../services/auth.service.js';

let modalOverlayElement = null;

function asegurarModalEnDOM() {
  if (modalOverlayElement) return modalOverlayElement;

  const html = `
    <div id="auth-required-modal" class="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <h3 class="modal-title">Identificación requerida</h3>
          <button type="button" class="modal-close-btn" id="btn-close-auth-modal">&times;</button>
        </div>
        <div style="text-align: center; padding: 10px 0 20px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🐾 🔒</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">Protegiendo a las mascotas de Cali</h4>
          <p style="font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.4; margin-bottom: 20px;">
            Para contactar a un publicador o crear un reporte, inicia sesión con tu cuenta de Google. Esto previene fraudes y protege la información de contacto.
          </p>
          <button id="btn-modal-google-login" class="btn btn-primary" style="margin-bottom: 10px;">
            <svg style="width: 20px; height: 20px; margin-right: 6px;" viewBox="0 0 24 24">
              <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continuar con Google
          </button>
          <button id="btn-modal-cancel" class="btn btn-secondary btn-sm" style="width: 100%;">
            Volver a explorar
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  modalOverlayElement = document.getElementById('auth-required-modal');

  const btnClose = document.getElementById('btn-close-auth-modal');
  const btnCancel = document.getElementById('btn-modal-cancel');
  const btnLogin = document.getElementById('btn-modal-google-login');

  const cerrar = () => modalOverlayElement.classList.remove('open');
  btnClose.addEventListener('click', cerrar);
  btnCancel.addEventListener('click', cerrar);

  btnLogin.addEventListener('click', async () => {
    try {
      btnLogin.disabled = true;
      btnLogin.textContent = 'Iniciando sesión...';
      await loginWithGoogle();
      cerrar();
      if (window.__pendingAuthCallback) {
        const cb = window.__pendingAuthCallback;
        window.__pendingAuthCallback = null;
        cb();
      }
    } catch (e) {
      alert('Error al iniciar sesión con Google: ' + e.message);
    } finally {
      btnLogin.disabled = false;
      btnLogin.innerHTML = 'Continuar con Google';
    }
  });

  return modalOverlayElement;
}

/**
 * Muestra el modal de autenticación si no hay sesión activa.
 * Si ya está autenticado, ejecuta el callback de inmediato.
 * @param {Function} onSuccessCallback 
 */
export function exigirAutenticacion(onSuccessCallback) {
  if (isAuthenticated()) {
    if (onSuccessCallback) onSuccessCallback();
    return true;
  }

  window.__pendingAuthCallback = onSuccessCallback;
  const modal = asegurarModalEnDOM();
  modal.classList.add('open');
  return false;
}
