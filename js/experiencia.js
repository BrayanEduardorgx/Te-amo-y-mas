// Capas ambientales, narrativa visual, particulas, recuerdos y fotografias.
(() => {
  const { acotar, suave, campana } = NE.mat;
  const { crear } = NE.dom;
  const { conAlfa } = NE.color;

  const ESCENAS = [
    { desde: 0,   nombre: "oscuridad", rotulo: "la oscuridad", particula: "ceniza" },
    { desde: 4,   nombre: "chispa", rotulo: "la primera chispa", particula: "luciernaga" },
    { desde: 22,  nombre: "fuego", rotulo: "el fuego crece", particula: "ascua" },
    { desde: 54,  nombre: "tormenta", rotulo: "todo cambia", particula: "petalo" },
    { desde: 104, nombre: "calma", rotulo: "la calma", particula: "polvo" },
    { desde: 172, nombre: "amanecer", rotulo: "vuelve la luz", particula: "luz" },
  ];

  const aplicarDedicatoria = () => {
    const c = NE.personalizacion && NE.personalizacion.entrada;
    const entrada = document.getElementById("entrada");
    if (!entrada || !c || !c.mostrar || (!c.para && !c.frase)) return;
    const bloque = crear("div", "dedicatoria-entrada", entrada);
    if (c.para) crear("div", "dedicatoria-para", bloque).textContent = c.para;
    if (c.frase) crear("div", "dedicatoria-frase", bloque).textContent = c.frase;
  };

  class Experiencia {
    constructor(cuadro) {
      this.cuadro = cuadro;
      this.config = NE.personalizacion || {};
      this.x = 0.5;
      this.y = 0.45;
      this.escena = -1;
      this.fotoActiva = -1;
      this.eventosFotoActivos = new Set();
      this.t = 0;
      this.estela = [];
      this.estallidos = [];
      this.ultimaEstela = 0;
      this.ultimoFrameParticulas = -1;
      this.calidad = 1;

      this.ambiente = crear("div", "ambiente-profundo", cuadro);
      this.ambiente.setAttribute("aria-hidden", "true");
      for (let i = 0; i < 4; i++) crear("i", `sombra-ambiente s${i + 1}`, this.ambiente);
      this.humo = crear("div", "humo-ambiente", cuadro);
      this.humo.setAttribute("aria-hidden", "true");
      for (let i = 0; i < 5; i++) crear("i", `humo-hilo h${i + 1}`, this.humo);
      this.reflejo = crear("div", "reflejo-fuego", cuadro);
      this.reflejo.setAttribute("aria-hidden", "true");
      this.halo = document.getElementById("halo");
      this.haz = document.getElementById("haz");
      this.pared = document.getElementById("pared");
      this.cambioEscena = crear("div", "cambio-escena", cuadro);
      this.cambioEscena.setAttribute("aria-hidden", "true");
      this.rotuloEscena = crear("span", "", this.cambioEscena);

      this.canvas = crear("canvas", "particulas-emocionales", cuadro);
      this.canvas.setAttribute("aria-hidden", "true");
      this.ctx = this.canvas.getContext("2d", { alpha: true });
      this.semillas = Array.from({ length: 80 }, (_, i) => ({
        x: ((i * 47) % 101) / 101,
        y: ((i * 83 + 17) % 103) / 103,
        tam: 0.6 + ((i * 29) % 17) / 10,
        vel: 0.45 + ((i * 13) % 19) / 18,
        fase: ((i * 31) % 97) / 97,
      }));

      this.crearGaleria();
      this.crearRecuerdos();
      this.redimensionar();
    }

    crearGaleria() {
      this.fotos = (this.config.fotografias || []).filter((f) => f && String(f.src || "").trim());
      if (!this.fotos.length) return;
      this.galeria = crear("section", "galeria-recuerdos", this.cuadro);
      this.galeria.setAttribute("aria-label", "Fotografías y recuerdos");
      this.tarjetasFoto = this.fotos.map((foto) => {
        const figura = crear("figure", "foto-recuerdo", this.galeria);
        const img = crear("img", "", figura);
        img.src = foto.src;
        img.alt = foto.titulo || foto.frase || "Fotografía de un recuerdo";
        const pie = crear("figcaption", "", figura);
        if (foto.titulo) crear("strong", "", pie).textContent = foto.titulo;
        if (foto.frase) crear("span", "", pie).textContent = foto.frase;
        return figura;
      });
    }

    crearRecuerdos() {
      this.recuerdos = (this.config.recuerdos || []).filter((r) => r && r.palabra);
      if (!this.recuerdos.length) return;
      this.modal = crear("div", "recuerdo-modal", document.body);
      this.modal.setAttribute("aria-hidden", "true");
      const tarjeta = crear("article", "recuerdo-tarjeta", this.modal);
      this.recuerdoCerrar = crear("button", "recuerdo-cerrar", tarjeta);
      this.recuerdoCerrar.type = "button";
      this.recuerdoCerrar.setAttribute("aria-label", "Cerrar recuerdo");
      this.recuerdoCerrar.textContent = "×";
      this.recuerdoTitulo = crear("div", "recuerdo-titulo", tarjeta);
      this.recuerdoTexto = crear("div", "recuerdo-texto", tarjeta);
      this.recuerdoFecha = crear("div", "recuerdo-fecha", tarjeta);
      const cerrar = () => {
        this.modal.classList.remove("visible");
        this.modal.setAttribute("aria-hidden", "true");
      };
      this.recuerdoCerrar.addEventListener("click", cerrar);
      this.modal.addEventListener("pointerdown", (e) => { if (e.target === this.modal) cerrar(); });
    }

    prepararRecuerdos(escenario) {
      if (!this.modal || !escenario) return;
      const pendientes = new Map(this.recuerdos.map((r) => [r.palabra.toLocaleLowerCase("es"), r]));
      for (const linea of escenario.lineas) {
        for (const palabra of linea.palabras) {
          const clave = palabra.texto.replace(/^[¿¡(]+|[.,;:!?)]*$/g, "").toLocaleLowerCase("es");
          const recuerdo = pendientes.get(clave);
          if (!recuerdo) continue;
          palabra.el.classList.add("pal-recuerdo");
          palabra.el.tabIndex = 0;
          palabra.el.setAttribute("role", "button");
          palabra.el.setAttribute("aria-label", `Abrir recuerdo: ${recuerdo.titulo || palabra.texto}`);
          const abrir = (e) => {
            e.stopPropagation();
            this.recuerdoTitulo.textContent = recuerdo.titulo || palabra.texto;
            this.recuerdoTexto.textContent = recuerdo.texto || "";
            this.recuerdoFecha.textContent = recuerdo.fecha || "";
            this.recuerdoFecha.hidden = !recuerdo.fecha;
            this.modal.classList.add("visible");
            this.modal.setAttribute("aria-hidden", "false");
          };
          palabra.el.addEventListener("click", abrir);
          palabra.el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") abrir(e);
          });
          pendientes.delete(clave);
        }
      }
    }

    redimensionar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      this.w = Math.max(1, this.cuadro.clientWidth);
      this.h = Math.max(1, this.cuadro.clientHeight);
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.canvas.style.width = `${this.w}px`;
      this.canvas.style.height = `${this.h}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    puntero(x, y) {
      this.x = x;
      this.y = y;
      this.humo.style.setProperty("--raton-x", `${((x - 0.5) * 58).toFixed(1)}px`);
      this.humo.style.setProperty("--raton-y", `${((y - 0.5) * 34).toFixed(1)}px`);
      this.cuadro.style.setProperty("--luz-x", `${(x * 100).toFixed(1)}%`);
      this.cuadro.style.setProperty("--luz-y", `${(y * 100).toFixed(1)}%`);
      if (this.t >= 3 && performance.now() - this.ultimaEstela > 55) {
        this.ultimaEstela = performance.now();
        this.estela.push({ x, y, nace: performance.now() });
        if (this.estela.length > 24) this.estela.shift();
      }
    }

    impulso(x, y) {
      if (this.t < 3) return;
      this.estallidos.push({ x, y, nace: performance.now() });
      if (this.estallidos.length > 4) this.estallidos.shift();
      this.cuadro.classList.remove("toque-luz");
      void this.cuadro.offsetWidth;
      this.cuadro.classList.add("toque-luz");
    }

    iniciar() { document.body.classList.add("experiencia-iniciada"); }

    dibujar(t, f, paleta) {
      this.t = t;
      const activacion = suave(acotar((t - 3) / 2));
      this.cuadro.classList.toggle("ambiente-visible", t >= 3);
      let i = 0;
      for (let k = 0; k < ESCENAS.length; k++) if (t >= ESCENAS[k].desde) i = k;
      if (i !== this.escena) {
        this.escena = i;
        this.cuadro.dataset.escena = ESCENAS[i].nombre;
        if (t >= 3.5) {
          this.rotuloEscena.textContent = ESCENAS[i].rotulo;
          this.cambioEscena.classList.remove("visible");
          void this.cambioEscena.offsetWidth;
          this.cambioEscena.classList.add("visible");
        }
      }

      const pulso = acotar(0.42 + f.graves * 0.72 + f.pulso * 0.42);
      this.cuadro.style.setProperty("--pulso-ambiente", pulso.toFixed(3));
      this.cuadro.style.setProperty("--entrada-ambiente", activacion.toFixed(3));
      this.cuadro.style.setProperty("--color-ambiente", paleta.halacion);
      this.reflejo.style.opacity = (activacion * (0.24 + pulso * 0.46)).toFixed(3);
      this.reflejo.style.transform = `translateX(-50%) scaleX(${(0.9 + pulso * 0.48).toFixed(3)}) scaleY(${(0.92 + f.graves * 0.28).toFixed(3)})`;
      const brillo = (1.05 + activacion * (f.graves * 0.65 + f.pulso * 0.28)).toFixed(2);
      if (this.halo) this.halo.style.filter = `saturate(1.45) brightness(${brillo})`;
      if (this.haz) this.haz.style.filter = `saturate(1.35) brightness(${brillo})`;
      if (this.pared) this.pared.style.filter = `saturate(1.3) brightness(${brillo})`;
      this.dibujarParticulas(t, f, paleta, ESCENAS[i].particula);
      this.actualizarGaleria(t);
    }

    dibujarParticulas(t, f, paleta, tipo) {
      const fotograma = Math.floor(t * 45);
      if (fotograma === this.ultimoFrameParticulas) return;
      this.ultimoFrameParticulas = fotograma;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      const personalizada = this.config.constelacion || {};
      const cicloCorazon = t >= 5 ? Math.floor((t - 5) / 22) : -1;
      const dentroCiclo = cicloCorazon >= 0 ? (t - 5) - cicloCorazon * 22 : 99;
      const automatico = dentroCiclo < 7
        ? { desde: t - dentroCiclo, duracion: 7, ciclo: cicloCorazon }
        : null;
      const manual = personalizada.mostrar && t >= Number(personalizada.desde) &&
        t <= Number(personalizada.desde) + Number(personalizada.duracion)
        ? { ...personalizada, ciclo: cicloCorazon + 1 }
        : null;
      const constelacion = manual || automatico;
      const enCorazon = constelacion != null;
      const kCorazon = enCorazon
        ? suave(acotar(Math.min(t - constelacion.desde, constelacion.desde + constelacion.duracion - t) / 1.7))
        : 0;
      const entrada = suave(acotar((t - 3) / 2));
      const cantidadBase = document.body.classList.contains("ligero") ? 30 : 64;
      const cantidad = Math.max(24, Math.round(cantidadBase * this.calidad));
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < cantidad; i++) {
        const s = this.semillas[i];
        const subida = ((s.y - t * 0.018 * s.vel) % 1 + 1) % 1;
        let x = (s.x + Math.sin(t * 0.35 + i) * 0.018) * this.w;
        let y = subida * this.h;
        const dx = this.x * this.w - x;
        const dy = this.y * this.h - y;
        const cercania = Math.max(0, 1 - Math.hypot(dx, dy) / (this.w * 0.42));
        x += dx * cercania * 0.10;
        y += dy * cercania * 0.075;

        if (kCorazon > 0) {
          const a = (i / cantidad) * Math.PI * 2;
          const alterna = (i + constelacion.ciclo) % 2;
          const arriba = constelacion.ciclo % 2 === 0;
          const cx = this.w * (alterna ? 0.86 : 0.14);
          const cy = this.h * (alterna === Number(arriba) ? 0.27 : 0.72);
          const escala = Math.min(this.w, this.h);
          const hx = cx + Math.pow(Math.sin(a), 3) * escala * 0.075;
          const hy = cy - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * escala * 0.0055;
          x += (hx - x) * kCorazon;
          y += (hy - y) * kCorazon;
        }

        let alpha = entrada * (0.22 + f.altos * 0.5) * (0.62 + s.fase * 0.52);
        let radio = s.tam * 1.45;
        if (tipo === "luciernaga" || tipo === "luz") { alpha *= 1.75; radio *= 1.55; }
        if (tipo === "ceniza") alpha *= 0.72;
        if (tipo === "petalo") radio *= 2.25;
        if (kCorazon > 0) { alpha = 0.48 + kCorazon * 0.52; radio *= 1.7; }
        const colorExterior = conAlfa(paleta.halacion, acotar(alpha * 0.28));
        ctx.fillStyle = colorExterior;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.2, radio * 2.7), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = conAlfa(paleta.halacion, acotar(alpha));
        ctx.beginPath();
        if (tipo === "petalo" && !enCorazon) ctx.ellipse(x, y, radio * 1.8, radio * 0.75, t + i, 0, Math.PI * 2);
        else ctx.arc(x, y, Math.max(0.5, radio), 0, Math.PI * 2);
        ctx.fill();
        if ((tipo === "ascua" || tipo === "ceniza") && i % 3 === 0) {
          ctx.strokeStyle = conAlfa(paleta.realce, acotar(alpha * 0.5));
          ctx.lineWidth = Math.max(0.5, radio * 0.42);
          ctx.beginPath();
          ctx.moveTo(x, y + radio * 3.5);
          ctx.lineTo(x, y + radio * 0.4);
          ctx.stroke();
        }
      }
      const ahora = performance.now();
      this.estela = this.estela.filter((p) => ahora - p.nace < 900);
      for (const p of this.estela) {
        const vida = 1 - (ahora - p.nace) / 900;
        ctx.fillStyle = conAlfa(paleta.halacion, vida * 0.55);
        ctx.beginPath();
        ctx.arc(p.x * this.w, p.y * this.h, 1.5 + vida * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      this.estallidos = this.estallidos.filter((p) => ahora - p.nace < 850);
      for (const p of this.estallidos) {
        const vida = acotar((ahora - p.nace) / 850);
        for (let k = 0; k < 18; k++) {
          const a = (k / 18) * Math.PI * 2;
          const distancia = suave(vida) * Math.min(this.w, this.h) * 0.16;
          ctx.fillStyle = conAlfa(paleta.halacion, (1 - vida) * 0.85);
          ctx.beginPath();
          ctx.arc(p.x * this.w + Math.cos(a) * distancia, p.y * this.h + Math.sin(a) * distancia, 1.2 + (1 - vida) * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    }

    actualizarGaleria(t) {
      if (!this.galeria) return;
      const inicio = 3.5;
      const intervalo = 3.4;
      const duracion = 4.7;
      const eventoActual = Math.floor((t - inicio) / intervalo);
      const eventos = new Set();

      if (eventoActual >= 0) {
        for (let evento = Math.max(0, eventoActual - 1); evento <= eventoActual; evento++) {
          const nace = inicio + evento * intervalo;
          if (t >= nace && t < nace + duracion) eventos.add(evento);
        }
      }

      const clave = [...eventos].join(",");
      if (clave === this.fotoActiva) return;
      this.fotoActiva = clave;
      this.eventosFotoActivos = eventos;
      this.tarjetasFoto.forEach((el) => el.classList.remove("visible"));
      eventos.forEach((evento) => {
        const indice = evento % this.fotos.length;
        const el = this.tarjetasFoto[indice];
        this.colocarFoto(el, evento);
        el.style.zIndex = String(20 + evento);
        el.classList.add("visible");
      });
      this.galeria.classList.toggle("visible", eventos.size > 0);
    }

    colocarFoto(el, evento) {
      const movil = this.w <= 600;
      const posiciones = movil
        ? [[14,18], [86,20], [14,76], [86,72], [50,14], [50,82]]
        : [[13,20], [87,22], [14,72], [86,70], [27,14], [73,82]];
      const cuadroRect = this.cuadro.getBoundingClientRect();
      const limites = [...document.querySelectorAll("#letra .linea:not(.h-fuera):not(.h-prep):not(.h-apaga)")]
        .map((linea) => linea.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0);
      const ancho = movil ? Math.min(this.w * .28, 130) : Math.min(this.w * .18, 250);
      const alto = movil ? Math.min(this.h * .24, 175) : Math.min(this.h * .38, 330);
      const margen = movil ? 12 : 28;
      let elegida = posiciones[evento % posiciones.length];

      for (let intento = 0; intento < posiciones.length; intento++) {
        const candidata = posiciones[(evento + intento) % posiciones.length];
        const cx = cuadroRect.left + this.w * candidata[0] / 100;
        const cy = cuadroRect.top + this.h * candidata[1] / 100;
        const choca = limites.some((limite) =>
          cx + ancho / 2 + margen > limite.left && cx - ancho / 2 - margen < limite.right &&
          cy + alto / 2 + margen > limite.top && cy - alto / 2 - margen < limite.bottom
        );
        if (!choca) { elegida = candidata; break; }
      }
      el.style.setProperty("--foto-x", `${elegida[0]}%`);
      el.style.setProperty("--foto-y", `${elegida[1]}%`);
      el.style.setProperty("--foto-giro", `${((evento * 7) % 7) - 3}deg`);
    }

    mostrarFinal(contenedor) {
      const c = this.config.final;
      if (!c || !c.mostrar || (!c.frase && !c.firma)) return;
      const despedida = crear("div", "despedida-personal", contenedor);
      if (c.frase) crear("div", "despedida-frase", despedida).textContent = c.frase;
      if (c.firma) crear("div", "despedida-firma", despedida).textContent = c.firma;
    }

    reiniciar() {
      this.fotoActiva = -1;
      this.eventosFotoActivos.clear();
      this.ultimoFrameParticulas = -1;
      this.estela.length = 0;
      this.estallidos.length = 0;
      if (this.galeria) {
        this.galeria.classList.remove("visible");
        this.tarjetasFoto.forEach((el) => el.classList.remove("visible"));
      }
    }
  }

  aplicarDedicatoria();
  NE.Experiencia = Experiencia;
})();
