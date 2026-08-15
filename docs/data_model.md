# Modelo de Datos — Huellas a Casa

> **Base de Datos:** Firebase Firestore  
> **Almacenamiento de Fotos:** Firebase Storage  
> **Regla de Compresión:** El cliente comprime las fotos a `<300KB` (target óptimo para 3G), mientras que las reglas de `storage.rules` imponen un techo de seguridad de `<500KB` para evitar rechazos por variaciones menores.

---

## 📂 Colección Principal: `reportes` (`/reportes/{reporteId}`)

Documento público accesible para búsqueda y visualización. **Nunca incluye dirección exacta, datos de contacto ni la seña de verificación privada**.

```json
{
  "id": "rep_abc123",
  "tipo": "perdido",               // "perdido" | "encontrado" | "en_adopcion"
  "estado": "perdido",             // "perdido" | "encontrado" | "coincidencia_sugerida" | "confirmado_ambas_partes" | "reunido" | "en_adopcion" | "adoptado"
  "especie": "perro",              // "perro" | "gato" | "otro"
  "tamano": "mediano",             // "pequeno" | "mediano" | "grande"
  "sexo": "macho",                 // "macho" | "hembra" | "no_se"
  "color": "Negro con pecho blanco",
  "raza": "Mestizo",               // Opcional
  "nombre": "Toby",                // Opcional (puede no saberse si es encontrado)
  "ciudad": "Cali",                // Nombre de la ciudad/municipio (Agrupada o personalizada vía 'Otra')
  "ciudadLower": "cali",           // Normalizado con normalizarTexto() (minúsculas + sin tildes) para queries en Firestore
  "barrio": "San Antonio",         // Texto libre opcional (NUNCA dirección exacta)
  "barrioLower": "san antonio",    // Normalizado con normalizarTexto() para filtro en cliente
  "fechaEvento": "2026-08-11",     // Fecha en que se perdió o encontró
  "senasVisibles": "Collar rojo sin placa, mancha en oreja derecha",
  "fotoUrl": "https://firebasestorage.googleapis.com/.../foto_rep_abc123.jpg",
  "fotoPath": "reportes/rep_abc123_1723500000.jpg",
  "nombrePublicador": "Carlos D.", // Opcional / primer nombre

  // Exclusivo de "encontrado"
  "necesitaVet": false,            // boolean
  "situacionLugar": "en_casa_temporal", // "en_casa_temporal" | "suelta_en_zona"

  // Metadatos de auditoría y autor (Sin correo expuesto)
  "creadorUid": "usr_google_xyz987",
  "coincidenciaConReporteId": null,// ID del reporte con el que se sugiere coincidencia
  "confirmadoPorCreador": false,
  "confirmadoPorContraparte": false,
  "fechaCreacion": "2026-08-13T18:00:00.000Z",
  "fechaActualizacion": "2026-08-13T18:00:00.000Z"
}
```

---

## 📞 Subcolección Protegida: `contacto` (`/reportes/{reporteId}/privado/contacto`)

Aislada del documento público. **Solo usuarios autenticados (`request.auth != null`) pueden leerla para contactar al publicador. Solo el creador puede escribir**.

```json
{
  "telefonoContacto": "+573001234567",
  "medioContacto": "whatsapp",     // "whatsapp" | "llamada" | "ambos"
  "creadorUid": "usr_google_xyz987",
  "creadoEn": "2026-08-13T18:00:00.000Z"
}
```

---

## 🔒 Subcolección Privada: `seguridad` (`/reportes/{reporteId}/privado/seguridad`)

Aislada de la consulta pública y del contacto. **ÚNICAMENTE el creador del reporte (`request.auth.uid == creadorUid`) puede leer y escribir este documento**.

```json
{
  "senaVerificacionPrivada": "Tiene una cicatriz debajo de la pata trasera izquierda",
  "creadorUid": "usr_google_xyz987",
  "creadoEn": "2026-08-13T18:00:00.000Z"
}
```

---

## 👤 Colección: `usuarios` (`/usuarios/{uid}`)

Control del perfil y de la cuota diferenciada de reportes activos por cuenta (Máx: 3 perdidos + 3 encontrados + 3 en adopción = 9 en total).

```json
{
  "uid": "usr_google_xyz987",
  "nombre": "Carlos Devia",
  "email": "usuario@gmail.com",
  "fotoPerfil": "https://lh3.googleusercontent.com/...",
  "reportesActivosCount": 1,        // Conteo total activo (Máximo total: 9)
  "perdidosActivosCount": 1,        // Límite máximo: 3 reportes tipo perdido
  "encontradosActivosCount": 0,     // Límite máximo: 3 reportes tipo encontrado
  "adopcionActivosCount": 0,        // Límite máximo: 3 reportes tipo en_adopcion
  "creadoEn": "2026-08-13T15:00:00.000Z",
  "ultimoAcceso": "2026-08-13T18:00:00.000Z"
}
```

---

## ⚠️ Colección Protegida: `reportes_abuso` (`/reportes_abuso/{reporteId}_{usuarioUid}`)

Registro de alertas comunitarias para moderación. Protegido en `firestore.rules` con `allow read: if false;` (solo accesible por el administrador en Firebase Console).
El ID del documento es determinista (`${reporteId}_${usuarioUid}`) para evitar que una misma cuenta infle artificialmente las denuncias sobre un mismo caso.

```json
{
  "reporteId": "rep_abc123",
  "usuarioDenuncianteUid": "usr_google_denunciante",
  "usuarioDenuncianteEmail": "denunciante@gmail.com",
  "motivo": "spam_o_fraude",        // "spam_o_fraude" | "foto_inapropiada" | "datos_falsos" | "otro"
  "comentario": "Este anuncio parece duplicado",
  "fechaCreacion": "2026-08-13T19:00:00.000Z"
}
```
