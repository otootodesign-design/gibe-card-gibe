/* ============================================================
   GIBE DigiCard — script del template
   Fa tre cose e basta: pallini, autoplay, condivisione.
   Lo scorrimento è quello nativo del browser, non è simulato,
   e il file .vcf è statico: entrambi non hanno bisogno di JS.
   ============================================================ */
(function () {
  "use strict";

  var track = document.getElementById("track");
  var dotsBox = document.getElementById("dots");
  var slides = track ? Array.prototype.slice.call(track.children) : [];
  var calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Pallini ---------- */

  var dots = [];

  if (dotsBox && slides.length > 1) {
    slides.forEach(function (slide, i) {
      var b = document.createElement("button");
      b.className = "hero__dot";
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Immagine " + (i + 1) + " di " + slides.length);
      b.addEventListener("click", function () {
        ferma();
        vaiA(i);
      });
      dotsBox.appendChild(b);
      dots.push(b);
    });
    segna(0);
  }

  function segna(i) {
    dots.forEach(function (d, k) {
      d.setAttribute("aria-current", k === i ? "true" : "false");
    });
  }

  function vaiA(i) {
    var s = slides[i];
    if (!s) return;
    track.scrollTo({
      left: s.offsetLeft - track.offsetLeft,
      behavior: calmo ? "auto" : "smooth"
    });
  }

  /* La slide attiva è quella più vicina al bordo sinistro del track:
     più affidabile di IntersectionObserver quando le slide si
     sovrappongono per via della sbirciata laterale. */
  var attesa;
  if (track) {
    track.addEventListener("scroll", function () {
      clearTimeout(attesa);
      attesa = setTimeout(function () {
        var x = track.scrollLeft;
        var vicino = 0;
        var minimo = Infinity;
        slides.forEach(function (s, i) {
          var d = Math.abs(s.offsetLeft - track.offsetLeft - x);
          if (d < minimo) { minimo = d; vicino = i; }
        });
        indice = vicino;
        segna(vicino);
      }, 90);
    }, { passive: true });
  }

  /* ---------- Autoplay ---------- */

  var indice = 0;
  var timer = null;
  var DURATA = 3000;

  function parti() {
    if (calmo || slides.length < 2 || timer) return;
    timer = setInterval(function () {
      if (document.hidden) return;
      indice = (indice + 1) % slides.length;
      vaiA(indice);
    }, DURATA);
  }

  /* Al primo tocco l'autoplay si spegne per sempre: se continuasse
     a girare mentre l'utente sfoglia, gli sposterebbe la foto
     sotto il dito. */
  function ferma() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  if (track) {
    ["pointerdown", "touchstart", "wheel"].forEach(function (ev) {
      track.addEventListener(ev, ferma, { passive: true, once: true });
    });
    parti();
  }

  /* ---------- Condivisione ---------- */

  var condividi = document.getElementById("share");
  var toast = document.getElementById("toast");

  function avvisa(testo) {
    if (!toast) return;
    toast.textContent = testo;
    toast.setAttribute("data-show", "true");
    setTimeout(function () { toast.setAttribute("data-show", "false"); }, 2200);
  }

  if (condividi) {
    condividi.addEventListener("click", function () {
      var dati = {
        title: document.title,
        text: (document.querySelector('meta[property="og:description"]') || {}).content || "",
        url: location.href
      };

      /* Il foglio di condivisione nativo esiste solo in contesto
         sicuro: https o localhost. Altrove si ripiega sugli appunti. */
      if (navigator.share) {
        navigator.share(dati).catch(function () { /* annullato dall'utente */ });
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href).then(
          function () { avvisa("Link copiato"); },
          function () { avvisa("Copia il link dalla barra"); }
        );
        return;
      }

      avvisa("Copia il link dalla barra");
    });
  }
})();
