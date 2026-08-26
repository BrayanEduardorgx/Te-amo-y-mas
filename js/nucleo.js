// Utilidades base: matematicas, azar determinista, DOM y color.
const NE = (window.NE = {});

const acotar = (v, min = 0, max = 1) => (v < min ? min : v > max ? max : v);
const mezcla = (a, b, t) => a + (b - a) * t;

const remapear = (v, a0, a1, b0, b1) =>
  a1 === a0 ? b0 : b0 + acotar((v - a0) / (a1 - a0)) * (b1 - b0);

const suave = (t) => {
  const x = acotar(t);
  return x * x * (3 - 2 * x);
};
const salidaCubica = (t) => 1 - Math.pow(1 - acotar(t), 3);
const salidaQuinta = (t) => 1 - Math.pow(1 - acotar(t), 5);
const entradaCubica = (t) => Math.pow(acotar(t), 3);
const salidaExpo = (t) => {
  const x = acotar(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};

const campana = (t) => Math.sin(acotar(t) * Math.PI);

const perseguir = (actual, objetivo, velocidad, dt) =>
  actual + (objetivo - actual) * (1 - Math.exp(-velocidad * dt));

NE.mat = { acotar, mezcla, remapear, suave, salidaCubica, salidaQuinta, entradaCubica, salidaExpo, campana, perseguir };

const revolver = (n) => {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) >>> 0;
};

const azar = (semilla) => revolver(semilla) / 4294967296;
const azarEntre = (semilla, min, max) => min + azar(semilla) * (max - min);
const azarEntero = (semilla, n) => Math.floor(azar(semilla) * n) % n;
const elegir = (semilla, lista) => lista[azarEntero(semilla, lista.length)];

const semillaDe = (texto) => {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const ruido1d = (x, semilla = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = azar(revolver(i + semilla * 7919));
  const b = azar(revolver(i + 1 + semilla * 7919));
  const t = (1 - Math.cos(f * Math.PI)) / 2;
  return a * (1 - t) + b * t;
};

const ruidoFractal = (x, semilla = 0, octavas = 3) => {
  let suma = 0, amplitud = 1, total = 0, frecuencia = 1;
  for (let o = 0; o < octavas; o++) {
    suma += ruido1d(x * frecuencia, semilla + o) * amplitud;
    total += amplitud;
    amplitud *= 0.5;
    frecuencia *= 2.13;
  }
  return total > 0 ? suma / total : 0;
};

const ruidoCentrado = (x, semilla = 0, octavas = 3) => ruidoFractal(x, semilla, octavas) * 2 - 1;

NE.azar = { azar, azarEntre, azarEntero, elegir, semillaDe, ruido1d, ruidoFractal, ruidoCentrado };

const crear = (etiqueta, clase, padre) => {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (padre) padre.appendChild(el);
  return el;
};

const $ = (sel, raiz = document) => raiz.querySelector(sel);

NE.dom = { crear, $ };

const aRgb = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mezclarColor = (a, b, t) => {
  const [r1, g1, b1] = aRgb(a);
  const [r2, g2, b2] = aRgb(b);
  const m = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
};

const conAlfa = (hex, alfa) => {
  const [r, g, b] = aRgb(hex);
  return `rgba(${r},${g},${b},${acotar(alfa).toFixed(3)})`;
};

const mezclarHex = (a, b, t) => {
  const [r1, g1, b1] = aRgb(a);
  const [r2, g2, b2] = aRgb(b);
  const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
};

NE.color = { aRgb, mezclarColor, mezclarHex, conAlfa };
