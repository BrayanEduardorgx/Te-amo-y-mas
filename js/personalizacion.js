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
    sincronizacion: [6.969, 14.356, 21.242, 27.988, 35.149, 42.084, 48.962, 55.902, 63.861, 69.709, 77.638, 83.249, 104.659, 111.577, 118.401, 125.396, 132.387, 139.289, 142.836, 146.508],

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
      desde: 102,
      duracion: 8,
    },
  };
})();
