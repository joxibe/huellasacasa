# Flujo de Estados y Validación Bilateral — Huellas a Casa

Este documento define la máquina de estados de un reporte y las reglas de transición.

---

## 📊 1. Tabla de Estados

| Estado | Tipo / Rol | Descripción | Transición Siguiente Permitida |
|---|---|---|---|
| `perdido` | Activo | Dueño buscando a su mascota extraviada. | `coincidencia_sugerida` |
| `encontrado` | Activo | Rescatista o ciudadano que tiene/vio a la mascota. | `coincidencia_sugerida`, `en_adopcion` (tras 20+ días) |
| `coincidencia_sugerida` | En revisión | Alguien vinculó un reporte de Perdido con uno de Encontrado/En Adopción. | `confirmado_ambas_partes`, `perdido`/`encontrado` (si se rechaza) |
| `confirmado_ambas_partes` | Validado | Ambas cuentas validaron la coincidencia (en proceso de entrega). | `reunido` |
| `reunido` | Final (Éxito) | Mascota devuelta a casa con su dueño original. | Estado final (no modificable, libera cupo) |
| `en_adopcion` | Activo | Mascota encontrada sin reclamo tras 20+ días. Busca hogar definitivo. | `adoptado` (cierre exitoso por adopción), `coincidencia_sugerida` |
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

## 🤝 3. Flujo de Confirmación Bilateral (Anti-Cierre Unilateral)

1. **Sugerencia:**
   - Cualquier usuario autenticado (dueño, rescatista o voluntario) pulsa **"🔗 Sugerir coincidencia"** e introduce el ID del otro reporte.
   - El sistema valida que sean reportes complementarios (`perdido` vs `encontrado`/`en_adopcion`) y vincula ambos (`coincidenciaConReporteId`), pasando su estado a `coincidencia_sugerida`.

2. **Notificación y Validación en "Mis Reportes":**
   - En el panel de ambos autores aparece una tarjeta destacada con los datos del reporte vinculado:
     - Botón **"✓ Sí, confirmo que es la misma"** -> actualiza `confirmadoPorCreador` o `confirmadoPorContraparte`.
     - Botón **"✕ No coincide"** -> desvincula ambos reportes y los regresa a su estado previo (`perdido` / `encontrado`).

3. **Cierre a "Reunido":**
   - Cuando ambas partes confirman, el estado pasa a `confirmado_ambas_partes`.
   - Se habilita el botón **"🐾 Marcar como Reunido"**. Al pulsarlo, ambos casos se cierran como `reunido` y se liberan sus cupos activos.

---

## 💜 4. Transición a "En Adopción" y Cierre a "Adoptado"

1. **Paso a En Adopción:**
   - Aplica a reportes con `tipo === 'encontrado'`.
   - Tras 20 días sin reclamo (`dias >= 20`) y siempre que el usuario tenga cupo disponible en adopción (máx 3), el autor puede activar **"Cambiar a En Adopción"**.
   - Al cambiar, libera el cupo de `encontrados` y ocupa 1 cupo de `adopcion`.

2. **Cierre a Adoptado:**
   - Cuando la mascota en adopción es entregada a su nueva familia adoptante, el autor presiona **"💚 Marcar como Adoptado"**.
   - El reporte pasa a estado `adoptado` (estado final exitoso) y libera automáticamente el cupo de `adopcionActivosCount` y del total.

---

## 🛑 5. Cierre Directo por el Creador (Reencuentro Autónomo)

- Si el dueño encuentra a su mascota perdida por sus propios medios (o regresa sola), puede cerrarla directamente desde **Mis Reportes** presionando:
  `[ 🐾 Ya regresó a casa (Cerrar caso) ]`
- El reporte pasa a estado `reunido` y libera inmediatamente el cupo activo de `perdidos`.

---

## 📊 6. Límites y Cuotas de Publicación Activas

Para prevenir spam y abusos durante la emergencia:
- **Mascotas Perdidas activas:** Máximo 3 por usuario.
- **Mascotas Encontradas activas:** Máximo 3 por usuario.
- **En Adopción activas:** Máximo 3 por usuario.
- **Tope global de reportes activos:** Máximo 9 por cuenta.
- Al cerrarse cualquier caso (`reunido` o `adoptado`), el cupo de esa categoría se libera de inmediato en tiempo real.

