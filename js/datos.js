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
      "Eres tú, tú-ru-ru",
      "Eres tú, y tú, y tú, tú-ru-ru-ru",
      "Mmm, oh, oh",
      "Eres tú, yeah, tú-ru-ru-ru",
    ],
    [
      "La que me fascina",
      "La que me domina",
      "Mi mente se alinea cuando caminas",
    ],
    [
      "Eres tú la calma y la ruina",
      "La voz que suena",
      "Cuando el alma suspira",
    ],
    [
      "Tus ojos son fuego en la neblina",
      "Tu risa me quema, me ilumina",
      "Y si no estás, el mundo gira",
      "Pero sin rumbo, sin salida",
    ],
    [
      "Eres tú (tú, y tú, y tú)",
      "Tú-ru-ru-ru (tú, y tú, y tú)",
      "Eres tú (tú, y tú, y tú)",
      "Tú-ru-ru-ru",
    ],
    [
      "Eres tú (tú, y tú, y tú)",
      "Tú-ru-ru-ru (tú, y tú, y tú)",
      "Eres tú (tú, y tú, y tú)",
      "Tú-ru-ru-ru",
    ],
    [
      "Eres tan perfecta",
      "Tan sincera, tan real, que me desespera",
      "Eres la razón por la que aún espero",
      "La voz que suena cuando muero",
    ],
    [
      "Eres tú la que me enciende por dentro",
      "Eres tú mi mejor pensamiento",
    ],
    [
      "Tus besos saben a calma y a miedo",
      "A promesas que aún no entiendo",
      "Tus abrazos detienen el tiempo",
      "Y, en tus brazos, todo tiene sentido",
    ],
    [
      "Tu mirada tan profunda y clara",
      "Rompe el ruido, calla el alma",
      "Y tu sonrisa, mi desgracia",
      "Mi adicción, mi esperanza",
    ],
    [
      "(Ah, ah, ah)",
      "Solo tú",
      "(Ah, ah)",
      "Tan solo tú",
      "(Ah, ah, ah)",
      "Eres tú, yeah",
    ],
    [
      "Eres tú (la que) me domina, mi dopamina, mi medicina",
      "Eres tú (la que) la que me ilumina, mi calma, mi herida",
      "Más y más de ti (ti, ti)",
      "De ti, de ti (ti, ti)",
      "Más y más de ti",
      "Más, más, más, más de ti",
      "De ti (tú, y tú, y tú)",
      "(Tú, y tú, y tú)",
      "Mucho más (tú, y tú, y tú)",
      "Porque solo eres tú (tú, y tú, y tú)",
      "Tan solo tú (tú, y tú, y tú)",
      "Eres tú-ru-uh, tú-ru-ru-ru, tú, y tú, y tú, tú-ru",
      "Tan solo tú, solo tú, y nada más, tú, tú-ru-ru-ru",
    ],
  ];

  const DURACION = 288;
  // Retraso global para que el texto entre despues de la voz y no se adelante.
  const RETRASO_LETRA = 1.5;
  const INICIO_VOZ = 6 + RETRASO_LETRA;
  const FIN_VOZ = 284 + RETRASO_LETRA;
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
    try { tiemposGuardados = JSON.parse(localStorage.getItem("eres-tu-tiempos") || "[]"); } catch (e) {}
  }
  const tiemposValidos = tiemposGuardados.length === lineas.length &&
    tiemposGuardados.every((t, i) => Number.isFinite(t) && t >= 0 && (!i || t > tiemposGuardados[i - 1]));
  let cursor = INICIO_VOZ;
  let indice = 0;

  datos.titulo = "Eres tú";
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
