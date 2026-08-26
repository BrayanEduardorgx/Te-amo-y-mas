// Reloj maestro sincronizado al audio y lectura de pistas.
(() => {
  const { acotar } = NE.mat;

  const desdeBase64 = (b64) => {
    const bin = atob(b64);
    const salida = new Float32Array(bin.length);
    for (let i = 0; i < bin.length; i++) salida[i] = bin.charCodeAt(i) / 255;
    return salida;
  };

  class Reloj {
    constructor(audio) {
      this.audio = audio;
      this.ultimoCT = -1;
      this.anclaPerf = 0;
      this.t = 0;
      this.dt = 1 / 60;
      this.anterior = 0;

      this.latencia = 0;
      this.calibracion = 0;
    }

    medirLatencia(ctx) {
      const salida = (ctx && (ctx.outputLatency || ctx.baseLatency)) || 0;

      this.latencia = salida - 1 / 60;
    }

    leer() {
      const ct = this.audio.currentTime;
      if (ct !== this.ultimoCT) {
        this.ultimoCT = ct;
        this.anclaPerf = performance.now();
      }
      let t = ct;
      if (!this.audio.paused) {

        t += Math.min((performance.now() - this.anclaPerf) / 1000, 0.05);
      }
      t -= this.latencia + this.calibracion;

      this.dt = acotar(t - this.anterior, 0.001, 0.05);
      this.anterior = t;
      this.t = t;
      return t;
    }

    reanclar() {
      this.ultimoCT = -1;
      this.anterior = this.audio.currentTime;
    }
  }

  class Pistas {
    constructor(datos) {
      this.fps = datos.pistasFps;
      this.series = {};
      for (const [nombre, b64] of Object.entries(datos.pistas)) {
        this.series[nombre] = desdeBase64(b64);
      }
      this.beats = datos.beats;
      this.onsets = datos.onsets;
      this.duracionPulso = 60 / (datos.bpm || 120);

      // Recorre el material visual preanalizado durante toda la nueva pista,
      // evitando que la luz y el grano queden inmoviles despues del primer minuto.
      const primera = Object.values(this.series)[0];
      const duracionAnalisis = primera ? primera.length / this.fps : datos.duracion;
      this.escalaTiempo = duracionAnalisis / Math.max(0.001, datos.duracion);

      this.fuertes = this.beats.filter((_, i) => i % 4 === 0);
    }

    lee(nombre, t, ventana = 0.08) {
      const serie = this.series[nombre];
      if (!serie) return 0;

      t *= this.escalaTiempo;
      ventana *= this.escalaTiempo;

      const centro = t * this.fps;
      const radio = ventana * this.fps;
      if (radio < 0.5) {
        const i = acotar(centro, 0, serie.length - 1);
        const i0 = Math.floor(i);
        const f = i - i0;
        return serie[i0] * (1 - f) + serie[Math.min(serie.length - 1, i0 + 1)] * f;
      }

      const desde = Math.max(0, Math.floor(centro - radio));
      const hasta = Math.min(serie.length - 1, Math.ceil(centro + radio));
      let suma = 0;
      let peso = 0;
      for (let i = desde; i <= hasta; i++) {
        const w = 1 - Math.abs(i - centro) / (radio + 1);
        if (w <= 0) continue;
        suma += serie[i] * w;
        peso += w;
      }
      return peso > 0 ? suma / peso : 0;
    }

    static ultimoAntesDe(lista, t) {
      let lo = 0, hi = lista.length - 1, res = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (lista[mid] <= t) { res = mid; lo = mid + 1; }
        else hi = mid - 1;
      }
      return res;
    }

    pulso(t, caida = 0.28, lista = null) {
      const l = lista || this.beats;
      const i = Pistas.ultimoAntesDe(l, t);
      if (i < 0) return 0;
      return Math.exp(-((t - l[i]) / (caida / 3)));
    }

    golpe(t, caida = 0.2) {
      return this.pulso(t, caida, this.fuertes);
    }

    pulsosEntre(desde, t) {
      return Math.max(
        0,
        Pistas.ultimoAntesDe(this.beats, t) - Pistas.ultimoAntesDe(this.beats, desde),
      );
    }
  }

  const construirFrame = (pistas, t, dt) => ({
    t,
    dt,
    rms: pistas.lee("rms", t, 0.10),
    voz: pistas.lee("voz", t, 0.05),
    percusion: pistas.lee("golpe", t, 0.04),
    graves: pistas.lee("graves", t, 0.16),
    agudos: pistas.lee("altos", t, 0.10),
    brillo: pistas.lee("brillo", t, 0.14),
    ataque: pistas.lee("onset", t, 0.03),

    pulso: pistas.pulso(t, 0.26),
    golpe: pistas.golpe(t, 0.18),

    respiracion: acotar(pistas.lee("graves", t, 0.5) * 0.6 + pistas.lee("rms", t, 0.55) * 0.4),
  });

  NE.Reloj = Reloj;
  NE.Pistas = Pistas;
  NE.construirFrame = construirFrame;
})();
