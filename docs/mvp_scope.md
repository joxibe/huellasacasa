# Alcance del MVP — Huellas a Casa

> **Contexto:** Plataforma de emergencia para reportar mascotas perdidas o encontradas tras el terremoto del 10 de agosto de 2026, enfocada en Cali, Colombia.

---

## 🎯 Objetivo

Facilitar la conexión directa, rápida y segura entre personas que perdieron una mascota y quienes encontraron una, con costo cero de operación y consumo mínimo de datos móviles.

---

## ✅ Qué SÍ incluye el MVP

1. **Explorador y Búsqueda Pública (Sin requerir cuenta):**
   - Feed de reportes ordenados por fecha descendente.
   - Filtros rápidos por chips: Tipo (`Todos`, `Perdido`, `Encontrado`, `En adopción`), Especie (`Todos`, `Perro`, `Gato`, `Otro`) y Zona/Barrio de Cali.
   - Tarjetas de mascota con foto optimizada, estado diferenciado por color, especie, tamaño, sexo y señas particulares visibles.

2. **Publicación de Reportes (Requiere Google Auth):**
   - Subida y compresión obligatoria de foto en cliente (< 300KB) alojada en Firebase Storage.
   - Formulario adaptativo según tipo (`Perdido` vs `Encontrado`).
   - Seña privada de verificación (aislada para que no viaje en listas públicas).
   - Datos de contacto y canal preferido (`WhatsApp`, `Llamada`, `Ambos`).
   - Límite diferenciado de cuotas por cuenta: máximo 3 perdidos, 3 encontrados, 3 en adopción (tope global de 9 activos).

3. **Contacto Seguro:**
   - Botón directo de WhatsApp (`wa.me`) con mensaje contextual generado automáticamente (requiere inicio de sesión con Google para prevenir spam/abuso).
   - La dirección exacta **nunca se publica** en la plataforma, se coordina por chat privado.

4. **Flujo de Coincidencia Mutua y Cierre:**
   - Opción para sugerir coincidencia entre un reporte de `Perdido` y uno de `Encontrado`.
   - Estado `Coincidencia sugerida`.
   - Confirmación bilateral desde el panel de "Mis Reportes" de cada usuario.
   - Cierre final a `Reunido`.

5. **Conversión a "En Adopción":**
   - Si un reporte de tipo `Encontrado` no tiene reclamo tras 20-30 días, el autor puede cambiar su estado a `En adopción`.

6. **Botón de Reportar Anuncio:**
   - Presente en cada tarjeta para moderación comunitaria.

7. **Theme System UI/UX Ultraligero:**
   - Tipografía 100% nativa de sistema (0KB descargas de fuentes).
   - Paleta de colores cálida y accesible con 6 estados diferenciados.
   - Vista optimizada para móvil (360px - 390px).

---

## ❌ Qué NO incluye el MVP (Fuera de alcance)

- ❌ Chat interno dentro de la app (se usa WhatsApp externo).
- ❌ Reconocimiento facial / IA de imágenes para mascotas.
- ❌ Notificaciones push.
- ❌ Soporte multi-idioma (solo español para Cali, Colombia).
- ❌ Pasarela de pagos o donaciones.
- ❌ Panel administrativo complejo con roles multinivel.
- ❌ Trackers de analítica de terceros que consuman ancho de banda o comprometan privacidad.
- ❌ Cloud Functions de mantenimiento en segundo plano (ej: limpieza periódica de imágenes huérfanas en Storage cuando una transacción es abortada, planeado para post-MVP).
