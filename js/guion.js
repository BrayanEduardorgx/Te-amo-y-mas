// Direccion de la cancion: secciones, paletas, tratamientos y tiempos.
(() => {
  const { renglon, ids } = NE.letra;

  const PALETAS = {

    lampara:  { fondo: "#060402", halo: "#3e2206", tinta: "#f4ead9", realce: "#f2b45c", halacion: "#ff9e3d", alfaApagada: 0.22, alfaEco: 0.50, grano: 1.00 },

    amanecer: { fondo: "#090504", halo: "#552414", tinta: "#fff0df", realce: "#ffb27a", halacion: "#ff704d", alfaApagada: 0.21, alfaEco: 0.48, grano: 1.08 },

    asfixia:  { fondo: "#05070c", halo: "#182b44", tinta: "#e6ecf4", realce: "#a9b8f0", halacion: "#6e8fd0", alfaApagada: 0.20, alfaEco: 0.46, grano: 1.15 },

    oceano:   { fondo: "#02080d", halo: "#063b52", tinta: "#dff8ff", realce: "#65d9ef", halacion: "#168eb8", alfaApagada: 0.19, alfaEco: 0.45, grano: 0.92 },

    cicatriz: { fondo: "#0a0403", halo: "#45140f", tinta: "#f2e3da", realce: "#ff8fa0", halacion: "#d9452f", alfaApagada: 0.22, alfaEco: 0.48, grano: 1.30 },

    petalo:    { fondo: "#0b0409", halo: "#481638", tinta: "#f9e7f2", realce: "#f49ac2", halacion: "#d94f91", alfaApagada: 0.20, alfaEco: 0.46, grano: 1.10 },

    mentira:  { fondo: "#04060c", halo: "#17233f", tinta: "#ecf1f8", realce: "#8fb6e4", halacion: "#5c77c0", alfaApagada: 0.19, alfaEco: 0.42, grano: 0.85 },

    violeta:   { fondo: "#07040d", halo: "#2e1853", tinta: "#f0e8ff", realce: "#b99cff", halacion: "#7956d8", alfaApagada: 0.20, alfaEco: 0.45, grano: 1.05 },

    miedo:    { fondo: "#08040a", halo: "#38143e", tinta: "#efe4f0", realce: "#c98fe8", halacion: "#8b3fb8", alfaApagada: 0.20, alfaEco: 0.46, grano: 1.20 },

    jade:      { fondo: "#020906", halo: "#0b4434", tinta: "#e1f7ed", realce: "#72d9ae", halacion: "#24a578", alfaApagada: 0.18, alfaEco: 0.42, grano: 0.95 },

    brasa:    { fondo: "#050302", halo: "#341706", tinta: "#e8dac6", realce: "#ffa260", halacion: "#c4571a", alfaApagada: 0.16, alfaEco: 0.36, grano: 1.45 },

    aurora:    { fondo: "#080604", halo: "#493006", tinta: "#fff5d9", realce: "#ffd166", halacion: "#f28c28", alfaApagada: 0.18, alfaEco: 0.42, grano: 1.18 },
  };

  const SECCIONES = [
    { desde: 0,                          paleta: "lampara" },
    { desde: NE.datos.duracion * 0.08,  paleta: "amanecer" },
    { desde: NE.datos.duracion * 0.17,  paleta: "asfixia" },
    { desde: NE.datos.duracion * 0.26,  paleta: "oceano" },
    { desde: NE.datos.duracion * 0.35,  paleta: "cicatriz" },
    { desde: NE.datos.duracion * 0.44,  paleta: "petalo" },
    { desde: NE.datos.duracion * 0.53,  paleta: "mentira" },
    { desde: NE.datos.duracion * 0.62,  paleta: "violeta" },
    { desde: NE.datos.duracion * 0.71,  paleta: "miedo" },
    { desde: NE.datos.duracion * 0.79,  paleta: "jade" },
    { desde: NE.datos.duracion * 0.88,  paleta: "brasa" },
    { desde: NE.datos.duracion * 0.95,  paleta: "aurora" },
  ];

  // Rueda cromatica compartida por la fogata y la letra. Recorre los doce
  // tonos varias veces durante la cancion, independientemente de las escenas.
  const COLORES_FOGATA = [
    "#ff9e3d", // ambar
    "#ff704d", // coral
    "#ff3b3b", // rojo
    "#f04f9a", // rosa
    "#bd63e6", // violeta
    "#7659e8", // indigo
    "#4c7ff0", // azul
    "#32bde8", // cian
    "#25c6b3", // turquesa
    "#48c774", // verde
    "#a8d94f", // lima
    "#ffd166", // dorado
  ];
  const DURACION_COLOR_FOGATA = 9;
  const TRANSICION_COLOR_FOGATA = 1.1;

  const colorFogataEn = (t) => {
    const posicion = Math.max(0, t) / DURACION_COLOR_FOGATA;
    const vuelta = Math.floor(posicion);
    const actual = COLORES_FOGATA[vuelta % COLORES_FOGATA.length];
    const siguiente = COLORES_FOGATA[(vuelta + 1) % COLORES_FOGATA.length];
    const dentro = (posicion - vuelta) * DURACION_COLOR_FOGATA;
    const inicioMezcla = DURACION_COLOR_FOGATA - TRANSICION_COLOR_FOGATA;
    const avance = NE.mat.suave(NE.mat.acotar(
      (dentro - inicioMezcla) / TRANSICION_COLOR_FOGATA,
    ));
    return NE.color.mezclarHex(actual, siguiente, avance);
  };

  const DIRECCION = {

    v1a: ["verso", { fuente: "archivo", fuenteRealce: "playfair", cursivaRealce: true, realce: 4 }],
    v1b: ["verso", { fuente: "instrument", cursiva: true, fuenteRealce: "bodoni", cursivaRealce: false, realce: 3 }],
    v1c: ["verso", { fuente: "archivo", fuenteRealce: "playfair", cursivaRealce: true, realce: 4 }],

    ser: ["solitaria", {
      fuente: "playfair", cursiva: true,
      alargar: { Ser: [5] }, alargarYa: true,
      golpes: [7.89, 8.22, 8.60, 8.96, 9.31, 9.67, 10.00],
      caras: [
        { f: "playfair",   it: true,  wght: 800 },
        { f: "anybody",    wght: 800, wdth: 150 },
        { f: "bodoni",     wght: 900 },
        { f: "flex",       wght: 900, wdth: 45 },
        { f: "instrument", it: true },
        { f: "martian",    wght: 700 },
        { f: "archivo",    wght: 200, wdth: 125 },
        { f: "flex",       wght: 1000, wdth: 25 },
      ],
    }],

    v2a: ["verso", { fuente: "playfair", fuenteRealce: "playfair", cursivaRealce: true, realce: [0, 1], cambiante: [0] }],
    v2b: ["verso", { fuente: "archivo", fuenteRealce: "bodoni", realce: 4 }],

    v2c: ["grito", { fuente: "flex", mayusculas: true, fuenteRealce: "flex", realce: 5 }],
    v2d: ["verso", { fuente: "flex", fuenteRealce: "playfair", cursivaRealce: true, realce: 4 }],

    escuchar: ["solitaria", { fuente: "instrument", cursiva: true, alargar: { Escuchar: [3, 2, 3] } }],

    v3a: ["verso", { fuente: "anybody", fuenteRealce: "playfair", cursivaRealce: true, realce: 4 }],

    v3b: ["capilar", { fuente: "archivo", fuenteRealce: "bodoni", realce: [1, 2], alargar: { no: [3] } }],
    v3c: ["verso", { fuente: "archivo", fuenteRealce: "playfair", cursivaRealce: true, realce: 3 }],
    v3d: ["verso", { fuente: "playfair", cursiva: true, realce: 1, fuenteRealce: "playfair", cursivaRealce: true,
                     alargar: { Sin: [4], siquiera: [0, 0, 0, 4, 0] } }],

    avisar: ["solitaria", { fuente: "bodoni", mayusculas: true, rojo: true, alargar: { Avisar: [1, 0, 0] } }],

    v4a: ["mentira", { fuente: "inter", fuenteRealce: "inter", realce: 5 }],
    v4b: ["verso", { fuente: "inter", fuenteRealce: "playfair", cursivaRealce: true, realce: 4 }],
    v4c: ["verso", { fuente: "playfair", cursiva: true, fuenteRealce: "bodoni", cursivaRealce: false, realce: 3 }],
    v4d: ["susurro", { fuente: "martian", mayusculas: true, realce: "todo" }],

    "quien-soy": ["identidad", { fuente: "archivo", fuenteRealce: "playfair", cursivaRealce: true, realce: 3,
                                 cambiante: [2, 3, 4, 5] }],

    hoy: ["solitaria", { fuente: "playfair", cursiva: true, alargar: { hoy: [4] } }],
    v5a: ["verso", { fuente: "instrument", cursiva: true, fuenteRealce: "bodoni", realce: 4 }],
    v5b: ["verso", { fuente: "archivo", fuenteRealce: "playfair", cursivaRealce: true, realce: 6 }],
    v5c: ["verso", { fuente: "flex", fuenteRealce: "bodoni", realce: 5 }],

    v5d: ["grito", { fuente: "flex", mayusculas: true, fuenteRealce: "bodoni", realce: 7, alargar: { ENGAÑO: [0, 0, 7] } }],
  };

  const PERMANENCIA = {
    ser:      { sale: 10.15 },
    escuchar: { entra: 21.30, sale: 24.90 },
    avisar:   { sale: 37.05 },
    v5d:      { sale: 63.50 },
  };

  const SUCESOS = SECCIONES.slice(1).map((seccion, i) => ({
    en: seccion.desde - 0.35,
    tipo: i % 2 ? "destello" : "fuga",
    desde: ["derecha", "izquierda", "arriba", "abajo"][i % 4],
    fuerza: 0.55 + (i % 3) * 0.12,
  }));

  const programar = (frases, { anticipo = 0.4, cola = 0.5, cruce = 0.22, adelanto = 0.1 } = {}) => {
    const orden = [...frases].sort((a, b) => a.palabras[0].desde - b.palabras[0].desde);
    const ultima = (f) => f.palabras[f.palabras.length - 1].hasta;
    const entradas = orden.map((f, i) => {
      if (f.entra != null) return f.entra;
      const deseada = f.palabras[0].desde - anticipo;
      const anterior = orden[i - 1];
      return anterior ? Math.max(deseada, ultima(anterior) - adelanto) : deseada;
    });
    return orden.map((f, i) => {
      const entra = entradas[i];
      if (f.sale != null) return { ...f, entra, sale: f.sale };
      const deseada = ultima(f) + cola;
      const sig = entradas[i + 1];
      const sale = sig == null ? deseada : Math.min(deseada, sig + cruce);
      return { ...f, entra, sale: Math.max(sale, entra + 0.25) };
    });
  };

  const frases = programar(
    ids.map((id) => {
      const numero = Number(id.split("-").pop()) || 1;
      const estilos = ["verso", "verso", "susurro", "capilar", "verso", "mentira"];
      const fuentes = ["archivo", "instrument", "playfair", "anybody", "inter", "bodoni"];
      const [tratamiento, op] = DIRECCION[id] || [estilos[(numero - 1) % estilos.length], {
        fuente: fuentes[(numero - 1) % fuentes.length],
        fuenteRealce: numero % 2 ? "playfair" : "bodoni",
        cursiva: numero % 5 === 0,
        cursivaRealce: true,
        realce: numero % 4,
      }];
      return { id, palabras: renglon(id), tratamiento, op, ...(PERMANENCIA[id] || {}) };
    }),
  );

  const paletaEn = (t, transicion = 1.25, anticipo = 0.4) => {
    let i = 0;
    for (let k = 0; k < SECCIONES.length; k++) if (SECCIONES[k].desde - anticipo <= t) i = k;
    const actual = PALETAS[SECCIONES[i].paleta];
    const anterior = i === 0 ? actual : PALETAS[SECCIONES[i - 1].paleta];

    const crudo = i === 0
      ? 1
      : NE.mat.acotar((t - (SECCIONES[i].desde - anticipo)) / transicion);
    const avance = NE.mat.suave(Math.round(crudo * 32) / 32);
    const n = (a, b) => a + (b - a) * avance;
    const c = (a, b) => NE.color.mezclarHex(a, b, avance);
    const colorFogata = colorFogataEn(t);
    return {
      fondo: c(anterior.fondo, actual.fondo),
      halo: c(anterior.halo, actual.halo),
      tinta: NE.color.mezclarHex(c(anterior.tinta, actual.tinta), colorFogata, 0.42),
      realce: colorFogata,
      halacion: colorFogata,
      alfaApagada: n(anterior.alfaApagada, actual.alfaApagada),
      alfaEco: n(anterior.alfaEco, actual.alfaEco),
      grano: n(anterior.grano, actual.grano),
    };
  };

  NE.guion = {
    PALETAS, SECCIONES, COLORES_FOGATA, DIRECCION, SUCESOS,
    frases, paletaEn, colorFogataEn, programar,
  };
})();
