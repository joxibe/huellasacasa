# Alcance del MVP — Huellas a Casa

> **Contexto:** Plataforma comunitaria de emergencia para reportar mascotas perdidas o encontradas tras el terremoto del 10 de agosto de 2026, enfocada inicialmente en Cali y adaptable a toda Colombia.

---

## 🎯 Objetivo

Facilitar la conexión directa, rápida y segura entre personas que perdieron una mascota y quienes encontraron una, con costo cero de operación, alta seguridad anti-fraude y consumo mínimo de datos móviles (optimizado para redes 3G).

---

## ✅ Qué SÍ incluye el MVP

1. **Explorador y Búsqueda Pública (Sin requerir cuenta):**
   - Feed de reportes ordenados por fecha descendente.
   - Filtros rápidos por chips: Tipo (`Todos`, `Perdido`, `Encontrado`, `En adopción`), Especie (`Todos`, `Perro`, `Gato`, `Otro`) y Selector de Ciudad / Barrio.
   - Tarjetas de mascota con foto optimizada, estado diferenciado por color, especie, tamaño, sexo y señas particulares visibles.

2. **Publicación de Reportes (Requiere Google Auth):**
   - Subida y compresión obligatoria de foto en cliente (< 300KB) alojada en Firebase Storage (blindada con techo de 500KB en `storage.rules`).
   - Formulario adaptativo según tipo (`Perdido` vs `Encontrado` vs `En adopción`).
   - Seña privada de verificación secreta (aislada en `/privado/seguridad` para que no viaje en listados públicos).
   - Datos de contacto y canal preferido (`WhatsApp`, `Llamada`, `Ambos`) aislados en `/privado/contacto`.
   - Límite diferenciado de cuotas por cuenta: máximo 3 perdidos, 3 encontrados, 3 en adopción (tope global de 9 activos) validado tanto en cliente como en servidor (`firestore.rules`).

3. **Contacto Seguro:**
   - Botón directo de WhatsApp (`wa.me`) con mensaje contextual generado automáticamente (requiere inicio de sesión con Google para prevenir spam/abuso).
   - La dirección exacta **nunca se publica** en la plataforma, se coordina por chat privado.

4. **Flujo de Coincidencia Mutua y Buscador Visual:**
   - **Buscador visual interactivo:** Muestra un mini-feed con fotos y filtros reactivos de las mascotas del tipo opuesto en la misma ciudad para vincular con 1 solo clic.
   - Opción secundaria para vincular mediante ID manual o enlace compartido.
   - Estado `coincidencia_sugerida` con notificación y tarjeta comparativa en *Mis Reportes*.
   - Confirmación bilateral obligatoria (`confirmado_ambas_partes`) antes de permitir el cierre a `reunido`.

5. **Conversión a "En Adopción":**
   - Si un reporte de tipo `Encontrado` no tiene reclamo tras 20 días, el autor puede cambiar su estado a `En adopción`, liberando el cupo de encontrados y ocupando uno de adopción.

6. **Eliminación y Gestión de Publicaciones:**
   - Botón `🗑️ Eliminar reporte` disponible en *Mis Reportes* y en la vista de *Detalle* (exclusivo para el creador).
   - Borrado en cascada: elimina documento público, subcolecciones privadas, foto en Cloud Storage, desvincula a la contraparte y libera el cupo en tiempo real.

7. **Moderación Comunitaria:**
   - Botón de **Reportar Anuncio** presente en cada tarjeta para alertar sobre publicaciones sospechosas o spam en la colección `/reportes_abuso`.

8. **Theme System UI/UX y Performance:**
   - Tipografía 100% nativa de sistema (0KB descargas de fuentes externas).
   - Políticas de `Cache-Control` configuradas en Firebase Hosting para que los navegadores móviles en Android/iOS reciban siempre las últimas versiones de JS/CSS sin borrar caché manual.
   - Vista optimizada para móvil (360px - 390px) con navegación inferior ergonómica y botón flotante central.

---

## ❌ Qué NO incluye el MVP (Fuera de alcance)

- ❌ Chat interno dentro de la app (se usa WhatsApp externo).
- ❌ Reconocimiento facial / IA de imágenes para mascotas.
- ❌ Notificaciones push por SMS/FCM.
- ❌ Soporte multi-idioma (optimizado para español de Colombia).
- ❌ Pasarela de pagos o donaciones monetarias.
- ❌ Panel administrativo complejo con roles multinivel.
- ❌ Trackers de analítica de terceros que consuman ancho de banda o comprometan privacidad.
- ❌ Cloud Functions de mantenimiento en segundo plano (planeado para post-MVP).
