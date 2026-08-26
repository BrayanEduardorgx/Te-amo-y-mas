// Ambiente sonoro: zumbido de la lampara, aire y acorde final.
(() => {

  const ACORDE = [
    { hz: 98.0,  ganancia: 0.30, tipo: "sine" },
    { hz: 146.83, ganancia: 0.20, tipo: "sine" },
    { hz: 196.0, ganancia: 0.16, tipo: "triangle" },
    { hz: 233.08, ganancia: 0.12, tipo: "sine" },
    { hz: 293.66, ganancia: 0.07, tipo: "sine" },
  ];

  class Cuarto {
    constructor(ctx) {
      this.ctx = ctx;
      this.salida = ctx.createGain();
      this.salida.gain.value = 0;
      this.salida.connect(ctx.destination);
      this.encendido = false;
    }

    bufferRuido(segundos) {
      const n = Math.floor(this.ctx.sampleRate * segundos);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < n; i++) {

        const blanco = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        b0 = 0.99765 * b0 + blanco * 0.099;
        b1 = 0.963 * b1 + blanco * 0.288;
        b2 = 0.57 * b2 + blanco * 1.0526;
        d[i] = (b0 + b1 + b2 + blanco * 0.1848) * 0.06;
      }
      return buf;
    }

    encender() {
      if (this.encendido) return;
      this.encendido = true;
      const ctx = this.ctx;

      const aire = ctx.createBufferSource();
      aire.buffer = this.bufferRuido(4);
      aire.loop = true;
      const filtroAire = ctx.createBiquadFilter();
      filtroAire.type = "lowpass";
      filtroAire.frequency.value = 900;
      const gAire = ctx.createGain();
      gAire.gain.value = 0.16;
      aire.connect(filtroAire).connect(gAire).connect(this.salida);
      aire.start();

      for (const [hz, g] of [[100, 0.035], [200, 0.012]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = hz;
        const gan = ctx.createGain();
        gan.gain.value = g;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.13;
        const lfoG = ctx.createGain();
        lfoG.gain.value = g * 0.4;
        lfo.connect(lfoG).connect(gan.gain);
        osc.connect(gan).connect(this.salida);
        osc.start();
        lfo.start();
      }

      this.salida.gain.cancelScheduledValues(ctx.currentTime);
      this.salida.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.salida.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 2.5);
    }

    nivel(v, segundos = 1.5) {
      const t = this.ctx.currentTime;
      this.salida.gain.cancelScheduledValues(t);
      this.salida.gain.setValueAtTime(Math.max(0.0001, this.salida.gain.value), t);
      this.salida.gain.exponentialRampToValueAtTime(Math.max(0.0001, v), t + segundos);
    }

    cola(segundos = 20) {
      const ctx = this.ctx;
      const t0 = ctx.currentTime;

      const bus = ctx.createGain();
      bus.gain.value = 0;
      const filtro = ctx.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.setValueAtTime(2600, t0);

      filtro.frequency.exponentialRampToValueAtTime(320, t0 + segundos);
      filtro.Q.value = 0.6;
      bus.connect(filtro).connect(this.salida);

      bus.gain.setValueAtTime(0.0001, t0);
      bus.gain.exponentialRampToValueAtTime(0.5, t0 + 2.5);
      bus.gain.exponentialRampToValueAtTime(0.0001, t0 + segundos);

      for (const nota of ACORDE) {
        for (const desafina of [-3.5, 3.5]) {
          const osc = ctx.createOscillator();
          osc.type = nota.tipo;
          osc.frequency.value = nota.hz;
          osc.detune.value = desafina;

          const wow = ctx.createOscillator();
          wow.frequency.value = 0.21 + desafina * 0.01;
          const wowG = ctx.createGain();
          wowG.gain.value = 5;
          wow.connect(wowG).connect(osc.detune);

          const g = ctx.createGain();
          g.gain.value = nota.ganancia * 0.5;
          osc.connect(g).connect(bus);
          osc.start(t0);
          wow.start(t0);
          osc.stop(t0 + segundos + 1);
          wow.stop(t0 + segundos + 1);
        }
      }

      this.nivel(0.8, 3);
      setTimeout(() => this.nivel(0.45, 8), segundos * 500);
    }
  }

  NE.Cuarto = Cuarto;
})();
