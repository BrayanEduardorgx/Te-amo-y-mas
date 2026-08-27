// Lectura de la letra y del analisis de la cancion.
(() => {

  const leer = () => {
    const nodo = document.getElementById("datos-cancion");
    if (!nodo) throw new Error("Falta el bloque de datos de la cancion");
    return JSON.parse(nodo.textContent);
  };

  const datos = leer();

  // La letra entregada con la nueva pista. Conservamos el analisis visual del
  // montaje original, pero construimos una linea de tiempo completa para que
  // ningun verso quede fuera de la experiencia.
  const ESTROFAS = [
    [
      "Te amo y más de lo que puedes imaginar",
      "Te amo además como nunca nadie jamás lo hará",
      "En esta canción, va mi corazón",
      "Amor más que amor es el nuestro y te lo vengo a dar",
    ],
    [
      "Te miro y más y más y más te quiero mirar",
      "Te amo y sabrás puro sentimiento y no hay nada más",
      "Y sueño llegar a tu alma tocar",
      "Amor más que amor es el nuestro y te lo vengo a dar",
    ],
    [
      "Ruego a Dios tenerte a mi lado",
      "Y entonces poderte abrazar",
      "Si no estás aquí algo falta",
      "Yo por ti pelearé hasta el final",
    ],
    [
      "Y sueño llegar a tu alma tocar",
      "Amor más que amor es el nuestro y te lo vengo a dar",
    ],
    [
      "Te amo ¡y más!",
      "Te amo y sabrás que nadie como yo te amará",
      "En esta canción yo veo quien soy",
    ],
    [
      "Amor más que amor es el mío y lo siento",
      "Amor más que amor es el tuyo y presiento",
      "Amor más que amor será el nuestro si tú me lo das",
    ],
  ];

  const DURACION = 155.2;
  // Retraso global para que el texto entre despues de la voz y no se adelante.
  const RETRASO_LETRA = 1.5;
  const INICIO_VOZ = 0.5 + RETRASO_LETRA;
  const FIN_VOZ = DURACION - 3;
  const PAUSA_ESTROFA = 1.15;
  const lineas = ESTROFAS.flat();
  const pesoLinea = (linea) => Math.max(2.8, 1.4 + linea.length * 0.105);
  const sumaPesos = lineas.reduce((s, linea) => s + pesoLinea(linea), 0);
  const tiempoCantado = FIN_VOZ - INICIO_VOZ - (ESTROFAS.length - 1) * PAUSA_ESTROFA;
  const escalaTiempo = tiempoCantado / sumaPesos;
  let tiemposGuardados = Array.isArray(NE.personalizacion && NE.personalizacion.sincronizacion)
    ? NE.personalizacion.sincronizacion.slice()
    : [];
  if (!tiemposGuardados.length) {
    try { tiemposGuardados = JSON.parse(localStorage.getItem("te-amo-y-mas-tiempos") || "[]"); } catch (e) {}
  }
  const tiemposValidos = tiemposGuardados.length === lineas.length &&
    tiemposGuardados.every((t, i) => Number.isFinite(t) && t >= 0 && (!i || t > tiemposGuardados[i - 1]));
  let cursor = INICIO_VOZ;
  let indice = 0;

  datos.titulo = "Te amo y más";
  datos.duracion = DURACION;
  datos.ajuste = 0;
  datos.bpm = 96;
  datos.beats = Array.from({ length: Math.ceil(DURACION * datos.bpm / 60) }, (_, i) => i * 60 / datos.bpm);
  datos.onsets = datos.beats.slice();
  datos.renglones = [];
  datos.sincronizacionManual = tiemposValidos;

  ESTROFAS.forEach((estrofa, e) => {
    estrofa.forEach((linea) => {
      const numeroLinea = indice;
      const inicioManual = tiemposValidos ? tiemposGuardados[numeroLinea] : null;
      const siguienteManual = tiemposValidos ? tiemposGuardados[numeroLinea + 1] : null;
      if (inicioManual != null) cursor = inicioManual;
      const duracionLinea = tiemposValidos
        ? Math.max(0.8, (siguienteManual == null ? DURACION - 0.5 : siguienteManual - 0.12) - cursor)
        : pesoLinea(linea) * escalaTiempo;
      const palabras = linea.split(/\s+/);
      const pesos = palabras.map((palabra) => Math.max(0.8, Math.pow(palabra.length, 0.62)));
      const total = pesos.reduce((s, peso) => s + peso, 0);
      let t = cursor;
      const cronometradas = palabras.map((palabra, i) => {
        const desde = t;
        t += duracionLinea * pesos[i] / total;
        return [palabra, Number(desde.toFixed(3)), Number(t.toFixed(3))];
      });
      datos.renglones.push({ id: `linea-${String(++indice).padStart(2, "0")}`, palabras: cronometradas });
      cursor += duracionLinea;
    });
    if (!tiemposValidos && e < ESTROFAS.length - 1) cursor += PAUSA_ESTROFA;
  });

  const renglon = (id) => {
    const r = datos.renglones.find((x) => x.id === id);
    if (!r) throw new Error(`No existe el renglon "${id}"`);
    return r.palabras.map(([texto, desde, hasta]) => ({ texto, desde, hasta }));
  };

  const ids = datos.renglones.map((r) => r.id);

  NE.datos = datos;
  NE.letra = { renglon, ids };
})();
