(function () {
  var t = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("nav");
  if (t && nav) {
    t.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      t.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  var form = document.querySelector("[data-search]");
  if (!form) return;
  var list = document.querySelector("[data-search-list]");
  var empty = document.querySelector("[data-search-empty]");
  var status = document.querySelector("[data-search-status]");
  var q = form.querySelector("input[name=q]");
  var laneSel = form.querySelector("select[name=lane]");
  var index = null;
  function norm(s) { return (s || "").toLowerCase(); }
  function render(items) {
    list.innerHTML = items.map(function (p) {
      return '<li class="list-item"><a href="' + p.url + '" class="list-link"><span class="kicker-small">' + p.laneName + '</span><span class="list-title">' + p.title + '</span><span class="list-dek">' + p.dek + '</span><span class="list-meta">' + p.date + ' · ' + p.readingTime + ' min</span></a></li>';
    }).join("");
    empty.hidden = items.length > 0;
    status.textContent = q.value || laneSel.value ? items.length + (items.length === 1 ? " result" : " results") : "";
  }
  function run() {
    if (!index) return;
    var terms = norm(q.value).split(/\s+/).filter(Boolean);
    var lane = laneSel.value;
    var out = index.filter(function (p) {
      if (lane && p.lane !== lane) return false;
      if (!terms.length) return true;
      var hay = norm(p.title + " " + p.dek + " " + p.tags.join(" ") + " " + p.laneName);
      return terms.every(function (t) { return hay.indexOf(t) !== -1; });
    });
    render(out);
  }
  function load() {
    if (index) return Promise.resolve();
    status.textContent = "Loading index";
    return fetch("/search.json").then(function (r) { return r.json(); }).then(function (d) { index = d; status.textContent = ""; })
      .catch(function () { status.textContent = "Search is unavailable right now. The full list is below."; });
  }
  var params = new URLSearchParams(location.search);
  if (params.get("q")) q.value = params.get("q");
  if (params.get("lane")) laneSel.value = params.get("lane");
  q.addEventListener("input", function () { load().then(run); });
  laneSel.addEventListener("change", function () { load().then(run); });
  form.addEventListener("submit", function (e) { e.preventDefault(); load().then(run); });
  if (q.value || laneSel.value) load().then(run);
})();
