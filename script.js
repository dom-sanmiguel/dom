/* certificados y accordion se resuelven en iniciarApp(), tras cargar municipio_config.json */
let certificados = [];

function crearAcordeon() {
  const accordion = document.getElementById("certificadosAccordion");
  if (!accordion) return;
  certificados.forEach((certificado, index) => {
    const item = document.createElement("div");
    item.className = "accordion-item";

    item.innerHTML = `
      <button class="accordion-header" type="button">
        <div class="accordion-title-wrap">
          <div class="accordion-badge">📄</div>
          <div>
            <h3 class="accordion-title">${certificado.nombre}</h3>
            <p class="accordion-subtitle">Plazo referencial: ${certificado.plazo}</p>
          </div>
        </div>
        <div class="accordion-arrow">⌄</div>
      </button>

      <div class="accordion-content">
        <div class="accordion-grid">
          <div class="info-box">
            <h4>Descripción</h4>
            <p>${certificado.descripcion}</p>
          </div>

          <div class="info-box">
            <h4>Documentos requeridos</h4>
            <ul>
              ${certificado.documentos.map(doc => `<li>${doc}</li>`).join("")}
            </ul>
          </div>
        </div>

    <div class="accordion-actions">
  ${certificado.formulario ? `
    <a class="btn btn-outline" href="${certificado.formulario}" target="_blank">
      Ver formulario
    </a>
  ` : ""}

  <a class="btn btn-accent" href="https://domenlinea.minvu.cl/" target="_blank">
    Ir a DOM en Línea
  </a>
</div>

</div>
`;

    const header = item.querySelector(".accordion-header");
    header.addEventListener("click", () => {
      item.classList.toggle("active");
    });

    accordion.appendChild(item);
  });
}

/* CONFIGURACIÓN GENERAL */

function obtenerConfigDom(clave, valorPorDefecto) {
  if (window.DOM_CONFIG && Object.prototype.hasOwnProperty.call(window.DOM_CONFIG, clave)) {
    return window.DOM_CONFIG[clave];
  }
  return valorPorDefecto;
}

function obtenerPosicionPdf(clave, valorPorDefecto) {
  const posiciones = obtenerConfigDom("posicionesPdf", {});
  return posiciones && posiciones[clave] ? posiciones[clave] : valorPorDefecto;
}

function asignarValor(id, valor, sobrescribir = true) {
  const elemento = document.getElementById(id);
  if (!elemento || valor === undefined || valor === null || String(valor).trim() === "") return;

  if (sobrescribir || !elemento.value.trim()) {
    elemento.value = String(valor).trim();
  }
}

function extraerNumeroDireccion(texto) {
  if (!texto) return "";
  const coincidencia = String(texto).match(/\b\d{1,6}[A-Za-z]?\b/);
  return coincidencia ? coincidencia[0] : "";
}

function limpiarCalle(calle) {
  if (!calle) return "";
  return String(calle)
    .replace(/\s+/g, " ")
    .trim();
}

function obtenerLocalidadDesdeAddress(address = {}) {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    address.county ||
    address.suburb ||
    obtenerConfigDom("localidadPredeterminada", "") ||
    obtenerConfigDom("comunaBusqueda", "")
  );
}

function autocompletarDireccionFormulario(address = {}, textoBusqueda = "") {
  const calle = limpiarCalle(
    address.road ||
    address.pedestrian ||
    address.residential ||
    address.footway ||
    address.path ||
    address.neighbourhood ||
    ""
  );

  const numero = address.house_number || extraerNumeroDireccion(textoBusqueda);
  const localidad = obtenerLocalidadDesdeAddress(address);
  const zonaPredeterminada = obtenerConfigDom("zonaPredeterminada", "");

  asignarValor("calle", calle, true);
  asignarValor("numero", numero, true);
  const checkSinNumero = document.getElementById("sinNumero");

if (checkSinNumero && checkSinNumero.checked) {
  asignarValor("numero", "S/N", true);
} else {
  asignarValor("numero", numero, true);
}

  asignarValor("localidad", localidad, true);

  const zona = document.getElementById("zona");
  if (zona && zonaPredeterminada && !zona.value) {
    zona.value = zonaPredeterminada;
  }

  actualizarEstadoFlujo();
}

function hayUbicacionSeleccionada() {
  return Boolean(obtenerValor("latitud") && obtenerValor("longitud"));
}

function actualizarPaso(id, estado) {
  const paso = document.getElementById(id);
  if (!paso) return;

  paso.classList.remove("activo", "completado");
  if (estado) paso.classList.add(estado);
}


function actualizarEstadoFlujo() {
  const hayUbicacion = hayUbicacionSeleccionada();
  const cfgConsent = obtenerConfigDom("consentimiento", {});
  const consentimientoRequerido = cfgConsent.requerido !== false;
  const consentimiento = document.getElementById("consentimientoDatos");
  const hayConsentimiento = !consentimientoRequerido || (consentimiento ? consentimiento.checked : false);
  const estadoUbicacion = document.getElementById("estadoUbicacion");
  const botones = ["btnGuardarDatos", "btnGenerarPdf", "btnImprimirPdf"];

  botones.forEach((id) => {
    const boton = document.getElementById(id);
    if (boton) boton.disabled = !(hayUbicacion && hayConsentimiento);
  });

  if (estadoUbicacion) {
    if (hayUbicacion) {
      estadoUbicacion.textContent = "Ubicación lista. Revise los datos autocompletados y complete los datos personales.";
      estadoUbicacion.classList.remove("pendiente");
      estadoUbicacion.classList.add("listo");
    } else {
      estadoUbicacion.textContent = "Seleccione una ubicación para continuar con el formulario.";
      estadoUbicacion.classList.remove("listo");
      estadoUbicacion.classList.add("pendiente");
    }
  }

  if (hayUbicacion) {
    actualizarPaso("pasoUbicacion", "completado");
    actualizarPaso("pasoFormulario", "activo");
    actualizarPaso("pasoPdf", "");
  } else {
    actualizarPaso("pasoUbicacion", "activo");
    actualizarPaso("pasoFormulario", "");
    actualizarPaso("pasoPdf", "");
  }
}

function irAlFormularioDespuesDeUbicacion() {
  if (!hayUbicacionSeleccionada()) {
    alert("Primero debe buscar una dirección o marcar el punto en el mapa.");
    return;
  }

  const formulario = document.getElementById("solicitudForm");
  if (formulario) {
    formulario.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* MAPA PARA CROQUIS DE UBICACIÓN */

let mapaPredio;
let marcadorPredio;
let drawnItems;          // FeatureGroup para los polígonos dibujados
let drawControl;         // Control de herramientas de dibujo

function iniciarMapaPredio() {
  const contenedorMapa = document.getElementById("mapaPredio");
  if (!contenedorMapa) return;

  const centroMapa = obtenerConfigDom("centroMapa", [-34.233333, -70.966667]);
  const zoomInicial = obtenerConfigDom("zoomInicial", 14);

  mapaPredio = L.map("mapaPredio", { zoomControl: true }).setView(centroMapa, zoomInicial);

  /* ── Capas base ─────────────────────────────────────────────── */

  /* 1. Solo satélite (base) */
  const imgSatelite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 20,
      attribution: "Tiles &copy; Esri — Esri, Maxar, GeoEye, USDA, USGS, AeroGRID, IGN",
      crossOrigin: true
    }
  );

  /* 2. Overlay: trazado de calles y rutas (líneas) */
  const ovTransporte = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 20, opacity: 0.9, crossOrigin: true }
  );

  /* 3. Overlay: nombres de calles, localidades y límites */
  const ovEtiquetas = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 20, opacity: 1, crossOrigin: true }
  );

  /* Híbrido = satélite + calles + etiquetas */
  const capaHibrido = L.layerGroup([imgSatelite, ovTransporte, ovEtiquetas]);

  /* Mapa de calles OSM (alternativa) */
  const capaCalles = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
      crossOrigin: true
    }
  );

  /* Híbrido por defecto */
  capaHibrido.addTo(mapaPredio);

  /* Control de capas (esquina superior derecha) */
  L.control.layers(
    { "🛰 Satelital + Calles": capaHibrido, "🗺 Solo Calles (OSM)": capaCalles },
    {},
    { position: "topright", collapsed: false }
  ).addTo(mapaPredio);

  /* ── Control Urbano / Rural sobre el mapa ───────────────────── */
  const ControlZona = L.Control.extend({
    options: { position: "bottomleft" },
    onAdd: function () {
      const div = L.DomUtil.create("div", "leaflet-zona-control");
      div.innerHTML = `
        <span class="zona-label">Zona:</span>
        <button type="button" class="zona-btn" id="mapaZonaUrbano">🏙 Urbano</button>
        <button type="button" class="zona-btn" id="mapaZonaRural">🌿 Rural</button>
      `;
      L.DomEvent.disableClickPropagation(div);
      return div;
    }
  });
  mapaPredio.addControl(new ControlZona());

  /* Sincronizar botones del mapa ↔ select del formulario */
  setTimeout(() => {
    const selectZona = document.getElementById("zona");

    function resaltarZona(valor) {
      const btnU = document.getElementById("mapaZonaUrbano");
      const btnR = document.getElementById("mapaZonaRural");
      if (!btnU || !btnR) return;
      btnU.classList.toggle("zona-activa", valor === "urbano");
      btnR.classList.toggle("zona-activa", valor === "rural");
    }

    document.getElementById("mapaZonaUrbano")?.addEventListener("click", () => {
      if (selectZona) selectZona.value = "urbano";
      resaltarZona("urbano");
    });

    document.getElementById("mapaZonaRural")?.addEventListener("click", () => {
      if (selectZona) selectZona.value = "rural";
      resaltarZona("rural");
    });

    /* Si el select ya tiene valor (ej: autocompletado), reflejar en mapa */
    if (selectZona) {
      selectZona.addEventListener("change", () => resaltarZona(selectZona.value));
      resaltarZona(selectZona.value);
    }
  }, 400);

  /* ── Capa para polígonos dibujados ──────────────────────────── */
  drawnItems = new L.FeatureGroup();
  mapaPredio.addLayer(drawnItems);

  /* ── Control de dibujo Leaflet.draw ─────────────────────────── */
  drawControl = new L.Control.Draw({
    position: "topleft",
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: true,
        shapeOptions: {
          color: "#e63946",
          weight: 2.5,
          opacity: 0.9,
          fillColor: "#e63946",
          fillOpacity: 0.12
        },
        tooltip: { start: "Haga clic para comenzar a trazar el predio", cont: "Continúe marcando vértices", end: "Cierre el polígono haciendo clic en el primer punto" }
      },
      rectangle: {
        shapeOptions: {
          color: "#e63946",
          weight: 2.5,
          opacity: 0.9,
          fillColor: "#e63946",
          fillOpacity: 0.12
        },
        tooltip: { start: "Arrastre para trazar el límite rectangular del predio" }
      },
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false
    },
    edit: {
      featureGroup: drawnItems,
      edit: { selectedPathOptions: { dashArray: "6, 6", fillOpacity: 0.2 } },
      remove: true
    }
  });
  mapaPredio.addControl(drawControl);

  /* ── Eventos de dibujo ──────────────────────────────────────── */
  mapaPredio.on(L.Draw.Event.CREATED, function (e) {
    /* Solo un polígono a la vez: limpiar antes de agregar */
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    guardarLimitesPropiedad();
  });

  mapaPredio.on(L.Draw.Event.EDITED, function () {
    guardarLimitesPropiedad();
  });

  mapaPredio.on(L.Draw.Event.DELETED, function () {
    document.getElementById("limitesPropiedad").value = "";
    actualizarInfoLimites(null);
  });

  /* ── Clic para marcar punto de ubicación ────────────────────── */
  mapaPredio.on("click", async function (event) {
    /* Ignorar clics sobre los controles de dibujo */
    if (mapaPredio._drawingMode) return;
    const lat = event.latlng.lat;
    const lng = event.latlng.lng;
    actualizarUbicacionPredio(lat, lng, "Punto marcado en el mapa");
    await completarDireccionPorCoordenadas(lat, lng);
  });

  setTimeout(() => { mapaPredio.invalidateSize(); }, 300);
}

/* Guarda el GeoJSON del polígono dibujado en el campo oculto */
function guardarLimitesPropiedad() {
  const campo = document.getElementById("limitesPropiedad");
  if (!campo || !drawnItems) return;

  const geojson = drawnItems.toGeoJSON();
  if (!geojson.features || geojson.features.length === 0) {
    campo.value = "";
    actualizarInfoLimites(null);
    return;
  }

  campo.value = JSON.stringify(geojson);
  actualizarInfoLimites(geojson.features[0]);
}

/* Actualiza el panel de estado de límites */
function actualizarInfoLimites(feature) {
  const badge   = document.getElementById("limitesBadge");
  const texto   = document.getElementById("limitesTexto");
  const btnLimpiar = document.getElementById("btnLimpiarLimites");

  if (!badge) return;

  if (!feature) {
    badge.textContent = "Sin demarcar";
    badge.className = "limites-badge sin-limites";
    if (texto) { texto.style.display = "none"; texto.textContent = ""; }
    if (btnLimpiar) btnLimpiar.style.display = "none";
    return;
  }

  badge.textContent = "Demarcado ✓";
  badge.className = "limites-badge con-limites";

  if (texto) {
    const coords = feature.geometry.coordinates[0];
    const nVertices = feature.geometry.type === "Polygon"
      ? coords.length - 1
      : coords.length;
    texto.textContent = `Figura trazada con ${nVertices} vértice${nVertices !== 1 ? "s" : ""}. Se incluirá en el PDF.`;
    texto.style.display = "block";
  }

  if (btnLimpiar) btnLimpiar.style.display = "inline-block";
}

function actualizarUbicacionPredio(lat, lng, texto) {
  const latitudInput = document.getElementById("latitud");
  const longitudInput = document.getElementById("longitud");
  const coordenadasTexto = document.getElementById("coordenadasTexto");

  const latFixed = Number(lat).toFixed(6);
  const lngFixed = Number(lng).toFixed(6);

  latitudInput.value = latFixed;
  longitudInput.value = lngFixed;

  coordenadasTexto.textContent = `${texto} | Latitud: ${latFixed} - Longitud: ${lngFixed}`;

  if (marcadorPredio) {
    marcadorPredio.setLatLng([lat, lng]);
  } else {
    marcadorPredio = L.marker([lat, lng], {
      draggable: true
    }).addTo(mapaPredio);

    marcadorPredio.on("dragend", async function () {
      const posicion = marcadorPredio.getLatLng();
      actualizarUbicacionPredio(
        posicion.lat,
        posicion.lng,
        "Punto ajustado manualmente"
      );
      await completarDireccionPorCoordenadas(posicion.lat, posicion.lng);
    });
  }

  marcadorPredio
    .bindPopup("Ubicación seleccionada para el croquis")
    .openPopup();

  actualizarEstadoFlujo();
}

function construirConsultaDireccion(direccion) {
  const comuna = obtenerConfigDom("comunaBusqueda", "");
  const region = obtenerConfigDom("regionBusqueda", "");
  const pais = obtenerConfigDom("paisBusqueda", "Chile");

  return [direccion, comuna, region, pais]
    .filter(Boolean)
    .join(", ");
}

function construirUrlBusquedaMapa(consulta) {
  const codigoPais = obtenerConfigDom("codigoPais", "cl");
  const viewbox = obtenerConfigDom("viewboxBusqueda", "");
  const bounded = obtenerConfigDom("boundedBusqueda", false);

  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
    "accept-language": "es",
    q: consulta
  });

  if (codigoPais) params.set("countrycodes", codigoPais);
  if (viewbox) params.set("viewbox", viewbox);
  if (viewbox && bounded) params.set("bounded", "1");

  return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
}

async function completarDireccionPorCoordenadas(lat, lng) {
  const codigoPais = obtenerConfigDom("codigoPais", "cl");

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    addressdetails: "1",
    "accept-language": "es"
  });

  if (codigoPais) params.set("countrycodes", codigoPais);

  const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;

  try {
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (datos && datos.address) {
      autocompletarDireccionFormulario(datos.address, datos.display_name || "");
    }
  } catch (error) {
    console.warn("No se pudo autocompletar la dirección desde el mapa.", error);
  }
}

async function buscarDireccionEnMapa() {
  const inputBuscar = document.getElementById("buscarDireccion");
  const direccion = inputBuscar.value.trim();

  if (!direccion) {
    alert("Ingrese una dirección o sector para buscar.");
    return;
  }

  const consulta = construirConsultaDireccion(direccion);
  const url = construirUrlBusquedaMapa(consulta);

  try {
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (!datos || datos.length === 0) {
      alert("No se encontró la dirección. Intente escribirla de otra forma o marque el punto manualmente en el mapa.");
      return;
    }

    const resultado = datos[0];
    const lat = parseFloat(resultado.lat);
    const lng = parseFloat(resultado.lon);
    const zoomBusqueda = obtenerConfigDom("zoomBusqueda", 17);

    mapaPredio.setView([lat, lng], zoomBusqueda);
    actualizarUbicacionPredio(lat, lng, "Dirección encontrada");
    autocompletarDireccionFormulario(resultado.address || {}, direccion);
  } catch (error) {
    console.error(error);
    alert("No se pudo buscar la dirección. Revise la conexión a internet o marque el punto manualmente.");
  }
}

/* GENERAR PDF CIP COMPLETADO */

function obtenerValor(id) {
  const elemento = document.getElementById(id);
  return elemento ? elemento.value.trim() : "";
}
/* VALIDACIÓN Y FORMATO AUTOMÁTICO DE RUT CHILENO */

function limpiarRut(rut) {
  return String(rut || "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
}

function formatearRut(rut) {
  const rutLimpio = limpiarRut(rut);

  if (rutLimpio.length < 2) {
    return rutLimpio;
  }

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${cuerpoFormateado}-${dv}`;
}

function calcularDigitoVerificadorRut(cuerpo) {
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  const resultado = 11 - resto;

  if (resultado === 11) return "0";
  if (resultado === 10) return "K";
  return String(resultado);
}

function validarRutChileno(rut) {
  const rutLimpio = limpiarRut(rut);

  if (rutLimpio.length < 2) {
    return false;
  }

  const cuerpo = rutLimpio.slice(0, -1);
  const dvIngresado = rutLimpio.slice(-1);

  if (!/^\d+$/.test(cuerpo)) {
    return false;
  }

  const dvCalculado = calcularDigitoVerificadorRut(cuerpo);
  return dvCalculado === dvIngresado;
}

function obtenerMensajeRut() {
  let mensaje = document.getElementById("rutMensaje");
  const inputRut = document.getElementById("rut");

  if (!inputRut) return null;

  if (!mensaje) {
    mensaje = document.createElement("small");
    mensaje.id = "rutMensaje";
    mensaje.style.display = "block";
    mensaje.style.marginTop = "6px";
    mensaje.style.fontWeight = "700";
    inputRut.insertAdjacentElement("afterend", mensaje);
  }

  return mensaje;
}

function mostrarEstadoRut() {
  const inputRut = document.getElementById("rut");
  const mensaje = obtenerMensajeRut();

  if (!inputRut || !mensaje) return true;

  const valor = inputRut.value.trim();

  if (!valor) {
    inputRut.style.borderColor = "";
    inputRut.setCustomValidity("");
    mensaje.textContent = "";
    return false;
  }

  inputRut.value = formatearRut(valor);

  if (validarRutChileno(inputRut.value)) {
    inputRut.style.borderColor = "#16a34a";
    inputRut.setCustomValidity("");
    mensaje.textContent = "RUT válido.";
    mensaje.style.color = "#0f6b45";
    return true;
  }

  inputRut.style.borderColor = "#dc2626";
  inputRut.setCustomValidity("RUT inválido.");
  mensaje.textContent = "RUT inválido. Revise el número o dígito verificador.";
  mensaje.style.color = "#b91c1c";
  return false;
}

/* VALIDACIÓN DE TELÉFONO — solo números, exactamente 9 dígitos */

function obtenerMensajeTelefono() {
  let mensaje = document.getElementById("telefonoMensaje");
  const inputTelefono = document.getElementById("telefono");

  if (!inputTelefono) return null;

  if (!mensaje) {
    mensaje = document.createElement("small");
    mensaje.id = "telefonoMensaje";
    mensaje.style.display = "block";
    mensaje.style.marginTop = "6px";
    mensaje.style.fontWeight = "700";
    inputTelefono.insertAdjacentElement("afterend", mensaje);
  }

  return mensaje;
}

function mostrarEstadoTelefono() {
  const inputTelefono = document.getElementById("telefono");
  const mensaje = obtenerMensajeTelefono();

  if (!inputTelefono || !mensaje) return true;

  const valor = inputTelefono.value.trim();

  if (!valor) {
    inputTelefono.style.borderColor = "";
    inputTelefono.setCustomValidity("");
    mensaje.textContent = "";
    return true;
  }

  if (/^\d{9}$/.test(valor)) {
    inputTelefono.style.borderColor = "#16a34a";
    inputTelefono.setCustomValidity("");
    mensaje.textContent = "Teléfono válido.";
    mensaje.style.color = "#0f6b45";
    return true;
  }

  inputTelefono.style.borderColor = "#dc2626";
  inputTelefono.setCustomValidity("Teléfono inválido.");
  mensaje.textContent = `Ingrese exactamente 9 dígitos (ingresados: ${valor.length}).`;
  mensaje.style.color = "#b91c1c";
  return false;
}

function activarValidacionTelefono() {
  const inputTelefono = document.getElementById("telefono");

  if (!inputTelefono) return;

  inputTelefono.setAttribute("maxlength", "9");
  inputTelefono.setAttribute("autocomplete", "off");
  inputTelefono.setAttribute("inputmode", "numeric");

  inputTelefono.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");

    const mensaje = obtenerMensajeTelefono();
    if (mensaje) mensaje.textContent = "";
    this.style.borderColor = "";
    this.setCustomValidity("");
  });

  inputTelefono.addEventListener("blur", mostrarEstadoTelefono);
}

/* VALIDACIÓN DE NÚMERO DE DOMICILIO — solo dígitos (salvo S/N) */

function activarValidacionNumero() {
  const inputNumero = document.getElementById("numero");
  const checkSinNumero = document.getElementById("sinNumero");

  if (!inputNumero) return;

  inputNumero.addEventListener("input", function () {
    if (checkSinNumero && checkSinNumero.checked) return;
    this.value = this.value.replace(/\D/g, "");
  });
}

function activarValidacionRut() {
  const inputRut = document.getElementById("rut");

  if (!inputRut) return;

  inputRut.setAttribute("maxlength", "12");
  inputRut.setAttribute("autocomplete", "off");

  inputRut.addEventListener("input", function () {
    this.value = this.value
      .replace(/[^0-9kK.\-]/g, "")
      .toUpperCase();

    const mensaje = obtenerMensajeRut();
    if (mensaje) {
      mensaje.textContent = "";
    }

    this.style.borderColor = "";
    this.setCustomValidity("");
  });

  inputRut.addEventListener("blur", mostrarEstadoRut);
}

function validarFormularioCip() {
  const rutInput = document.getElementById("rut");
  const numeroInput = document.getElementById("numero");
  const checkSinNumero = document.getElementById("sinNumero");
  const rolSiiInput = document.getElementById("rolSii");

  if (rutInput) {
    rutInput.value = formatearRut(rutInput.value);
  }

  if (checkSinNumero && checkSinNumero.checked && numeroInput) {
    numeroInput.value = "S/N";
  }

  const nombre = obtenerValor("nombre");
  const rut = obtenerValor("rut");
  const calle = obtenerValor("calle");
  const numero = obtenerValor("numero");
  const rolSii = obtenerValor("rolSii");
  const latitud = obtenerValor("latitud");
  const longitud = obtenerValor("longitud");
  const sinNumero = checkSinNumero ? checkSinNumero.checked : false;

  if (!nombre || !rut || !calle || (!numero && !sinNumero) || !rolSii) {
    alert("Debe completar nombre, RUT, calle, número y Rol SII. Si el predio no tiene número, marque la opción S.N.");
    return false;
  }

  if (!validarRutChileno(rut)) {
    alert("El RUT ingresado no es válido. Revise el número o el dígito verificador.");
    if (rutInput) {
      mostrarEstadoRut();
      rutInput.focus();
    }
    return false;
  }

  const telefono = obtenerValor("telefono");
  if (telefono && !/^\d{9}$/.test(telefono)) {
    alert("El teléfono debe tener exactamente 9 dígitos numéricos (sin espacios ni guiones).");
    const telefonoInput = document.getElementById("telefono");
    if (telefonoInput) {
      mostrarEstadoTelefono();
      telefonoInput.focus();
    }
    return false;
  }

  if (!latitud || !longitud) {
    alert("Debe seleccionar una ubicación en el mapa.");
    return false;
  }

  return true;
}
async function cargarPdfBaseCip() {
  const rutas = obtenerConfigDom("rutasPdfCip", ["./img/Doc/cip_base.pdf"]);

  for (const ruta of rutas) {
    try {
      const respuesta = await fetch(ruta);

      if (respuesta.ok) {
        return await respuesta.arrayBuffer();
      }
    } catch (error) {
      console.warn(`No se pudo cargar el PDF base en la ruta: ${ruta}`, error);
    }
  }

  throw new Error("No se encontró el PDF base CIP en las rutas configuradas.");
}

async function capturarMapaParaPdf() {
  if (mapaPredio) {
    mapaPredio.invalidateSize();
  }

  const mapa = document.getElementById("mapaPredio");

  const canvas = await html2canvas(mapa, {
    useCORS: true,
    backgroundColor: "#ffffff",
    scale: 2
  });

  return canvas.toDataURL("image/png");
}

function cortarTexto(texto, maximo) {
  if (!texto) return "";
  return texto.length > maximo ? texto.substring(0, maximo) : texto;
}

async function generarPdfCip(imprimir = false) {
  if (!validarFormularioCip()) {
    return;
  }

  actualizarPaso("pasoFormulario", "completado");
  actualizarPaso("pasoPdf", "activo");

  try {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;

    const pdfBytes = await cargarPdfBaseCip();

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pagina = pdfDoc.getPages()[0];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const negro = rgb(0, 0, 0);

    function escribir(texto, x, y, size = 8, bold = false) {
      if (!texto) return;

      pagina.drawText(String(texto), {
        x,
        y,
        size,
        font: bold ? fontBold : font,
        color: negro
      });
    }

    function escribirConPosicion(texto, posicion) {
      if (!posicion) return;
      escribir(
        cortarTexto(String(texto || "").toUpperCase(), posicion.max || 60),
        posicion.x,
        posicion.y,
        posicion.size || 8,
        posicion.bold || false
      );
    }

    function escribirCampo(clave, texto, posicionDefecto, convertirMayuscula = true) {
      const posicion = obtenerPosicionPdf(clave, posicionDefecto);
      const valor = convertirMayuscula ? String(texto || "").toUpperCase() : String(texto || "");
      escribirConPosicion(valor, posicion);
    }

    const nombre = obtenerValor("nombre");
    const rut = obtenerValor("rut");
    const email = obtenerValor("email");
    const telefono = obtenerValor("telefono");
    const zona = obtenerValor("zona");

    const calle = obtenerValor("calle");
    const numero = obtenerValor("numero");
    const depto = obtenerValor("depto");
    const block = obtenerValor("block");
    const manzana = obtenerValor("manzana");
    const lote = obtenerValor("lote");
    const localidad = obtenerValor("localidad");
    const planoLoteo = obtenerValor("planoLoteo");
    const rolSii = obtenerValor("rolSii");

    const latitud = obtenerValor("latitud");
    const longitud = obtenerValor("longitud");

    const municipalidad = obtenerConfigDom("municipalidad", "");
    const region = obtenerConfigDom("region", "");

    const posMunicipalidadSuperior = obtenerPosicionPdf("municipalidadSuperior", { x: 270, y: 820, size: 9, bold: true, max: 42 });
    const posRegionSuperior = obtenerPosicionPdf("regionSuperior", { x: 212, y: 789, size: 7, bold: false, max: 60 });
    const posMunicipalidadComprobante = obtenerPosicionPdf("municipalidadComprobante", { x: 255, y: 190, size: 9, bold: true, max: 35 });

    /* Datos superiores configurables */
    escribirConPosicion(municipalidad, posMunicipalidadSuperior);
    escribirConPosicion(region, posRegionSuperior);

    /* Marcar urbano / rural */
    if (zona === "urbano") {
      const posMarcaUrbano = obtenerPosicionPdf("marcaUrbano", { x: 209, y: 754, size: 13, bold: true, max: 1 });
      escribir("X", posMarcaUrbano.x, posMarcaUrbano.y, posMarcaUrbano.size || 13, posMarcaUrbano.bold !== false);
    }

    if (zona === "rural") {
      const posMarcaRural = obtenerPosicionPdf("marcaRural", { x: 307, y: 754, size: 13, bold: true, max: 1 });
      escribir("X", posMarcaRural.x, posMarcaRural.y, posMarcaRural.size || 13, posMarcaRural.bold !== false);
    }

    /* 1. Identificación del solicitante */
    escribirCampo("nombre", nombre, { x: 60, y: 667, size: 8, bold: false, max: 55 });
    escribirCampo("rut", rut, { x: 338, y: 667, size: 8, bold: false, max: 20 });
    escribirCampo("email", email, { x: 60, y: 647, size: 8, bold: false, max: 35 }, false);
    escribirCampo("telefono", telefono, { x: 238, y: 647, size: 8, bold: false, max: 18 }, false);

    /* 2. Dirección de la propiedad */
    escribirCampo("calle", calle, { x: 60, y: 611, size: 8, bold: false, max: 55 });
    escribirCampo("numero", numero, { x: 356, y: 611, size: 8, bold: false, max: 12 });
    escribirCampo("depto", depto, { x: 432, y: 611, size: 8, bold: false, max: 12 });
    escribirCampo("block", block, { x: 512, y: 611, size: 8, bold: false, max: 12 });

    escribirCampo("manzana", manzana, { x: 60, y: 585, size: 8, bold: false, max: 12 });
    escribirCampo("lote", lote, { x: 120, y: 585, size: 8, bold: false, max: 12 });
    escribirCampo("localidad", localidad, { x: 180, y: 585, size: 8, bold: false, max: 35 });
    escribirCampo("planoLoteo", planoLoteo, { x: 412, y: 585, size: 8, bold: false, max: 18 });
    escribirCampo("rolSii", rolSii, { x: 512, y: 585, size: 8, bold: false, max: 18 });

    /* 3. Croquis de ubicación */
    const imagenMapaBase64 = await capturarMapaParaPdf();
    const imagenMapa = await pdfDoc.embedPng(imagenMapaBase64);

    const posMapa = obtenerPosicionPdf("mapa", { x: 55, y: 305, width: 529, height: 259 });
    pagina.drawImage(imagenMapa, {
      x: posMapa.x,
      y: posMapa.y,
      width: posMapa.width,
      height: posMapa.height
    });

    /* Coordenadas sobre el croquis */
    const posCoordenadas = obtenerPosicionPdf("coordenadas", { x: 65, y: 312, size: 8, bold: true, max: 80 });
    escribir(`Latitud: ${latitud}    Longitud: ${longitud}`, posCoordenadas.x, posCoordenadas.y, posCoordenadas.size || 8, posCoordenadas.bold !== false);

    /* Comprobante inferior configurable */
    escribirConPosicion(municipalidad, posMunicipalidadComprobante);
    escribirCampo("calleComprobante", calle, { x: 60, y: 116, size: 8, bold: false, max: 65 });
    escribirCampo("numeroComprobante", numero, { x: 500, y: 116, size: 8, bold: false, max: 15 });

    /* Nota de límites demarcados en el PDF */
    const limitesJson = obtenerValor("limitesPropiedad");
    if (limitesJson) {
      try {
        const geojson = JSON.parse(limitesJson);
        const nVertices = geojson.features?.[0]?.geometry?.coordinates?.[0]?.length - 1 || 0;
        const textoLimites = `Límites del predio demarcados en el croquis (${nVertices} vértices). Ver figura en rojo sobre el mapa.`;
        const posLimites = obtenerPosicionPdf("limitesPdf", { x: 55, y: 108, size: 6.5, bold: false, max: 120 });
        escribir(textoLimites, posLimites.x, posLimites.y, posLimites.size || 6.5, false);
      } catch (_) { /* si el JSON falla, ignorar silenciosamente */ }
    }

    /* Registro de consentimiento en el PDF */
    const cfgConsent = obtenerConfigDom("consentimiento", {});
    if (cfgConsent.registrarEnPdf && document.getElementById("consentimientoDatos")?.checked) {
      const ahora = new Date();
      const fechaHora = ahora.toLocaleDateString("es-CL") + " " + ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
      const datosConsent = Array.isArray(cfgConsent.datosPersonales) && cfgConsent.datosPersonales.length
        ? cfgConsent.datosPersonales.join(", ")
        : "datos personales";
      const textoConsent = `El solicitante autorizó el tratamiento de sus datos (${datosConsent}) el ${fechaHora} hrs.`;
      const posConsent = obtenerPosicionPdf("consentimientoPdf", { x: 55, y: 95, size: 6.5, bold: false, max: 120 });
      escribir(textoConsent, posConsent.x, posConsent.y, posConsent.size || 6.5, posConsent.bold === true);
    }

    const pdfFinal = await pdfDoc.save();

    const blob = new Blob([pdfFinal], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    if (imprimir) {
      const ventana = window.open(url, "_blank");
      if (ventana) {
        ventana.onload = function () {
          ventana.print();
        };
      }
    } else {
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `formulario_cip_${Date.now()}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
    }

  } catch (error) {
    console.error(error);
    alert("No se pudo generar el PDF. Revise la ruta del PDF base en municipio_config.json y confirme que el archivo exista en img/Doc.");
  }
}


/* OPCIÓN PREDIO SIN NÚMERO / S.N. */

function activarOpcionSinNumero() {
  const inputNumero = document.getElementById("numero");
  const checkSinNumero = document.getElementById("sinNumero");

  if (!inputNumero || !checkSinNumero) return;

  checkSinNumero.addEventListener("change", function () {
    if (this.checked) {
      inputNumero.value = "S/N";
      inputNumero.readOnly = true;
    } else {
      if (inputNumero.value.trim().toUpperCase() === "S/N") {
        inputNumero.value = "";
      }

      inputNumero.readOnly = false;
      inputNumero.focus();
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   ARRANQUE
   Lee municipio_config.json (único archivo que cada municipio
   debe editar), construye window.DOM_CONFIG y luego inicializa
   toda la aplicación.
   Si el JSON no está disponible (ej. prueba con doble clic),
   el script sigue funcionando con los valores por defecto.
   ➜ Para personalizar: edite solo municipio_config.json
───────────────────────────────────────────────────────────── */
function mapearJsonAConfig(json) {
  const m   = json.municipalidad || {};
  const map = json.mapa          || {};
  const pdf = json.pdf           || {};

  return {
    /* Identificación */
    municipalidad:           m.nombre        || "",
    municipalidadCompleta:   m.nombreCompleto || m.nombre || "",
    region:                  m.region        || "",
    regionCompleta:          m.regionCompleta || m.region || "",
    contacto:                m.contacto      || {},

    /* Mapa */
    comunaBusqueda:          map.comunaBusqueda          || "",
    regionBusqueda:          map.regionBusqueda          || "",
    paisBusqueda:            map.paisBusqueda            || "Chile",
    codigoPais:              map.codigoPais              || "cl",
    centroMapa:              map.centroMapa              || [-33.45, -70.67],
    zoomInicial:             map.zoomInicial             || 14,
    zoomBusqueda:            map.zoomBusqueda            || 17,
    viewboxBusqueda:         map.viewboxBusqueda         || "",
    boundedBusqueda:         map.boundedBusqueda         || false,
    localidadPredeterminada: map.localidadPredeterminada || "",
    zonaPredeterminada:      map.zonaPredeterminada      || "",

    /* Certificados */
    certificados: Array.isArray(json.certificados) ? json.certificados : [],

    /* Consentimiento */
    consentimiento: json.consentimiento || {},

    /* PDF */
    rutasPdfCip:  pdf.rutaBase ? [pdf.rutaBase] : ["./img/Doc/cip_base.pdf"],
    posicionesPdf: pdf.posiciones || {}
  };
}

function iniciarApp() {
  crearAcordeon();

  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.classList.toggle("active");
    });
  });

  iniciarMapaPredio();
  actualizarEstadoFlujo();
  activarValidacionRut();
  activarValidacionTelefono();
  activarValidacionNumero();
  activarOpcionSinNumero();
  inicializarConsentimiento();

  const btnBuscar = document.getElementById("btnBuscarMapa");
  if (btnBuscar) btnBuscar.addEventListener("click", buscarDireccionEnMapa);

  const inputBuscar = document.getElementById("buscarDireccion");
  if (inputBuscar) {
    inputBuscar.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); buscarDireccionEnMapa(); }
    });
  }

  const btnGuardar = document.getElementById("btnGuardarDatos");
  if (btnGuardar) {
    btnGuardar.addEventListener("click", function () {
      if (!validarFormularioCip()) return;
      actualizarPaso("pasoFormulario", "completado");
      actualizarPaso("pasoPdf", "activo");
      alert("Datos preparados correctamente. Ahora puede descargar o imprimir el formulario PDF.");
    });
  }

  const btnConfirmar = document.getElementById("btnConfirmarUbicacion");
  if (btnConfirmar) btnConfirmar.addEventListener("click", irAlFormularioDespuesDeUbicacion);

  const btnLimpiarLimites = document.getElementById("btnLimpiarLimites");
  if (btnLimpiarLimites) {
    btnLimpiarLimites.addEventListener("click", function () {
      if (drawnItems) drawnItems.clearLayers();
      const campo = document.getElementById("limitesPropiedad");
      if (campo) campo.value = "";
      actualizarInfoLimites(null);
    });
  }

  const btnPdf = document.getElementById("btnGenerarPdf");
  if (btnPdf) btnPdf.addEventListener("click", () => generarPdfCip(false));

  const btnImprimir = document.getElementById("btnImprimirPdf");
  if (btnImprimir) btnImprimir.addEventListener("click", () => generarPdfCip(true));
}

(async function cargarConfiguracion() {
  try {
    const resp = await fetch("./municipio_config.json");
    if (!resp.ok) throw new Error("No se pudo cargar municipio_config.json");
    const json = await resp.json();
    window.DOM_CONFIG = mapearJsonAConfig(json);
    certificados = window.DOM_CONFIG.certificados;
  } catch (e) {
    console.warn("municipio_config.json no encontrado o inválido. Usando valores por defecto.", e);
    window.DOM_CONFIG = window.DOM_CONFIG || {};
    certificados = window.DOM_CONFIG.certificados || [];
  }
  iniciarApp();
})();

function escaparHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inicializarConsentimiento() {
  const contenedor = document.getElementById("consentimientoContainer");
  if (!contenedor) return;

  const cfg = obtenerConfigDom("consentimiento", {});
  if (!cfg.textoConsentimiento) return;

  const municipalidad = obtenerConfigDom("municipalidadCompleta", "la Municipalidad");
  const datos = Array.isArray(cfg.datosPersonales) && cfg.datosPersonales.length
    ? cfg.datosPersonales.join(" y ")
    : "datos personales";

  const texto = cfg.textoConsentimiento
    .replace("{municipalidad}", escaparHtml(municipalidad))
    .replace("{datos}", escaparHtml(datos));

  const linkHref  = escaparHtml(cfg.linkLey    || "#");
  const linkTexto = escaparHtml(cfg.textoLinkLey || "normativa vigente");

  contenedor.innerHTML = `
    <div class="form-group consent-group">
      <label class="consent-label">
        <input type="checkbox" id="consentimientoDatos">
        <span>
          ${texto}
          <a href="${linkHref}" target="_blank" rel="noopener">${linkTexto}</a>.
        </span>
      </label>
    </div>`;

  document.getElementById("consentimientoDatos")
    .addEventListener("change", actualizarEstadoFlujo);
}
