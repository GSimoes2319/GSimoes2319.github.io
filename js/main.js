(function () {
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isCoarse = window.matchMedia("(pointer: coarse)").matches;
  var useCustomCursor = !reducedMotion && !isCoarse && window.innerWidth > 900;

  /* —— Project grid (marquee, tilt, spotlight) —— */
  var spotlightTimer = null;
  var spotlightIndex = 0;

  function bindProjectTilt(card) {
    if (reducedMotion || isCoarse) return;

    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", (-py * 10).toFixed(2) + "deg");
      card.style.setProperty("--tilt-y", (px * 12).toFixed(2) + "deg");
    });

    card.addEventListener("mouseleave", function () {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  }

  function runSpotlight(container) {
    var cards = container.querySelectorAll(".project-card");
    if (cards.length < 2 || reducedMotion) return;

    if (spotlightTimer) clearInterval(spotlightTimer);

    spotlightTimer = setInterval(function () {
      cards.forEach(function (c) {
        c.classList.remove("is-spotlight");
      });
      spotlightIndex = (spotlightIndex + 1) % cards.length;
      cards[spotlightIndex].classList.add("is-spotlight");
    }, 4200);
  }

  function fillMarquee(repos) {
    var track = document.getElementById("projects-marquee");
    if (!track || !repos.length) return;

    var labels = repos.map(function (r) {
      return (
        '<span class="projects-marquee-item">' +
        escapeHtml(r.name) +
        "</span>"
      );
    });

    var chunk = labels.join("");
    track.innerHTML = chunk + chunk;
  }

  window.initProjects = function (container, repos) {
    container = container || document.getElementById("github-projects");
    if (!container) return;

    var cards = container.querySelectorAll(".project-card");
    if (!cards.length) return;

    container.classList.add("is-ready");
    cards.forEach(function (card, i) {
      card.style.setProperty("--stagger", String(i * 70) + "ms");
      bindProjectTilt(card);
    });

    if (repos && repos.length) fillMarquee(repos);

    if (cards[0]) cards[0].classList.add("is-spotlight");
    spotlightIndex = 0;
    runSpotlight(container);

    container.addEventListener("mouseenter", function () {
      if (spotlightTimer) {
        clearInterval(spotlightTimer);
        spotlightTimer = null;
      }
    });

    container.addEventListener("mouseleave", function () {
      runSpotlight(container);
    });
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* —— Click burst tracker —— */
  var clickLayer = document.getElementById("click-tracker");

  function spawnClickBurst(x, y) {
    if (!clickLayer) return;
    var burst = document.createElement("span");
    burst.className = "click-burst";
    burst.style.left = x + "px";
    burst.style.top = y + "px";
    clickLayer.appendChild(burst);
    burst.addEventListener("animationend", function () {
      burst.remove();
    });
    setTimeout(function () {
      burst.remove();
    }, 900);
  }

  document.addEventListener(
    "pointerdown",
    function (e) {
      spawnClickBurst(e.clientX, e.clientY);
      document.body.classList.add("is-clicking");
    },
    { passive: true }
  );

  document.addEventListener(
    "pointerup",
    function () {
      document.body.classList.remove("is-clicking");
    },
    { passive: true }
  );

  /* —— Cursor follower —— */
  var cursorEl = document.getElementById("cursor-tracker");
  var mouseX = window.innerWidth / 2;
  var mouseY = window.innerHeight / 2;
  var ringX = mouseX;
  var ringY = mouseY;

  if (useCustomCursor && cursorEl) {
    document.addEventListener(
      "pointermove",
      function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorEl.style.transform =
          "translate(" + mouseX + "px, " + mouseY + "px)";
      },
      { passive: true }
    );

    (function animateCursor() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      var ring = cursorEl.querySelector(".cursor-tracker-ring");
      if (ring) {
        ring.style.transform =
          "translate(" + (ringX - mouseX) + "px, " + (ringY - mouseY) + "px)";
      }
      requestAnimationFrame(animateCursor);
    })();
  } else if (cursorEl) {
    cursorEl.remove();
    document.body.style.cursor = "auto";
  }

  /* —— Side nav (mobile overlay + desktop collapse) —— */
  var toggle = document.getElementById("side-nav-toggle");
  var collapseBtn = document.getElementById("side-nav-collapse");
  var sideNav = document.getElementById("side-nav");
  var SIDEBAR_KEY = "work-profile-sidebar-collapsed";

  function setSidebarCollapsed(collapsed, persist) {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    if (collapseBtn) {
      collapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      collapseBtn.title = collapsed ? "Expand menu" : "Collapse menu";
    }
    if (persist && window.innerWidth > 900) {
      try {
        localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
      } catch (e) {
        /* ignore */
      }
    }
  }

  if (window.innerWidth > 900) {
    try {
      if (localStorage.getItem(SIDEBAR_KEY) === "1") {
        setSidebarCollapsed(true, false);
      }
    } catch (e) {
      /* ignore */
    }
  }

  if (toggle && sideNav) {
    toggle.addEventListener("click", function () {
      if (
        window.innerWidth > 900 &&
        document.body.classList.contains("sidebar-collapsed")
      ) {
        setSidebarCollapsed(false, true);
        toggle.setAttribute("aria-expanded", "true");
        return;
      }
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    sideNav.querySelectorAll(".side-nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (collapseBtn) {
    collapseBtn.addEventListener("click", function () {
      var collapsed = !document.body.classList.contains("sidebar-collapsed");
      setSidebarCollapsed(collapsed, true);
      document.body.classList.remove("nav-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  }

  if (toggle && collapseBtn) {
    window.addEventListener("resize", function () {
      if (window.innerWidth <= 900) {
        document.body.classList.remove("sidebar-collapsed");
      }
    });
  }

  var navLinks = document.querySelectorAll(".side-nav-link[data-nav]");
  var navSections = [];

  navLinks.forEach(function (link) {
    var id = link.getAttribute("data-nav");
    var section = document.getElementById(id);
    if (section) navSections.push({ id: id, el: section, link: link });
  });

  if ("IntersectionObserver" in window && navSections.length) {
    var navIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            navLinks.forEach(function (l) {
              l.classList.toggle("is-active", l.getAttribute("data-nav") === id);
            });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    navSections.forEach(function (s) {
      navIo.observe(s.el);
    });
  }

  /* —— Hero parallax —— */
  var outline = document.getElementById("hero-outline");
  var solid = document.getElementById("hero-solid");
  var ticking = false;

  window.addEventListener(
    "scroll",
    function () {
      if (ticking || reducedMotion) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var t = Math.min(y * 0.06, 20);
        if (outline) {
          outline.style.transform =
            "scaleX(1.02) skewX(-3deg) translateX(" + t * 0.4 + "px)";
        }
        if (solid) {
          solid.style.transform = "translateX(" + -t * 0.25 + "px)";
        }
        ticking = false;
      });
    },
    { passive: true }
  );

  /* —— Reveal panels —— */
  var panels = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    panels.forEach(function (p) {
      io.observe(p);
    });
  } else {
    panels.forEach(function (p) {
      p.classList.add("is-visible");
    });
  }
})();
