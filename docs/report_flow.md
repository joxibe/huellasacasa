# Flujo de Estados, Coincidencias y Ciclo de Vida — Huellas a Casa

Este documento define la máquina de estados de un reporte, las reglas de transición, el buscador visual de coincidencias y el ciclo de vida completo (incluyendo eliminación y liberación de cupos).

---

## 📊 1. Tabla de Estados

| Estado | Tipo / Rol | Descripción | Transición Siguiente Permitida |
|---|---|---|---|
| `perdido` | Activo | Dueño buscando a su mascota extraviada. | `coincidencia_sugerida`, `reunido` (cierre directo si no hay match pendiente), `eliminado` |
| `encontrado` | Activo | Rescatista o ciudadano que tiene/vio a la mascota. | `coincidencia_sugerida`, `en_adopcion` (tras 20+ días), `reunido` (cierre directo si no hay match pendiente), `eliminado` |
| `coincidencia_sugerida` | En revisión | Se vinculó un reporte de Perdido con uno de Encontrado/En Adopción. | `confirmado_ambas_partes`, `perdido`/`encontrado` (si se rechaza o desvincula), `eliminado` |
| `confirmado_ambas_partes` | Validado | Ambas cuentas validaron la coincidencia (en proceso de entrega). | `reunido`, `eliminado` |
| `reunido` | Final (Éxito) | Mascota devuelta a casa con su dueño original. | Estado final (no modificable, libera cupo) |
| `en_adopcion` | Activo | Mascota encontrada sin reclamo tras 20+ días. Busca hogar definitivo. | `adoptado` (cierre exitoso por adopción), `coincidencia_sugerida`, `eliminado` |
| `adoptado` | Final (Éxito) | Mascota en adopción entregada a un nuevo hogar definitivo. | Estado final (no modificable, libera cupo) |

---

## 🔄 2. Diagrama de Transición de Estados

```text
[ Creación: Perdido ] ──────────────────────────┐
                                                │
[ Creación: Encontrado ] ───────────────────────┼──> [ Coincidencia sugerida ]
         │ (Tras 20+ días sin dueño)            │               │
         ▼                                      │               ▼
   [ En adopción ] ─────────────────────────────┘   [ Confirmado por ambas partes ]
         │                                                      │
         ├─────────────────────────────────────────┐            ▼
         ▼                                         └───────> [ Reunido ] 🐾
   [ Adoptado ] 💚                                     (Mascota devuelta a dueño)
 (Nuevo hogar definitivo)
```

---

## 🤝 3. Flujo de Sugerencia de Coincidencias (Buscador Visual)

Para eliminar la fricción de copiar y pegar IDs técnicos, el sistema provee dos modalidades de vinculación:

1. **Buscador Visual Interactivo (Modal en `detalle.html`):**
   - Al pulsar **"🔗 Sugerir coincidencia con otro caso"**, el sistema detecta el tipo de reporte opuesto (si estás en *Perdido*, busca *Encontrados* en la misma ciudad; si estás en *Encontrado*, busca *Perdidos*).
   - Renderiza un mini-feed desplazable con la foto real, nombre, barrio, especie y color de cada mascota candidata.
   - Incluye una barra de búsqueda en tiempo real para filtrar por nombre, color o barrio.
   - Cada tarjeta tiene el botón directo **`🔗 Vincular`** para establecer la coincidencia en un solo clic.

2. **Vinculación Directa por ID / Enlace (Pestaña desplegable):**
   - Permite escribir o pegar manualmente un ID (ej: `rep_cali_001`) o la URL completa de la otra publicación si alguien la compartió por chat o redes sociales.

---

## ⚖️ 4. Validación Bilateral (Anti-Cierre Fraudulento)

1. **Notificación en "Mis Reportes":**
   - En el panel de ambos autores aparece una tarjeta destacada con los datos comparativos de la otra mascota (foto, señas, barrio e ID).
   - Botón **"✓ Sí, confirmo que es la misma"** -> Registra el voto de esa parte (`confirmadoPorCreador` o `confirmadoPorContraparte`).
   - Botón **"✕ No coincide"** -> Desvincula ambos reportes inmediatamente (`coincidenciaConReporteId = null`) y regresa ambos a su estado base original.

2. **Cierre a "Reunido" tras Confirmación Mutua:**
   - Solo cuando ambas partes han votado afirmativamente, el estado pasa a `confirmado_ambas_partes`.
   - Se activa el botón **"🐾 Marcar como Reunido (Cerrar caso)"**. Al pulsarlo, ambos casos se cierran bilateralmente y se liberan los cupos de ambas cuentas.

---

## 🛑 5. Cierre Directo por el Creador (Reencuentro Autónomo)

- Si el dueño encuentra a su mascota perdida por sus propios medios (o regresa sola), puede cerrarla directamente desde **Mis Reportes** presionando:
  `[ 🐾 Ya regresó a casa (Cerrar caso) ]`
- **Regla de seguridad estricta:** Solo se permite el salto directo a `reunido` si `coincidenciaConReporteId == null`. Si el reporte tiene una sugerencia pendiente activa, primero debe rechazarla/desvincularla para no dejar colgada a la contraparte.

---

## 🗑️ 6. Eliminación de Reportes (Derecho de Supresión y Corrección de Errores)

Si un usuario comete un error al publicar o desea retirar su caso de la plataforma:

1. **Puntos de acceso:**
   - Desde su panel en **"Mis Reportes"** (`mis-reportes.html`): botón `🗑️ Eliminar reporte` en cada tarjeta propia.
   - Desde la ficha técnica en **"Detalle"** (`detalle.html`): barra superior de autor con botón `🗑️ Eliminar publicación` (visible solo para el creador).

2. **Acciones automáticas al eliminar:**
   - **Confirmación previa:** Modal de advertencia para evitar borrados accidentales.
   - **Desvinculación limpia:** Si el reporte tenía una coincidencia activa con otra mascota, la contraparte es desvinculada automáticamente y restaurada a su estado base.
   - **Limpieza de Storage:** Se elimina la foto física almacenada en el bucket de Cloud Storage.
   - **Borrado atómico en Firestore:** Se eliminan el documento público `/reportes/{id}` y sus subcolecciones protegidas `/privado/contacto` y `/privado/seguridad`.
   - **Liberación de cupo:** Se decrementan los contadores en `/usuarios/{uid}`, recuperando de inmediato el cupo para publicar.

---

## 📊 7. Límites y Cuotas de Publicación Activas

Para prevenir spam, acaparamiento y garantizar el uso responsable:
- **Mascotas Perdidas activas:** Máximo 3 por usuario.
- **Mascotas Encontradas activas:** Máximo 3 por usuario.
- **En Adopción activas:** Máximo 3 por usuario.
- **Tope global de reportes activos:** Máximo 9 por cuenta.
- Al cerrarse (`reunido`/`adoptado`) o eliminarse cualquier reporte, el cupo de esa categoría se libera automáticamente en tiempo real.
