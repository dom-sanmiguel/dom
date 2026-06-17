# Resumen de sesión de desarrollo — DOM en Línea
**Fecha:** Junio 2026  
**Proyecto:** Portal DOM en Línea — Municipalidad de Doñihue  
**Repositorio:** https://github.com/DomDonihue/dom

---

## ✅ Cambios realizados en esta sesión

### 1. Consentimiento de datos personales (Ley N° 19.628)
- Agregado checkbox de autorización para el RUT
- Configurable desde `municipio_config.json` → bloque `consentimiento`
- Texto con marcadores `{municipalidad}` y `{datos}` reemplazados dinámicamente
- Registro de fecha/hora de autorización en el PDF generado
- Los botones se bloquean si el consentimiento no está marcado

### 2. Eliminación de config.js
- Eliminado `config.js` — ya no existe
- **Un solo archivo de configuración:** `municipio_config.json`
- Otros municipios solo editan ese archivo, sin tocar HTML ni JS

### 3. Mapa satelital híbrido (Esri)
- Reemplazado OpenStreetMap por **Esri World Imagery** (satelital)
- Overlay de calles: `World_Transportation` + `World_Boundaries_and_Places`
- Control para cambiar entre **Satelital + Calles** / **Solo Calles (OSM)**
- Mapa ampliado a 520px de alto, ancho completo

### 4. Demarcación de deslindes del predio (Leaflet.draw)
- Barra de herramientas con **Polígono** y **Rectángulo**
- Solo un trazado a la vez (reemplaza el anterior)
- Botones Editar / Eliminar en español
- GeoJSON de los deslindes guardado en campo oculto `#limitesPropiedad`
- Panel "Deslindes del predio" con badge Demarcado ✓ / Sin demarcar

### 5. Mini-mapa de previsualización en el formulario
- Al dibujar deslindes aparece un **mini-mapa satelital de solo lectura** en el formulario
- Zoom ajustado automáticamente al polígono dibujado
- Muestra el trazado rojo sobre imagen satelital

### 6. Polígono en el PDF generado
- Los deslindes se dibujan **directamente sobre el PDF** con pdf-lib
- Líneas rojas + puntos en cada vértice proyectados desde coordenadas GPS
- Nota en el pie: "Deslindes demarcados en el croquis (N vértices)"
- Independiente de html2canvas (que no renderiza bien SVG)

### 7. Control Urbano / Rural
- **Auto-detección** de zona urbana/rural desde la respuesta de Nominatim
  - `city`, `town`, `suburb` → Urbano
  - `village`, `hamlet`, `farm` → Rural
- Actualiza automáticamente el campo "Tipo de zona" del formulario
- Sin selector manual visible

### 8. Herramienta mover mapa (✋)
- Botón en la barra de herramientas que cancela el modo dibujo y restaura el cursor de arrastre

### 9. Validaciones del formulario
- **RUT chileno:** validación completa con dígito verificador (módulo 11), formato automático
- **Teléfono:** exactamente 9 dígitos numéricos
- **Checkbox sin número / S.N.:** bloquea el campo número y escribe "S/N" en el PDF

### 10. Hero configurable desde JSON
- Bloque `hero` en `municipio_config.json`
- Configurable: eyebrow, título, subtítulo, descripción (array de líneas), botón, indicadores
- La descripción acepta array de strings para facilitar edición

### 11. Publicación en GitHub
- Repositorio: https://github.com/DomDonihue/dom
- Remote cambiado de `Keno38/dom-en-linea` a `DomDonihue/dom`
- GitHub Pages activo

---

## 📁 Archivos del proyecto

| Archivo | Rol |
|---|---|
| `index.html` | Estructura HTML — no modificar |
| `script.js` | Lógica completa — no modificar |
| `style.css` | Estilos — no modificar |
| `municipio_config.json` | **ÚNICO ARCHIVO A EDITAR** |
| `img/logomuni.png` | Logo municipal |
| `img/hero.png` | Imagen banner |
| `img/video/VideoDOM.mp4` | Video informativo |
| `img/Doc/cip_base.pdf` | Plantilla PDF del formulario |

---

## 📦 Dependencias (CDN, sin instalación)

| Librería | Versión | Uso |
|---|---|---|
| Leaflet.js | 1.9.4 | Mapa interactivo |
| Leaflet.draw | 1.0.4 | Herramienta de dibujo de deslindes |
| html2canvas | 1.4.1 | Captura del mapa para PDF |
| pdf-lib | 1.17.1 | Generación del formulario PDF |
| Nominatim (OSM) | API pública | Búsqueda y geocodificación inversa |
| Esri (ArcGIS) | CDN público | Capas satelital, calles y etiquetas |

---

## 📄 Manuales generados

- `INSTRUCTIVO_IMPLEMENTACION_DOM_v3.docx` — Manual técnico completo (12 secciones)
- `INSTRUCTIVO_IMPLEMENTACION_DOM_v4.docx` — Manual con índice completo (15 secciones + conclusión)

---

## 🔧 Secciones de municipio_config.json

```
_meta            → Metadatos del archivo
municipalidad    → Nombre, región, logo, contacto
hero             → Título, subtítulo, descripción, botón, indicadores del banner
mapa             → Centro, zoom, filtros de búsqueda
certificados     → Lista de certificados del acordeón
documentos       → Tarjetas de documentos descargables
faq              → Preguntas frecuentes
pdf              → Ruta base + posiciones de cada campo en el formulario
consentimiento   → Texto, ley, campos, obligatorio, registro en PDF
```
