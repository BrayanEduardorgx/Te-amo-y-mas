// Colocacion de los versos en escena y calculo de tamanos.
(() => {
  const { acotar } = NE.mat;
  const { crear } = NE.dom;
  const { FUENTES, IDS, Palabra } = NE.tipo;

  const ESCALA_VECINO = 0.34;

  class Linea {
    constructor(frase, contenedor, indice) {
      this.frase = frase;
      this.op = frase.op || {};
      this.tratamiento = frase.tratamiento || "verso";
      this.indice = indice;
      this.desde = frase.palabras[0].desde;
      this.hasta = frase.palabras[frase.palabras.length - 1].hasta;

      this.el = crear("div", "linea", contenedor);
      this.el.classList.add(`t-${this.tratamiento}`);

      if (this.op.rojo) this.el.classList.add("rojo");

      this.palabras = [];
      this.filas = [];
      this.hayCambiante = false;
      this.construir();

      this.hueco = "";
      this._transform = "";
    }

    construir() {
      const op = this.op;
      const total = this.frase.palabras.length;

      const rango =
        Array.isArray(op.realce) ? op.realce
        : op.realce === "todo" ? [0, total]
        : op.realce === "no" ? [total, total]
        : typeof op.realce === "number" ? [op.realce, total]
        : this.tratamiento === "solitaria" ? [0, total]
        : [Math.max(0, total - 1), total];

      const cambia = (i) =>
        op.cambiante === "todo" ? true
        : Array.isArray(op.cambiante) ? op.cambiante.indexOf(i) >= 0
        : false;

      const solitaria = this.tratamiento === "solitaria";
      const letras = this.frase.palabras.reduce((s, p) => s + p.texto.length + 1, 0);

      const nFilas = solitaria ? 1 : op.renglones || acotar(Math.ceil(letras / 9), 1, 4);
      const grupos = repartir(this.frase.palabras, nFilas);

      let n = 0;
      for (const grupo of grupos) {
        const fila = crear("div", "fila", this.el);
        this.filas.push(fila);
        for (const p of grupo) {
          const realce = n >= rango[0] && n < rango[1];
          const cambiante = cambia(n);
          if (cambiante || op.caras) this.hayCambiante = true;

          let alargar;
          if (op.alargar) {
            for (const clave of Object.keys(op.alargar)) {
              if (clave.toLowerCase() === p.texto.toLowerCase()) alargar = op.alargar[clave];
            }
          }

          const palabra = new Palabra(p.texto, p.desde, p.hasta, {
            esFinal: n === total - 1,
            fuente: (realce && op.fuenteRealce) || op.fuente || "archivo",
            mayusculas: realce ? (op.mayusculasRealce ?? op.mayusculas) : op.mayusculas,
            cursiva: realce ? (op.cursivaRealce ?? op.cursiva) : op.cursiva,
            cambiante: cambiante || !!op.caras,
            caras: op.caras,
            golpes: op.golpes,
            alargarYa: op.alargarYa,
            alargar,
          });
          palabra.semillaFam = (this.indice * 3 + n) % IDS.length;
          palabra.esRealce = realce;
          if (realce) palabra.el.classList.add("realce");
          fila.appendChild(palabra.el);
          this.palabras.push(palabra);
          n++;
        }
      }
    }

    ajustar(ancho, altoMax, ref) {
      this.el.style.fontSize = `${ref}px`;
      this.el.style.visibility = "visible";

      for (const p of this.palabras) {
        for (let i = 0; i < p.ecos.length; i++) {
          const e = p.ecos[i];
          if (i >= p.totalEco) { e.el.style.display = "none"; continue; }
          e.el.style.display = "inline-block";
          if (p.alargarYa) { e.el.style.fontSize = ""; continue; }
          const k = (e.indice + 1) / Math.max(1, e.deGrupo);
          e.el.style.fontSize = `${(1 - k * 0.3).toFixed(3)}em`;
        }
      }

      for (const p of this.palabras) {
        const f = FUENTES[p.fuente];
        if (!f.wght) continue;
        p.el.style.fontVariationSettings = NE.tipo.ejesCss(p.fuente, {
          wght: f.peso + (f.wght[1] - f.peso) * 0.5,
        });
      }

      const medir = () => {

        this.el.style.width = "max-content";
        let m = 1;
        for (const f of this.filas) m = Math.max(m, f.getBoundingClientRect().width, f.scrollWidth);
        this.el.style.width = "";
        return m;
      };

      let anchoMax;
      if (this.hayCambiante) {

        const original = this.palabras.map((p) => p.fuente);

        if (this.op.caras) {

          const medidasC = [];
          for (const c of this.op.caras) {
            for (const p of this.palabras) {
              if (!p.cambiante) continue;
              p.el.style.fontFamily = `"${FUENTES[c.f].fam}"`;
              p.el.style.fontStyle = c.it ? "italic" : "normal";
              p.el.style.fontVariationSettings = NE.tipo.ejesCss(c.f, { wght: c.wght, wdth: c.wdth });
            }
            medidasC.push(medir());
          }
          const caraRatio = medidasC.map((m) => acotar(medidasC[0] / (m || 1), 0.6, 1.6));
          console.log("[luz-prendida] caras", this.frase.id,
            medidasC.map((m, i) => `${i}:${m.toFixed(0)} r${caraRatio[i].toFixed(2)}`).join("  "));
          for (const p of this.palabras) if (p.cambiante) p.caraRatio = caraRatio;
          this.palabras.forEach((p, i) => {
            p.fuente = original[i];
            p.el.style.fontFamily = `"${FUENTES[original[i]].fam}"`;
            p.el.style.fontStyle = p.cursiva ? "italic" : "normal";
          });
          anchoMax = medidasC[0];
        } else {
          const conCambio = this.palabras.find((p) => p.cambiante) || this.palabras[0];
          const base = conCambio.fuenteBase;
          const medidas = {};
          for (const fam of IDS) {
            for (const p of this.palabras) {
              if (!p.cambiante) continue;
              p.fuente = fam;
              p.el.style.fontFamily = `"${FUENTES[fam].fam}"`;
            }
            medidas[fam] = medir();
          }
          this.palabras.forEach((p, i) => {
            p.fuente = original[i];
            p.el.style.fontFamily = `"${FUENTES[original[i]].fam}"`;
          });

          const famRatio = {};
          for (const fam of IDS) {
            famRatio[fam] = acotar(medidas[base] / (medidas[fam] || 1), 0.72, 1.4);
          }
          for (const p of this.palabras) if (p.cambiante) p.famRatio = famRatio;

          anchoMax = medidas[base];
        }
      } else {
        anchoMax = medir();
      }

      for (const p of this.palabras) {
        p.el.style.fontVariationSettings = "";
        p._ejes = "";
      }

      const tope = this.tratamiento === "solitaria" ? ref * 4.5 : ref * 4;

      const util = this.tratamiento === "solitaria" ? ancho * 0.99 : ancho * 0.94;
      this.anchoRef = anchoMax;
      this.refMedida = ref;
      this.anchoDisp = ancho;
      this.tamanoMax = Math.min((util * ref) / anchoMax, tope, (altoMax / this.filas.length) * 0.95);
      this.fijarTamano(this.tamanoMax);
    }

    fijarTamano(px) {
      this.tamano = px;
      this.el.style.fontSize = `${px.toFixed(1)}px`;
      const holgura = this.anchoDisp / (this.anchoRef * (px / this.refMedida));
      for (const p of this.palabras) {
        p.anchoEjeMax = Math.min(NE.tipo.anchoMaximo(p.fuente), acotar(holgura * 100, 100, 151));
        for (const e of p.ecos) e.el.style.display = "none";
        p.vistos = -1;
        p._vistosPintados = -1;
      }
    }

    ponerHueco(nombre, y) {
      if (nombre === this.hueco) return;
      this.hueco = nombre;
      const escala = nombre === "actual" || nombre === "apaga" || nombre === "prep" ? 1 : ESCALA_VECINO;
      this.el.classList.remove("h-anterior", "h-actual", "h-siguiente", "h-lejos", "h-fuera", "h-apaga", "h-prep");
      this.el.classList.add(`h-${nombre}`);
      const tr = `translate(-50%,-50%) translate3d(0,${y.toFixed(1)}px,0) scale(${escala})`;
      if (tr !== this._transform) { this.el.style.transform = tr; this._transform = tr; }

      this.el.style.visibility = nombre === "fuera" ? "hidden" : "visible";
    }

    dibujar(t, f, paleta, esActual) {
      if (this.hueco === "fuera" || this.hueco === "apaga" || this.hueco === "prep") return;
      const estado = {
        voz: f.voz,
        halo: esActual ? (this.op.halo != null ? this.op.halo : 1) : 0,
        elasticidad: this.op.elasticidad != null ? this.op.elasticidad : 1,
        sostenido: NE.app && NE.app.sostenido
          ? (performance.now() - NE.app.sostenido.inicio) / 1000
          : 0,
        sombra: (fuerza, realce) => NE.halacion(paleta, this.tamano, fuerza, realce),
      };
      for (const p of this.palabras) p.dibujar(t, estado, esActual);
    }
  }

  class Escenario {
    constructor(contenedor, frases) {
      this.el = contenedor;
      this.lineas = frases.map((f, i) => new Linea(f, contenedor, i));
      this.actual = -1;
      this.huecos = { anterior: 0, actual: 0, siguiente: 0, lejos: 0 };
    }

    ajustar(ancho, alto, ref) {
      this.alto = alto;

      for (const l of this.lineas) l.ajustar(ancho, alto * 0.34, ref);

      const cuerpo = ["verso", "mentira", "capilar", "identidad"];
      const grupo = this.lineas.filter((l) => cuerpo.includes(l.tratamiento));
      if (grupo.length) {
        const tallas = grupo.map((l) => l.tamanoMax).sort((a, b) => a - b);
        const comun = tallas[Math.floor(tallas.length * 0.3)];
        for (const l of grupo) l.fijarTamano(Math.min(l.tamanoMax, comun));
      }

      let masAlto = 1;
      for (const l of this.lineas) {
        l.altoReal = l.el.offsetHeight || 1;
        if (l.altoReal > masAlto) masAlto = l.altoReal;
      }
      const aire = alto * 0.03;
      const sep = masAlto / 2 + (masAlto * ESCALA_VECINO) / 2 + aire;
      const centro = alto * 0.46;
      this.huecos = {
        actual: centro,
        anterior: centro - sep,
        siguiente: centro + sep,
        lejos: centro + sep * 1.7,
      };
      this.separacion = sep;

      this.actual = -1;
      for (const l of this.lineas) { l.hueco = ""; l._transform = ""; }
    }

    indiceEn(t) {

      let i = 0;
      for (let k = 0; k < this.lineas.length; k++) if (this.lineas[k].desde - 0.2 <= t) i = k;

      while (i > 0 && this.lineas[i].desde > t && this.lineas[i - 1].hasta > t) i--;
      return i;
    }

    dibujar(t, f, paleta) {
      const i = this.indiceEn(t);
      if (i !== this.actual) {
        this.actual = i;
        for (let k = 0; k < this.lineas.length; k++) {
          const d = k - i;
          const nombre =
            d === 0 ? "actual"
            : d === -1 ? "anterior"
            : d === 1 ? "siguiente"
            : d === 2 ? "lejos"
            : "fuera";

          if (this.lineas[k].tratamiento === "solitaria" && (nombre === "anterior" || nombre === "lejos")) {
            this.lineas[k].ponerHueco("apaga", this.huecos.actual);
            continue;
          }

          if (this.lineas[k].tratamiento === "solitaria" && nombre === "siguiente") {
            this.lineas[k].ponerHueco("prep", this.huecos.actual);
            continue;
          }
          this.lineas[k].ponerHueco(nombre, this.huecos[nombre] ?? this.huecos.lejos);
        }
      }
      for (let k = Math.max(0, i - 1); k <= Math.min(this.lineas.length - 1, i + 2); k++) {
        this.lineas[k].dibujar(t, f, paleta, k === i);
      }
    }

    reiniciar() {
      this.actual = -1;
      for (const l of this.lineas) for (const p of l.palabras) p.reiniciar();
    }
  }

  const halacion = (paleta, tamano, fuerza, realce) => {
    const f = acotar(fuerza, 0, 1.4);
    const c = NE.color.conAlfa;
    const tono = realce ? paleta.realce : paleta.halacion;
    return (
      `0 0 ${(tamano * 0.04 * f).toFixed(1)}px ${c(tono, 0.55 * f)},` +
      `0 0 ${(tamano * 0.2 * f).toFixed(1)}px ${c(tono, 0.34 * f)},` +
      `0 0 ${(tamano * 0.62 * f).toFixed(1)}px ${c(tono, 0.2 * f)},` +
      `0 0 ${(tamano * 1.5 * f).toFixed(1)}px ${c(paleta.halacion, 0.1 * f)}`
    );
  };

  const repartir = (palabras, n) => {
    if (n <= 1) return [palabras];
    const largo = palabras.reduce((s, p) => s + p.texto.length + 1, 0);
    const objetivo = largo / n;
    const salida = [];
    let actual = [];
    let acumulado = 0;
    for (const p of palabras) {
      actual.push(p);
      acumulado += p.texto.length + 1;
      if (acumulado >= objetivo && salida.length < n - 1) {
        salida.push(actual);
        actual = [];
        acumulado = 0;
      }
    }
    if (actual.length) salida.push(actual);
    return salida;
  };

  NE.Escenario = Escenario;
  NE.Linea = Linea;
  NE.halacion = halacion;
})();
