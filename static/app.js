/* Contrappunto: tema chiaro/scuro, "solo i fatti", filtri di «Parola data».
   Il sito funziona anche senza JavaScript: questo file aggiunge solo comodità. */
(function () {
  "use strict";

  function leggi(chiave) {
    try { return window.localStorage.getItem(chiave); } catch (e) { return null; }
  }
  function scrivi(chiave, valore) {
    try { window.localStorage.setItem(chiave, valore); } catch (e) { /* navigazione privata */ }
    // Copia nel nome della finestra: sopravvive al cambio di pagina anche dove la memoria è bloccata.
    var resto = (window.name || "").split(";").filter(function (v) { return v && v.indexOf(chiave + "=") !== 0; });
    resto.push(chiave + "=" + valore);
    window.name = resto.join(";");
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

  // Parola data: filtro per tema.
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
  // Un rimando a una fonte o a un passaggio chiuso negli «ulteriori dettagli»: apri prima la tendina.
  function apriPerAncora() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    var bersaglio = id && document.getElementById(id);
    if (!bersaglio) return;
    for (var el = bersaglio; el; el = el.parentElement) {
      if (el.tagName === "DETAILS") el.open = true;
    }
    bersaglio.scrollIntoView();
  }
  window.addEventListener("hashchange", apriPerAncora);
  // Senza ancora l'articolo si apre dall'inizio, anche se il browser ricorda la posizione della pagina precedente.
  if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  if (window.location.hash) apriPerAncora();
  else {
    window.scrollTo(0, 0);
    // Dentro una cornice (l'anteprima privata) a scorrere è la pagina che la contiene: chiediamo anche a lei di salire.
    if (window.self !== window.top) {
      try { document.documentElement.scrollIntoView({ block: "start" }); } catch (e) { /* niente */ }
    }
  }
  // Ricerca: il sito è statico, quindi cerca in cerca.json direttamente nel browser.
  var risultati = document.getElementById("risultati-ricerca");
  var campo = document.getElementById("campo-ricerca");
  if (risultati && campo) {
    var esito = document.getElementById("esito-ricerca");
    var radice = risultati.getAttribute("data-radice") || "";
    var indice = null;
    var piano = function (s) {
      return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };
    var testo = function (tag, classe, contenuto) {
      var el = document.createElement(tag);
      if (classe) el.className = classe;
      el.textContent = contenuto;
      return el;
    };
    var mostra = function () {
      var parole = piano(campo.value).split(/\s+/).filter(function (p) { return p.length > 1; });
      risultati.textContent = "";
      if (!indice || !parole.length) { esito.textContent = ""; return; }
      var trovati = indice.map(function (v) {
        var t = piano(v.t), s = piano(v.s), c = piano(v.c), a = piano(v.a), punti = 0;
        for (var k = 0; k < parole.length; k++) {
          var p = parole[k];
          if (t.indexOf(p) >= 0) punti += 5;
          else if (s.indexOf(p) >= 0 || a.indexOf(p) >= 0) punti += 3;
          else if (c.indexOf(p) >= 0) punti += 1;
          else return null; // tutte le parole devono esserci
        }
        return { v: v, punti: punti };
      }).filter(Boolean).sort(function (x, y) { return y.punti - x.punti || (x.v.d < y.v.d ? 1 : -1); });
      esito.textContent = trovati.length ? trovati.length + (trovati.length === 1 ? " risultato" : " risultati") : "Nessun risultato";
      trovati.slice(0, 30).forEach(function (r) {
        var v = r.v, li = document.createElement("li");
        if (v.i) {
          var img = document.createElement("img");
          img.className = "miniatura"; img.src = radice + v.i; img.alt = ""; img.loading = "lazy";
          li.appendChild(img);
        } else {
          li.appendChild(testo("span", "miniatura vuota", ""));
        }
        var div = document.createElement("div");
        div.appendChild(testo("span", "mono tenue", v.a + " · " + v.d.split("-").reverse().join(".")));
        var link = testo("a", "titolo-breve", v.t);
        link.href = radice + v.u;
        div.appendChild(link);
        if (v.s) div.appendChild(testo("p", "", v.s));
        li.appendChild(div);
        risultati.appendChild(li);
      });
    };
    fetch(risultati.getAttribute("data-indice")).then(function (r) { return r.json(); }).then(function (dati) {
      indice = dati;
      var q = new URLSearchParams(window.location.search).get("q");
      if (q) campo.value = q;
      mostra();
    }).catch(function () { esito.textContent = "La ricerca non è disponibile in questo momento."; });
    campo.addEventListener("input", mostra);
    campo.focus();
  }
  // Test di affinità: tutto nel browser, niente viene salvato o inviato.
  var calcola = document.getElementById("calcola");
  var datiTest = document.getElementById("dati-test");
  if (calcola && datiTest) {
    var dati = JSON.parse(datiTest.textContent);
    calcola.addEventListener("click", function () {
      var mie = {};
      dati.domande.forEach(function (d) {
        var scelta = document.querySelector('input[name="' + d.id + '"]:checked');
        if (scelta) mie[d.id] = parseInt(scelta.value, 10);
      });
      var risposte = Object.keys(mie).length;
      var lista = document.getElementById("classifica");
      lista.textContent = "";
      if (!risposte) { lista.textContent = "Rispondi ad almeno una domanda."; }
      var classifica = dati.partiti.map(function (p) {
        var punti = 0, contate = 0;
        Object.keys(mie).forEach(function (id) {
          if (p.risposte[id] === undefined) return;
          punti += 4 - Math.abs(mie[id] - p.risposte[id]);
          contate += 1;
        });
        return { p: p, quota: contate ? Math.round(100 * punti / (4 * contate)) : null };
      }).filter(function (r) { return r.quota !== null && risposte; })
        .sort(function (a, b) { return b.quota - a.quota; });
      classifica.forEach(function (r) {
        var li = document.createElement("li");
        var nome = document.createElement("a");
        nome.href = r.p.url; nome.textContent = r.p.nome;
        var barra = document.createElement("span");
        barra.className = "barra-affinita";
        var pieno = document.createElement("span");
        pieno.style.width = r.quota + "%";
        barra.appendChild(pieno);
        var numero = document.createElement("span");
        numero.className = "mono"; numero.textContent = r.quota + "%";
        li.appendChild(nome); li.appendChild(barra); li.appendChild(numero);
        lista.appendChild(li);
      });
      var sezione = document.getElementById("risultato-test");
      sezione.hidden = false;
      sezione.scrollIntoView({ behavior: "smooth" });
    });
  }
})();
