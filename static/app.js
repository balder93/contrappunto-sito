/* Contrappunto: tema chiaro/scuro, "solo i fatti", filtri del promessometro.
   Il sito funziona anche senza JavaScript: questo file aggiunge solo comodità. */
(function () {
  "use strict";

  function leggi(chiave) {
    try { return window.localStorage.getItem(chiave); } catch (e) { return null; }
  }
  function scrivi(chiave, valore) {
    try { window.localStorage.setItem(chiave, valore); } catch (e) { /* navigazione privata */ }
  }

  // Tema: l'attributo è già impostato dallo script in <head>; qui solo il pulsante.
  var radice = document.documentElement;
  function temaAttuale() {
    var esplicito = radice.getAttribute("data-theme");
    if (esplicito) return esplicito;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function aggiornaPulsanteTema(p) {
    var scuro = temaAttuale() === "dark";
    p.setAttribute("aria-label", scuro ? "Passa al tema chiaro" : "Passa al tema scuro");
    p.setAttribute("aria-pressed", scuro ? "true" : "false");
  }
  var pulsanteTema = document.getElementById("cambia-tema");
  if (pulsanteTema) {
    aggiornaPulsanteTema(pulsanteTema);
    pulsanteTema.addEventListener("click", function () {
      var nuovo = temaAttuale() === "dark" ? "light" : "dark";
      radice.setAttribute("data-theme", nuovo);
      scrivi("contrappunto-tema", nuovo);
      aggiornaPulsanteTema(pulsanteTema);
    });
  }

  // Solo i fatti: nasconde ipotesi e opinioni.
  var interruttore = document.getElementById("solo-fatti");
  if (interruttore) {
    var stato = interruttore.querySelector("[data-stato]");
    var imposta = function (attivo) {
      document.body.classList.toggle("solo-fatti", attivo);
      interruttore.setAttribute("aria-pressed", attivo ? "true" : "false");
      if (stato) stato.textContent = attivo ? "[ON]" : "[OFF]";
    };
    imposta(leggi("contrappunto-solo-fatti") === "1");
    interruttore.addEventListener("click", function () {
      var attivo = !document.body.classList.contains("solo-fatti");
      imposta(attivo);
      scrivi("contrappunto-solo-fatti", attivo ? "1" : "0");
    });
  }

  // Promessometro: filtro per tema.
  var filtro = document.getElementById("filtro-tema");
  if (filtro) {
    var conteggio = document.getElementById("conteggio-promesse");
    filtro.addEventListener("change", function () {
      var scelto = filtro.value;
      var visibili = 0;
      document.querySelectorAll(".promessa").forEach(function (p) {
        var mostra = !scelto || p.getAttribute("data-tema") === scelto;
        p.hidden = !mostra;
        if (mostra) visibili += 1;
      });
      if (conteggio) conteggio.textContent = visibili + (visibili === 1 ? " promessa" : " promesse");
    });
  }

  // Menu su telefono.
  var pulsanteMenu = document.getElementById("apri-menu");
  var menu = document.getElementById("menu");
  if (pulsanteMenu && menu) {
    pulsanteMenu.addEventListener("click", function () {
      var aperto = pulsanteMenu.getAttribute("aria-expanded") === "true";
      pulsanteMenu.setAttribute("aria-expanded", aperto ? "false" : "true");
      menu.hidden = aperto;
    });
  }
})();
