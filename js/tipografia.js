// Fuentes variables, alargamiento de vocales y pintado por palabra.
(() => {
  const { acotar, mezcla, remapear, salidaExpo, salidaCubica } = NE.mat;

  const FUENTES = {
    flex:       { fam: "RobotoFlex",      wght: [100, 1000], wdth: [25, 151],   peso: 700, esc: 1.00, track: -0.025 },
    archivo:    { fam: "Archivo",         wght: [100, 900],  wdth: [62, 125],   peso: 700, esc: 1.00, track: -0.030 },
    anybody:    { fam: "Anybody",         wght: [100, 900],  wdth: [50, 150],   peso: 700, esc: 1.02, track: -0.020 },
    martian:    { fam: "MartianMono",     wght: [100, 800],  wdth: [75, 112.5], peso: 500, esc: 0.80, track:  0.020 },
    playfair:   { fam: "PlayfairDisplay", wght: [400, 900],  wdth: null,        peso: 700, esc: 1.04, track: -0.015, cursiva: true },
    bodoni:     { fam: "BodoniModa",      wght: [400, 900],  wdth: null,        peso: 600, esc: 1.06, track:  0.000 },
    inter:      { fam: "Inter",           wght: [100, 900],  wdth: null,        peso: 700, esc: 0.98, track: -0.035 },
    instrument: { fam: "InstrumentSerif", wght: null,        wdth: null,        peso: 400, esc: 1.10, track: -0.005, cursiva: true },
  };

  const IDS = Object.keys(FUENTES);

  const ejesCss = (id, { wght, wdth } = {}) => {
    const f = FUENTES[id];
    const partes = [];
    if (f.wdth && wdth != null) partes.push(`"wdth" ${acotar(wdth, f.wdth[0], f.wdth[1]).toFixed(1)}`);
    if (f.wght && wght != null) partes.push(`"wght" ${acotar(wght, f.wght[0], f.wght[1]).toFixed(0)}`);
    return partes.join(",") || "normal";
  };

  const anchoMaximo = (id) => (FUENTES[id].wdth ? FUENTES[id].wdth[1] : 100);

  const VOCALES = "aeiouáéíóúü";
  const SIN_TILDE = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" };

  const partirVocales = (palabra) => {

    const todoMayus = palabra === palabra.toUpperCase() && palabra !== palabra.toLowerCase();
    const tramos = [];
    let acumulado = "";
    for (const ch of palabra) {
      acumulado += ch;
      const bajo = ch.toLowerCase();
      if (VOCALES.indexOf(bajo) >= 0) {
        let base = SIN_TILDE[bajo] || bajo;
        if (todoMayus) base = base.toUpperCase();
        tramos.push({ texto: acumulado, vocal: base });
        acumulado = "";
      }
    }
    return { tramos, cola: acumulado };
  };

  const medirSostenido = (desde, hasta) => {
    const pistas = window.NE && NE.pistas;
    if (!pistas) return 1;
    const dur = hasta - desde;
    if (dur <= 0.05) return 0;
    const N = 12;
    const v = [];
    let pico = 0;
    for (let i = 0; i < N; i++) {
      const e = pistas.lee("voz", desde + (dur * (i + 0.5)) / N, 0.03);
      v.push(e);
      if (e > pico) pico = e;
    }
    if (pico <= 0.001) return 0;
    return acotar((v[N - 4] + v[N - 3] + v[N - 2] + v[N - 1]) / 4 / pico);
  };

  const repartoAutomatico = (nTramos, duracion, desde, hasta, esFinal, largo) => {
    const ceros = new Array(nTramos).fill(0);

    if (largo < 3) return ceros;
    if (!esFinal || nTramos === 0 || duracion < 0.55) return ceros;
    const sostenido = medirSostenido(desde, hasta);
    if (sostenido < 0.6) return ceros;
    ceros[nTramos - 1] = acotar(Math.round(((duracion - 0.3) / 0.3) * sostenido), 1, 9);
    return ceros;
  };

  const visibles = (t, desde, hasta, total) => {
    if (total <= 0) return 0;
    const dur = Math.max(0.001, hasta - desde);
    const avance = acotar((t - desde) / (dur * 0.86));
    return Math.min(total, Math.floor(salidaCubica(avance) * (total + 0.999)));
  };

  const tension = (t, desde, hasta, voz, { umbral = 0.34, saturacion = 1.5, pesoVoz = 0.45, cola = 0.24 } = {}) => {
    const dur = Math.max(0.001, hasta - desde);
    const capacidad = remapear(dur, umbral, saturacion, 0, 1);
    if (capacidad <= 0 || t < desde) return 0;
    if (t > hasta) {
      const salida = 1 - acotar((t - hasta) / cola);
      return acotar(capacidad * salida * salida * (0.35 + pesoVoz * voz));
    }
    const avance = acotar((t - desde) / dur);
    const forma = salidaExpo(acotar(avance / 0.45)) * (1 - Math.pow(remapear(avance, 0.78, 1, 0, 1), 3));
    return acotar(capacidad * forma * (1 - pesoVoz + pesoVoz * voz));
  };

  class Palabra {
    constructor(texto, desde, hasta, opciones = {}) {
      this.texto = texto;
      this.desde = desde;
      this.hasta = hasta;
      this.duracion = hasta - desde;
      this.op = opciones;

      this.fuente = opciones.fuente || "archivo";
      this.fuenteBase = this.fuente;
      this.mayusculas = !!opciones.mayusculas;
      this.cursiva = !!opciones.cursiva && !!FUENTES[this.fuente].cursiva;
      this.cambiante = !!opciones.cambiante;

      this.caras = opciones.caras || null;
      this.golpes = opciones.golpes || null;

      this.alargarYa = !!opciones.alargarYa;
      this.esFinal = !!opciones.esFinal;
      this.semillaFam = 0;

      const visible = this.mayusculas ? texto.toUpperCase() : texto;
      const { tramos, cola } = partirVocales(visible);

      let reparto;
      if (Array.isArray(opciones.alargar)) {
        reparto = tramos.map((_, i) => Math.max(0, opciones.alargar[i] | 0));
      } else if (typeof opciones.alargar === "number") {
        reparto = tramos.map((_, i) => (i === tramos.length - 1 ? Math.max(0, opciones.alargar | 0) : 0));
      } else {
        reparto = repartoAutomatico(tramos.length, this.duracion, desde, hasta, !!opciones.esFinal, texto.length);
      }

      this.el = document.createElement("span");
      this.el.className = "pal";
      this.ecos = [];
      this.totalEco = reparto.reduce((a, b) => a + b, 0);

      this.reserva = this.totalEco > 0 ? 5 : 0;

      if (tramos.length === 0) {
        this.el.textContent = visible;
      } else {
        for (let i = 0; i < tramos.length; i++) {
          const trozo = document.createElement("span");
          trozo.textContent = tramos[i].texto;
          this.el.appendChild(trozo);

          const extra = i === tramos.length - 1 ? this.reserva : 0;
          const n = reparto[i] + extra;
          for (let k = 0; k < n; k++) {
            const e = document.createElement("span");
            e.className = "eco";
            e.textContent = tramos[i].vocal;

            if (this.alargarYa) e.style.transition = "none";

            e.style.display = "none";
            this.el.appendChild(e);

            this.ecos.push({ el: e, indice: k, deGrupo: reparto[i] + extra });
          }
        }
        if (cola) {
          const fin = document.createElement("span");
          fin.textContent = cola;
          this.el.appendChild(fin);
        }
      }

      this.el.style.fontFamily = `"${FUENTES[this.fuente].fam}"`;
      this.el.style.fontStyle = this.cursiva ? "italic" : "normal";
      this.el.style.letterSpacing = `${FUENTES[this.fuente].track}em`;

      this.vistos = -1;
      this.anchoEjeMax = anchoMaximo(this.fuente);
    }

    reiniciar() {
      this.vistos = -1;
      this._vistosPintados = -1;
      this._clase = "";
      this._ejes = "";
      this._track = "";
      this._fuerzaHalo = -1;
      this._fam = null;
      this.el.classList.remove("viva", "dicha");
      this.el.style.textShadow = "";
      if (this.cambiante || this.caras) {
        this._cara = null;
        this.fuente = this.fuenteBase;
        this.el.style.fontFamily = `"${FUENTES[this.fuenteBase].fam}"`;
        this.el.style.fontStyle = this.cursiva ? "italic" : "normal";
        this.el.style.fontVariationSettings = "";
        this.el.style.fontSize = "";
      }
      for (const e of this.ecos) { e.el.style.display = "none"; e.el.classList.remove("nace"); }
    }

    dibujar(t, estado, esActual) {
      const { voz, halo, elasticidad = 1 } = estado;
      const activa = t >= this.desde && t < this.hasta;
      const cantada = t >= this.hasta;

      const clase = activa ? "viva" : cantada ? "dicha" : "";
      if (clase !== this._clase) {
        this.el.classList.toggle("viva", clase === "viva");
        this.el.classList.toggle("dicha", clase === "dicha");
        this._clase = clase;
        if (clase !== "viva") {
          this.el.style.textShadow = "";
          this._fuerzaHalo = -1;
        }
      }

      if (!esActual) return { activa, cantada };

      const enfriado = this.esFinal ? 1.5 : 0.45;
      const viva = activa ? 1 : cantada ? Math.max(0, 1 - salidaExpo(acotar((t - this.hasta) / enfriado))) : 0;

      if (this.caras && esActual) {
        const idx = Math.min(
          this.caras.length - 1,
          NE.Pistas.ultimoAntesDe(this.golpes || [], t) + 1,
        );
        if (idx !== this._cara) {
          this._cara = idx;
          const c = this.caras[idx];
          const F = FUENTES[c.f];
          this.fuente = c.f;
          this.el.style.fontFamily = `"${F.fam}"`;
          this.el.style.fontStyle = c.it ? "italic" : "normal";
          this.el.style.fontVariationSettings = ejesCss(c.f, { wght: c.wght, wdth: c.wdth });
          this.el.style.letterSpacing = `${F.track}em`;
          const r = this.caraRatio ? this.caraRatio[idx] || 1 : 1;
          this.el.style.fontSize = Math.abs(r - 1) > 0.01 ? `${r.toFixed(4)}em` : "";
        }
      } else if (this.cambiante && esActual && NE.pistas) {
        const n = NE.pistas.pulsosEntre(this.desde, t);
        const fam = IDS[(this.semillaFam + n) % IDS.length];
        if (fam !== this._fam) {
          this._fam = fam;
          this.fuente = fam;
          this.el.style.fontFamily = `"${FUENTES[fam].fam}"`;

          const r = this.famRatio ? this.famRatio[fam] || 1 : 1;
          this.el.style.fontSize = Math.abs(r - 1) > 0.01 ? `${r.toFixed(4)}em` : "";
          this._ejes = "";
        }
      }

      const ten = this.caras ? 0 : tension(t, this.desde, this.hasta, voz) * elasticidad;
      const f = FUENTES[this.fuente];

      const wdth = f.wdth ? Math.round(mezcla(100, this.anchoEjeMax, ten) / 2) * 2 : null;

      const wght = f.wght
        ? Math.round(mezcla(f.peso, f.wght[1], viva * 0.5) / 25) * 25
        : null;
      let ejes = "";
      if (!this.caras) {
        ejes = ejesCss(this.fuente, { wght, wdth });
        if (ejes !== this._ejes) { this.el.style.fontVariationSettings = ejes; this._ejes = ejes; }

        const track = `${(f.track + (Math.round(ten * 16) / 16) * 0.016).toFixed(4)}em`;
        if (track !== this._track) { this.el.style.letterSpacing = track; this._track = track; }
      }

      if (this.totalEco > 0) {
        let n = this.alargarYa ? this.totalEco : visibles(t, this.desde, this.hasta, this.totalEco);
        if (estado.sostenido > 0 && activa) {
          n = Math.min(this.ecos.length, n + Math.floor(estado.sostenido / 0.3));
        }
        if (n !== this.vistos) {
          for (let i = 0; i < this.ecos.length; i++) {
            const e = this.ecos[i].el;
            const dentro = i < n;
            if (dentro && e.style.display === "none") {

              e.style.display = "inline-block";
              e.style.fontSize = "0.04em";
              e.style.opacity = "0";
              void e.offsetWidth;
            } else if (!dentro && e.style.display !== "none") {
              e.style.display = "none";
              e.classList.remove("nace");
            }
          }
          this.vistos = n;
        }

        if (n !== this._vistosPintados || ejes !== this._ejesEco) {
          this._vistosPintados = n;
          this._ejesEco = ejes;
          for (let i = 0; i < n; i++) {
            const { el, indice, deGrupo } = this.ecos[i];
            const k = (indice + 1) / Math.max(1, deGrupo);
            if (!this.caras && (f.wght || f.wdth)) {
              el.style.fontVariationSettings = ejesCss(this.fuente, {
                wght: f.wght
                  ? Math.round(mezcla(wght == null ? f.peso : wght,
                      f.wght[0] + (f.wght[1] - f.wght[0]) * 0.18, k * 0.8) / 25) * 25
                  : null,
                wdth: f.wdth ? Math.round(mezcla(wdth == null ? 100 : wdth, 66, k * 0.85) / 2) * 2 : null,
              });
            }
            if (this.alargarYa) {

              el.style.fontSize = "";
              el.style.opacity = "";
              continue;
            }

            const afila = 0.3 * Math.min(1, (deGrupo - 1) / 3);
            el.style.fontSize = `${(1 - k * afila).toFixed(3)}em`;
            el.style.opacity = (1 - k * afila).toFixed(2);
          }
        }
      }

      const fuerza = Math.round(viva * halo * 12) / 12;
      if (fuerza !== this._fuerzaHalo) {
        this._fuerzaHalo = fuerza;
        this.el.style.textShadow = fuerza > 0.02 ? estado.sombra(fuerza, this.esRealce) : "";
      }

      return { activa, cantada, viva };
    }
  }

  NE.tipo = {
    FUENTES, IDS, ejesCss, anchoMaximo,
    partirVocales, medirSostenido, visibles, tension,
    Palabra,
  };
})();
