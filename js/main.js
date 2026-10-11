const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================================================
   Lo que hago
   ========================================================= */
document.getElementById("grid").innerHTML = projects.map((p, i) => {
  const tag = p.link ? "a" : "div";
  const href = p.link ? ` href="${esc(p.link)}" target="_blank" rel="noopener"` : "";
  const delay = ` style="--d:${(i * 0.08).toFixed(2)}s"`;
  if (p.kind === "flute") {
    const img = p.image ? ` style="background-image:url('${esc(p.image)}')"` : "";
    return `<${tag} class="p-card flute reveal"${href}${delay}>
      <span class="scene"${img}></span><span class="flutes"></span>
      <span class="label">${esc(p.label)}</span>
    </${tag}>`;
  }
  return `<${tag} class="p-card num reveal"${href}${delay}>
    <span class="orb"></span>
    <div class="p-body">
      <div class="p-num chrome">${esc(p.num)}</div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.desc)}</p>
    </div>
  </${tag}>`;
}).join("");

/* =========================================================
   Testimonios: carrusel circular con reproducción automática
   ========================================================= */
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>';

function mediaHTML(t) {
  if (t.type === "youtube") {
    const origin = location.origin.startsWith("http") ? `&origin=${encodeURIComponent(location.origin)}` : "";
    return `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(t.id)}?rel=0&playsinline=1&enablejsapi=1${origin}"
      title="${esc(t.title)}${t.author ? " · " + esc(t.author) : ""}" loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  }
  if (t.type === "video") {
    return `<video src="${esc(t.src)}"${t.poster ? ` poster="${esc(t.poster)}"` : ""} controls preload="metadata" playsinline></video>`;
  }
  if (t.type === "audio") {
    // Alturas fijas para que la onda siempre se vea igual
    const bars = Array.from({ length: 42 }, (_, i) => {
      const h = 22 + Math.round(70 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)));
      return `<i style="--h:${h}%;--i:${i}"></i>`;
    }).join("");
    return `<div class="player">
      <span class="orb"></span>
      <div class="p-row">
        <button class="play" aria-label="Reproducir audio">${ICON_PLAY}</button>
        <div class="wave" role="slider" aria-label="Progreso del audio" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">${bars}</div>
      </div>
      <div class="time"><span class="cur">0:00</span> / <span class="dur">–:––</span></div>
      <audio src="${esc(t.src)}" preload="metadata"></audio>
    </div>`;
  }
  return `<div class="soon"><span class="orb"></span><span>${esc(t.role || "Próximamente")}</span></div>`;
}

const track = document.getElementById("ring-track");
const ring = document.getElementById("ring");
const dotsBox = document.getElementById("ring-dots");
const progressBar = document.getElementById("ring-progress");

track.innerHTML = testimonials.map((t, i) => `
  <article class="r-card glass" data-i="${i}" aria-roledescription="diapositiva" aria-label="${i + 1} de ${testimonials.length}">
    <div class="r-media">${mediaHTML(t)}</div>
    <div class="r-text">
      <h3 class="chrome">${esc(t.title)}</h3>
      <p>${t.author ? `<b>${esc(t.author)}</b> · ` : ""}${esc(t.role || "")}</p>
    </div>
  </article>`).join("");
dotsBox.innerHTML = testimonials.map((t, i) => `<button role="tab" aria-label="Ir al testimonio ${i + 1}"></button>`).join("");

const cards = [...track.children];
const dots = [...dotsBox.children];
const N = cards.length;
let active = 0;
const prevOffset = new Array(N).fill(null);

function ringGeometry() {
  const w = cards[0] ? cards[0].offsetWidth : 400;
  return { R: Math.max(w * 1.45, 380), step: innerWidth < 600 ? 50 : 44 };
}

function layout() {
  const { R, step } = ringGeometry();
  cards.forEach((card, i) => {
    let o = ((i - active) % N + N) % N;
    if (o > N / 2) o -= N;
    const place = off => {
      const a = off * step;
      card.style.transform = `translate(-50%, -50%) translateZ(${-R}px) rotateY(${a}deg) translateZ(${R}px)`;
    };
    // Si la tarjeta "da la vuelta" por detrás, la hacemos entrar por el lado contrario
    if (prevOffset[i] !== null && Math.abs(o - prevOffset[i]) > 1) {
      card.style.transition = "none";
      place(o + Math.sign(o || 1));
      card.style.opacity = "0";
      card.offsetWidth; // forzar repintado
      card.style.transition = "";
    }
    place(o);
    const d = Math.abs(o);
    card.style.opacity = d > 1.5 ? "0" : d > 0 ? ".55" : "1";
    card.style.filter = d > 0 ? "brightness(.55) blur(1px)" : "none";
    card.style.zIndex = String(10 - d);
    card.style.pointerEvents = d > 1.5 ? "none" : "";
    card.classList.toggle("is-active", d === 0);
    card.setAttribute("aria-hidden", d === 0 ? "false" : "true");
    prevOffset[i] = o;
  });
  dots.forEach((b, i) => { b.classList.toggle("on", i === active); b.setAttribute("aria-selected", i === active); });
}

function stopMediaExcept(idx) {
  cards.forEach((card, i) => {
    if (i === idx) return;
    const f = card.querySelector("iframe");
    if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
    const a = card.querySelector("audio, video");
    if (a && !a.paused) a.pause();
  });
}

function go(i, user = false) {
  active = (i + N) % N;
  if (user) engaged = false;
  stopMediaExcept(active);
  layout();
  restartTimer();
}

// Reproducción automática
const AUTOPLAY_MS = 5500;
let hover = false, engaged = false, offscreen = true, mediaPlaying = false;
let t0 = performance.now(), pausedAt = null;
const paused = () => hover || engaged || offscreen || mediaPlaying || document.hidden;
function restartTimer() { t0 = performance.now(); pausedAt = null; }
function tick(now) {
  if (N > 1) {
    if (paused()) {
      if (pausedAt === null) pausedAt = now;
    } else {
      if (pausedAt !== null) { t0 += now - pausedAt; pausedAt = null; }
      const p = Math.min((now - t0) / AUTOPLAY_MS, 1);
      progressBar.style.transform = `scaleX(${p})`;
      if (p >= 1) go(active + 1);
    }
  }
  requestAnimationFrame(tick);
}

document.getElementById("ring-prev").addEventListener("click", () => go(active - 1, true));
document.getElementById("ring-next").addEventListener("click", () => go(active + 1, true));
dots.forEach((b, i) => b.addEventListener("click", () => go(i, true)));
cards.forEach((card, i) => card.addEventListener("click", () => { if (i !== active) go(i, true); }));
ring.addEventListener("pointerenter", () => { hover = true; });
ring.addEventListener("pointerleave", () => { hover = false; });
ring.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") go(active - 1, true);
  if (e.key === "ArrowRight") go(active + 1, true);
});

// Arrastrar / deslizar
let downX = null;
ring.addEventListener("pointerdown", e => { downX = e.clientX; });
addEventListener("pointerup", e => {
  if (downX === null) return;
  const dx = e.clientX - downX; downX = null;
  if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1), true);
});
// Desplazamiento horizontal (trackpad)
let wheelLock = 0;
ring.addEventListener("wheel", e => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 20) return;
  e.preventDefault();
  const now = performance.now();
  if (now < wheelLock) return;
  wheelLock = now + 650;
  go(active + (e.deltaX > 0 ? 1 : -1), true);
}, { passive: false });

// Si alguien pulsa dentro del video de YouTube, el carrusel deja de girar
addEventListener("blur", () => setTimeout(() => {
  if (document.activeElement && document.activeElement.tagName === "IFRAME" && ring.contains(document.activeElement)) engaged = true;
}, 0));

// Solo gira mientras se ve en pantalla
new IntersectionObserver(([e]) => { offscreen = !e.isIntersecting; }, { threshold: 0.35 }).observe(ring);

// Reproductor de audio
const fmt = s => isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "–:––";
document.querySelectorAll(".player").forEach(pl => {
  const audio = pl.querySelector("audio"), btn = pl.querySelector(".play"), wave = pl.querySelector(".wave");
  const bars = [...wave.children], cur = pl.querySelector(".cur"), dur = pl.querySelector(".dur");
  const paint = () => {
    const p = audio.duration ? audio.currentTime / audio.duration : 0;
    const n = Math.round(p * bars.length);
    bars.forEach((b, i) => b.classList.toggle("on", i < n));
    cur.textContent = fmt(audio.currentTime);
    wave.setAttribute("aria-valuenow", Math.round(p * 100));
  };
  audio.addEventListener("loadedmetadata", () => { dur.textContent = fmt(audio.duration); });
  audio.addEventListener("timeupdate", paint);
  audio.addEventListener("play", () => { pl.classList.add("playing"); btn.innerHTML = ICON_PAUSE; btn.setAttribute("aria-label", "Pausar audio"); mediaPlaying = true; });
  const stop = () => { pl.classList.remove("playing"); btn.innerHTML = ICON_PLAY; btn.setAttribute("aria-label", "Reproducir audio"); mediaPlaying = false; };
  audio.addEventListener("pause", stop);
  audio.addEventListener("ended", () => { stop(); audio.currentTime = 0; paint(); });
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const card = pl.closest(".r-card");
    if (!card.classList.contains("is-active")) { go(+card.dataset.i, true); return; }
    audio.paused ? audio.play() : audio.pause();
  });
  const seek = clientX => {
    const r = wave.getBoundingClientRect();
    if (audio.duration) audio.currentTime = Math.min(Math.max((clientX - r.left) / r.width, 0), 1) * audio.duration;
  };
  wave.addEventListener("click", e => { if (pl.closest(".r-card").classList.contains("is-active")) seek(e.clientX); });
  wave.addEventListener("keydown", e => {
    if (!audio.duration) return;
    if (e.key === "ArrowRight") { audio.currentTime = Math.min(audio.currentTime + 5, audio.duration); e.stopPropagation(); }
    if (e.key === "ArrowLeft") { audio.currentTime = Math.max(audio.currentTime - 5, 0); e.stopPropagation(); }
  });
});
document.querySelectorAll(".r-card video").forEach(v => {
  v.addEventListener("play", () => { mediaPlaying = true; });
  v.addEventListener("pause", () => { mediaPlaying = false; });
});

layout();
addEventListener("resize", layout);
requestAnimationFrame(tick);

/* =========================================================
   General
   ========================================================= */
document.getElementById("year").textContent = new Date().getFullYear();

// Entrada al cargar: espera a las fuentes (máx. 1,5 s) y deja ver la barra al menos 0,95 s
const minShow = new Promise(r => setTimeout(r, reduceMotion ? 0 : 950));
const fonts = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1500))]);
Promise.all([minShow, fonts]).then(() => document.documentElement.classList.add("loaded"));

// Aparición al hacer scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// Sección actual: menú activo y contador "01 / 05"
const sections = [...document.querySelectorAll("[data-section]")];
const countNow = document.getElementById("count-now");
document.getElementById("count-total").textContent = String(sections.length).padStart(2, "0");
const navLinks = [...document.querySelectorAll(".nav a")];
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const id = e.target.id;
    countNow.textContent = String(sections.indexOf(e.target) + 1).padStart(2, "0");
    navLinks.forEach(a => a.classList.toggle("active", a.dataset.spy === id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach(s => spy.observe(s));

// Vidrio: el reflejo sigue al puntero
document.addEventListener("pointermove", e => {
  const el = e.target.closest && e.target.closest(".glass");
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}, { passive: true });
