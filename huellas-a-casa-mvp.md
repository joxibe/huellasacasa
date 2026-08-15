# Huellas a Casa

Plataforma para reportar y buscar mascotas perdidas o encontradas en Cali tras el terremoto del 10 de agosto de 2026.

## 1. Objetivo

Conectar a personas que perdieron una mascota con personas que encontraron una, de forma rápida, gratuita y fácil de mantener, sin duplicar los esfuerzos oficiales de búsqueda de personas (Colombia Te Busca, Cruz Roja, Asocapitales), que quedan fuera del alcance de este proyecto.

## 2. Usuarios

- **Visitante (sin cuenta):** puede buscar y filtrar reportes libremente. No puede publicar ni contactar.
- **Usuario registrado (login con Google):** puede crear reportes, editarlos/actualizarlos, y contactar a otros usuarios.

## 3. Flujo principal

1. Alguien pierde o encuentra una mascota, o busca hogar para una rescatada.
2. Inicia sesión con Google y publica un reporte eligiendo entre: **Perdí mi mascota**, **Encontré una mascota** o **Dar en adopción**.
3. Cualquier visitante puede buscar y filtrar reportes por ciudad, zona, especie, estado, etc.
4. Si alguien tiene información o desea adoptar, inicia sesión y pulsa **Contactar** → se abre WhatsApp (`wa.me`) con el mensaje contextual preformateado.
5. **Cierre directo de caso:** Si el dueño encuentra a su mascota por sus propios medios, pulsa `🐾 Ya regresó a casa` en "Mis Reportes" para cerrar el caso a **Reunido** y liberar su cupo al instante.
6. **Coincidencias comunitarias:** Cuando dos reportes (uno "perdido" y uno "encontrado") parecen coincidir, cualquier usuario puede sugerir el Match mediante el ID único. Ambas partes validan la tarjeta comparativa y, si aprueban, se confirma y se marca como **Reunido** liberando los cupos de ambos.
7. **Paso a Adopción:** Si un reporte "encontrado" no tiene reclamo tras 20+ días de custodia, el autor puede pasarlo a **En adopción**.
8. **Cierre de Adopción:** Cuando la mascota es entregada a su familia definitiva, se marca como **Adoptado** liberando el cupo.

## 4. Estados de un reporte

| Estado | Descripción |
|---|---|
| Perdido | Reporte creado por el dueño, buscando a su mascota |
| Encontrado | Reporte creado por quien halló una mascota sin dueño identificado |
| Coincidencia sugerida | Un usuario vinculó este reporte con otro mediante ID |
| Confirmado por ambas partes | Las dos cuentas involucradas validaron mutuamente la coincidencia |
| Reunido | Caso cerrado exitosamente, mascota recuperada por su dueño (libera cupo) |
| En adopción | Mascota en adopción responsable (publicada directo o convertida tras 20+ días) |
| Adoptado | Mascota entregada con éxito a un hogar definitivo (libera cupo) |

## 5. Campos del formulario de reporte

### Comunes a todos los tipos
- Tipo de publicación: `Perdido` / `Encontrado` / `En adopción` *(obligatorio, define el formulario)*
- Foto *(obligatoria, 1 foto comprimida automáticamente en cliente a <300KB)*
- Especie: `Perro` / `Gato` / `Otro`
- Tamaño: `Pequeño` / `Mediano` / `Grande`
- Sexo: `Macho` / `Hembra` / `No sé`
- Color(es)
- Raza *(opcional)*
- Nombre *(opcional — en Encontrado puede no saberse)*
- Ciudad o Municipio *(obligatorio, selector multiciudad + opción personalizada)*
- Zona / barrio *(no dirección exacta, por seguridad)*
- Fecha en que se perdió / encontró / inició resguardo
- Señas particulares visibles *(collar, cicatrices, manchas — público)*
- **Seña de verificación privada** *(almacenada en subcolección protegida `/privado/seguridad`, solo visible para el autor, usada para validar identidad antes de acordar la entrega)*
- **Número y medio de contacto** *(almacenados en subcolección `/privado/contacto`, protegidos por Firestore Rules, legibles solo por usuarios autenticados al pulsar "Contactar")*

### Exclusivo de "Perdido"
- Nombre del dueño *(opcional)*

### Exclusivo de "Encontrado"
- ¿La mascota necesita atención veterinaria urgente? `Sí` / `No`
- ¿Está en un lugar temporal seguro o sigue suelta? `En casa temporal` / `Suelta en la zona`

### Exclusivo de "En adopción"
- ¿Está esterilizado/a? `Sí` / `No` / `No sé / Por confirmar`
- ¿Vacunación al día? `Sí` / `Parcial` / `No sé / Por confirmar`

## 6. Filtros de búsqueda

Corresponden 1:1 a los campos del formulario para que cualquier visitante pueda encontrar rápido lo que busca:
- Tipo / Estado (Todos / Perdido / Encontrado / Coincidencias / Reunidos / En adopción / Adoptados)
- Especie (Todos / Perro / Gato / Otro)
- Zona / barrio (Búsqueda por texto)
- Ciudad (Selector multiciudad)
- Fecha (orden descendente por defecto)

## 7. Medidas contra fraude, robo de mascotas y spam

- La dirección exacta **nunca se muestra públicamente** — solo zona/barrio. La ubicación precisa se comparte en el chat privado de WhatsApp una vez ambas partes ya se contactaron.
- **Datos de contacto protegidos:** El teléfono y canal preferido no viajan en el documento público de lectura. Viven en la subcolección `/privado/contacto` y solo se entregan cuando un usuario autenticado pulsa "Contactar por WhatsApp".
- **Seña de verificación privada:** solo el publicador la ve. Cuando alguien dice "es mi mascota" o "yo la tengo", se le pide describir esa seña antes de recibir la ubicación exacta.
- Cuenta vinculada a **Google real**, no anónima — dificulta la creación masiva de cuentas falsas y bots.
- Botón de **"Reportar este anuncio"** visible en cada publicación para moderación comunitaria.
- **Sistema de Cuotas Diferenciadas (Máx 9 reportes activos por cuenta):**
  - **3 reportes para "Perdí mi mascota"**: Espacio pensado para familias afectadas.
  - **3 reportes para "Encontré una mascota"**: Espacio para rescatistas y vecinos solidarios.
  - **3 reportes para "Dar en adopción"**: Espacio para albergues temporales y adopción responsable.
  - Al cerrarse cualquier caso (`reunido` o `adoptado`), el cupo de esa categoría se libera de inmediato en tiempo real.
- El cierre a "Reunido" en casos vinculados **requiere confirmación bilateral de ambas cuentas involucradas**, nunca de una sola parte.

*Nota: ninguna de estas medidas elimina el riesgo por completo — como en cualquier plataforma de contacto entre desconocidos — pero reduce significativamente la fricción para un mal actor.*

## 8. Stack técnico (gratuito y fácil de mantener)

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | HTML/CSS/JS (o React) | Simple, rápido de desplegar, gratis en Vercel/Netlify |
| Autenticación | Firebase Auth (Google) | Gratis, sin manejar contraseñas, identidad real |
| Base de datos | Firebase Firestore | Gratis en plan Spark, tiempo real, fácil de consultar/filtrar |
| Fotos | Firebase Cloud Storage | Fotos comprimidas (<300KB) alojadas en Storage con URL pública optimizada |
| Hosting | Firebase Hosting | Gratis, HTTPS automático, CDN global |
| Contacto | Enlace `wa.me` | Sin chat propio que mantener |

Este mismo backend (Firebase) se puede reutilizar el día que se decida construir una app móvil (Flutter, React Native, etc.), sin tener que migrar datos.

## 9. Qué NO incluye este MVP (fuera de alcance por ahora)

- Chat interno en la plataforma (se usa WhatsApp externo)
- Verificación automática de fotos (ej. reconocimiento de imágenes)
- Notificaciones push
- Traducción / multi-idioma
- Panel de administración avanzado (moderación manual al inicio)

## 10. Próximos pasos

1. Crear proyecto nuevo en Firebase (Auth + Firestore + Storage + Hosting)
2. Diseñar la estructura de datos en Firestore (colección `reportes`)
3. Construir el formulario de publicación con los campos de la sección 5
4. Construir la vista de búsqueda/filtro (sección 6)
5. Implementar el flujo de coincidencia + confirmación mutua (sección 3, pasos 5-6)
6. Desplegar y compartir el enlace
