// Grano y polvo de pelicula; calidad adaptativa.
(() => {
  const { acotar, campana } = NE.mat;
  const { azar, azarEntre, ruidoCentrado } = NE.azar;

  const FPS_PELICULA = 16;

  const N_BALDOSAS = 6;
  const LADO_BALDOSA = 128;

  const gauss = (semilla) =>
    (azar(semilla) + azar(semilla * 7 + 1) + azar(semilla * 13 + 2) - 1.5) / 1.5;

  const crearBaldosa = (indice) => {
    const c = document.createElement("canvas");
    c.width = c.height = LADO_BALDOSA;
    const ctx = c.getContext("2d", { willReadFrequently: false });
    const img = ctx.createImageData(LADO_BALDOSA, LADO_BALDOSA);
    const d = img.data;
    for (let i = 0; i < LADO_BALDOSA * LADO_BALDOSA; i++) {
      const v = gauss(indice * 1000003 + i * 31 + 7);

      const claro = v > 0;
      const a = Math.min(255, Math.abs(v) * 300);
      const k = i * 4;
      d[k] = d[k + 1] = d[k + 2] = claro ? 255 : 0;
      d[k + 3] = a;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  };

  class Emulsion {
    constructor(lienzo) {
      this.lienzo = lienzo;
      this.ctx = lienzo.getContext("2d", { alpha: true, desynchronized: true });
      this.baldosas = Array.from({ length: N_BALDOSAS }, (_, i) => crearBaldosa(i));
      this.patrones = this.baldosas.map((b) => this.ctx.createPattern(b, "repeat"));
      this.ultimoFotograma = -1;
      this.escala = 0.6;
      this.ancho = 0;
      this.alto = 0;
      this.pelo = null;
      this.calidad = 1;
    }

    redimensionar(ancho, alto, dpr) {
      const s = Math.max(0.3, Math.min(1, this.escala)) * Math.min(dpr, 2);
      this.ancho = Math.max(1, Math.round(ancho * s));
      this.alto = Math.max(1, Math.round(alto * s));
      this.lienzo.width = this.ancho;
      this.lienzo.height = this.alto;
      this.ultimoFotograma = -1;
    }

    dibujar(t, frame, luzX = 0.5, luzY = 0.44) {
      const fotograma = Math.floor(t * FPS_PELICULA);
      if (fotograma === this.ultimoFotograma) return;
      this.ultimoFotograma = fotograma;
      this.luzX = luzX;
      this.luzY = luzY;

      const ctx = this.ctx;
      const W = this.ancho;
      const H = this.alto;
      ctx.clearRect(0, 0, W, H);

      const fuerza = acotar(0.10 + frame.rms * 0.10) * this.calidad;
      const patron = this.patrones[fotograma % N_BALDOSAS];
      ctx.globalAlpha = fuerza;
      ctx.save();

      ctx.translate(
        Math.floor(azarEntre(fotograma * 3 + 1, -LADO_BALDOSA, 0)),
        Math.floor(azarEntre(fotograma * 3 + 2, -LADO_BALDOSA, 0)),
      );
      ctx.fillStyle = patron;
      ctx.fillRect(0, 0, W + LADO_BALDOSA, H + LADO_BALDOSA);
      ctx.restore();
      ctx.globalAlpha = 1;

      const cuantas = Math.round(azarEntre(fotograma * 97, 0, 4) * this.calidad);
      for (let i = 0; i < cuantas; i++) {
        const s = fotograma * 613 + i * 29;
        const x = azarEntre(s + 1, 0, W);
        const y = azarEntre(s + 2, 0, H);
        const r = azarEntre(s + 3, 0.6, 2.4) * (W / 700);
        ctx.globalAlpha = azarEntre(s + 4, 0.18, 0.55);
        ctx.fillStyle = azar(s + 5) > 0.35 ? "#fff" : "#000";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 6.284);
        ctx.fill();
      }

      const cx = this.luzX * W;
      const cy = this.luzY * H;
      const radioLuz = Math.min(W, H) * 0.62;
      for (let i = 0; i < 9; i++) {
        const s = 4177 + i * 977;

        const vx = azarEntre(s + 1, -0.035, 0.035);
        const vy = azarEntre(s + 2, -0.022, -0.004);
        const fase = azarEntre(s + 3, 0, 100);
        const x = (azarEntre(s + 4, -0.55, 0.55) + vx * (t + fase)) % 1.1;
        const y = (azarEntre(s + 5, -0.5, 0.5) + vy * (t + fase)) % 1.1;
        const px = cx + x * radioLuz;
        const py = cy + y * radioLuz;
        if (px < -10 || px > W + 10 || py < -10 || py > H + 10) continue;

        const d = Math.hypot(px - cx, py - cy) / radioLuz;
        const dentro = Math.max(0, 1 - d * d);
        if (dentro < 0.03) continue;

        const titila = 0.55 + 0.45 * ruidoCentrado(t * 0.9 + fase, s, 2);
        ctx.globalAlpha = acotar(dentro * titila * 0.5 * this.calidad);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(px, py, azarEntre(s + 6, 0.7, 2.1) * (W / 700), 0, 6.284);
        ctx.fill();
      }

      const cicloPelo = Math.floor(t / 17);
      if (azar(cicloPelo * 71) > 0.45) {
        if (!this.pelo || this.pelo.ciclo !== cicloPelo) {
          const s = cicloPelo * 313;
          this.pelo = {
            ciclo: cicloPelo,
            borde: azar(s) > 0.5 ? 0 : 1,
            pos: azarEntre(s + 1, 0.15, 0.85),
            largo: azarEntre(s + 2, 0.08, 0.22),
            curva: azarEntre(s + 3, -0.5, 0.5),
          };
        }
        const p = this.pelo;
        const vida = campana(acotar((t / 17 - cicloPelo) / 0.8));
        if (vida > 0.02) {
          const tiembla = ruidoCentrado(t * 3.5, 41, 2) * (W * 0.002);
          ctx.globalAlpha = 0.22 * vida;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = Math.max(1, W / 900);
          ctx.beginPath();
          if (p.borde === 0) {
            const x = p.pos * W + tiembla;
            ctx.moveTo(x, 0);
            ctx.quadraticCurveTo(x + p.curva * W * 0.06, H * p.largo * 0.5, x + tiembla * 2, H * p.largo);
          } else {
            const y = p.pos * H + tiembla;
            ctx.moveTo(0, y);
            ctx.quadraticCurveTo(W * p.largo * 0.5, y + p.curva * H * 0.05, W * p.largo, y + tiembla * 2);
          }
          ctx.stroke();
        }
      }

      ctx.globalCompositeOperation = "destination-in";
      const mascara = ctx.createRadialGradient(W * 0.5, H * 0.44, 0, W * 0.5, H * 0.44, Math.max(W, H) * 0.62);
      mascara.addColorStop(0, "rgba(0,0,0,1)");
      mascara.addColorStop(0.55, "rgba(0,0,0,0.85)");
      mascara.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = mascara;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
  }

  class Calidad {
    constructor(emulsion) {
      this.emulsion = emulsion;
      this.tiempos = [];
      this.nivel = 1;
      this.ultimoCambio = 0;
    }

    medir(ms, ahora) {
      this.tiempos.push(ms);
      if (this.tiempos.length < 60) return;

      const ordenados = [...this.tiempos].sort((a, b) => a - b);
      const p75 = ordenados[Math.floor(ordenados.length * 0.75)];

      const base = ordenados[Math.floor(ordenados.length * 0.1)];
      this.tiempos.length = 0;

      if (p75 > Math.max(base * 1.7, base + 9) && this.nivel > 0.3 && ahora - this.ultimoCambio > 1500) {
        this.nivel = this.nivel > 0.6 ? 0.6 : 0.3;
        this.aplicar(ahora);
      } else if (p75 < base * 1.25 && this.nivel < 1 && ahora - this.ultimoCambio > 4000) {
        this.nivel = this.nivel < 0.6 ? 0.6 : 1;
        this.aplicar(ahora);
      }
    }

    aplicar(ahora) {
      this.ultimoCambio = ahora;
      this.emulsion.calidad = this.nivel;
      if (this.fogata) this.fogata.calidad = this.nivel;
      if (this.experiencia) this.experiencia.calidad = this.nivel;
      this.emulsion.escala = this.nivel >= 1 ? 0.6 : this.nivel >= 0.6 ? 0.45 : 0.32;
      document.body.classList.toggle("calidad-baja", this.nivel < 0.6);

      document.body.classList.toggle("ligero", this.nivel < 0.6);
      NE.app && NE.app.redimensionar();
    }
  }

  NE.Emulsion = Emulsion;
  NE.Calidad = Calidad;
  NE.FPS_PELICULA = FPS_PELICULA;
})();
