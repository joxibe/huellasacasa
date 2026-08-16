/**
 * HUELLAS A CASA — Punto de Entrada de la Aplicación
 * Conecta UI, servicios y gestión reactiva de la sesión.
 */

import { onAuthStateChanged, logout, getCurrentUser } from './services/auth.service.js';
import { exigirAutenticacion } from './ui/auth-modal.ui.js';
import { ADMIN_UID } from './services/reportes.service.js';

export function inicializarAppGlobal() {
  // Sincronizar Header con estado de usuario
  const userBtn = document.getElementById('user-header-btn');

  onAuthStateChanged((user) => {
    if (user && userBtn) {
      const esAdmin = user.uid === ADMIN_UID;
      userBtn.innerHTML = `
        <div style="position: relative; display: inline-flex; align-items: center;">
          <img src="${user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" 
               alt="${user.displayName || 'Usuario'}" 
               class="user-avatar-img" 
               title="Mi cuenta: ${user.displayName || 'Usuario'}"
          />
          ${esAdmin ? `<span style="position: absolute; bottom: -2px; right: -2px; font-size: 10px; background: #DC2626; color: white; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border: 1.5px solid white;">★</span>` : ''}
        </div>
      `;

      userBtn.onclick = () => {
        mostrarMenuUsuario(user, esAdmin);
      };
    } else if (userBtn) {
      userBtn.innerHTML = `
        <span class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.75rem; white-space: nowrap; line-height: 1.2;">
          Ingresar
        </span>
      `;
      userBtn.onclick = () => {
        exigirAutenticacion(() => {
          location.reload();
        });
      };
    }
  });

  // Marcar enlace activo en Bottom Navigation y Desktop Nav (compatible con Clean URLs)
  const pathClean = window.location.pathname.split('/').filter(Boolean).pop() || 'index';
  const rutaActual = pathClean.replace('.html', '');

  document.querySelectorAll('.bottom-nav .nav-item, .desktop-nav-links .desktop-nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').replace('.html', '').replace('./', '').replace('/', '');
    const hrefClean = href || 'index';

    if (hrefClean === rutaActual || (rutaActual === 'index' && hrefClean === 'index')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function mostrarMenuUsuario(user, esAdmin) {
  // Eliminar menú previo si existiera
  document.getElementById('modal-menu-usuario')?.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-menu-usuario';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 16px;
  `;

  modal.innerHTML = `
    <div style="background: var(--color-bg-card); border-radius: var(--radius-xl); max-width: 360px; width: 100%; padding: var(--space-lg); box-shadow: var(--shadow-modal); border: 1px solid var(--color-border);">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: var(--space-md); padding-bottom: var(--space-sm); border-bottom: 1px solid var(--color-border);">
        <img src="${user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" 
             alt="${user.displayName || 'Usuario'}" 
             style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary-light);" 
        />
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; font-size: var(--font-size-base); color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${user.displayName || 'Usuario'}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${user.email || ''}
          </div>
          ${esAdmin ? `
            <span style="display: inline-block; background: #FEE2E2; color: #991B1B; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-top: 3px;">
              🛡️ Modo Administrador
            </span>
          ` : ''}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${esAdmin ? `
          <a href="admin.html" class="btn btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; background-color: #DC2626; border-color: #DC2626; text-decoration: none;">
            🛡️ Ir al Panel de Moderación
          </a>
        ` : ''}

        <a href="mis-reportes.html" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; text-decoration: none;">
          📂 Mis Reportes y Cupos
        </a>

        <a href="publicar.html" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; text-decoration: none;">
          ➕ Publicar Mascota
        </a>

        <hr style="border: none; border-top: 1px solid var(--color-border); margin: 4px 0;" />

        <button id="btn-usuario-cerrar-sesion" class="btn btn-secondary" style="color: #DC2626; border-color: #FCA5A5; font-weight: 600;">
          🚪 Cerrar Sesión
        </button>

        <button id="btn-usuario-cerrar-modal" class="btn btn-secondary btn-sm" style="margin-top: 2px;">
          ✕ Cerrar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Cerrar al hacer clic afuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.getElementById('btn-usuario-cerrar-modal')?.addEventListener('click', () => {
    modal.remove();
  });

  document.getElementById('btn-usuario-cerrar-sesion')?.addEventListener('click', async () => {
    modal.remove();
    await logout();
    location.reload();
  });
}

// Auto-inicializar cuando cargue el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAppGlobal);
} else {
  inicializarAppGlobal();
}
