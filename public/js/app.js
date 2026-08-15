/**
 * HUELLAS A CASA — Punto de Entrada de la Aplicación
 * Conecta UI, servicios y gestión reactiva de la sesión.
 */

import { onAuthStateChanged, logout, getCurrentUser } from './services/auth.service.js';
import { exigirAutenticacion } from './ui/auth-modal.ui.js';

export function inicializarAppGlobal() {
  // Sincronizar Header con estado de usuario
  const userBtn = document.getElementById('user-header-btn');
  const userDisplay = document.getElementById('user-header-display');

  onAuthStateChanged((user) => {
    if (user && userBtn) {
      userBtn.innerHTML = `
        <img src="${user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" 
             alt="${user.displayName || 'Usuario'}" 
             class="user-avatar-img" 
             title="Sesión activa: ${user.displayName || 'Usuario'} (Clic para salir)"
        />
      `;
      userBtn.onclick = () => {
        if (confirm(`¿Deseas cerrar la sesión de ${user.displayName || 'tu cuenta'}?`)) {
          logout();
          location.reload();
        }
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

  // Marcar enlace activo en Bottom Navigation
  const rutaActual = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.bottom-nav .nav-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href === rutaActual || (rutaActual === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Auto-inicializar cuando cargue el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAppGlobal);
} else {
  inicializarAppGlobal();
}
