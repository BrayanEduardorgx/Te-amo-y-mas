// Fogata: llamas por shader WebGL y chispas en canvas.
(() => {
  const { acotar } = NE.mat;
  const { azar, azarEntre, ruidoCentrado, ruidoFractal } = NE.azar;
  const { conAlfa, mezclarHex } = NE.color;

  const FPS_FUEGO = 45;

  const VERTICE = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

  const FRAGMENTO = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 R;
uniform float T;
uniform float V;
uniform vec3 C1;
uniform vec3 C2;
uniform vec3 C3;
uniform sampler2D N;

float ruido(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return texture2D(N, (i + f + 0.5) / 256.0).r;
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * ruido(p);
    p = p * 2.02 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 uv = gl_FragCoord.xy / R;
  vec2 p = vec2(uv.x * R.x / R.y, uv.y) * 3.0;

  vec2 q = vec2(fbm(p + vec2(0.0, -T * 1.1)),
                fbm(p + vec2(5.2, -T * 0.9)));
  vec2 r = vec2(fbm(p + q * 1.7 + vec2(1.7, -T * 1.8)),
                fbm(p + q * 1.7 + vec2(8.3, -T * 1.4)));

  float f = fbm(p * vec2(0.85, 0.4) + r * 2.3 + vec2(0.0, -T * 2.4));

  float alt = 0.24 + 0.2 * V;
  float llama = pow(clamp(f * 1.9 - uv.y / alt, 0.0, 1.0), 1.7);

  float nucleo = pow(clamp(f * 2.3 - uv.y / (alt * 0.42), 0.0, 1.0), 3.0);

  float lados = 0.85 + 0.15 * sin(uv.x * 3.14159);
  llama *= lados;

  vec3 col = C1 * llama * 1.1 + C2 * llama * llama * 0.7 + C3 * nucleo * 0.55;

  float a = clamp(llama * llama * 2.0 + nucleo * 0.55, 0.0, 1.0) * clamp(V * 2.0, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}
`;

  const aVec3 = (hex) => {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };

  class Fogata {

    constructor(lienzoGL, lienzo2D) {
      this.gl = null;
      this.rota = false;
      this.lienzoGL = lienzoGL;
      this.lienzo2D = lienzo2D;
      this.ctx = lienzo2D.getContext("2d", { alpha: true, desynchronized: true });
      this.ultimo = -1;
      this.calidad = 1;

      this.intensidad = 1;

      try {
        const gl = lienzoGL.getContext("webgl", {
          alpha: true, antialias: false, depth: false, stencil: false,
          powerPreference: "high-performance",
        });
        if (gl) this.compilar(gl);
      } catch (e) {  }

      lienzoGL.addEventListener("webglcontextlost", (e) => {

        e.preventDefault();
        this.rota = true;
      });
      lienzoGL.addEventListener("webglcontextrestored", () => {

        try {
          const gl = lienzoGL.getContext("webgl", {
            alpha: true, antialias: false, depth: false, stencil: false,
            powerPreference: "high-performance",
          });
          if (gl) {
            this.compilar(gl);
            gl.viewport(0, 0, lienzoGL.width, lienzoGL.height);
            this.rota = false;
          }
        } catch (err) {  }
      });
    }

    compilar(gl) {
      const sombra = (tipo, src) => {
        const sh = gl.createShader(tipo);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(sh) || "shader");
        }
        return sh;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, sombra(gl.VERTEX_SHADER, VERTICE));
      gl.attachShader(prog, sombra(gl.FRAGMENT_SHADER, FRAGMENTO));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);

      const lado = 256;
      const datos = new Uint8Array(lado * lado * 4);
      for (let i = 0; i < lado * lado; i++) {
        const v = Math.floor(azar(i * 7 + 13) * 256);
        datos[i * 4] = v;
        datos[i * 4 + 1] = v;
        datos[i * 4 + 2] = v;
        datos[i * 4 + 3] = 255;
      }
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, lado, lado, 0, gl.RGBA, gl.UNSIGNED_BYTE, datos);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.uniform1i(gl.getUniformLocation(prog, "N"), 0);

      this.u = {
        R: gl.getUniformLocation(prog, "R"),
        T: gl.getUniformLocation(prog, "T"),
        V: gl.getUniformLocation(prog, "V"),
        C1: gl.getUniformLocation(prog, "C1"),
        C2: gl.getUniformLocation(prog, "C2"),
        C3: gl.getUniformLocation(prog, "C3"),
      };
      this.gl = gl;
    }

    redimensionar(ancho, alto, dpr) {

      const sGL = 0.55 * Math.min(dpr, 2);
      this.lienzoGL.width = Math.max(1, Math.round(ancho * sGL));
      this.lienzoGL.height = Math.max(1, Math.round(alto * sGL));
      const s2 = 0.6 * Math.min(dpr, 2);
      this.ancho = Math.max(1, Math.round(ancho * s2));
      this.alto = Math.max(1, Math.round(alto * s2));
      this.lienzo2D.width = this.ancho;
      this.lienzo2D.height = this.alto;
      if (this.gl) this.gl.viewport(0, 0, this.lienzoGL.width, this.lienzoGL.height);
      this.ultimo = -1;
    }

    dibujar(t, f, paleta) {
      const vivo = acotar(0.55 + f.graves * 0.5 + f.pulso * 0.18, 0, 1.25) * this.intensidad;

      if (this.gl && !this.rota) {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(this.u.R, this.lienzoGL.width, this.lienzoGL.height);
        gl.uniform1f(this.u.T, t * 0.72);
        gl.uniform1f(this.u.V, vivo);
        gl.uniform3fv(this.u.C1, aVec3(paleta.halacion));
        gl.uniform3fv(this.u.C2, aVec3(paleta.realce));
        gl.uniform3fv(this.u.C3, aVec3(mezclarHex(paleta.halacion, "#ffffff", 0.72)));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      const fr = Math.floor(t * FPS_FUEGO);
      if (fr === this.ultimo) return;
      this.ultimo = fr;
      const ctx = this.ctx;
      const W = this.ancho;
      const H = this.alto;
      ctx.clearRect(0, 0, W, H);
      if (vivo < 0.03) return;
      ctx.globalCompositeOperation = "lighter";

      const nAscuas = Math.max(3, Math.round(6 * this.calidad));
      for (let i = 0; i < nAscuas; i++) {
        const s0 = 4409 + i * 97;
        const x = azar(s0) * W;
        const late = 0.35 + 0.65 * ruidoFractal(t * azarEntre(s0 + 1, 0.6, 1.6), s0 + 2, 2);
        const r = azarEntre(s0 + 3, 2, 6) * (W / 900);
        const ga = ctx.createRadialGradient(x, H - r, 0, x, H - r, r * 3);
        ga.addColorStop(0, conAlfa(paleta.halacion, 0.45 * late * vivo));
        ga.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ga;
        ctx.beginPath();
        ctx.arc(x, H - r, r * 3, 0, 6.284);
        ctx.fill();
      }

      const nChispas = Math.max(10, Math.round(20 * this.calidad));
      const colorChispa = mezclarHex(paleta.halacion, "#ffffff", 0.55);
      for (let k = 0; k < nChispas; k++) {
        const sk = 977 + k * 31;
        const dur = azarEntre(sk, 1.6, 3.8);
        const fase = (t / dur + azar(sk + 1)) % 1;
        const x =
          azar(sk + 2) * W +
          Math.sin((t + k * 7) * azarEntre(sk + 3, 1, 2.2)) * W * 0.008 +
          fase * ruidoCentrado(k * 1.7, sk, 1) * W * 0.05;
        const y = H - fase * H * azarEntre(sk + 4, 0.35, 0.8);
        const brillo = (1 - fase) * (0.4 + 0.6 * ruidoFractal(t * 6 + k, sk + 5, 2)) * vivo;
        if (brillo < 0.04) continue;
        ctx.globalAlpha = acotar(brillo);
        ctx.fillStyle = colorChispa;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.5, azarEntre(sk + 6, 0.6, 1.9) * (W / 900)), 0, 6.284);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  NE.Fogata = Fogata;
})();
