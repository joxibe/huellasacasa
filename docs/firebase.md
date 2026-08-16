# Guía de Firebase — Huellas a Casa

Referencia rápida de cómo funciona el despliegue, qué hace cada comando, y
conceptos clave para no perderse. Pensado para volver a leerlo cuando pase
tiempo y se te olvide el flujo.

## 1. El modelo mental correcto

```
Tu computadora (código local)
        │
        ├──── firebase deploy ────────────►  Firebase (Hosting, Rules, etc.)
        │                                     (el link público real)
        │
        └──── git push ───────────────────►  GitHub
                                              (solo respaldo/historial,
                                               NO despliega nada por sí solo)
```

**GitHub y Firebase son independientes** a menos que configures explícitamente
la integración (ver sección 5). Hacer el repo de GitHub privado o público
**no afecta en nada** tu capacidad de desplegar con `firebase deploy`.

## 2. Comandos que ya usaste (y qué hacen)

| Comando | Qué hace |
|---|---|
| `firebase login` | Inicia sesión en el CLI con tu cuenta de Google (la dueña del proyecto). Solo se hace una vez por máquina. |
| `firebase init` | Configura QUÉ servicios de Firebase usa tu carpeta local (Firestore, Storage, Hosting, Emulators...) y crea `firebase.json` / `.firebaserc`. |
| `firebase deploy` | Sube TODO lo que esté configurado en `firebase.json` (reglas, índices, hosting, todo junto). |
| `firebase deploy --only hosting` | Sube SOLO los archivos estáticos (HTML/CSS/JS) al link público. No toca reglas ni índices. |
| `firebase deploy --only firestore:rules` | Sube SOLO `firestore.rules`, sin tocar el resto. |
| `firebase deploy --only storage` | Sube SOLO `storage.rules`. |
| `firebase deploy --only firestore:indexes` | Sube SOLO `firestore.indexes.json` (los índices compuestos para queries con filtros combinados). |
| `firebase emulators:start` | Levanta Firestore/Auth/Storage SIMULADOS en tu máquina, sin tocar el proyecto real. Panel visual en `http://localhost:4000`. |
| `firebase emulators:exec "comando"` | Levanta los emuladores, corre el comando indicado (normalmente tus tests), y los apaga automáticamente al terminar. |

**Regla práctica:** usa `--only algo` cuando solo cambiaste esa pieza (por
ejemplo, solo tocaste `firestore.rules`) — es más rápido y reduce el riesgo
de tocar algo que no querías. Usa `firebase deploy` sin `--only` cuando
cambiaste varias cosas a la vez y quieres que todo quede sincronizado.

## 3. Errores comunes que ya viviste (y su causa)

| Error | Causa real |
|---|---|
| `Cannot understand what targets to deploy... '--only hosting.'` | Un punto (`.`) de más pegado al final del comando — revisa que no haya caracteres extra al copiar/pegar. |
| `No targets in firebase.json match 'hosting'` | Nunca corriste `firebase init hosting`, así que `firebase.json` no tiene esa sección configurada todavía. |
| `auth/unauthorized-domain` | El dominio desde el que abres la página no está en Firebase Console → Authentication → Settings → Authorized domains. `127.0.0.1` NO cuenta como `localhost` para este propósito. |
| Login y Firestore fallan con el mismo mensaje genérico | Casi siempre significa que el SDK de Firebase nunca se inicializó (`window.firebase` no existe) — revisa que los `<script>` de Firebase estén en el HTML, en orden, antes de tu propio código. |

## 4. Antes de cada deploy — checklist rápido

```
□ npm test                        → lógica JS en verde
□ npm run test:rules:firestore    → reglas de Firestore en verde
□ npm run test:rules              → reglas de Storage en verde
□ Probado en localhost sin errores en consola
□ firebase deploy --only hosting  (o el target específico que cambió)
□ Abrir el link público real y repetir la prueba manual (no confiar en que
  "si funcionó en local, funciona en producción" — ya nos pasó que no)
```

## 5. GitHub Action para despliegue automático (opcional, para más adelante)

Cuando quieras que cada `git push` a `main` despliegue solo, sin correr
`firebase deploy` a mano cada vez:

```
firebase init hosting:github
```

Esto crea un archivo `.github/workflows/firebase-hosting-merge.yml` y guarda
una credencial de servicio como "Secret" en GitHub (invisible incluso en un
repo privado, y funciona igual de bien privado que público). A partir de ahí,
cada vez que hagas `git push` a `main`, GitHub construye y despliega
automáticamente.

**Recomendación:** no actives esto hasta haber probado el flujo completo
manualmente en el link público al menos una vez. Automatizar antes de saber
que el código funciona en producción solo significa que, si algo falla, se
publica solo y más rápido.

## 6. Comandos de diagnóstico útiles

| Comando | Para qué |
|---|---|
| `firebase projects:list` | Ver a qué proyecto de Firebase está conectada tu carpeta actual. |
| `firebase use` | Ver o cambiar el proyecto activo si manejas varios. |
| `firebase deploy --only hosting --debug` | Igual que un deploy normal, pero muestra mucho más detalle si algo falla. |
| `firebase hosting:channel:list` | Ver los links de "vista previa" que Firebase pudo haber generado (útil si sospechas que estás viendo una versión vieja). |

## 7. Glosario mínimo

- **Hosting**: el servicio que sirve tus archivos `.html/.css/.js` al público, con un link real.
- **Rules (`.rules`)**: las reglas de seguridad de Firestore/Storage — quién puede leer/escribir qué.
- **Indexes (`.indexes.json`)**: configuración necesaria para que Firestore pueda responder rápido a consultas que combinan varios filtros a la vez (ej. ciudad + tipo + orden por fecha).
- **Emulator Suite**: una copia simulada de Firebase que corre en tu propia máquina, para probar sin tocar los datos reales de producción.
- **Blaze**: el plan de pago-por-uso de Firebase (necesario para Storage desde 2026), que sigue siendo gratis mientras te mantengas dentro de los límites del nivel gratuito.

---

## 8. Gestión de Denuncias y Moderación en la Consola

1. **Panel de Denuncias:**
   - Ingresa a [https://console.firebase.google.com/project/huellasacasa-23651/firestore/data/~2Freportes_abuso](https://console.firebase.google.com/project/huellasacasa-23651/firestore/data/~2Freportes_abuso).
   - Cada documento contiene el `reporteId`, `motivo`, `comentario` y el correo del denunciante.
2. **Inspección y Moderación:**
   - Abre la URL: `https://huellasacasa-23651.web.app/detalle.html?id={reporteId}`.
   - Para eliminar un caso fraudulento, bórralo en la colección `/reportes/{reporteId}` y su foto en la pestaña **Storage**.
   - Borra el documento en `/reportes_abuso` para archivar la denuncia.
3. **Recepción Automática de Alertas por Correo (Post-MVP):**
   - Puedes instalar la extensión oficial **"Trigger Email from Firestore"** en la consola de Firebase configurando tu correo `jxrosero3@gmail.com` para recibir alertas inmediatas cuando se cree un documento en `/reportes_abuso`.

---

## 9. Políticas de Caché y Rendimiento de Red

Para garantizar que la web cargue al instante sin consumir datos móviles innecesarios y sin atascar a los usuarios en versiones desactualizadas tras un deploy:

1. **Documentos HTML (`firebase.json`):**
   - Cabecera: `Cache-Control: no-cache, must-revalidate`.
   - **Efecto:** El navegador siempre revalida con el servidor si hay una versión nueva tras un `firebase deploy`, pero **permite el Back-Forward Cache (bfcache)** del navegador, evitando recargas completas al pulsar "Atrás".
2. **Archivos Estáticos JS/CSS (`firebase.json`):**
   - Cabecera: `Cache-Control: no-cache, must-revalidate`.
3. **Fotos en Cloud Storage (`storage.service.js`):**
   - Cabecera de metadatos: `cacheControl: 'public, max-age=604800'` (7 días).
   - **Efecto:** Cada foto de mascota se descarga **una sola vez** (~140KB) y se sirve desde la memoria/disco del teléfono en **0 ms** durante 7 días.
4. **Script de Migración de Caché (`scripts/actualizar-cache-fotos.js`):**
   - Actualiza en lote el metadato `cacheControl` de todos los archivos existentes bajo `reportes/` en Cloud Storage. Ejecutable con: `node scripts/actualizar-cache-fotos.js`.

---

## 10. URLs Limpias (`cleanUrls`) y la Etiqueta `<base href="/">`

En `firebase.json`, se encuentra activa la directiva:
```json
"hosting": {
  "cleanUrls": true
}
```

### ⚠️ Regla de Arquitectura Crítica: NUNCA eliminar `<base href="/">` de los archivos HTML

- **¿Qué hace `cleanUrls: true`?** Transforma las rutas visibles del navegador de `/mis-reportes.html` a `/mis-reportes` (eliminando la extensión `.html` de la URL).
- **El problema con las rutas relativas:** Cuando el navegador está en una URL limpia como `/mis-reportes`, cualquier recurso con ruta relativa (ej. `<link href="public/css/theme.css">` o `import './public/js/app.js'`) intenta resolverse contra `/mis-reportes/public/...` en lugar de la raíz `/public/...`, provocando errores 404 y demoras críticas en la inicialización de Firebase Auth.
- **La solución permanente:** Cada archivo HTML contiene `<base href="/" />` en el `<head>`. Esto fuerza a que **absolutamente todos** los estilos, scripts modulares, fuentes y assets se resuelvan siempre desde la raíz del dominio (`/`), garantizando que la sesión cargue al instante y sin parpadeos.