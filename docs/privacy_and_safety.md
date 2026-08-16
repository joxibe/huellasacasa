# Privacidad, Seguridad y Anti-Fraude — Huellas a Casa

> **Marco de Referencia:** Ley 1581 de 2012 (Protección de Datos Personales en Colombia), principios de privacidad por diseño y protocolos de seguridad en emergencias.

---

## 🛡️ 1. Principios de Protección de Datos y Anti-Fraude

1. **Ubicación Aproximada Únicamente:**
   - La plataforma **solo almacena y exhibe la Zona, Barrio o Comuna** (ej: "San Fernando", "Aguablanca", "Limonar").
   - **NUNCA** se solicita ni se publica dirección exacta, número de casa, manzana ni coordenadas GPS precisas.
   - La entrega física o ubicación exacta se acuerda exclusivamente de persona a persona en WhatsApp una vez validada la identidad.

2. **Aislamiento Estricto de la Seña Privada de Verificación:**
   - Para evitar que terceros inescrupulosos reclamen mascotas que no les pertenecen, el publicador registra una *seña privada secreta* (ej. "cicatriz debajo de la pata trasera", "mancha oculta en el paladar").
   - Esta seña se almacena en la subcolección privada `/reportes/{id}/privado/seguridad`, con su propio campo `creadorUid`.
   - Las reglas de Firestore (`firestore.rules`) impiden de forma autónoma que cualquier usuario distinto al creador legítimo pueda leer este documento.
   - Antes de revelar la ubicación exacta por WhatsApp, el dueño/rescatista le pide a la contraparte describir esa seña secreta.

3. **Contacto Protegido a Nivel de Base de Datos (Firestore Rules):**
   - El documento público `/reportes/{id}` **no contiene teléfono, medio de contacto ni correo del creador**.
   - Los datos de contacto viven aislados en la subcolección `/reportes/{id}/privado/contacto`, protegida por reglas de Firestore (`allow read: if request.auth != null;`).
   - Los visitantes anónimos solo ven la ficha pública; el botón "Contactar por WhatsApp" consulta la subcolección protegida únicamente tras autenticarse con Google, manteniendo trazabilidad y previniendo scraping o estafas masivas.

4. **Límite de Reportes Activos por Cuenta (Anti-Spam / Anti-Acaparamiento):**
   - Máximo **3 reportes de perdidos**, **3 de encontrados** y **3 en adopción** (tope total de **9 reportes activos** por cuenta de Google).
   - Validado tanto en el cliente como en el servidor (`firestore.rules` con función `canCreateReport()`).
   - **Liberación de cupo**: Al cerrar un caso exitosamente (`reunido`/`adoptado`) o al eliminarlo, los contadores de cuota se decrementan atómicamente, liberando el cupo de inmediato.

5. **Sugerencias de Coincidencia Seguras (Buscador Visual y Validación Bilateral):**
   - Cualquier usuario autenticado (vecinos, rescatistas o voluntarios) puede sugerir una coincidencia seleccionando la foto del caso opuesto en el buscador visual o ingresando el ID del otro reporte.
   - Los autores originales de ambos reportes reciben la tarjeta comparativa en "Mis Reportes" para validar o rechazar mutuamente el caso.
   - Ninguna parte puede forzar el cierre unilateral como `reunido` mientras exista un vínculo activo pendiente (blindaje CASO A y CASO B en `firestore.rules`).

6. **Derecho de Supresión (Eliminación Completa de Publicaciones):**
   - El creador puede eliminar su publicación en cualquier momento desde *Mis Reportes* o desde la vista de *Detalle*.
   - El proceso de eliminación es integral: borra el documento público `/reportes/{id}`, las subcolecciones `/privado/contacto` y `/privado/seguridad`, el archivo de imagen en Cloud Storage, desvincula automáticamente a la contraparte si había un match activo y libera el cupo de la cuenta.

7. **Moderación Comunitaria y Protocolo de Administración (`/reportes_abuso`):**
   - **Autenticación obligatoria:** Solo usuarios con sesión activa de Google pueden reportar una publicación, previniendo bots o ataques anónimos.
   - **Anti-inflado por ID determinista:** Las denuncias se guardan con ID `${reporteId}_${usuarioDenuncianteUid}`. Si un usuario reporta varias veces el mismo caso, sobreescribe su registro sin duplicar conteos.
   - **Aislamiento total y sigilo:** El documento público `/reportes/{id}` **NO contiene ningún campo ni contador de denuncias**. Las alertas van directo a `/reportes_abuso` accesible únicamente por el administrador.
   - **Administrador Designado:**
     - **UID:** `7KRsQ64BAWeLIQWdRpsfHri1LbD2`
     - **Cuenta:** `huellasacasa1008@gmail.com`
     - **URL de Panel:** [`/admin`](https://huellasacasa-23651.web.app/admin) (sin enlace público en la navegación ordinaria).
   - **Alcance de Permisos del Administrador (Principio de Mínimo Privilegio - PoLP):**
     - **Lo que SÍ puede hacer el Administrador:**
       1. Leer y listar todas las alertas de la comunidad en `/reportes_abuso`.
       2. Descartar y borrar denuncias resueltas de `/reportes_abuso`.
       3. Eliminar publicaciones denunciadas `/reportes/{id}` y sus subcolecciones en cascada.
       4. Borrar fotos de reportes infractores en Firebase Storage.
     - **Lo que NO puede hacer el Administrador (Blindaje Estricto en Reglas de Firestore):**
       1. **NO puede leer la seña secreta de nadie:** `/privado/seguridad` tiene la regla `allow read: if isAuthenticated() && resource.data.creadorUid == request.auth.uid;`. No existe ninguna cláusula `isAdmin()` para lectura; solo el dueño original puede verla.
       2. **NO tiene bypass para datos de contacto:** `/privado/contacto` solo se consulta bajo la regla estándar de usuario autenticado.
       3. **NO puede editar o alterar el contenido de reportes ajenos:** Solo tiene permiso de borrado (`delete`), impidiendo cualquier manipulación de datos.

8. **Minimización, Sin Trackers y Políticas de Caché:**
   - Sin librerías de tracking publicitario ni cookies de terceros.
   - Compresión local de imágenes en el dispositivo (< 300KB) antes de la subida a Storage.
   - Políticas de cabeceras HTTP (`Cache-Control: no-cache, must-revalidate`) que permiten *Back-Forward Cache* instantáneo sin retener datos desactualizados tras un deploy.

---

## 🔮 2. Mejoras de Seguridad Planificadas (Post-MVP)

- **Mitigación de Acoso por Bucle de Sugerencias Rechazadas**:
  - *Escenario*: Si una cuenta maliciosa sugiere insistentemente una coincidencia que ya fue rechazada por el dueño para inundar su panel de notificaciones.
  - *Solución a implementar*: Cooldown de re-sugerencia entre el mismo par de reportes (ej. bloqueo temporal tras 2 rechazos consecutivos) y opción de silenciar/bloquear sugerencias provenientes de una cuenta específica.

- **Limpieza Periódica de Archivos Huérfanos en Storage**:
  - *Escenario*: Si la subida a Firebase Storage tiene éxito pero la transacción en Firestore es abortada (ej. desconexión abrupta), queda una foto huérfana no referenciada.
  - *Solución a implementar*: Cloud Function programada semanalmente para comparar paths en Storage vs colecciones de Firestore y purgar archivos sin documento asociado.
