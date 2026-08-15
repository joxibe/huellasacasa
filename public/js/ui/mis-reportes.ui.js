import { obtenerMisReportes, obtenerReportePorId, cambiarAEnAdopcion, responderCoincidencia, marcarComoReunido, marcarComoAdoptado, obtenerSenaPrivada, obtenerCuotasUsuario } from '../services/reportes.service.js';
import { getCurrentUser, loginWithGoogle } from '../services/auth.service.js';
import { formatoTiempoRelativo, formatearEstado, formatearEspecie } from '../utils/formato.js';

export async function inicializarMisReportes() {
  const container = document.getElementById('mis-reportes-container');
  const user = getCurrentUser();

  // Caso: Usuario sin sesión -> Mostrar tarjeta clara de login (nunca pantalla vacía)
  if (!user) {
    container.innerHTML = `
      <div class="ui-state-empty" style="border: none; background: var(--color-bg-card); box-shadow: var(--shadow-sm);">
        <div style="font-size: 3rem; margin-bottom: 8px;">🔐 🐾</div>
        <h2 class="ui-state-title">Inicia sesión para ver tus reportes</h2>
        <p class="ui-state-desc">
          Para gestionar tus mascotas publicadas, confirmar coincidencias o consultar tus señas de verificación secretas, accede con tu cuenta de Google.
        </p>
        <button id="btn-login-mis-reportes" class="btn btn-primary" style="margin-top: 12px; max-width: 260px;">
          Continuar con Google
        </button>
      </div>
    `;

    document.getElementById('btn-login-mis-reportes').addEventListener('click', async () => {
      try {
        await loginWithGoogle();
        inicializarMisReportes();
      } catch (e) {
        alert('Error al iniciar sesión: ' + e.message);
      }
    });
    return;
  }

  // Usuario autenticado -> Cargar cuotas y sus reportes
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md);">
      <div>
        <h1 style="font-size: var(--font-size-lg); font-weight: 700;">Mis Reportes</h1>
        <p style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">${user.displayName || 'Usuario'} (${user.email})</p>
      </div>
      <a href="publicar.html" class="btn btn-primary btn-sm">+ Publicar</a>
    </div>
    <div id="box-cuotas-usuario"></div>
    <div id="lista-mis-reportes">
      <div class="skeleton-card">
        <div class="skeleton-box skeleton-title"></div>
        <div class="skeleton-box skeleton-text"></div>
      </div>
    </div>
  `;

  try {
    const [reportes, cuotas] = await Promise.all([
      obtenerMisReportes(user.uid),
      obtenerCuotasUsuario(user.uid)
    ]);

    // Renderizar bloque visual de cuotas diferenciadas
    const boxCuotas = document.getElementById('box-cuotas-usuario');
    if (boxCuotas) {
      boxCuotas.innerHTML = `
        <div style="background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-md); margin-bottom: var(--space-md); box-shadow: var(--shadow-sm);">
          <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-primary); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span>📊</span> Mis cupos de publicación activos
            </div>
            <span style="font-size: 11px; font-weight: 600; color: var(--color-text-secondary); background: var(--color-bg-muted); padding: 2px 8px; border-radius: var(--radius-sm);">
              Total: ${cuotas.totalActivos} / ${cuotas.limiteTotal}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div style="background: var(--color-bg-muted); padding: 8px 10px; border-radius: var(--radius-md);">
              <div style="font-size: 11px; color: var(--color-text-secondary); font-weight: 600;">🔴 Perdidas</div>
              <div style="font-size: var(--font-size-base); font-weight: 800; color: ${cuotas.perdidosActivos >= cuotas.limitePerdidos ? 'var(--status-perdido-color)' : 'var(--color-text-primary)'};">
                ${cuotas.perdidosActivos} / ${cuotas.limitePerdidos}
              </div>
              <div style="font-size: 10px; color: var(--color-text-muted);">${cuotas.limitePerdidos - cuotas.perdidosActivos > 0 ? `${cuotas.limitePerdidos - cuotas.perdidosActivos} libre(s)` : 'Completo'}</div>
            </div>
            <div style="background: var(--color-bg-muted); padding: 8px 10px; border-radius: var(--radius-md);">
              <div style="font-size: 11px; color: var(--color-text-secondary); font-weight: 600;">🔵 Encontradas</div>
              <div style="font-size: var(--font-size-base); font-weight: 800; color: ${cuotas.encontradosActivos >= cuotas.limiteEncontrados ? 'var(--status-encontrado-color)' : 'var(--color-text-primary)'};">
                ${cuotas.encontradosActivos} / ${cuotas.limiteEncontrados}
              </div>
              <div style="font-size: 10px; color: var(--color-text-muted);">${cuotas.limiteEncontrados - cuotas.encontradosActivos > 0 ? `${cuotas.limiteEncontrados - cuotas.encontradosActivos} libre(s)` : 'Completo'}</div>
            </div>
            <div style="background: var(--color-bg-muted); padding: 8px 10px; border-radius: var(--radius-md);">
              <div style="font-size: 11px; color: var(--color-text-secondary); font-weight: 600;">💜 En Adopción</div>
              <div style="font-size: var(--font-size-base); font-weight: 800; color: ${cuotas.adopcionActivos >= cuotas.limiteAdopcion ? 'var(--status-adopcion-color)' : 'var(--color-text-primary)'};">
                ${cuotas.adopcionActivos} / ${cuotas.limiteAdopcion}
              </div>
              <div style="font-size: 10px; color: var(--color-text-muted);">${cuotas.limiteAdopcion - cuotas.adopcionActivos > 0 ? `${cuotas.limiteAdopcion - cuotas.adopcionActivos} libre(s)` : 'Completo'}</div>
            </div>
          </div>
          <div style="font-size: 11px; color: var(--color-text-secondary); line-height: 1.4; background: #FFFBEB; border: 1px solid #FDE68A; padding: 6px 10px; border-radius: var(--radius-sm);">
            ℹ️ <strong>¿Por qué hay límites?</strong> Máximo 3 por categoría (hasta 9 en total). Al cerrar un caso exitosamente (Reunido o Adoptado), el cupo se libera de forma automática.
          </div>
        </div>
      `;
    }

    const listaContainer = document.getElementById('lista-mis-reportes');

    if (!reportes || reportes.length === 0) {
      listaContainer.innerHTML = `
        <div class="ui-state-empty">
          <div class="ui-state-icon">📋</div>
          <h3 class="ui-state-title">Aún no has creado reportes</h3>
          <p class="ui-state-desc">Cuando publiques una mascota perdida o encontrada, aparecerá aquí para que puedas gestionarla y validar coincidencias.</p>
          <a href="publicar.html" class="btn btn-primary btn-sm" style="margin-top: 8px;">Publicar mi primer reporte</a>
        </div>
      `;
      return;
    }

    // Renderizar cada reporte con su información de coincidencia si existe
    const htmlCards = await Promise.all(reportes.map(r => renderMiReporteItemAsync(r, user.uid)));
    listaContainer.innerHTML = htmlCards.join('');
    vincularAccionesMisReportes(reportes);

  } catch (err) {
    console.error('Error cargando mis reportes:', err);
    container.innerHTML = `
      <div class="ui-state-error">
        <h3 class="ui-state-title">Error al cargar tus reportes</h3>
        <button onclick="location.reload()" class="btn btn-primary btn-sm">Reintentar</button>
      </div>
    `;
  }
}

async function renderMiReporteItemAsync(reporte, userUid) {
  const tiempo = formatoTiempoRelativo(reporte.fechaCreacion);
  const estadoLabel = formatearEstado(reporte.estado);
  const infoEspecie = formatearEspecie(reporte.especie);
  const diasTranscurridos = Math.floor((Date.now() - new Date(reporte.fechaCreacion).getTime()) / (1000 * 3600 * 24));
  const puedePasarAAdopcion = reporte.tipo === 'encontrado' && reporte.estado === 'encontrado' && diasTranscurridos >= 20;

  // Notificación de coincidencia pendiente con comparación
  let bannerCoincidencia = '';
  if (reporte.estado === 'coincidencia_sugerida' && reporte.coincidenciaConReporteId) {
    const contraparte = await obtenerReportePorId(reporte.coincidenciaConReporteId);
    const contraInfo = contraparte ? `
      <div style="display: flex; gap: 10px; align-items: center; background: #FFFFFF; padding: 8px; border-radius: var(--radius-sm); margin: 8px 0;">
        <img src="${contraparte.fotoUrl}" style="width: 54px; height: 54px; border-radius: var(--radius-xs); object-fit: cover;" />
        <div style="font-size: var(--font-size-xs); line-height: 1.3;">
          <strong>${contraparte.nombre || 'Mascota'}</strong> (${formatearEspecie(contraparte.especie).label})<br/>
          📍 ${contraparte.barrio ? `${contraparte.barrio}, ` : ''}${contraparte.ciudad}<br/>
          🎨 ${contraparte.color}<br/>
          🆔 <code>${contraparte.id}</code>
        </div>
      </div>
    ` : `<p style="font-size: var(--font-size-xs);">Cargando reporte vinculado...</p>`;

    bannerCoincidencia = `
      <div style="background-color: var(--status-coincidencia-bg); border: 1px solid var(--status-coincidencia-border); border-radius: var(--radius-md); padding: var(--space-sm); margin-top: var(--space-xs);">
        <div style="font-size: var(--font-size-xs); font-weight: 700; color: var(--status-coincidencia-color); display: flex; align-items: center; gap: 4px;">
          ⚠️ Sugerencia de coincidencia para validar
        </div>
        <p style="font-size: var(--font-size-xs); color: #78350F; margin-top: 2px;">
          Compara los datos con este caso vinculado:
        </p>
        ${contraInfo}
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm btn-confirmar-match" data-id="${reporte.id}">
            ✓ Sí, confirmo que es la misma
          </button>
          <button class="btn btn-secondary btn-sm btn-rechazar-match" data-id="${reporte.id}">
            ✕ No coincide
          </button>
          ${contraparte ? `<a href="detalle.html?id=${contraparte.id}" target="_blank" class="btn btn-secondary btn-sm" style="width: auto;">🔍 Ver caso completo</a>` : ''}
        </div>
      </div>
    `;
  } else if (reporte.estado === 'confirmado_ambas_partes') {
    bannerCoincidencia = `
      <div style="background-color: var(--status-confirmado-bg); border: 1px solid var(--status-confirmado-border); border-radius: var(--radius-md); padding: var(--space-sm); margin-top: var(--space-xs);">
        <div style="font-size: var(--font-size-xs); font-weight: 700; color: var(--status-confirmado-color); margin-bottom: 4px;">
          🎉 ¡Coincidencia validada por ambas partes!
        </div>
        <p style="font-size: var(--font-size-xs); color: #3730A3; margin-bottom: 8px;">
          Ambas cuentas confirmaron la coincidencia. Una vez la mascota haya sido entregada o regresada a casa con su familia, pulsa para cerrar el caso y liberar tu cupo.
        </p>
        <button class="btn btn-primary btn-sm btn-marcar-reunido" data-id="${reporte.id}" style="background-color: var(--status-reunido-color);">
          🐾 Marcar como Reunido (Cerrar caso)
        </button>
      </div>
    `;
  }

  return `
    <div class="pet-card" style="margin-bottom: var(--space-md); padding: var(--space-md);" id="item-${reporte.id}">
      <div style="display: flex; gap: var(--space-sm);">
        <img src="${reporte.fotoUrl}" style="width: 80px; height: 80px; border-radius: var(--radius-md); object-fit: cover; flex-shrink: 0;" />
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: baseline; justify-content: space-between;">
              <h3 style="font-size: var(--font-size-base); font-weight: 700;">${reporte.nombre || 'Mascota'}</h3>
              <span style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">${tiempo}</span>
            </div>
            <div style="margin-top: 4px;">
              <span class="badge-status" data-status="${reporte.estado}">${estadoLabel}</span>
            </div>
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
            ${infoEspecie.icon} ${reporte.barrio ? `${reporte.barrio}, ` : ''}${reporte.ciudad}
            <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 2px; font-family: monospace;">
              🆔 ID: <strong>${reporte.id}</strong>
            </div>
          </div>
        </div>
      </div>

      ${bannerCoincidencia}

      <!-- Contenedor desplegable de Seña Secreta Privada -->
      <div id="box-sena-privada-${reporte.id}" style="display: none; background-color: #FFFBEB; border: 1px dashed #FDE68A; padding: 8px 12px; border-radius: var(--radius-sm); margin-top: 8px; font-size: var(--font-size-xs); color: #92400E;">
        <strong>🔒 Tu seña de verificación secreta:</strong>
        <span id="texto-sena-${reporte.id}">Cargando...</span>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: var(--space-sm); border-top: 1px solid var(--color-border); padding-top: var(--space-xs);">
        <a href="detalle.html?id=${reporte.id}" class="btn btn-secondary btn-sm">Ver publicación</a>
        
        <button class="btn btn-secondary btn-sm btn-ver-sena" data-id="${reporte.id}">
          🔒 Ver mi seña secreta
        </button>

        ${reporte.estado === 'perdido' ? `
          <button class="btn btn-secondary btn-sm btn-marcar-reunido" data-id="${reporte.id}" style="color: var(--status-reunido-color); border-color: var(--status-reunido-border); font-weight: 600;">
            🐾 Ya regresó a casa (Cerrar caso)
          </button>
        ` : ''}

        ${puedePasarAAdopcion ? `
          <button class="btn btn-secondary btn-sm btn-pasar-adopcion" data-id="${reporte.id}" style="color: var(--status-adopcion-color); border-color: var(--status-adopcion-border);">
            💜 Cambiar a En Adopción
          </button>
        ` : ''}

        ${reporte.estado === 'en_adopcion' ? `
          <button class="btn btn-secondary btn-sm btn-marcar-adoptado" data-id="${reporte.id}" style="color: var(--status-adoptado-color); border-color: var(--status-adoptado-border); font-weight: 700;">
            💚 Marcar como Adoptado
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function vincularAccionesMisReportes(reportes) {
  // Ver seña secreta privada
  document.querySelectorAll('.btn-ver-sena').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const box = document.getElementById(`box-sena-privada-${id}`);
      const texto = document.getElementById(`texto-sena-${id}`);

      if (box.style.display === 'none') {
        box.style.display = 'block';
        btn.textContent = '🔒 Ocultar seña secreta';
        try {
          const sena = await obtenerSenaPrivada(id);
          texto.textContent = sena;
        } catch (e) {
          texto.textContent = 'Error al consultar: ' + e.message;
        }
      } else {
        box.style.display = 'none';
        btn.textContent = '🔒 Ver mi seña secreta';
      }
    });
  });

  // Confirmar Coincidencia Bilateral
  document.querySelectorAll('.btn-confirmar-match').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      try {
        await responderCoincidencia(id, true);
        alert('Has confirmado la coincidencia. Si la otra persona también la confirmó, el caso quedará listo para marcarse como Reunido.');
        inicializarMisReportes();
      } catch (e) {
        alert('Error: ' + e.message);
      }
    });
  });

  // Rechazar / Desvincular Coincidencia
  document.querySelectorAll('.btn-rechazar-match').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('¿Confirmas que NO es la misma mascota? Ambos reportes se desvincularán y volverán a su estado anterior.')) {
        try {
          await responderCoincidencia(id, false);
          alert('Coincidencia rechazada. Los reportes volvieron a su estado normal.');
          inicializarMisReportes();
        } catch (e) {
          alert('Error: ' + e.message);
        }
      }
    });
  });

  // Marcar como Reunido (solo tras confirmación bilateral)
  document.querySelectorAll('.btn-marcar-reunido').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('¿Confirmas que la mascota ya está a salvo con su dueño? Ambos casos vinculados se cerrarán con éxito como Reunido 🎉 y se liberarán los cupos.')) {
        try {
          await marcarComoReunido(id);
          alert('¡Qué gran noticia! El caso ha sido cerrado como Reunido 🎉');
          inicializarMisReportes();
        } catch (e) {
          alert('Error: ' + e.message);
        }
      }
    });
  });

  // Marcar como Adoptado (para casos en adopción)
  document.querySelectorAll('.btn-marcar-adoptado').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('¿Confirmas que esta mascota ya fue adoptada y entregada a su nueva familia? El caso se cerrará con éxito como Adoptado 💚 y se liberará tu cupo.')) {
        try {
          await marcarComoAdoptado(id);
          alert('¡Felicitaciones! El caso ha sido cerrado como Adoptado 💚');
          inicializarMisReportes();
        } catch (e) {
          alert('Error: ' + e.message);
        }
      }
    });
  });

  // Pasar a Adopción
  document.querySelectorAll('.btn-pasar-adopcion').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('¿Deseas cambiar el estado a "En adopción" para buscarle un nuevo hogar definitivo?')) {
        try {
          await cambiarAEnAdopcion(id);
          alert('Estado actualizado a "En adopción".');
          inicializarMisReportes();
        } catch (e) {
          alert('Error: ' + e.message);
        }
      }
    });
  });
}
