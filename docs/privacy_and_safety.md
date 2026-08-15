# Privacidad, Seguridad y Anti-Fraude — Huellas a Casa

> **Marco de Referencia:** Ley 1581 de 2012 (Protección de Datos Personales en Colombia) y protocolos de seguridad en situaciones de emergencia.

---

## 🛡️ 1. Principios de Protección de Datos

1. **Ubicación Aproximada Únicamente:**
   - La plataforma **solo almacena y exhibe la Zona, Barrio o Comuna** (ej: "San Fernando", "Aguablanca", "Limonar").
   - **NUNCA** se solicita ni se publica dirección exacta, número de casa, manzana ni coordenadas GPS precisas.
   - La entrega física o ubicación exacta se acuerda exclusivamente de persona a persona en WhatsApp una vez validada la identidad.

2. **Aislamiento Estricto de la Seña Privada de Verificación:**
   - Para evitar que terceros inescrupulosos reclamen mascotas que no les pertenecen, el publicador registra una *seña privada* (ej. "cicatriz en la pata izquierda", "mancha oculta en el paladar").
   - Esta seña se almacena en la subcolección privada `/reportes/{id}/privado/seguridad`.
   - Las reglas de Firestore (`firestore.rules`) impiden que cualquier usuario distinto al creador del reporte pueda leer este documento.
   - Antes de revelar la ubicación exacta por WhatsApp, el dueño/rescatista le pide a la contraparte describir esa seña secreta.

3. **Contacto Protegido a Nivel de Base de Datos (Firestore Rules):**
   - El documento público `/reportes/{id}` **no contiene teléfono, medio de contacto ni correo del creador**.
   - Los datos de contacto viven aislados en la subcolección `/reportes/{id}/privado/contacto`, protegida por reglas de Firestore (`allow read: if request.auth != null;`).
   - Los visitantes no autenticados solo ven la ficha pública; el botón "Contactar por WhatsApp" consulta la subcolección protegida únicamente tras autenticarse con Google, manteniendo trazabilidad y previniendo scraping o estafas masivas.

4. **Límite de Reportes Activos por Cuenta (Anti-Spam / Anti-Mercadeo Ilegal):**
   - Máximo **3 reportes de perdidos**, **3 de encontrados** y **3 en adopción** (tope total de **9 reportes activos** por cuenta de Google).
   - **Liberación de cupo**: Cuando un reporte se cierra exitosamente como `reunido` o `adoptado`, los contadores de cuota de los autores involucrados se decrementan atómicamente, liberando el cupo para futuros reportes.

5. **Sugerencias de Coincidencia Comunitarias por Terceros:**
   - Cualquier usuario autenticado (vecinos, rescatistas o voluntarios) puede sugerir una coincidencia entre dos publicaciones distintas ingresando el ID del otro reporte.
   - Los autores originales de ambos reportes reciben la tarjeta comparativa en "Mis Reportes" para validar o rechazar mutuamente el caso.

6. **Moderación Comunitaria (Botón Reportar):**
   - Toda tarjeta incluye un botón visible de **"Reportar este anuncio"** que registra el caso en la colección `reportes_abuso`.

7. **Minimización y Cero Trackers:**
   - Sin librerías de tracking publicitario ni cookies de terceros.
   - Todo el procesamiento de imágenes se realiza localmente en el dispositivo antes de ser enviado a Firebase.

---

## 🔮 2. Mejoras de Seguridad Planificadas (Post-MVP)

- **Mitigación de Acoso por Bucle de Sugerencias Rechazadas**:
  - *Escenario*: Si una cuenta maliciosa sugiere insistentemente una coincidencia que ya fue rechazada por el dueño para inundar su panel de notificaciones.
  - *Solución a implementar*: Cooldown de re-sugerencia entre el mismo par de reportes (ej. bloqueo temporal tras 2 rechazos consecutivos) y opción de silenciar/bloquear sugerencias provenientes de una cuenta específica.

- **Limpieza Periódica de Archivos Huérfanos en Storage**:
  - *Escenario*: Si la subida a Firebase Storage (Paso 1) tiene éxito pero la transacción en Firestore (Paso 2) es abortada (ej. desconexión abrupta o límite de 5 reportes alcanzado), queda una foto huérfana no referenciada.
  - *Solución a implementar*: Cloud Function programada semanalmente para comparar paths en Storage vs colecciones de Firestore y purgar archivos sin documento asociado.
