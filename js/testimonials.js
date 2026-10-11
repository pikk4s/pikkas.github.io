/* =========================================================
   EDITA AQUÍ LOS TESTIMONIOS (carrusel circular)
   El primero de la lista es el que se ve de frente al cargar.
   - type: "youtube" -> id: el código del video (lo que va después de youtu.be/)
   - type: "audio"   -> src: ruta al archivo de audio (mp3)
   - type: "video"   -> src: ruta a un mp4 propio (poster opcional)
   - type: "soon"    -> hueco "Próximamente"
   - title: texto grande de la tarjeta · author / role: quién lo dice (opcionales)
   ========================================================= */
const testimonials = [
  { type: "youtube", id: "xTNnKCec44w", title: "Video", author: "Santiago", role: "Testimonio en video" },
  { type: "audio", src: "media/testimonio-audio-1.mp3", title: "Audio", author: "", role: "Testimonio en audio" },
  { type: "soon", title: "Audio", role: "Próximamente" }
];
