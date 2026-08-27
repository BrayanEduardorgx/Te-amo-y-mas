// ================================================================
// PERSONALIZA AQUI: nombres, frases, recuerdos, fechas y fotografias
// ================================================================
(() => {
  NE.personalizacion = {
    // 1. DEDICATORIA DE ENTRADA
    // Cambia mostrar a false para ocultarla por completo.
    entrada: {
      mostrar: true,
      para: "Para Mi Princesa",
      frase: "Hay canciones que se le dedican a una sola persona en esta vida.",
    },

    // TIEMPOS DEFINITIVOS DE LA LETRA
    // Al terminar el sincronizador, copia la lista que genera y reemplaza [].
    // Una vez publicada, esta sincronizacion funcionara para todos los visitantes.
    sincronizacion: [0.83, 8.524, 15.74, 23.395, 34.064, 37.531, 40.351, 45.68, 53.223, 55.814, 61.129, 64.821, 68.526, 72.554, 79.289, 83.325, 87.315, 90.334, 94.564, 97.923, 102.171, 105.342, 109.268, 112.641, 118.354, 121.862, 125.1, 132.501, 140.044, 144.015, 147.686, 151.346, 155.131, 159.173, 162.49, 166.219, 170.157, 173.586, 174.798, 176.729, 178.447, 181.085, 214.762, 222.853, 229.071, 232.918, 236.466, 239.431, 241.171, 250.432, 251.68, 258.448, 262.886, 267.092, 275.995],

    // 9. MENSAJE FINAL
    final: {
      mostrar: true,
      frase: "Algunas luces nunca se apagan del todo porque el brillo de tus ojos es la luz que nunca quiero que se extinga.",
      firma: "Con cariño",
    },

    // 11. RECUERDOS OCULTOS
    // Al tocar la palabra indicada aparece la tarjeta. La palabra debe existir
    // en la letra. Puedes añadir, borrar o duplicar objetos de esta lista.
    recuerdos: [
      {
        palabra: "ojos",
        titulo: "Un recuerdo",
        texto: "Escribe aquí algo que solamente ustedes puedan reconocer.",
        fecha: "Añade aquí una fecha especial",
      },
      {
        palabra: "calma",
        titulo: "Nuestra historia",
        texto: "Este espacio puede guardar un lugar, una promesa o un instante.",
        fecha: "",
      },
      {
        palabra: "tiempo",
        titulo: "El tiempo",
        texto: "Escribe aquí lo que quieras que recuerde al llegar a esta palabra.",
        fecha: "",
      },
    ],

    // 12. FOTOGRAFIAS Y FRASES
    // Las fotos aparecen de forma escalonada y se repiten al terminar la lista.
    // Cada una permanece entre 3 y 5 segundos y nunca se repite al mismo tiempo.
    fotografias: [
      { src: "assets/fotos/14.jpeg" },
      { src: "assets/fotos/15.jpeg" },
      { src: "assets/fotos/16.jpeg" },
      { src: "assets/fotos/17.jpeg" },
      { src: "assets/fotos/20.jpeg" },
      { src: "assets/fotos/21.jpeg" },
      { src: "assets/fotos/22.jpeg" },
      { src: "assets/fotos/26.jpg" },
      { src: "assets/fotos/27.jpg" },
      { src: "assets/fotos/28.jpg" },
    ],

    // 5 y 6. MOMENTO EN QUE LAS CHISPAS FORMAN UN CORAZON
    constelacion: {
      mostrar: true,
      desde: 188,
      duracion: 8,
    },
  };
})();
