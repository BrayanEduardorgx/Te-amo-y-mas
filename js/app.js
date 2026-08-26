// Arranque, controles, bucle principal y cierre.
(() => {
  const { acotar, campana, salidaExpo } = NE.mat;
  const { azarEntre, ruidoCentrado } = NE.azar;
  const { $, crear } = NE.dom;
  const D = NE.datos;

  const FAMILIAS = ["RobotoFlex", "Archivo", "Anybody", "MartianMono",
                    "PlayfairDisplay", "BodoniModa", "Inter", "InstrumentSerif"];

  const app = { listo: false, sonando: false, terminado: false, sostenido: null, inicioSilencio: 0, visitas: 1 };
  NE.app = app;

  const audio = $("#audio");
  const entrada = $("#entrada");
  const cuadro = $("#cuadro");
  const letraEl = $("#letra");
  const haloEl = $("#halo");
  const hazEl = $("#haz");
  const paredEl = $("#pared");
  const lamparaEl = $("#lampara");
  const emulsionEl = $("#emulsion");
  const granoFino = $("#grano-fino");
  const fugaEl = $("#fuga");
  const finalEl = $("#final");
  const uiEl = $("#ui");
  const barraEl = $("#ui .barra");
  const barra = $("#ui .barra i");
  const tirador = $("#ui .barra b");
  const tActual = $("#t-actual");
  const tTotal = $("#t-total");
  const raya = $("#raya");
  const cordonMini = $("#cordon-mini");
  const relojEl = $("#reloj-insomnio");
  const pistaSostener = $("#pista-sostener");
  const cargaEl = $("#carga i");

  const fogata = new NE.Fogata($("#fogata-gl"), $("#fogata"));
  const emulsion = new NE.Emulsion(emulsionEl);
  const experiencia = new NE.Experiencia(cuadro);
  const calidad = new NE.Calidad(emulsion);
  calidad.fogata = fogata;
  calidad.experiencia = experiencia;
  const pistas = new NE.Pistas(D);
  NE.pistas = pistas;
  const reloj = new NE.Reloj(audio);

  let escenario = null;
  let ctxAudio = null;
  let cuarto = null;

  const progreso = (p) => { cargaEl.style.width = `${Math.round(p * 100)}%`; };

  const calentar = async () => {
    progreso(0.05);

    let hechas = 0;
    const cargas = FAMILIAS.flatMap((f) => [

      ...["300", "700", "900"].map((w) => `${w} 100px "${f}"`),
      ...["italic 400", "italic 700"].map((w) => `${w} 100px "${f}"`),
    ]);
    await Promise.all(
      cargas.map((desc) =>
        document.fonts.load(desc, "Serángaño áéíóúñ").then(() => {
          hechas++;
          progreso(0.05 + (hechas / cargas.length) * 0.55);
        }).catch(() => {}),
      ),
    );
    await document.fonts.ready;
    progreso(0.65);

    const horno = crear("div", "solo-lectores", document.body);
    horno.innerHTML = FAMILIAS.map(
      (f) => `<span style="font-family:'${f}';font-size:100px;font-variation-settings:'wght' 700">Serángaño</span>`,
    ).join("");
    void horno.offsetWidth;
    progreso(0.78);

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { ctxAudio = new AC(); reloj.medirLatencia(ctxAudio); cuarto = new NE.Cuarto(ctxAudio); }
    } catch (e) {  }

    await new Promise((res) => {
      if (audio.readyState >= 3) return res();
      audio.addEventListener("canplaythrough", res, { once: true });
      setTimeout(res, 6000);
    });
    progreso(0.9);

    escenario = new NE.Escenario(letraEl, NE.guion.frases);
    experiencia.prepararRecuerdos(escenario);
    redimensionar();
    horno.remove();
    progreso(1);

    tTotal.textContent = comoReloj(D.duracion);
    tActual.textContent = "0:00";
    app.listo = true;
    entrada.classList.add("lista");
    $("#texto-entrada").textContent = app.visitas > 1 ? "otra vez" : "tira del cordón";
  };

  const redimensionar = () => {
    const w = cuadro.clientWidth;
    const h = cuadro.clientHeight;
    emulsion.redimensionar(w, h, window.devicePixelRatio || 1);
    fogata.redimensionar(w, h, window.devicePixelRatio || 1);
    experiencia.redimensionar();
    document.documentElement.style.setProperty("--cuerpo", `${(Math.min(w, h) * 0.062).toFixed(1)}px`);

    if (escenario) {
      escenario.ajustar(w * 0.95, h, Math.min(w, h) * 0.062);

      raya.style.top = `${((escenario.huecos.actual + escenario.huecos.siguiente) / 2).toFixed(0)}px`;
    }
    if (barraEl) barraEl.getBoundingClientRect && (barraAncho = barraEl.getBoundingClientRect().width);
    {
    }
  };
  app.redimensionar = redimensionar;

  let arrancando = false;

  const tirarDelCordon = () => {
    if (!app.listo || arrancando) return;
    arrancando = true;
    entrada.classList.add("tirando");
    setTimeout(() => entrada.classList.remove("tirando"), 220);
    entrada.classList.add("apagada");

    if (ctxAudio && ctxAudio.state === "suspended") ctxAudio.resume();
    try { navigator.audioSession && (navigator.audioSession.type = "playback"); } catch (e) {}

    if (cuarto) cuarto.encender();

    setTimeout(() => {
      entrada.classList.remove("apagada");
      audio.currentTime = 0;
      const p = audio.play();
      if (p && p.catch) p.catch(() => { $("#texto-entrada").textContent = "sube el volumen"; });
      app.sonando = true;
      experiencia.iniciar();
      reloj.reanclar();

      if (cuarto) cuarto.nivel(0.07, 2.5);
      entrada.classList.add("fuera");
      setTimeout(() => { entrada.style.display = "none"; }, 950);
      cordonMini.classList.add("visible");
      setTimeout(() => pistaSostener.classList.add("visible"), 9000);
      setTimeout(() => pistaSostener.classList.remove("visible"), 16500);
      try { localStorage.setItem("luz-prendida-visitas", String(app.visitas)); } catch (e) {}
    }, 480);
  };

  entrada.addEventListener("pointerup", tirarDelCordon);
  entrada.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") tirarDelCordon(); });

  let parpadeoHasta = 0;
  cordonMini.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    cordonMini.classList.add("tirando");
    parpadeoHasta = performance.now() + 130;
    setTimeout(() => cordonMini.classList.remove("tirando"), 200);
  });

  let luzX = 0.5, luzY = 0.42, luzObjX = 0.5, luzObjY = 0.42;
  window.addEventListener("pointermove", (e) => {
    const r = cuadro.getBoundingClientRect();
    luzObjX = acotar((e.clientX - r.left) / r.width);
    luzObjY = acotar((e.clientY - r.top) / r.height);
    experiencia.puntero(luzObjX, luzObjY);
  }, { passive: true });

  let pulsando = null;

  window.addEventListener("pointerdown", (e) => {
    if (!app.sonando || app.terminado) return;
    if (e.target.closest("#ui") || e.target.closest("#cordon-mini") ||
        e.target.closest(".pal-recuerdo") || e.target.closest(".recuerdo-modal")) return;
    experiencia.impulso(luzObjX, luzObjY);
    pulsando = setTimeout(() => {
      pulsando = null;
      app.sostenido = { desde: reloj.t, inicio: performance.now() };
      audio.pause();
      pistaSostener.classList.remove("visible");
    }, 190);
  });

  const soltar = () => {
    if (pulsando) { clearTimeout(pulsando); pulsando = null; }
    if (app.sostenido) {
      app.sostenido = null;
      if (!app.terminado) { audio.play().catch(() => {}); reloj.reanclar(); }
    }
  };
  window.addEventListener("pointerup", soltar);
  window.addEventListener("pointercancel", soltar);

  const sucesosVistos = new Set();
  let destelloHasta = 0, destelloFuerza = 0, semillaFuga = 1;

  const revisarSucesos = (t) => {
    for (let i = 0; i < NE.guion.SUCESOS.length; i++) {
      const s = NE.guion.SUCESOS[i];
      if (sucesosVistos.has(i) || t < s.en || t > s.en + 1.5) continue;
      sucesosVistos.add(i);
      if (s.tipo === "destello") { destelloHasta = performance.now() + 700; destelloFuerza = s.fuerza; }
      else if (s.tipo === "fuga") lanzarFuga(s);
    }
  };

  const lanzarFuga = (s) => {
    const horizontal = s.desde === "izquierda" || s.desde === "derecha";
    const signo = s.desde === "izquierda" || s.desde === "arriba" ? 1 : -1;
    const dur = 1000;
    const inicio = performance.now();
    const grosor = azarEntre(semillaFuga++, 26, 60);
    const giro = azarEntre(semillaFuga++, -26, 26);
    const hal = getComputedStyle(document.documentElement).getPropertyValue("--halacion").trim() || "#ff9e3d";

    fugaEl.style.background = horizontal
      ? `linear-gradient(${90 + giro}deg, transparent ${(50 - grosor).toFixed(0)}%, ${hal} 50%, transparent ${(50 + grosor).toFixed(0)}%)`
      : `linear-gradient(${giro}deg, transparent ${(50 - grosor).toFixed(0)}%, ${hal} 50%, transparent ${(50 + grosor).toFixed(0)}%)`;

    fugaEl.classList.add("activa");
    const paso = () => {
      const k = (performance.now() - inicio) / dur;
      if (k >= 1) {
        fugaEl.style.opacity = "0";

        fugaEl.classList.remove("activa");
        return;
      }
      const recorrido = (signo > 0 ? -1 + salidaExpo(k) * 2 : 1 - salidaExpo(k) * 2) * 90;
      fugaEl.style.opacity = (campana(k) * s.fuerza).toFixed(3);
      fugaEl.style.transform = horizontal
        ? `translate3d(${recorrido}%,0,0)` : `translate3d(0,${recorrido}%,0)`;
      requestAnimationFrame(paso);
    };
    paso();
  };

  const raiz = document.documentElement;
  const escrito = {};
  const escribirVar = (nombre, valor) => {
    if (escrito[nombre] === valor) return;
    escrito[nombre] = valor;
    raiz.style.setProperty(nombre, valor);
  };

  let ultimoPerf = performance.now();
  let ultimoSegundo = -1;

  let barraAncho = 0;

  const bucle = () => {
    requestAnimationFrame(bucle);
    const ahora = performance.now();
    const msFrame = ahora - ultimoPerf;
    ultimoPerf = ahora;
    if (app.sonando) calidad.medir(msFrame, ahora);
    if (!escenario) return;

    let t = reloj.leer();
    if (app.sostenido) t = app.sostenido.desde;
    const dt = reloj.dt;
    const f = NE.construirFrame(pistas, t, dt);

    const paleta = NE.guion.paletaEn(t);
    escribirVar("--fondo", paleta.fondo);
    escribirVar("--tinta", paleta.tinta);
    escribirVar("--realce", paleta.realce);

    escribirVar("--halacion", paleta.halacion);
    escribirVar("--halo-1", NE.color.conAlfa(paleta.halo, 0.85));
    escribirVar("--halo-2", NE.color.conAlfa(paleta.halo, 0.22));
    escribirVar("--derrame", NE.color.conAlfa(paleta.halacion, 0.2));

    const escalaHalo = 0.86 + f.graves * 0.3;
    haloEl.style.transform = `translate(-50%,-50%) scale(${escalaHalo.toFixed(3)})`;
    if (!app.terminado) haloEl.style.opacity = (0.42 + f.graves * 0.45).toFixed(3);
    if (!app.terminado) paredEl.style.opacity = (0.2 + f.respiracion * 0.42).toFixed(3);

    const k = 1 - Math.exp(-14 * dt);
    luzX += (luzObjX - luzX) * k;
    luzY += (luzObjY - luzY) * k;
    const rizo = 0.92 + ruidoCentrado(t * 1.7, 91, 2) * 0.06 + f.pulso * 0.04;
    const apagon = ahora < parpadeoHasta ? 0.06 : 1;
    lamparaEl.style.transform =
      `translate3d(${(luzX * cuadro.clientWidth).toFixed(1)}px,${(luzY * cuadro.clientHeight).toFixed(1)}px,0)`;
    lamparaEl.style.opacity = (rizo * apagon).toFixed(3);

    if (!app.terminado) {
      const inclina = (luzX - 0.5) * 9;
      hazEl.style.transform = `translate(-50%,0) rotate(${inclina.toFixed(2)}deg)`;
      hazEl.style.opacity = ((0.30 + f.respiracion * 0.34) * apagon).toFixed(3);
    }

    if (ahora < destelloHasta) {
      const k2 = 1 - (destelloHasta - ahora) / 700;
      document.body.style.background = NE.color.conAlfa(paleta.realce, campana(k2) * 0.15 * destelloFuerza);
    } else if (document.body.style.background) {
      document.body.style.background = "";
    }

    revisarSucesos(t);
    escenario.dibujar(t, f, paleta);

    fogata.dibujar(t, f, paleta);

    experiencia.dibujar(t, f, paleta);

    emulsion.dibujar(t, f, luzX, luzY);

    granoFino.style.transform =
      `translate3d(${azarEntre(Math.floor(t * 16) * 3 + 1, -40, 40).toFixed(0)}px,` +
      `${azarEntre(Math.floor(t * 16) * 3 + 2, -40, 40).toFixed(0)}px,0)`;

    if (!app.terminado && (t >= D.duracion - 0.1 || (audio.ended && app.sonando))) empezarFinal();
    if (app.terminado) pintarFinal(ahora);

    const avance = acotar(t / D.duracion);
    barra.style.transform = `scaleX(${avance.toFixed(4)})`;
    tirador.style.transform = `translate3d(${(avance * barraAncho).toFixed(1)}px,0,0) translateX(-50%)`;
    const seg = Math.floor(Math.max(0, t));
    if (seg !== ultimoSegundo) {
      ultimoSegundo = seg;
      tActual.textContent = comoReloj(seg);
    }
  };

  const DURACION_COLA = 20;
  let inicioFinal = 0;
  let poemaPuesto = false;

  const empezarFinal = () => {
    app.terminado = true;
    inicioFinal = performance.now();
    if (cuarto) cuarto.cola(DURACION_COLA);
  };

  const pintarFinal = (ahora) => {
    const s = (ahora - inicioFinal) / 1000;

    const ida = NE.mat.suave(acotar(s / 5));
    fogata.intensidad = 1 - ida * 0.65;
    letraEl.style.opacity = (1 - ida).toFixed(3);
    raya.style.opacity = (0.1 * (1 - ida)).toFixed(3);
    haloEl.style.opacity = (0.42 * (1 - ida * 0.75)).toFixed(3);
    paredEl.style.opacity = (0.2 * (1 - ida * 0.8)).toFixed(3);

    if (!poemaPuesto && s >= 6) { poemaPuesto = true; mostrarPoema(); }

    if (s >= 26) {
      relojEl.classList.add("visible");
      const seg = Math.floor(s - 26);
      const m = String(Math.floor(seg / 60)).padStart(2, "0");
      const ss = String(seg % 60).padStart(2, "0");
      relojEl.textContent = seg >= 90 ? `${m}:${ss}   deberías dormir` : `${m}:${ss}`;
    }
  };

  const mostrarPoema = () => {
    const claves = new Set(["Eres tú, tú-ru-ru", "Solo tú", "Tan solo tú", "Eres tú, yeah"]);
    for (const fr of NE.guion.frases) {
      const texto = fr.palabras.map((p) => p.texto).join(" ");
      const linea = crear("div", "verso", finalEl);
      if (claves.has(texto)) linea.classList.add("clave");
      linea.textContent = texto;
    }
    const pie = crear("div", "pie", finalEl);
    const hora = new Date().getHours();
    pie.textContent = hora >= 0 && hora < 6 ? `${D.firma} · tú tampoco` : D.firma;
    experiencia.mostrarFinal(finalEl);
    finalEl.classList.add("visible");
    setTimeout(() => uiEl.classList.add("visible"), 4000);
  };

  const comoReloj = (seg) =>
    `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, "0")}`;

  const deshacerFinal = () => {
    poemaPuesto = false;
    app.terminado = false;
    finalEl.classList.remove("visible");
    finalEl.innerHTML = "";
    experiencia.reiniciar();
    relojEl.classList.remove("visible");
    letraEl.style.opacity = "";
    raya.style.opacity = "";
    audio.volume = 1;
    fogata.intensidad = 1;
    haloEl.style.opacity = "";
    paredEl.style.opacity = "";
    if (cuarto) cuarto.nivel(0.07, 1);
  };

  const irA = (seg) => {
    const destino = acotar(seg, 0, D.duracion);
    audio.currentTime = destino;
    reloj.reanclar();

    for (let i = 0; i < NE.guion.SUCESOS.length; i++) {
      if (NE.guion.SUCESOS[i].en >= destino) sucesosVistos.delete(i);
    }
    if (destino < D.duracion - 0.1) deshacerFinal();
    escenario.reiniciar();
    ultimoSegundo = -1;
    despertarUI();
  };

  const reflejarEstado = () => uiEl.classList.toggle("parado", audio.paused);

  const alternarPausa = () => {
    if (!app.sonando) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      reloj.reanclar();
      if (cuarto) cuarto.nivel(0.07, 1);
    } else {
      audio.pause();

      if (cuarto) cuarto.nivel(0.4, 1.2);
    }
    reflejarEstado();
    despertarUI();
  };

  const parar = () => {
    audio.pause();
    irA(0);
    sucesosVistos.clear();
    reflejarEstado();
    if (cuarto) cuarto.nivel(0.4, 1.2);
  };

  const reiniciar = () => {
    sucesosVistos.clear();
    irA(0);
    audio.play().catch(() => {});
    if (cuarto) cuarto.nivel(0.07, 1.5);
    reflejarEstado();
  };

  $("#btn-atras").addEventListener("click", (e) => { e.stopPropagation(); irA(audio.currentTime - 5); });
  $("#btn-alante").addEventListener("click", (e) => { e.stopPropagation(); irA(audio.currentTime + 5); });
  $("#btn-play").addEventListener("click", (e) => { e.stopPropagation(); alternarPausa(); });
  $("#btn-stop").addEventListener("click", (e) => { e.stopPropagation(); parar(); });
  $("#btn-repetir").addEventListener("click", (e) => { e.stopPropagation(); reiniciar(); });
  audio.addEventListener("play", reflejarEstado);
  audio.addEventListener("pause", reflejarEstado);

  let arrastrando = false;
  const posicionDe = (e) => {
    const r = barraEl.getBoundingClientRect();
    return acotar((e.clientX - r.left) / r.width) * D.duracion;
  };
  barraEl.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    arrastrando = true;
    barraEl.classList.add("arrastrando");
    barraEl.setPointerCapture(e.pointerId);
    irA(posicionDe(e));
  });
  barraEl.addEventListener("pointermove", (e) => {
    if (!arrastrando) return;
    e.stopPropagation();
    irA(posicionDe(e));
  });
  const soltarBarra = (e) => {
    if (!arrastrando) return;
    arrastrando = false;
    barraEl.classList.remove("arrastrando");
    try { barraEl.releasePointerCapture(e.pointerId); } catch (err) {}
  };
  barraEl.addEventListener("pointerup", soltarBarra);
  barraEl.addEventListener("pointercancel", soltarBarra);

  let ocultarUI;
  function despertarUI() {
    uiEl.classList.add("visible");
    clearTimeout(ocultarUI);
    ocultarUI = setTimeout(() => {
      if (!app.terminado && !arrastrando) uiEl.classList.remove("visible");
    }, 2600);
  }
  window.addEventListener("pointermove", despertarUI, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { reloj.reanclar(); emulsion.ultimoFotograma = -1; }
  });

  let temporizador, altoPrevio = window.innerHeight, anchoPrevio = window.innerWidth;
  window.addEventListener("resize", () => {

    const saltoAlto = Math.abs(window.innerHeight - altoPrevio);
    const saltoAncho = Math.abs(window.innerWidth - anchoPrevio);
    altoPrevio = window.innerHeight;
    anchoPrevio = window.innerWidth;
    if (saltoAncho < 2 && saltoAlto < 130) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(redimensionar, 250);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "k") { e.preventDefault(); alternarPausa(); }
    else if (e.key === "ArrowLeft") irA(audio.currentTime - 5);
    else if (e.key === "ArrowRight") irA(audio.currentTime + 5);
    else if (e.key === "r" || e.key === "R") reiniciar();
    else if (e.key === "Home") parar();
  });

  try {
    const pista = document.createElement("canvas");
    pista.width = pista.height = 1;
    const op = { powerPreference: "high-performance", antialias: false, depth: false, stencil: false };
    app.gpu = pista.getContext("webgl2", op) || pista.getContext("webgl", op);
    if (app.gpu) {
      const info = app.gpu.getExtension("WEBGL_debug_renderer_info");
      app.tarjeta = info ? app.gpu.getParameter(info.UNMASKED_RENDERER_WEBGL) : "desconocida";
      console.log("[luz-prendida] v14 · grafica en uso:", app.tarjeta);
    }
  } catch (e) {  }

  try { app.visitas = Number(localStorage.getItem("luz-prendida-visitas") || 0) + 1; } catch (e) {}

  const abrirSincronizador = $("#abrir-sincronizador");
  abrirSincronizador.addEventListener("pointerup", (e) => {
    e.preventDefault();
    e.stopPropagation();
    location.search = "?sincronizar=1";
  });
  abrirSincronizador.addEventListener("click", (e) => e.stopPropagation());

  const oculta = crear("div", "solo-lectores", document.body);
  oculta.setAttribute("aria-label", "Letra de Luz prendida");
  oculta.textContent = D.renglones.map((r) => r.palabras.map((p) => p[0]).join(" ")).join(". ");

  // Modo de marcado: abre index.html?sincronizar=1 y pulsa T al comenzar cada verso.
  if (/[?&]sincronizar=1/.test(location.search)) {
    document.body.classList.add("modo-sincronizar");
    const textos = D.renglones.map((r) => r.palabras.map((p) => p[0]).join(" "));
    let marcas = [];
    try { marcas = JSON.parse(localStorage.getItem("eres-tu-tiempos") || "[]"); } catch (e) {}

    const panel = crear("aside", "sincronizador", document.body);
    panel.innerHTML = `
      <div class="sync-etiqueta">sincronización manual</div>
      <div class="sync-contador"></div>
      <div class="sync-actual"></div>
      <div class="sync-siguiente"></div>
      <div class="sync-ayuda">Escucha la canción. Cuando oigas que empieza esta frase, toca el botón naranja.</div>
      <div class="sync-acciones">
        <button class="sync-iniciar" type="button" data-sync="reproducir" disabled>cargando canción…</button>
        <button class="sync-marcar" type="button" data-sync="marcar">2. empieza esta frase</button>
        <button type="button" data-sync="deshacer">deshacer</button>
        <button type="button" data-sync="reiniciar">borrar marcas</button>
        <button type="button" data-sync="ver">ver resultado</button>
      </div>`;
    const contador = panel.querySelector(".sync-contador");
    const actual = panel.querySelector(".sync-actual");
    const siguiente = panel.querySelector(".sync-siguiente");

    const pintarSync = () => {
      const i = marcas.length;
      contador.textContent = i >= textos.length ? `${textos.length}/${textos.length} · terminado` : `${i + 1}/${textos.length}`;
      actual.textContent = i >= textos.length ? "Sincronización guardada" : textos[i];
      siguiente.textContent = i + 1 < textos.length ? `después: ${textos[i + 1]}` : "";
      panel.classList.toggle("completo", i >= textos.length);
    };
    const guardarSync = () => {
      localStorage.setItem("eres-tu-tiempos", JSON.stringify(marcas));
      pintarSync();
    };
    const marcar = () => {
      if (marcas.length >= textos.length || audio.paused) return;
      marcas.push(Number(audio.currentTime.toFixed(3)));
      guardarSync();
    };

    const botonIniciarSync = panel.querySelector('[data-sync="reproducir"]');
    const esperaSync = setInterval(() => {
      if (!app.listo) return;
      clearInterval(esperaSync);
      botonIniciarSync.disabled = false;
      botonIniciarSync.textContent = "1. iniciar canción";
    }, 150);
    botonIniciarSync.addEventListener("click", () => {
      marcas = [];
      guardarSync();
      if (entrada.style.display !== "none") tirarDelCordon();
      else { audio.currentTime = 0; audio.play().catch(() => {}); reloj.reanclar(); }
    });
    panel.querySelector('[data-sync="marcar"]').addEventListener("click", marcar);
    panel.querySelector('[data-sync="deshacer"]').addEventListener("click", () => { marcas.pop(); guardarSync(); });
    panel.querySelector('[data-sync="reiniciar"]').addEventListener("click", () => { marcas = []; guardarSync(); });
    panel.querySelector('[data-sync="ver"]').addEventListener("click", () => { location.href = location.pathname; });
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() !== "t" || e.repeat) return;
      e.preventDefault();
      marcar();
    });
    pintarSync();
  }

  if (/[?&]ligero=1/.test(location.search)) {
    document.body.classList.add("ligero");
    emulsion.calidad = 0.5;
    emulsion.escala = 0.4;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("sin-movimiento");
    emulsion.calidad = 0.4;
  }

  bucle();
  calentar();
})();
