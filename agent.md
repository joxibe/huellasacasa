# 🐾 AGENT.md — Huellas a Casa

> **Versión:** 1.0 · **Proyecto:** Huellas a Casa · **Stack:** HTML/CSS/JS + Firebase
>
> Este documento es la **fuente de verdad operativa** para cualquier agente de IA
> que opere en este repositorio. **Leer completo antes de tocar cualquier archivo.**
> **Las reglas de este archivo son obligatorias y no negociables.**
>
> Contexto: plataforma de emergencia para reportar mascotas perdidas/encontradas
> tras el terremoto de Colombia (agosto 2026), enfocada en Cali. Prioridad: rapidez,
> bajo costo, bajo consumo de datos, y protección de la información de contacto
> y ubicación de las personas que la usan.

---

## 🧭 PROTOCOLO INICIAL — ANTES DE TOCAR CUALQUIER ARCHIVO

```
PASO 0 — Leer este archivo completo.
PASO 1 — Leer docs/mvp_scope.md para confirmar qué está dentro y fuera del MVP.
PASO 2 — Identificar qué documentación es relevante para la tarea:
          - Modelo de datos   → docs/data_model.md
          - Flujo de estados  → docs/report_flow.md
          - Privacidad        → docs/privacy_and_safety.md
PASO 3 — Si la tarea involucra: número de contacto, ubicación, fotos, o el paso
          a "reunido"/"en adopción" → LEER docs/privacy_and_safety.md antes de
          proponer cualquier código.
PASO 4 — Leer el archivo a modificar COMPLETO antes de proponer cambios.
PASO 5 — Si la tarea toca > 2 archivos: presentar plan y esperar aprobación.
```

**Nunca escribas código sin completar estos pasos.**

---

## 📐 PROCESO DE ESPECIFICACIÓN LIGERA — OBLIGATORIO

> No usamos SDD completo como en proyectos grandes de app, porque el MVP debe
> salir rápido. Pero **ningún feature nuevo se construye sin al menos 3 líneas
> de intención escrita**, para evitar features fantasma o scope creep en medio
> de la emergencia.

### Cuándo escribir una mini-spec

- Feature nuevo (pantalla, formulario, colección nueva en Firestore).
- Cambio en el flujo de estados de un reporte (ver `docs/report_flow.md`).
- Cualquier cambio que toque privacidad de contacto o ubicación.

**Formato mínimo (puede ir en el PR/commit, no necesita archivo aparte):**
```
Qué: ...
Por qué: ...
Qué NO incluye: ...
```

### Definición de terminado

```
□ Funciona en un celular gama media con conexión 3G (probar con throttling)
□ Sin errores en consola
□ Sin datos sensibles expuestos que no debieran estarlo (ver privacidad)
□ Los 4 estados de UI están cubiertos si la pantalla trae datos remotos
□ Sin strings de "lorem ipsum" ni placeholders olvidados
```

---

## 🏗️ ARQUITECTURA — REGLAS ABSOLUTAS

### Separación de responsabilidades (sin framework pesado)

```
UI (HTML/CSS + eventos)  →  solo depende de  →  Lógica de datos (services/)
Lógica de datos (services/) →  solo depende de →  Firebase SDK
```

```js
// ❌ NUNCA llamadas directas a Firestore dentro de un archivo de UI
document.getElementById('btn-publicar').addEventListener('click', () => {
  firebase.firestore().collection('reportes').add({...}); // NO
});

// ✅ SIEMPRE a través de una capa de servicio
import { crearReporte } from './services/reportes.service.js';
document.getElementById('btn-publicar').addEventListener('click', () => {
  crearReporte(datosFormulario);
});
```

### Estructura de carpetas (obligatoria)

```
/public
  /css
  /js
    /services/       ← toda la comunicación con Firebase vive aquí
        auth.service.js
        reportes.service.js
        storage.service.js
    /ui/              ← renderizado y eventos de cada pantalla
        formulario.ui.js
        busqueda.ui.js
        reporte-card.ui.js
    /utils/           ← funciones puras, sin dependencias externas
        validaciones.js
        formato.js
    app.js            ← punto de entrada, conecta ui + services
  index.html
  buscar.html
  publicar.html
/docs
  mvp_scope.md
  data_model.md
  report_flow.md
  privacy_and_safety.md
```

> Si el proyecto crece y se justifica un framework (React), esta misma separación
> se traduce a `hooks/` (services) y `components/` (ui) — no se reescribe la lógica.

---

## 🧩 PRINCIPIOS DE CÓDIGO — OBLIGATORIOS

### KISS — Simplicidad ante todo

- La solución más simple que funcione es la correcta. No se introduce un framework,
  build tool o librería nueva sin que resuelva un problema real y actual.
- Nada de arquitecturas "por si acaso" — este es un MVP de emergencia, no un
  producto que se planea escalar a millones de usuarios.

### YAGNI — No construir lo que no se pidió

- No implementar chat interno, notificaciones push, ni multi-idioma — están
  fuera de alcance del MVP (ver `docs/mvp_scope.md`).
- No añadir campos al formulario que no estén en el modelo de datos aprobado.

### DRY (con matices)

- La lógica de validación (ej. "seña de verificación no puede estar vacía si es
  reporte encontrado") vive en `utils/validaciones.js`, nunca duplicada entre
  el formulario de crear y el de editar.
- Duplicación de HTML/CSS entre dos tarjetas es aceptable hasta el tercer caso
  idéntico — ahí se extrae a un componente/plantilla reutilizable.

### Un archivo, una responsabilidad

- Un archivo de `services/` no debería tocar el DOM.
- Un archivo de `ui/` no debería llamar directo a `firebase.firestore()`.

---

## 📵 MOBILE FIRST Y BAJO CONSUMO — OBLIGATORIO

> El contexto de uso real: personas en Cali, muchas con datos móviles limitados,
> señal inestable, o teléfonos de gama baja, en medio de una emergencia.
> Esto no es una preferencia de diseño — es un requisito funcional.

```
□ Diseño para 360-390px de ancho primero, escritorio es secundario
□ Imágenes de mascotas comprimidas antes de subir a Storage (máx ~300KB por foto)
□ Sin librerías pesadas de UI (nada de frameworks de componentes grandes)
□ Sin fuentes externas pesadas — usar fuentes del sistema cuando sea posible
□ Carga inicial de la página < 1MB idealmente
□ Funciona sin JavaScript avanzado (progressive enhancement básico) donde se pueda
□ Botones y campos de formulario grandes, fáciles de tocar con el pulgar
□ Nunca pedir datos que no son estrictamente necesarios para el reporte
```

### Estados de UI — Todos obligatorios

Toda pantalla con datos remotos implementa los 4 estados:

| Estado | Qué mostrar |
|--------|-------------|
| Cargando | Indicador simple, nunca pantalla en blanco |
| Vacío | Mensaje claro: "Aún no hay reportes en esta zona" + acción sugerida |
| Error | Mensaje claro + botón de reintentar (la conexión puede fallar) |
| Éxito | Contenido real |

**Nunca pantalla en blanco. Nunca spinner sin contexto — la gente puede estar en pánico, no hagas que dude si la app funciona.**

---

## 🔒 PRIVACIDAD Y SEGURIDAD — REGLAS CRÍTICAS (No negociables)

> Referencia: `docs/privacy_and_safety.md`. Este proyecto maneja datos personales
> (números de contacto, ubicación aproximada, fotos) bajo el marco general de la
> Ley 1581 de 2012 (protección de datos personales) en Colombia. Ante cualquier
> duda legal específica, consultar con una fuente legal actualizada — este
> documento no sustituye asesoría legal.

### Reglas de código derivadas del diseño de privacidad

```js
// ✅ CORRECTO — nunca exponer dirección exacta en el listado público
function renderReporteCard(reporte) {
  return `<p>${reporte.zona}</p>`; // solo barrio/zona
}

// ❌ NUNCA mostrar coordenadas exactas o dirección completa en la UI pública
function renderReporteCard(reporte) {
  return `<p>${reporte.direccionExacta}</p>`; // PROHIBIDO
}

// ✅ CORRECTO — la "seña de verificación privada" nunca se envía al cliente
// en la consulta pública de reportes (se excluye desde la query o desde
// las Security Rules de Firestore, no solo se oculta en la UI)
firestore.collection('reportes').select('tipo', 'zona', 'especie', 'fotoUrl');

// ❌ NUNCA traer el documento completo y ocultar el campo solo visualmente
// con CSS — un usuario puede leer el JSON de la respuesta de red
const reporte = await firestore.collection('reportes').doc(id).get(); // trae todo, MAL

// ✅ CORRECTO — contactar/publicar requiere sesión activa
if (!auth.currentUser) {
  mostrarLoginRequerido();
  return;
}
crearReporte(datos);

// ❌ NUNCA permitir crear reporte o ver botón de contacto sin sesión
```

### Reglas absolutas

1. **Nunca se muestra dirección exacta ni coordenadas precisas** en ningún listado
   o tarjeta pública — solo zona/barrio. La ubicación exacta se comparte fuera de
   la plataforma (WhatsApp), entre las dos partes ya en contacto.
2. **La seña de verificación privada nunca viaja al cliente** en las consultas
   de búsqueda pública — se protege también a nivel de Firestore Security Rules,
   no solo ocultándola en la interfaz.
3. **Publicar y contactar requieren sesión (Google) activa.** Buscar y ver
   reportes NO requiere sesión.
4. **El paso a "Reunido" requiere confirmación de ambas cuentas involucradas**,
   nunca de una sola parte unilateralmente (ver `docs/report_flow.md`).
5. **Todo reporte tiene botón de "Reportar este anuncio"**, visible siempre,
   sin excepción.
6. **Límite de reportes activos por cuenta** (3 perdidos, 3 encontrados, 3 adopción, tope global 9) aplicado
   en Firestore rules o Cloud Function. No confiar solo en el frontend.
7. **Minimización de datos.** No se agregan campos al formulario que no estén
   en `docs/data_model.md` "por si sirven después".
8. **Sin analítica de terceros que perfile usuarios** (nada de ad SDKs ni
   trackers de comportamiento) — esto es una herramienta de ayuda, no un producto
   con modelo de negocio publicitario.

---

## 🎨 DISEÑO — PRINCIPIOS

- **Una pantalla, un objetivo.** Publicar un reporte no debería compartir pantalla
  con buscar reportes.
- **Elegir antes que escribir.** Usar `<select>`/chips para especie, tamaño, tipo
  de publicación — reduce errores de tipeo y es más rápido en móvil.
- **Transmitir calma.** El público está en una situación de estrés/emergencia:
  colores neutros, mensajes claros y directos, nada de tono alarmista o llamativo
  innecesario.
- **Accesibilidad básica**: contraste suficiente, textos alternativos en imágenes,
  tamaños de fuente legibles (mínimo 16px en formularios).

---

## 🔄 PROCESO ESTÁNDAR PARA CUALQUIER TAREA

### Tarea pequeña (1-2 archivos)

```
1. Leer archivo completo
2. Ejecutar cambio
3. Probar en vista móvil (DevTools, 360px)
4. Confirmar que no rompe nada existente
```

### Tarea mediana/grande (feature nuevo, > 2 archivos)

```
1. Leer docs/mvp_scope.md, docs/data_model.md, docs/report_flow.md según aplique
2. Escribir mini-spec (qué / por qué / qué no incluye)
3. Presentar plan ordenado: modelo de datos → servicio → UI
4. Esperar aprobación
5. Ejecutar un sub-paso a la vez
6. Probar en móvil después de cada sub-paso
```

---

## 🚫 REGLAS DE REFACTORIZACIÓN

1. **No cambiar el comportamiento funcional** sin aprobación explícita.
2. **No eliminar lógica de validación o privacidad** — solo moverla o encapsularla.
3. **No introducir dependencias/librerías nuevas** sin justificación clara y
   verificación de que no infla el peso de la página de forma importante.
4. **No mezclar capas** — nunca llamar Firebase directo desde un archivo de `ui/`.

---

## 🛡️ COSAS QUE ESTE AGENTE NUNCA HACE

1. No expone dirección exacta ni coordenadas precisas en ningún listado público.
2. No permite crear reporte o contactar sin sesión activa.
3. No cierra un caso como "Reunido" sin confirmación de ambas partes.
4. No agrega campos al formulario fuera de `docs/data_model.md` sin aprobación.
5. No introduce frameworks o librerías pesadas sin justificación explícita.
6. No construye funcionalidad fuera del MVP (`docs/mvp_scope.md`) sin aprobación.
7. No hace todo de una vez — un sub-paso a la vez, con verificación en móvil.
8. No genera código sin leer primero el archivo a modificar.
9. No implementa analítica de terceros ni trackers de comportamiento.
10. No sube fotos sin comprimir — el consumo de datos del usuario importa.

---

## 📋 CHECKLIST PRE-COMMIT

```
□ Probado en viewport móvil (360-390px)
□ Sin errores en consola del navegador
□ Sin dirección exacta / coordenadas expuestas en el HTML o en la respuesta de red
□ Seña de verificación privada excluida de las consultas públicas
□ Botón "Reportar este anuncio" presente en toda tarjeta de reporte
□ Publicar y contactar exigen sesión activa; buscar no la exige
□ Los 4 estados de UI (cargando/vacío/error/éxito) cubiertos si aplica
□ Imágenes comprimidas antes de subir
□ Sin dependencias nuevas sin justificar
□ docs/ actualizado si cambió el modelo de datos o el flujo de estados
```

---

## 📐 NOMENCLATURA

| Artefacto | Patrón | Ejemplo |
|-----------|--------|---------|
| Servicio | `xxx.service.js` | `reportes.service.js` |
| UI de pantalla | `xxx.ui.js` | `formulario.ui.js` |
| Utilidad pura | descriptivo | `validaciones.js` |
| Página HTML | `xxx.html` | `publicar.html` |
| Mini-spec | dentro del commit/PR | — |

---

## 📚 REFERENCIA RÁPIDA — DOCUMENTACIÓN DEL PROYECTO

| Qué necesitas | Documento |
|---------------|-----------|
| Qué entra y qué NO entra en el MVP | `docs/mvp_scope.md` |
| Campos y estructura de datos en Firestore | `docs/data_model.md` |
| Estados de un reporte y transiciones | `docs/report_flow.md` |
| Reglas de privacidad y anti-fraude | `docs/privacy_and_safety.md` |

---

*Este archivo es la fuente de verdad operativa de Huellas a Casa.*
*Actualizar cuando cambien decisiones técnicas o de producto fundamentales.*
*Versión 1.0 — Agosto 2026 — HTML/CSS/JS + Firebase*