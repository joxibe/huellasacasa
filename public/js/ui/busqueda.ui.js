/**
 * HUELLAS A CASA — Controlador UI de Búsqueda y Explorador
 * Gestiona chips de filtros, barra de búsqueda y los 4 estados de la UI.
 */

import { obtenerReportes } from '../services/reportes.service.js';
import { renderReporteCard } from './reporte-card.ui.js';

// Recuperar última ciudad elegida de localStorage (por defecto 'Cali')
let ciudadSeleccionada = localStorage.getItem('huellas_ciudad_seleccionada') || 'Cali';

let filtrosActuales = {
  ciudad: ciudadSeleccionada,
  barrioTexto: '',
  tipo: 'todos',
  especie: 'todos',
  texto: ''
};

export async function inicializarBusqueda() {
  const container = document.getElementById('reportes-feed-container');
  const searchInput = document.getElementById('input-busqueda-texto');
  const selectCiudadHeader = document.getElementById('select-ciudad-header');
  const inputCiudadPersonalizada = document.getElementById('input-ciudad-personalizada-header');

  // Inicializar Selector de Ciudad en el Header
  if (selectCiudadHeader) {
    // Si la ciudad guardada no está en las opciones estándar, marcar __otra__
    const opcionesExistentes = Array.from(selectCiudadHeader.options).map(o => o.value);
    if (!opcionesExistentes.includes(ciudadSeleccionada) && ciudadSeleccionada) {
      selectCiudadHeader.value = '__otra__';
      if (inputCiudadPersonalizada) {
        inputCiudadPersonalizada.style.display = 'inline-block';
        inputCiudadPersonalizada.value = ciudadSeleccionada;
      }
    } else {
      selectCiudadHeader.value = ciudadSeleccionada;
    }

    selectCiudadHeader.addEventListener('change', (e) => {
      if (e.target.value === '__otra__') {
        if (inputCiudadPersonalizada) {
          inputCiudadPersonalizada.style.display = 'inline-block';
          inputCiudadPersonalizada.focus();
        }
      } else {
        if (inputCiudadPersonalizada) {
          inputCiudadPersonalizada.style.display = 'none';
          inputCiudadPersonalizada.value = '';
        }
        ciudadSeleccionada = e.target.value;
        localStorage.setItem('huellas_ciudad_seleccionada', ciudadSeleccionada);
        filtrosActuales.ciudad = ciudadSeleccionada;
        ejecutarBusqueda();
      }
    });
  }

  if (inputCiudadPersonalizada) {
    let timerCiudad;
    inputCiudadPersonalizada.addEventListener('input', (e) => {
      clearTimeout(timerCiudad);
      timerCiudad = setTimeout(() => {
        const val = e.target.value.trim();
        if (val) {
          ciudadSeleccionada = val;
          localStorage.setItem('huellas_ciudad_seleccionada', ciudadSeleccionada);
          filtrosActuales.ciudad = ciudadSeleccionada;
          ejecutarBusqueda();
        }
      }, 300);
    });
  }

  // Inicializar Chips de Tipo
  const chipsTipo = document.querySelectorAll('[data-filter-tipo]');
  chipsTipo.forEach(chip => {
    chip.addEventListener('click', () => {
      chipsTipo.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filtrosActuales.tipo = chip.getAttribute('data-filter-tipo');
      ejecutarBusqueda();
    });
  });

  // Inicializar Chips de Especie
  const chipsEspecie = document.querySelectorAll('[data-filter-especie]');
  chipsEspecie.forEach(chip => {
    chip.addEventListener('click', () => {
      chipsEspecie.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filtrosActuales.especie = chip.getAttribute('data-filter-especie');
      ejecutarBusqueda();
    });
  });

  // Búsqueda en vivo por barrio / texto con debounce
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        filtrosActuales.barrioTexto = e.target.value;
        filtrosActuales.texto = e.target.value;
        ejecutarBusqueda();
      }, 250);
    });
  }

  // Carga inicial
  await ejecutarBusqueda();
}

/**
 * Ejecuta la consulta de reportes y maneja los 4 Estados UI
 */
export async function ejecutarBusqueda() {
  const container = document.getElementById('reportes-feed-container');
  if (!container) return;

  // Estado 1: Cargando (Skeleton Screen)
  container.innerHTML = `
    <div class="skeleton-card">
      <div class="skeleton-box skeleton-image"></div>
      <div class="skeleton-box skeleton-title"></div>
      <div class="skeleton-box skeleton-text"></div>
    </div>
    <div class="skeleton-card" style="margin-top: 12px;">
      <div class="skeleton-box skeleton-image"></div>
      <div class="skeleton-box skeleton-title"></div>
      <div class="skeleton-box skeleton-text"></div>
    </div>
  `;

  try {
    const reportes = await obtenerReportes(filtrosActuales);

    // Estado 2: Vacío
    if (!reportes || reportes.length === 0) {
      container.innerHTML = `
        <div class="ui-state-empty">
          <div class="ui-state-icon">🔍 🐾</div>
          <h3 class="ui-state-title">No hay reportes en ${filtrosActuales.ciudad}</h3>
          <p class="ui-state-desc">
            No encontramos mascotas con estos filtros en ${filtrosActuales.ciudad}. Prueba buscando en otra ciudad, cambiando la especie o limpiando el filtro de barrio.
          </p>
          <button id="btn-limpiar-filtros" class="btn btn-secondary btn-sm" style="margin-top: 8px;">
            Ver todos los de ${filtrosActuales.ciudad}
          </button>
        </div>
      `;

      const btnLimpiar = document.getElementById('btn-limpiar-filtros');
      if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
          filtrosActuales.barrioTexto = '';
          filtrosActuales.texto = '';
          filtrosActuales.tipo = 'todos';
          filtrosActuales.especie = 'todos';
          document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          const defaultTipo = document.querySelector('[data-filter-tipo="todos"]');
          const defaultEspecie = document.querySelector('[data-filter-especie="todos"]');
          if (defaultTipo) defaultTipo.classList.add('active');
          if (defaultEspecie) defaultEspecie.classList.add('active');
          if (document.getElementById('input-busqueda-texto')) {
            document.getElementById('input-busqueda-texto').value = '';
          }
          ejecutarBusqueda();
        });
      }
      return;
    }

    // Estado 4: Éxito (Render de tarjetas)
    container.innerHTML = `
      <div class="pet-cards-grid">
        ${reportes.map(r => renderReporteCard(r)).join('')}
      </div>
    `;

  } catch (error) {
    // Estado 3: Error
    console.error('Error al cargar reportes:', error);
    container.innerHTML = `
      <div class="ui-state-error">
        <div class="ui-state-icon">⚠️</div>
        <h3 class="ui-state-title">Error al cargar la información</h3>
        <p class="ui-state-desc">
          La conexión a internet en Cali puede estar inestable tras el terremoto.
        </p>
        <button id="btn-reintentar-busqueda" class="btn btn-primary btn-sm" style="margin-top: 8px; width: auto;">
          🔄 Reintentar
        </button>
      </div>
    `;

    const btnReintentar = document.getElementById('btn-reintentar-busqueda');
    if (btnReintentar) {
      btnReintentar.addEventListener('click', ejecutarBusqueda);
    }
  }
}
