/**
 * HUELLAS A CASA — Componente UI: Tarjeta de Mascota (Pet Card)
 * Renderiza la tarjeta de mascota cumpliendo con el Theme System de 6 colores.
 */

import { formatoTiempoRelativo, formatearEspecie, formatearEstado } from '../utils/formato.js';

/**
 * Renderiza el HTML de una tarjeta de mascota
 * @param {Object} reporte 
 * @returns {string} HTML string
 */
export function renderReporteCard(reporte) {
  const tiempo = formatoTiempoRelativo(reporte.fechaCreacion);
  const infoEspecie = formatearEspecie(reporte.especie);
  const estadoLabel = formatearEstado(reporte.estado);
  const nombreDisplay = reporte.nombre || (reporte.tipo === 'encontrado' ? 'Mascota Encontrada' : 'Mascota Perdida');

  const tamanoMap = {
    pequeno: 'Pequeño',
    mediano: 'Mediano',
    grande: 'Grande'
  };
  const tamanoLabel = tamanoMap[reporte.tamano] || 'Mediano';

  const sexoMap = {
    macho: 'Macho',
    hembra: 'Hembra',
    no_se: 'Sexo desconocido'
  };
  const sexoLabel = sexoMap[reporte.sexo] || 'Macho';

  // Badges y alertas
  const vetBadge = reporte.necesitaVet ? `<span class="pet-card-urgent-pill">🚨 Requiere Vet</span>` : '';

  return `
    <article class="pet-card" id="card-${reporte.id}">
      <a href="detalle.html?id=${reporte.id}" style="display: block; text-decoration: none; color: inherit;">
        <div class="pet-card-image-wrapper">
          <img 
            src="${reporte.fotoUrl}" 
            alt="${nombreDisplay} - ${infoEspecie.label}" 
            class="pet-card-img" 
            loading="lazy"
          />
          <div class="pet-card-status-badge">
            <span class="badge-status" data-status="${reporte.estado}">${estadoLabel}</span>
          </div>
          ${vetBadge}
        </div>

        <div class="pet-card-content">
          <div class="pet-card-header">
            <h3 class="pet-card-name">${nombreDisplay}</h3>
            <span class="pet-card-time">${tiempo}</span>
          </div>

          <div class="pet-card-tags">
            <span class="pet-pill">${infoEspecie.icon} ${infoEspecie.label}</span>
            <span class="pet-pill">📏 ${tamanoLabel}</span>
            <span class="pet-pill">${sexoLabel}</span>
          </div>

          <div class="pet-card-location">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span>${reporte.barrio ? `${reporte.barrio}, ` : ''}${reporte.ciudad}</span>
          </div>

          ${reporte.senasVisibles ? `<p class="pet-card-details">${reporte.senasVisibles}</p>` : ''}
          <div style="margin-top: 6px; font-size: 11px; color: var(--color-text-muted); font-family: monospace;">
            🆔 ${reporte.id}
          </div>
        </div>
      </a>
    </article>
  `;
}
