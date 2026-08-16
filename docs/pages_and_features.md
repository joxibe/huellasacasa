# Mapa de Pantallas y Funcionalidades — Huellas a Casa

Este documento detalla cada página HTML de la plataforma, su propósito, sus componentes visibles y las acciones que realiza.

---

## 🗺️ Índice de Pantallas

| Pantalla | URL en Producción | Acceso / Permiso | Propósito Principal |
|---|---|---|---|
| **Explorador Público** | [`/index.html`](https://huellasacasa-23651.web.app) | Público (Sin login) | Explorar, filtrar y buscar mascotas perdidas, encontradas o en adopción. |
| **Publicar Mascota** | [`/publicar.html`](https://huellasacasa-23651.web.app/publicar.html) | Autenticado (Google) | Crear un nuevo reporte con foto comprimida y seña secreta privada. |
| **Ficha de Detalle** | [`/detalle.html?id=...`](https://huellasacasa-23651.web.app/detalle.html) | Público / Login para WhatsApp | Ver ficha completa, contactar por WhatsApp, sugerir coincidencia visual y denunciar. |
| **Mis Reportes** | [`/mis-reportes.html`](https://huellasacasa-23651.web.app/mis-reportes.html) | Autenticado (Google) | Gestionar reportes propios, validar coincidencias, cerrar casos y ver cupos. |
| **Guía Comunitaria** | [`/como-funciona.html`](https://huellasacasa-23651.web.app/como-funciona.html) | Público (Sin login) | Explicación ciudadana paso a paso del ciclo completo, estados y señas secretas. |
| **Política de Privacidad** | [`/privacidad.html`](https://huellasacasa-23651.web.app/privacidad.html) | Público (Sin login) | Términos legales y protección de datos según la Ley 1581 de 2012. |
| **Panel de Moderación** | [`/admin.html`](https://huellasacasa-23651.web.app/admin.html) | Exclusivo Administrador | Revisar denuncias comunitarias, inspeccionar publicaciones y eliminar contenido infractor. |

---

## 📱 1. Explorador Público (`index.html`)

- **Propósito:** Primer punto de contacto para cualquier ciudadano o rescatista. Carga instantáneamente en redes 3G (0 KB de fuentes externas).
- **Componentes clave:**
  1. **Banner de iniciativa ciudadana:** Información de emergencia y enlace permanente a [¿Cómo funciona esta plataforma?](https://huellasacasa-23651.web.app/como-funciona.html).
  2. **Selector de Ciudad en el Header:** Permite cambiar entre Cali, Pereira, Bogotá, Medellín u otras ciudades personalizadas.
  3. **Buscador en tiempo real:** Filtro por texto libre sobre barrio, señas o nombre.
  4. **Filtros por Chips:**
     - **Tipo:** `Todos`, `Perdido`, `Encontrado`, `En adopción`.
     - **Especie:** `Todos`, `Perro`, `Gato`, `Otro`.
  5. **Grid de Tarjetas de Mascotas:**
     - Foto optimizada, badge de estado con color distintivo, especie, sexo, tamaño, señas visibles y ubicación aproximada.
     - Identificador único `🆔 ID` visible para sugerir coincidencias.
     - Botón directo `🔍 Ver detalles`.
  6. **Paginación Eficiente (`.limit(20)` y `startAfter()`):**
     - La consulta inicial carga un bloque liviano de 20 reportes.
     - Si existen más publicaciones en la ciudad, se muestra el botón interactivo `🐾 Cargar más reportes`.
  7. **Barra de navegación inferior (Móvil):** Accesos directos ergonómicos a *Explorar*, *Guía*, *+ Publicar*, *Mis Reportes* y *Privacidad*.

---

## 📝 2. Publicar Mascota (`publicar.html`)

- **Propósito:** Formulario adaptativo y blindado para registrar un caso.
- **Flujo y Validaciones:**
  - **Selector de tipo:** `Perdí mi mascota` (Rojo), `Encontré una mascota` (Azul) o `Dar en adopción` (Púrpura). Los campos del formulario se adaptan dinámicamente según el tipo seleccionado.
  - **Compresión de foto en cliente:** Procesa la imagen localmente reduciéndola a menos de 300KB antes de subirla a Firebase Storage (regla de servidor limitada a < 500KB).
  - **Ubicación aproximada:** Selector de ciudad + barrio (se prohíbe dirección exacta por seguridad).
  - **Seña secreta privada:** Campo aislado que se almacena en `/privado/seguridad` (solo visible para el autor) para verificar identidad antes de la entrega.
  - **Contacto seguro:** Teléfono y canal preferido (WhatsApp/Llamada) guardados en `/privado/contacto`.
  - **Control de cuotas:** Valida en tiempo real que el usuario no supere el límite de 3 reportes por categoría o 9 totales.

---

## 🔍 3. Ficha de Detalle (`detalle.html`)

- **Propósito:** Vista a pantalla completa de la mascota reportada.
- **Acciones disponibles:**
  1. **Barra superior de autor (si es el creador):** Muestra el badge `👑 Eres el autor de este reporte` y el botón `🗑️ Eliminar publicación`.
  2. **Botón `💬 Contactar por WhatsApp`:** Requiere login con Google para consultar la subcolección privada `/privado/contacto` y genera el mensaje de WhatsApp preformateado sin exponer teléfonos a scrapers anónimos.
  3. **Botón `🔗 Sugerir coincidencia con otro caso`:**
     - Abre el **Buscador Visual Interactivo**: detecta automáticamente el tipo opuesto en la misma ciudad y muestra un mini-feed de tarjetas candidatas con fotos y filtro reactivo para vincular en 1 solo clic.
     - Pestaña desplegable para vincular mediante ID o enlace compartido.
  4. **Botón `🚩 Reportar este anuncio`:** Abre un formulario de denuncia comunitaria (`/reportes_abuso`) para alertar al administrador sobre spam o fraude.

---

## 📂 4. Mis Reportes (`mis-reportes.html`)

- **Propósito:** Centro de control del usuario para gestionar sus publicaciones y cupos.
- **Componentes clave:**
  1. **Contadores de Cuota:** Visualizador dinámico de cupos ocupados vs disponibles (`Perdidos: X/3`, `Encontrados: X/3`, `En adopción: X/3`, `Total: X/9`).
  2. **Tarjeta de Mascota con Estados Interactivos:**
     - **Estado Base (`perdido` / `encontrado`):** Botón `🔒 Ver mi seña secreta` y botón de cierre directo `🐾 Ya regresó a casa` (si no hay match pendiente).
     - **Estado `coincidencia_sugerida`:** Banner amarillo de alerta con tarjeta comparativa de la otra mascota y botones bilaterales: `✓ Sí, confirmo que es la misma` y `✕ No coincide`.
     - **Estado `confirmado_ambas_partes`:** Banner índigo de confirmación con botón `🐾 Marcar como Reunido (Cerrar caso)`.
     - **Estado `encontrado` con 20+ días:** Botón `💜 Cambiar a En Adopción`.
     - **Estado `en_adopcion`:** Botón `💚 Marcar como Adoptado`.
     - **Acción universal:** Botón `🗑️ Eliminar reporte` con modal personalizado de confirmación.

---

## 💡 5. Guía Comunitaria (`como-funciona.html`)

- **Propósito:** Página de onboarding y educación para la comunidad.
- **Secciones:**
  1. Origen y propósito de la iniciativa ciudadana.
  2. Guía paso a paso de publicación y compresión de fotos.
  3. Explicación de la seña secreta anti-fraude y cómo usarla en WhatsApp.
  4. Sistema de coincidencias mutuas y validación bilateral.
  5. Guía visual de los 7 estados y colores.
  6. Compromiso de uso responsable y seguridad en entregas presenciales.

---

## 📜 6. Privacidad y Términos (`privacidad.html`)

- **Propósito:** Garantizar el cumplimiento de la Ley 1581 de 2012 de Protección de Datos Personales en Colombia.
- **Contenido:**
  - Finalidad del tratamiento de datos (reconectar mascotas).
  - No almacenamiento de direcciones exactas ni GPS.
  - Ejercicio del derecho de supresión / eliminación de cuenta y reportes.
  - Correo oficial de contacto: `huellasacasa1008@gmail.com`.

---

## 🛡️ 7. Panel de Moderación y Denuncias (`admin.html` / `/admin`)

- **Propósito:** Centro de control administrativo confidencial para que el moderador designado revise las alertas de la comunidad sobre publicaciones sospechosas, fraudulentas o infractoras.
- **Acceso y Visibilidad:**
  - **Sin enlace público:** No existe ningún botón ni enlace a `admin.html` en la navegación pública general ni en el pie de página.
  - **Acceso exclusivo para el administrador:** Cuando el usuario autenticado coincide con el UID `7KRsQ64BAWeLIQWdRpsfHri1LbD2` (`huellasacasa1008@gmail.com`), su avatar muestra una insignia roja y al tocarlo se despliega el acceso directo: `🛡️ Ir al Panel de Moderación`.
  - **Validación de Seguridad Asíncrona:** Si un visitante anónimo o un usuario autenticado estándar intenta acceder a `/admin`, el controlador `admin.ui.js` bloquea la pantalla mostrando inmediatamente el estado: `🚫 Acceso no autorizado`.
- **Componentes y Acciones Detalladas:**
  1. **Contador de Alertas:** Muestra el número total de reportes pendientes de moderación en la colección `/reportes_abuso`.
  2. **Tarjeta de Denuncia Individual:**
     - **Encabezado y Motivo:** Distintivo en rojo con el tipo de alerta (*Spam o Fraude, Datos falsos, Foto inapropiada, Anuncio duplicado, etc.*) y fecha relativa.
     - **Comentario del Denunciante:** Mensaje explicativo escrito por el usuario que levantó el reporte.
     - **Metadatos del Caso:** Identificador `🆔 Reporte ID` y correo/UID del denunciante.
  3. **Botones de Acción por Denuncia:**
     - **`🔍 Inspeccionar publicación`:** Abre la ficha pública (`detalle.html?id=...`) en una pestaña nueva para examinar visualmente las fotos, descripciones y datos publicados.
     - **`✓ Descartar alerta`:** Si la denuncia fue infundada o resuelta, elimina el documento de `/reportes_abuso/{id}` de la cola sin alterar la publicación original de la mascota.
     - **`🗑️ Eliminar publicación`:** Si se confirma una infracción o fraude:
       1. Despliega el **Modal de Confirmación de Peligro** advirtiendo sobre el borrado irreversible.
       2. Ejecuta `eliminarReporteDenunciado()`, que borra atómicamente el documento en `/reportes/{id}`, sus subcolecciones privadas `/privado/contacto` y `/privado/seguridad`, la foto en Cloud Storage y desvincula cualquier match activo.
       3. Decrementa los contadores de reportes activos en `/usuarios/{creadorUid}` para mantener la integridad de cuotas.
       4. Borra automáticamente la denuncia de `/reportes_abuso`.
