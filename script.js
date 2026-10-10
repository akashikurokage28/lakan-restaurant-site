/* ---------- Animate on scroll ---------- */
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = ("IntersectionObserver" in window && !reduce)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target, delay = parseInt(el.getAttribute("data-delay"), 10) || 0;
          io.unobserve(el);
          el.classList.add("in");
          // once finished, drop the animation hooks so hover effects work normally
          setTimeout(function () {
            el.removeAttribute("data-anim"); el.classList.remove("in"); el.style.removeProperty("--d");
          }, 1000 + delay);
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" })
    : null;

  // Call again after adding new [data-anim] elements (the menu does this).
  window.revealScan = function (root) {
    (root || document).querySelectorAll("[data-anim]:not([data-seen])").forEach(function (el) {
      el.setAttribute("data-seen", "");
      if (!io) { el.removeAttribute("data-anim"); return; }
      el.style.setProperty("--d", (parseInt(el.getAttribute("data-delay"), 10) || 0) + "ms");
      io.observe(el);
    });
  };
  window.revealScan();
})();

(function () {
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- Header + mobile drawer ---------- */
  var top = $("top"), burger = $("burger"), drawer = $("drawer");
  function onScroll() { top.classList.toggle("solid", window.scrollY > 40); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  function toggle(open) {
    drawer.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    burger.firstElementChild.className = open ? "ri-close-line" : "ri-menu-line";
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () { toggle(!drawer.classList.contains("open")); });
  drawer.addEventListener("click", function (e) { if (e.target.closest("a")) toggle(false); });

  /* ---------- Menu (reads menu.json) ---------- */
  var tabs = $("tabs"), items = $("items");
  function show(cat) {
    items.innerHTML = "";
    cat.items.filter(function (it) { return it.available !== false; }).forEach(function (it, i) {
      var row = el("div", "item"), img = el("img"), body = el("div"), t = el("div", "t");
      row.setAttribute("data-anim", "up");
      row.setAttribute("data-delay", String((i % 2) * 100));
      img.src = it.image; img.alt = it.alt || it.name; img.loading = "lazy";
      t.appendChild(el("h3", null, it.name));
      t.appendChild(el("span", "dots"));
      t.appendChild(el("span", "price", "\u20B1" + Number(it.price).toLocaleString("en-PH")));
      body.appendChild(t);
      body.appendChild(el("p", null, it.description || ""));
      row.appendChild(img); row.appendChild(body);
      items.appendChild(row);
    });
    if (window.revealScan) window.revealScan(items);
  }
  fetch("menu.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      data.categories.forEach(function (cat, i) {
        var b = el("button", null, cat.name);
        b.type = "button"; b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", i === 0);
        b.addEventListener("click", function () {
          tabs.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
          show(cat);
        });
        tabs.appendChild(b);
      });
      show(data.categories[0]);
    })
    .catch(function () {
      items.appendChild(el("p", "empty", "The menu could not be loaded. If you opened index.html straight from your files, run the site through a local server (for example VS Code's Live Server)."));
    });

  /* ---------- Reservation form (front-end demo) ---------- */
  var d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
  $("date").min = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  $("rform").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("err"), date = $("date").value, msg = "";
    var phone = $("phone").value.replace(/[\s-]/g, "");
    if (!date) msg = "Choose a date.";
    else if (new Date(date + "T00:00").getDay() === 1) msg = "We are closed on Mondays. Pick another day.";
    else if (!$("time").value) msg = "Choose a time.";
    else if ($("name").value.trim().length < 2) msg = "Enter your name.";
    else if (!/^(\+63|0)9\d{9}$/.test(phone)) msg = "Enter a mobile number like 0917 555 0142.";
    err.textContent = msg;
    if (msg) return;
    $("okmsg").textContent = $("name").value.trim() + ", we have your request for " + $("guests").value +
      " on " + new Date(date + "T00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" }) +
      " at " + $("time").value + ". We will text you to confirm.";
    $("rform").hidden = true; $("ok").hidden = false;
  });
})();
