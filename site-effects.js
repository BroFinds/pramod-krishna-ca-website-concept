/*
 * Pramod Krishna & Co LLP — interactions, motion and Tikku the mascot.
 *
 * Pages are complete without this file. Layers:
 *   1. Always: review notes, live office status and clock, menu, accordions,
 *      checklists, map facade, dial, services scroll-spy, header state, Tikku.
 *   2. With GSAP + ScrollTrigger and no reduced-motion preference: smooth
 *      scrolling, intro and scroll choreography, tilt, magnetic buttons,
 *      cursor, page curtain, and Tikku's personality.
 * Every panel that animates open also animates closed.
 */
(() => {
  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fineMQ = window.matchMedia("(hover: hover) and (pointer: fine)");
  const motion = !reduceMQ.matches && typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  window.__pkcReady = true;
  if (motion) root.classList.add("fx");
  else root.classList.remove("fx", "is-arriving");
  if (motion) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ nullTargetWarn: false }); // shared code runs on pages without every section
  }
  // Intro waits for the page curtain to lift when arriving from another page.
  const introDelay = motion && root.classList.contains("is-arriving") ? 0.55 : 0.1;

  const store = {
    get(area, key) {
      try { return window[area].getItem(key); } catch { return null; }
    },
    set(area, key, value) {
      try { window[area].setItem(key, value); } catch { /* storage blocked: still works for this page */ }
    },
    remove(area, key) {
      try { window[area].removeItem(key); } catch { /* ignore */ }
    },
  };

  const tikkuApi = { say() {}, cheer() {} };

  /* =====================================================================
     1. Behaviour that never depends on the animation library
     ===================================================================== */

  /* ---------- Office status, hours and clock in India Standard Time ---------- */
  const OPEN_MIN = 9 * 60 + 30;
  const CLOSE_MIN = 19 * 60;

  const istNow = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    return {
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")),
      h: Number(get("hour")) % 24,
      m: Number(get("minute")),
      s: Number(get("second")),
    };
  };

  const officeStatus = () => {
    const { day, h, m } = istNow();
    const minutes = h * 60 + m;
    const workday = day >= 1 && day <= 6;
    if (workday && minutes >= OPEN_MIN && minutes < CLOSE_MIN) return { open: true, day, text: "Open now, closes at 7:00 pm" };
    if (workday && minutes < OPEN_MIN) return { open: false, day, text: "Closed now, opens at 9:30 am today" };
    if (day >= 1 && day <= 5) return { open: false, day, text: "Closed now, opens at 9:30 am tomorrow" };
    return { open: false, day, text: "Closed now, opens Monday at 9:30 am" };
  };

  const renderStatus = () => {
    const s = officeStatus();
    $$("[data-status]").forEach((el) => {
      el.classList.toggle("is-open", s.open);
      el.classList.toggle("is-closed", !s.open);
      const t = $(".status-text", el);
      if (t) t.textContent = s.text;
    });
    $$("[data-hours] tr, [data-week] li").forEach((row) => row.classList.toggle("is-today", Number(row.dataset.day) === s.day));
    return s;
  };
  renderStatus();
  setInterval(renderStatus, 30_000);

  const clocks = $$("[data-clock]");
  const tickClocks = () => {
    const { h, m, s } = istNow();
    clocks.forEach((c) => {
      $("[data-clock-h]", c).style.transform = `rotate(${(h % 12) * 30 + m * 0.5}deg)`;
      $("[data-clock-m]", c).style.transform = `rotate(${m * 6 + s * 0.1}deg)`;
      $("[data-clock-s]", c).style.transform = `rotate(${s * 6}deg)`;
    });
  };
  if (clocks.length) {
    tickClocks();
    setInterval(tickClocks, reduceMQ.matches ? 30_000 : 1000);
  }

  /* ---------- Footer year ---------- */
  $$("[data-year-now]").forEach((el) => (el.textContent = String(new Date().getFullYear())));

  /* ---------- Review notes: animated in and out ---------- */
  const notesToggles = $$("[data-notes-toggle]");
  const renderNotes = () => notesToggles.forEach((t) => t.setAttribute("aria-pressed", String(root.dataset.notes === "on")));
  const noteEls = () => $$(".note, .note-block");
  notesToggles.forEach((toggle) => {
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      const turnOn = root.dataset.notes !== "on";
      store.set("localStorage", "pkc-review-notes", turnOn ? "on" : "off");
      if (turnOn) {
        root.dataset.notes = "on";
        renderNotes();
        if (motion) gsap.from(noteEls(), { height: 0, autoAlpha: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, duration: 0.5, ease: "power3.out", clearProps: "all", onComplete: () => ScrollTrigger.refresh() });
        tikkuApi.say("Red notes mark what the firm still has to confirm.");
      } else {
        const finish = () => {
          delete root.dataset.notes;
          renderNotes();
          if (motion) {
            gsap.set(noteEls(), { clearProps: "all" });
            ScrollTrigger.refresh();
          }
        };
        if (motion) gsap.to(noteEls(), { height: 0, autoAlpha: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, duration: 0.35, ease: "power2.in", onComplete: finish });
        else finish();
      }
    });
  });
  renderNotes();

  /* ---------- Accordions (animated both ways) ---------- */
  const setAccordion = (btn, open) => {
    const body = document.getElementById(btn.getAttribute("aria-controls"));
    if (!body) return;
    btn.setAttribute("aria-expanded", String(open));
    const after = () => btn.dispatchEvent(new CustomEvent("accordion:change", { bubbles: true }));
    if (open) {
      body.hidden = false;
      if (motion) gsap.fromTo(body, { height: 0, autoAlpha: 0 }, { height: "auto", autoAlpha: 1, duration: 0.45, ease: "power3.out", clearProps: "height,opacity,visibility", onUpdate: after });
      after();
    } else if (motion) {
      gsap.to(body, { height: 0, autoAlpha: 0, duration: 0.32, ease: "power2.in", onUpdate: after, onComplete: () => { body.hidden = true; gsap.set(body, { clearProps: "all" }); after(); } });
    } else {
      body.hidden = true;
      after();
    }
  };
  $$("[data-accordion]").forEach((btn) => btn.addEventListener("click", () => setAccordion(btn, btn.getAttribute("aria-expanded") !== "true")));

  /* ---------- Tap-to-tick checklists ---------- */
  $$("[data-checklist]").forEach((list) => {
    const buttons = $$("[data-check]", list);
    const counter = $("[data-check-count]", list.closest(".tile, .svc-card") || list.parentElement);
    const update = () => {
      const done = buttons.filter((b) => b.getAttribute("aria-pressed") === "true").length;
      if (counter) counter.textContent = `${done} of ${buttons.length}`;
      return done;
    };
    buttons.forEach((b) => {
      const path = $(".tick path", b);
      path?.setAttribute("pathLength", "1");
      b.addEventListener("click", () => {
        const on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", String(on));
        const done = update();
        if (motion) {
          const box = $(".check-box", b);
          gsap.fromTo(box, { scale: on ? 0.6 : 1.15 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
          if (path) gsap.fromTo(path, { strokeDasharray: 1, strokeDashoffset: on ? 1 : 0 }, { strokeDashoffset: on ? 0 : 1, duration: on ? 0.35 : 0.2, ease: "power2.out" });
        }
        if (on) done === buttons.length ? tikkuApi.cheer("All set. See you at Bridge Square!") : tikkuApi.cheer();
      });
    });
    update();
  });

  /* ---------- Map facade: load Google Maps only on request ---------- */
  $$("[data-map]").forEach((map) => {
    $("[data-map-load]", map)?.addEventListener("click", () => {
      const frame = document.createElement("iframe");
      frame.src = "https://www.google.com/maps?q=Bridge+Square,+Balmatta,+Mangaluru,+Karnataka&output=embed";
      frame.title = "Map of Bridge Square, Balmatta, Mangaluru";
      frame.loading = "lazy";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      map.prepend(frame);
      map.classList.add("is-loaded");
      if (motion) gsap.from(frame, { autoAlpha: 0, scale: 1.04, duration: 0.8, ease: "power2.out" });
    });
  });

  /* ---------- Year dial ---------- */
  const dial = $("[data-dial]");
  if (dial) {
    const monthIndex = (new Date().getMonth() + 9) % 12; // April = 0
    $$(".month-label", dial)[monthIndex]?.classList.add("is-now");
    const monthEl = $("[data-dial-month]");
    const subEl = $("[data-dial-sub]");
    if (monthEl) monthEl.textContent = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(new Date());
    if (subEl) subEl.textContent = `Month ${monthIndex + 1} of 12`;
    const needle = $("[data-needle]", dial);
    if (needle) {
      needle.dataset.angle = String(monthIndex * 30 + 15);
      if (!motion) {
        needle.setAttribute("transform", `rotate(${needle.dataset.angle} 300 300)`);
        needle.classList.add("is-set");
      }
    }
    const items = $$(".legend-item");
    const activate = (item) => {
      items.forEach((i) => i.classList.toggle("is-active", i === item));
      if (item) dial.dataset.active = item.dataset.ring;
      else delete dial.dataset.active;
    };
    items.forEach((item) => {
      item.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && activate(item));
      item.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && activate(null));
      item.addEventListener("focus", () => activate(item));
      item.addEventListener("blur", () => activate(null));
      item.addEventListener("click", () => activate(item.classList.contains("is-active") && dial.dataset.active === item.dataset.ring ? null : item));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click();
        }
      });
    });
  }

  /* ---------- Services scroll-spy ---------- */
  const spy = $("[data-spy]");
  if (spy) {
    const links = $$('a[href^="#"]', spy);
    const sections = links.map((l) => document.getElementById(l.hash.slice(1)));
    const bar = $("[data-spy-progress]");
    let frame = 0;
    let last = -2;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let current = -1;
      sections.forEach((s, i) => {
        if (s && s.getBoundingClientRect().top <= line) current = i;
      });
      if (window.innerHeight + window.scrollY >= root.scrollHeight - 2) current = sections.length - 1;
      if (bar) bar.style.transform = `scaleX(${(current + 1) / sections.length})`;
      if (current === last) return;
      last = current;
      links.forEach((link, i) => {
        link.classList.toggle("is-done", i <= current);
        if (i === current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
  }

  /* ---------- Header state ---------- */
  const header = $("[data-header]");
  const menus = $$("[data-menu]");
  let lastY = window.scrollY;
  const updateHeader = (y) => {
    if (!header) return;
    const max = root.scrollHeight - window.innerHeight;
    header.style.setProperty("--progress", max > 0 ? Math.min(1, y / max).toFixed(4) : "0");
    header.classList.toggle("is-solid", y > 30);
    if (y > lastY + 4 && y > 260 && !menus.some((m) => m.open)) header.classList.add("is-hidden");
    else if (y < lastY - 4 || y < 260) header.classList.remove("is-hidden");
    lastY = y;
  };
  header?.addEventListener("focusin", () => header.classList.remove("is-hidden"));
  if (!motion) {
    let f = 0;
    window.addEventListener("scroll", () => { if (!f) f = requestAnimationFrame(() => { f = 0; updateHeader(window.scrollY); }); }, { passive: true });
    updateHeader(window.scrollY);
  }

  /* ---------- Mobile menu: animated open AND close ---------- */
  const menuAnim = new WeakMap();
  const openMenuFx = (menu) => {
    const panel = $(".menu-panel", menu);
    const s = $("summary", menu).getBoundingClientRect();
    const cx = s.left + s.width / 2;
    const cy = s.top + s.height / 2;
    const r = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
    menuAnim.set(menu, { cx, cy, r });
    header?.classList.remove("is-hidden");
    window.__lenis?.stop();
    if (!motion) return;
    gsap.killTweensOf([panel, ...$$(".menu-panel nav a, .menu-foot", menu)]);
    gsap.fromTo(panel, { clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${r}px at ${cx}px ${cy}px)`, duration: 0.75, ease: "expo.inOut" });
    gsap.fromTo($$(".menu-panel nav a", menu), { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: "expo.out", delay: 0.2 });
    gsap.fromTo($(".menu-foot", menu), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.45, ease: "power3.out" });
    tikkuApi.duck?.(true);
  };
  const closeMenu = (menu, { instant = false, focus = false } = {}) => {
    if (!menu.open || menu.classList.contains("is-closing")) return;
    const panel = $(".menu-panel", menu);
    const done = () => {
      menu.classList.remove("is-closing");
      menu.open = false;
      if (motion) gsap.set([panel, ...$$(".menu-panel nav a, .menu-foot", menu)], { clearProps: "all" });
      window.__lenis?.start();
      tikkuApi.duck?.(false);
      if (focus) $("summary", menu)?.focus();
    };
    if (!motion || instant) return done();
    const { cx, cy } = menuAnim.get(menu) || { cx: innerWidth - 40, cy: 40 };
    menu.classList.add("is-closing");
    gsap.killTweensOf([panel, ...$$(".menu-panel nav a, .menu-foot", menu)]);
    gsap.timeline({ onComplete: done })
      .to($$(".menu-panel nav a", menu).reverse(), { yPercent: 40, autoAlpha: 0, duration: 0.3, stagger: 0.04, ease: "power2.in" }, 0)
      .to($(".menu-foot", menu), { autoAlpha: 0, y: 10, duration: 0.25 }, 0)
      .to(panel, { clipPath: `circle(0px at ${cx}px ${cy}px)`, duration: 0.6, ease: "expo.inOut" }, 0.15);
  };
  menus.forEach((menu) => {
    const summary = $("summary", menu);
    summary.addEventListener("click", (e) => {
      if (menu.open) {
        e.preventDefault();
        closeMenu(menu);
      }
    });
    menu.addEventListener("toggle", () => menu.open && openMenuFx(menu));
    $$(".menu-panel a", menu).forEach((a) => a.addEventListener("click", () => closeMenu(menu, { instant: a.getAttribute("href")?.startsWith("#") === false })));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const m = menus.find((x) => x.open);
    if (m) closeMenu(m, { focus: true });
  });
  document.addEventListener("click", (e) => menus.forEach((m) => m.open && !m.contains(e.target) && !e.target.closest("[data-tikku], [data-tikku-panel]") && closeMenu(m)));
  window.matchMedia("(min-width: 961px)").addEventListener("change", (e) => e.matches && menus.forEach((m) => closeMenu(m, { instant: true })));

  /* ---------- Tikku ---------- */
  initTikku();

  if (!motion) return;

  /* =====================================================================
     2. Motion
     ===================================================================== */

  gsap.defaults({ ease: "expo.out", duration: 1.1 });
  const mm = gsap.matchMedia();

  /* ---------- Smooth scrolling ---------- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1, touchMultiplier: 1.3 });
    window.__lenis = lenis;
    lenis.on("scroll", (e) => {
      ScrollTrigger.update();
      updateHeader(e.scroll);
    });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    window.addEventListener("scroll", () => updateHeader(window.scrollY), { passive: true });
  }

  const headerOffset = () => -(header?.offsetHeight || 0) - 16;
  // Numbers, not elements: a native scroll Lenis has not seen yet cannot skew the target.
  const scrollToTarget = (target, immediate = false) => {
    const y = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY + headerOffset();
    if (lenis) lenis.scrollTo(Math.max(0, y), { immediate, duration: 1.4, force: true });
    else window.scrollTo(0, Math.max(0, y));
  };

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented) return;
    if (link.hasAttribute("data-to-top")) {
      e.preventDefault();
      scrollToTarget(0);
      tikkuApi.say("Wheee! Back to the top.", 1800);
      return;
    }
    const id = link.getAttribute("href").slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
    history.replaceState(null, "", `#${id}`);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });

  /* ---------- Page curtain (cover on leave, reveal on arrival) ---------- */
  const curtain = $(".curtain");
  const arriving = root.classList.contains("is-arriving");
  store.remove("sessionStorage", "pkc-curtain");
  if (curtain) {
    const coin = $(".curtain-coin", curtain);
    const mark = $(".curtain-mark", curtain);
    if (arriving) {
      gsap.set(curtain, { yPercent: 0 });
      root.classList.remove("is-arriving");
      gsap.timeline({ delay: 0.05 })
        .to(mark, { y: -30, autoAlpha: 0, duration: 0.4, ease: "power2.in" })
        .to(curtain, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, 0.15)
        .set(curtain, { yPercent: 100 })
        .set(mark, { clearProps: "all" });
    } else {
      gsap.set(curtain, { yPercent: 100 });
    }
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) || url.pathname === location.pathname) return;
      e.preventDefault();
      store.set("sessionStorage", "pkc-curtain", "1");
      gsap.timeline({ onComplete: () => (location.href = url.href) })
        .fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: "expo.inOut" })
        .fromTo(coin, { scale: 0.2, rotation: -180 }, { scale: 1, rotation: 0, duration: 0.7, ease: "back.out(1.6)" }, 0.2)
        .fromTo(mark, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" }, 0.35);
    });
    window.addEventListener("pageshow", (e) => e.persisted && gsap.set(curtain, { yPercent: 100 }));
  }

  /* ---------- Intro ---------- */
  const heroEl = $("[data-hero], [data-phero]");
  if (heroEl) {
    const tl = gsap.timeline({ delay: introDelay });
    tl.fromTo($$("[data-split] .ln > span", heroEl), { yPercent: 110, y: 0, rotation: 4 }, { yPercent: 0, y: 0, rotation: 0, duration: 1.4, stagger: 0.1 }, 0.05);
    tl.fromTo($$("[data-hero-fade]", heroEl), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.35);
    const cards = $$(".fcard", heroEl);
    if (cards.length) {
      tl.fromTo(cards, { autoAlpha: 0, scale: 0.6, y: 40, rotation: (i) => [-12, 10, 8, -8][i % 4] }, { autoAlpha: 1, scale: 1, y: 0, rotation: 0, duration: 1.1, stagger: 0.12, ease: "back.out(1.5)" }, 0.55);
      tl.from($(".fc-bar i", heroEl), { scaleX: 0, duration: 1.4, ease: "power2.inOut" }, 1);
      // Idle float, on yPercent so pointer parallax (x/y) can layer on top
      cards.forEach((c, i) => gsap.to(c, { yPercent: i % 2 ? -14 : 14, duration: 2.4 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.6 }));
    }
    tl.fromTo($$(".stage-ring", heroEl), { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.6, stagger: 0.1 }, 0.3);

    // Content drifts and dims as the hero scrolls away
    const copy = $(".hero-copy, .phero-inner", heroEl);
    gsap.to(copy, { yPercent: -10, autoAlpha: 0.3, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });
    const stage = $("[data-stage]", heroEl);
    if (stage) gsap.to(stage, { yPercent: -18, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- Rotating word ---------- */
  const rotator = $("[data-rotator]");
  if (rotator) {
    const words = $$(".rot-word", rotator);
    let i = 0;
    gsap.set(words, { autoAlpha: 0, yPercent: 100 });
    gsap.set(words[0], { autoAlpha: 1, yPercent: 0 });
    const next = () => {
      const cur = words[i];
      i = (i + 1) % words.length;
      const nxt = words[i];
      gsap.to(cur, { yPercent: -100, autoAlpha: 0, filter: "blur(8px)", duration: 0.6, ease: "power3.in" });
      gsap.fromTo(nxt, { yPercent: 100, autoAlpha: 0, filter: "blur(8px)" }, { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.8, ease: "expo.out", delay: 0.35 });
    };
    gsap.delayedCall(introDelay + 2.4, function loop() {
      if (!document.hidden) next();
      gsap.delayedCall(2.4, loop);
    });
  }

  /* ---------- Headlines and blocks on scroll ---------- */
  $$("[data-split]").forEach((el) => {
    if (el.closest("[data-hero], [data-phero]")) return;
    gsap.from($$(".ln > span", el), { yPercent: 110, rotation: 3, duration: 1.2, stagger: 0.1, scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  if ($("[data-reveal]")) {
    gsap.set("[data-reveal]", { autoAlpha: 0, y: 40, scale: 0.98 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 90%",
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, scale: 1, stagger: 0.08, duration: 1, overwrite: true }),
    });
  }

  /* Statement lights up word by word as you scroll */
  $$("[data-highlight]").forEach((p) => {
    const text = p.textContent.trim();
    p.setAttribute("aria-label", text);
    p.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(" ");
    gsap.fromTo($$(".w", p), { opacity: 0.14 }, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 40%", scrub: true } });
  });

  /* Line icons draw themselves */
  const drawIcon = (svg, vars = {}) => {
    const shapes = $$("path, circle, rect, line", svg);
    shapes.forEach((s) => s.setAttribute("pathLength", "1"));
    return gsap.fromTo(shapes, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, stagger: 0.1, ease: "power2.inOut", ...vars });
  };
  $$("[data-draw]").forEach((svg) => drawIcon(svg, { scrollTrigger: { trigger: svg, start: "top 88%" } }));

  /* ---------- Marquee that answers scroll speed ---------- */
  const marquee = $("[data-marquee] .marquee-track");
  if (marquee) {
    const loop = gsap.to(marquee, { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      onUpdate: (self) => {
        const boost = Math.min(5, Math.abs(self.getVelocity()) / 300);
        gsap.to(loop, { timeScale: self.direction * (1 + boost), duration: 0.25, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.25 });
      },
    });
  }

  /* ---------- Story: documents settle into a finished file ---------- */
  const story = $("[data-story]");
  if (story) {
    const docs = $$("[data-doc]", story);
    const ledger = $("[data-ledger]", story);
    const ledgerRows = $$("li, .ledger-total", ledger);
    const steps = $$("[data-step]", story);
    const stage = $(".story-stage", story);
    // Scatter stays over the stage side so the headline and steps remain readable
    const scatter = [[-0.12, -0.38, -24], [0.5, -0.42, 18], [-0.08, 0.42, 14], [0.55, 0.32, -20], [0.2, -0.55, 9], [-0.2, 0.05, -12], [0.68, -0.05, 26], [0.25, 0.6, -16]];
    const setStep = (p) => {
      const i = p < 0.34 ? 0 : p < 0.7 ? 1 : 2;
      steps.forEach((s, n) => s.classList.toggle("is-active", n === i));
    };
    const settled = { x: (i) => i * 10, y: (i) => i * 8, rotation: (i) => -7 + i * 1.8, scale: 1 };

    mm.add("(min-width: 961px)", () => {
      story.classList.add("is-pinned");
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: { trigger: story, start: "top top", end: "+=190%", pin: true, scrub: 1, invalidateOnRefresh: true, onUpdate: (self) => setStep(self.progress) },
      });
      // fromTo (not from): invalidateOnRefresh would otherwise re-record the scattered state as the end.
      tl.fromTo(docs, { x: (i) => scatter[i][0] * stage.offsetWidth, y: (i) => scatter[i][1] * stage.offsetHeight, rotation: (i) => scatter[i][2], scale: 1.05 }, { ...settled, duration: 1, stagger: 0.05 })
        .fromTo(ledger, { y: 140, autoAlpha: 0, rotation: 6, scale: 0.9 }, { y: 0, autoAlpha: 1, rotation: 0, scale: 1, duration: 0.45, ease: "back.out(1.4)" }, ">-0.05")
        .fromTo(ledgerRows, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, stagger: 0.07, duration: 0.25 }, ">-0.15")
        .to({}, { duration: 0.25 });
      setStep(0);
      return () => story.classList.remove("is-pinned");
    });

    mm.add("(max-width: 960px)", () => {
      gsap.fromTo(docs, { x: (i) => scatter[i][0] * stage.offsetWidth * 0.6, y: (i) => Math.abs(scatter[i][1]) * stage.offsetHeight * 0.5, rotation: (i) => scatter[i][2] }, { ...settled, ease: "power2.inOut", stagger: 0.04, scrollTrigger: { trigger: stage, start: "top 85%", end: "center 45%", scrub: 1 } });
      gsap.fromTo(ledger, { y: 80, autoAlpha: 0, scale: 0.9 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1, ease: "back.out(1.4)", scrollTrigger: { trigger: stage, start: "center 65%" } });
      steps.forEach((s) => s.classList.add("is-active"));
    });
  }

  /* ---------- Stacking service cards ---------- */
  const cards = $$("[data-stack-card]");
  cards.forEach((card, i) => {
    const inner = $(".sc-inner", card);
    gsap.from(inner, { y: 80, rotation: i % 2 ? 2 : -2, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: card, start: "top 92%" } });
    const nextCard = cards[i + 1];
    if (!nextCard) return;
    // Each card stays fully readable while it is on top (CSS gives it a pause);
    // it only settles back, without fading, as the next card slides over it.
    gsap.to(inner, {
      scale: 0.93,
      rotationX: 6,
      transformPerspective: 1000,
      ease: "none",
      scrollTrigger: { trigger: nextCard, start: "top 70%", end: () => `top ${(header?.offsetHeight || 70) + 40}px`, scrub: true },
    });
  });

  /* ---------- Bento ---------- */
  const tiles = $$("[data-tile]");
  if (tiles.length) {
    gsap.set(tiles, { autoAlpha: 0, y: 60, scale: 0.94 });
    ScrollTrigger.batch(tiles, {
      start: "top 92%",
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, scale: 1, stagger: 0.09, duration: 1.1, ease: "expo.out", overwrite: true }),
    });
  }
  $$("[data-week]").forEach((w) =>
    gsap.from($$(".week-bar i", w), { scaleY: 0, duration: 1, stagger: 0.06, ease: "back.out(1.6)", scrollTrigger: { trigger: w, start: "top 88%" } })
  );
  $$("[data-odometer]").forEach((odo) => {
    const digits = odo.dataset.odometer.split("").map(Number);
    const strips = $$(".odo-strip", odo);
    gsap.set(strips, { yPercent: 0 });
    ScrollTrigger.create({
      trigger: odo,
      start: "top 88%",
      once: true,
      onEnter: () => strips.forEach((s, i) => gsap.fromTo(s, { yPercent: -90 }, { yPercent: -digits[i] * 10, duration: 1.6 + i * 0.25, ease: "expo.out", delay: 0.2 })),
    });
  });
  const roof = $("[data-tiles]");
  if (roof) gsap.from($$(".tile-row", roof).reverse(), { yPercent: -60, autoAlpha: 0, stagger: 0.05, duration: 1, scrollTrigger: { trigger: roof, start: "top 85%" } });

  /* ---------- Year dial ---------- */
  if (dial) {
    const needle = $("[data-needle]", dial);
    const tl = gsap.timeline({ scrollTrigger: { trigger: dial, start: "top 75%" } });
    tl.from($$(".month-label", dial), { autoAlpha: 0, scale: 0.5, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.04, ease: "back.out(2)" })
      .fromTo($$(".arc", dial), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, stagger: 0.18, ease: "power3.inOut" }, 0.2)
      .from($$("[data-dot]", dial), { scale: 0, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.03, ease: "back.out(3)" }, 0.3);
    if (needle) {
      needle.classList.add("is-set");
      tl.fromTo(needle, { rotation: -90, svgOrigin: "300 300" }, { rotation: Number(needle.dataset.angle || 0), svgOrigin: "300 300", duration: 2, ease: "elastic.out(1, 0.5)" }, 0.5);
    }
  }

  /* ---------- Footer name: letters rise, then ripple under the pointer ---------- */
  const footName = $("[data-footer-name]");
  if (footName) {
    const text = footName.textContent;
    footName.innerHTML = [...text].map((c) => (c === " " ? " " : `<span class="ch">${c === "&" ? "&amp;" : c}</span>`)).join("");
    const chars = $$(".ch", footName);
    gsap.from(chars, { yPercent: 110, rotation: 12, autoAlpha: 0, stagger: 0.03, duration: 1, ease: "back.out(1.6)", scrollTrigger: { trigger: footName, start: "top 95%" } });
    if (fineMQ.matches) {
      footName.addEventListener("pointermove", (e) => {
        chars.forEach((c) => {
          const r = c.getBoundingClientRect();
          const d = Math.abs(e.clientX - (r.left + r.width / 2));
          gsap.to(c, { y: -Math.max(0, 40 - d * 0.35), duration: 0.4, ease: "power3.out" });
        });
      });
      footName.addEventListener("pointerleave", () => gsap.to(chars, { y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", stagger: 0.01 }));
    }
  }

  /* ---------- Pointer and touch niceties ---------- */
  const stageEl = $("[data-stage]");
  const parallax = (nx, ny) => {
    if (!stageEl) return;
    $$("[data-depth]", stageEl).forEach((c) => {
      const d = Number(c.dataset.depth);
      gsap.to(c, { x: nx * 24 * d, y: ny * 18 * d, rotationY: nx * 10, rotationX: -ny * 8, duration: 0.9, ease: "power3.out" });
    });
  };

  mm.add("(hover: hover) and (pointer: fine)", () => {
    // Hero cards follow the pointer
    const hero = $("[data-hero]");
    const onHero = (e) => parallax(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
    hero?.addEventListener("pointermove", onHero);

    // Buttons fill from the entry point
    const fillFrom = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--fx", `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty("--fy", `${e.clientY - r.top}px`);
    };
    $$(".btn").forEach((b) => {
      b.addEventListener("pointerenter", fillFrom);
      b.addEventListener("pointerleave", fillFrom);
    });

    // Magnetic pull
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.4)" }));
    });

    // 3D tilt with glare
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotationY: nx * 9, rotationX: -ny * 9, transformPerspective: 900, duration: 0.5, ease: "power3.out" });
        el.style.setProperty("--gx", `${(nx + 0.5) * 100}%`);
        el.style.setProperty("--gy", `${(ny + 0.5) * 100}%`);
        el.style.setProperty("--glare", "1");
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { rotationY: 0, rotationX: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" });
        el.style.setProperty("--glare", "0");
      });
    });

    // Cursor
    const cursor = $(".cursor");
    if (!cursor) return;
    root.classList.add("has-cursor");
    const dot = $(".cursor-dot", cursor);
    const ring = $(".cursor-ring", cursor);
    const label = $(".cursor-label", cursor);
    const dx = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    const move = (e) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      cursor.classList.remove("is-hidden");
    };
    const over = (e) => {
      const t = e.target.closest("[data-cursor]");
      cursor.classList.toggle("is-active", Boolean(t));
      label.textContent = t ? t.dataset.cursor : "";
    };
    const down = () => cursor.classList.add("is-down");
    const up = () => cursor.classList.remove("is-down");
    const hide = () => cursor.classList.add("is-hidden");
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", hide);
    return () => {
      root.classList.remove("has-cursor");
      hero?.removeEventListener("pointermove", onHero);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  });

  mm.add("(hover: none), (pointer: coarse)", () => {
    // Tilt your phone: hero cards and Tikku's eyes follow (no permission prompt on Android)
    const onTilt = (e) => {
      if (e.gamma == null) return;
      const nx = Math.max(-1, Math.min(1, e.gamma / 30)) * 0.5;
      const ny = Math.max(-1, Math.min(1, (e.beta - 40) / 30)) * 0.5;
      parallax(nx, ny);
      tikkuApi.lookDir?.(nx, ny);
    };
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission !== "function") {
      window.addEventListener("deviceorientation", onTilt);
    }
    // Ripples and press feedback for touch
    const press = (e) => {
      const host = e.target.closest(".btn, .tile, [data-check], .channel, .tp-actions a, .tp-actions button, .sc-link, .pcard");
      if (!host) return;
      const r = host.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const rip = document.createElement("span");
      rip.className = "ripple";
      Object.assign(rip.style, { left: `${e.clientX - r.left}px`, top: `${e.clientY - r.top}px`, width: `${size}px`, height: `${size}px` });
      host.appendChild(rip);
      gsap.to(rip, { scale: 1, opacity: 0, duration: 0.7, ease: "power2.out", onComplete: () => rip.remove() });
      if (host.matches("[data-tilt], .tile")) gsap.fromTo(host, { scale: 0.97 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    };
    window.addEventListener("pointerdown", press, { passive: true });
    return () => {
      window.removeEventListener("deviceorientation", onTilt);
      window.removeEventListener("pointerdown", press);
    };
  });

  /* ---------- Settle after fonts; honour a hash on arrival ---------- */
  const settle = () => {
    ScrollTrigger.refresh();
    if (location.hash.length > 1) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) requestAnimationFrame(() => scrollToTarget(target, true));
    }
  };
  if (document.fonts?.ready) document.fonts.ready.then(settle);
  else window.addEventListener("load", settle);
  reduceMQ.addEventListener("change", () => location.reload());

  /* =====================================================================
     Tikku — a small brass coin with a tick for an antenna.
     Lives at the bottom corner of every page. Tap for quick help, drag to
     move, and it reacts to scrolling, hovering, idling and ticking things off.
     ===================================================================== */
  function initTikku() {
    const el = $("[data-tikku]");
    if (!el) return;
    const btn = $("[data-tikku-btn]", el);
    const body = $("[data-tikku-body]", el);
    const panel = $("[data-tikku-panel]");
    const bubble = $("[data-tikku-bubble]", el);
    const peek = $("[data-tikku-show]", el);
    const hello = $("[data-tikku-hello]");
    const slot = $("[data-mascot-slot]");
    const parts = {
      all: $(".tk-all", el),
      shadow: $(".tk-shadow", el),
      eyes: $$(".tk-eye", el),
      pupils: $$(".tk-pupil", el),
      armR: $(".tk-arm-r", el),
      armL: $(".tk-arm-l", el),
      antenna: $(".tk-antenna", el),
      zzz: $$(".tk-zzz text", el),
    };
    // The panel is fixed-positioned; keep it out of the mascot's transformed box.
    document.body.appendChild(panel);
    el.classList.add("is-ready");

    let open = false;
    let sleeping = false;
    let hidden = store.get("localStorage", "pkc-tikku-hidden") === "1";
    let lastInput = Date.now();
    let docked = !slot || !motion;
    let justDragged = false;
    let bubbleTimer = 0;
    let zzzTween = null;

    const setMood = (m) => {
      if (m && m !== "happy") el.dataset.mood = m;
      else delete el.dataset.mood;
    };

    const greet = () => {
      const s = officeStatus();
      if (hello) hello.textContent = s.open ? "Hi! We’re open till 7 pm." : "Hi! The office is closed right now.";
    };
    greet();

    /* --- Speech bubble (animated in and out) --- */
    const hideBubble = () => {
      clearTimeout(bubbleTimer);
      if (motion) gsap.to(bubble, { autoAlpha: 0, scale: 0.7, y: 6, duration: 0.25, ease: "power2.in", overwrite: true });
      else bubble.style.visibility = "hidden";
    };
    const say = (text, ms = 3400) => {
      if (hidden || open || !text) return;
      if (!fineMQ.matches) ms = Math.min(ms, 2400); // shorter on phones, where it covers more
      wake();
      bubble.textContent = text;
      clearTimeout(bubbleTimer);
      // Keep the bubble on screen wherever Tikku is (big in the hero, or dragged to an edge)
      let shiftX = 0;
      if (motion) gsap.set(bubble, { x: 0, scale: 1 });
      else bubble.style.transform = "";
      const br = bubble.getBoundingClientRect();
      if (br.left < 10) shiftX = 10 - br.left;
      else if (br.right > innerWidth - 10) shiftX = innerWidth - 10 - br.right;
      if (motion) {
        gsap.fromTo(bubble, { autoAlpha: 0, scale: 0.5, y: 10, x: shiftX }, { autoAlpha: 1, scale: 1, y: 0, x: shiftX, duration: 0.5, ease: "back.out(2.2)", overwrite: true });
        gsap.fromTo(parts.antenna, { rotation: -18 }, { rotation: 0, duration: 0.9, ease: "elastic.out(1.2, 0.3)" });
        setMood("oh");
        gsap.delayedCall(0.6, () => !sleeping && setMood("happy"));
      } else {
        bubble.style.visibility = "visible";
        bubble.style.opacity = "1";
      }
      bubbleTimer = setTimeout(hideBubble, ms);
    };
    tikkuApi.say = say;
    // Step aside while the full-screen menu is open, then pop back
    tikkuApi.duck = (on) => {
      if (on) {
        hideBubble();
        closePanel(false);
      }
      el.classList.toggle("is-ducked", on);
    };

    /* --- Quick-help panel (animated open and close) --- */
    const placePanel = () => {
      const r = btn.getBoundingClientRect();
      const pw = panel.offsetWidth;
      const ph = panel.offsetHeight;
      const onLeft = r.left + r.width / 2 < innerWidth / 2;
      let left = onLeft ? r.left : r.right - pw;
      left = Math.min(Math.max(12, left), innerWidth - pw - 12);
      let top = r.top - ph - 12;
      if (top < 12) top = Math.min(r.bottom + 12, innerHeight - ph - 12);
      top = Math.max(12, top);
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.transformOrigin = `${r.left + r.width / 2 - left}px ${r.top + r.height / 2 - top}px`;
    };
    const openPanel = () => {
      if (open) return;
      open = true;
      wake();
      hideBubble();
      greet();
      panel.hidden = false;
      placePanel();
      btn.setAttribute("aria-expanded", "true");
      if (motion) {
        gsap.fromTo(panel, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.55, ease: "back.out(1.5)", overwrite: true });
        gsap.fromTo($$(".tp-actions > li, .tp-status, .tp-hide", panel), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, delay: 0.12, ease: "power3.out" });
        jump();
      }
      $(".tp-actions a", panel)?.focus({ preventScroll: true });
    };
    const closePanel = (returnFocus = true) => {
      if (!open) return;
      open = false;
      btn.setAttribute("aria-expanded", "false");
      const done = () => {
        panel.hidden = true;
        $$("[data-accordion]", panel).forEach((b) => {
          b.setAttribute("aria-expanded", "false");
          const bd = document.getElementById(b.getAttribute("aria-controls"));
          if (bd) bd.hidden = true;
        });
      };
      if (motion) {
        gsap.to($$(".tp-actions > li, .tp-status, .tp-hide", panel), { y: 8, autoAlpha: 0, duration: 0.18, stagger: 0.02, ease: "power2.in" });
        gsap.to(panel, { autoAlpha: 0, duration: 0.32, ease: "power2.in", overwrite: true });
        gsap.to(panel, { scale: 0.3, duration: 0.36, ease: "back.in(1.4)", onComplete: done });
      } else done();
      if (returnFocus) btn.focus({ preventScroll: true });
    };
    panel.addEventListener("accordion:change", () => open && placePanel());
    $("[data-tikku-close]", panel)?.addEventListener("click", () => closePanel());
    btn.addEventListener("click", () => {
      if (justDragged) return;
      open ? closePanel() : openPanel();
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && open && closePanel());
    document.addEventListener("pointerdown", (e) => open && !panel.contains(e.target) && !el.contains(e.target) && closePanel(false));
    window.addEventListener("resize", () => open && placePanel());

    /* --- Hide and bring back (both animated) --- */
    const applyHidden = (animate) => {
      btn.hidden = hidden;
      peek.hidden = !hidden;
      if (!animate || !motion) return;
      if (hidden) gsap.fromTo(peek, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2)" });
      else gsap.fromTo(btn, { scale: 0, rotation: 90 }, { scale: 1, rotation: 0, duration: 0.7, ease: "back.out(1.8)", clearProps: "scale,rotation" });
    };
    $("[data-tikku-hide]", panel)?.addEventListener("click", () => {
      closePanel(false);
      hideBubble();
      const go = () => {
        hidden = true;
        store.set("localStorage", "pkc-tikku-hidden", "1");
        applyHidden(true);
        peek.focus({ preventScroll: true });
      };
      if (motion) gsap.to(btn, { scale: 0, rotation: -120, duration: 0.45, delay: 0.25, ease: "back.in(1.8)", onComplete: go });
      else go();
    });
    peek.addEventListener("click", () => {
      const go = () => {
        hidden = false;
        store.set("localStorage", "pkc-tikku-hidden", "0");
        applyHidden(true);
        btn.focus({ preventScroll: true });
        setTimeout(() => say("I’m back! Tap me any time."), 500);
      };
      if (motion) gsap.to(peek, { scale: 0, rotation: 90, duration: 0.3, ease: "back.in(2)", onComplete: go });
      else go();
    });
    applyHidden(false);

    /* --- Sleep and wake --- */
    function wake() {
      lastInput = Date.now();
      if (!sleeping) return;
      sleeping = false;
      setMood("happy");
      zzzTween?.kill();
      if (motion) {
        gsap.to(parts.zzz, { autoAlpha: 0, duration: 0.2 });
        jump();
      }
    }
    const sleep = () => {
      if (sleeping || open || hidden) return;
      sleeping = true;
      hideBubble();
      setMood("sleep");
      if (motion) zzzTween = gsap.fromTo(parts.zzz, { y: 6, autoAlpha: 0 }, { y: -10, autoAlpha: 1, duration: 1.2, stagger: 0.4, repeat: -1, ease: "sine.out" });
    };
    ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach((t) => window.addEventListener(t, wake, { passive: true }));
    setInterval(() => Date.now() - lastInput > 22000 && sleep(), 2000);

    /* --- Cheer when something gets ticked --- */
    const cheers = ["Nice, one less thing to look for.", "Ticked!", "Good. Keep going.", "That’s the spirit."];
    tikkuApi.cheer = (text) => {
      if (motion && !hidden) {
        jump(true);
        gsap.fromTo(parts.armL, { rotation: 0 }, { rotation: 40, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" });
      }
      say(text || cheers[Math.floor(Math.random() * cheers.length)], 2200);
    };

    /* --- Lines for each section, said once when it comes into view --- */
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting || seen.has(en.target)) return;
        seen.add(en.target);
        const text = en.target.dataset.tikkuSay;
        const isHero = en.target.matches("[data-hero], [data-phero]");
        setTimeout(() => say(text), isHero ? 2200 : 250);
      });
    }, { threshold: 0.35 });
    $$("[data-tikku-say]").forEach((s) => io.observe(s));

    if (!motion) return;

    /* --- Personality --- */
    function jump(big = false) {
      gsap.timeline()
        .to(body, { y: big ? -26 : -16, scaleY: 1.06, scaleX: 0.95, duration: 0.2, ease: "power2.out" })
        .to(body, { y: 0, scaleY: 1, scaleX: 1, duration: 0.6, ease: "bounce.out" });
      if (big) gsap.fromTo(parts.all, { rotation: 0 }, { rotation: 360, svgOrigin: "60 76", duration: 0.7, ease: "power2.inOut" });
    }
    const wave = () =>
      gsap.timeline()
        .to(parts.armR, { rotation: -30, duration: 0.15, ease: "power2.out" })
        .to(parts.armR, { rotation: 18, duration: 0.15, repeat: 3, yoyo: true, ease: "sine.inOut" })
        .to(parts.armR, { rotation: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" });

    gsap.to(parts.all, { y: -4, duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(parts.shadow, { scaleX: 0.82, transformOrigin: "50% 50%", duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
    (function blinkLoop() {
      gsap.delayedCall(gsap.utils.random(2, 5), () => {
        if (!sleeping) gsap.to(parts.eyes, { scaleY: 0.1, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut" });
        blinkLoop();
      });
    })();
    (function antennaLoop() {
      gsap.delayedCall(gsap.utils.random(4, 8), () => {
        if (!sleeping) gsap.fromTo(parts.antenna, { rotation: 0 }, { keyframes: [{ rotation: -14 }, { rotation: 10 }, { rotation: 0 }], duration: 0.8, ease: "sine.inOut" });
        antennaLoop();
      });
    })();

    // Eyes follow the pointer (or the last touch, or the phone's tilt)
    const pupilTo = parts.pupils.map((p) => ({ x: gsap.quickTo(p, "x", { duration: 0.35, ease: "power3" }), y: gsap.quickTo(p, "y", { duration: 0.35, ease: "power3" }) }));
    const look = (cx, cy) => {
      const r = btn.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2);
      const dy = cy - (r.top + r.height * 0.48);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 160) * 3.8;
      pupilTo.forEach((q) => { q.x((dx / d) * k); q.y((dy / d) * k); });
    };
    tikkuApi.lookDir = (nx, ny) => pupilTo.forEach((q) => { q.x(nx * 7); q.y(ny * 7); });
    window.addEventListener("pointermove", (e) => look(e.clientX, e.clientY), { passive: true });
    window.addEventListener("pointerdown", (e) => look(e.clientX, e.clientY), { passive: true });
    // On touch screens, glance around now and then
    if (!fineMQ.matches) {
      (function glance() {
        gsap.delayedCall(gsap.utils.random(2.5, 5), () => {
          if (!sleeping && Date.now() - lastInput > 2000) tikkuApi.lookDir(gsap.utils.random(-0.5, 0.5), gsap.utils.random(-0.4, 0.4));
          glance();
        });
      })();
    }

    // Hover: squash and wave
    btn.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || !docked) return;
      gsap.timeline()
        .to(body, { scaleY: 0.9, scaleX: 1.08, duration: 0.12, ease: "power2.out" })
        .to(body, { scaleY: 1, scaleX: 1, duration: 0.7, ease: "elastic.out(1, 0.35)" });
      wave();
    });

    // Leans into fast scrolling
    const lean = gsap.quickTo(body, "rotation", { duration: 0.6, ease: "power3" });
    let straighten = null;
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity();
        lean(gsap.utils.clamp(-16, 16, -v / 140));
        if (Math.abs(v) > 2500 && !open) setMood("oh");
        straighten?.kill();
        straighten = gsap.delayedCall(0.25, () => { lean(0); if (!sleeping) setMood("happy"); });
      },
    });

    /* --- Docking: on the home page Tikku starts large in the hero and flies to the corner --- */
    let W0 = el.offsetWidth;
    const H = (w) => (w * 140) / 120;
    const dockBox = () => {
      const cs = getComputedStyle(el);
      return { R: parseFloat(cs.right), B: parseFloat(cs.bottom) };
    };
    const ease = gsap.parseEase("power2.inOut");
    let flight = null;
    const fly = (p) => {
      const { R, B } = dockBox();
      const s = slot.getBoundingClientRect();
      const t = ease(p);
      const w = s.width + (W0 - s.width) * t;
      const boxCx = innerWidth - R - w / 2;
      const boxCy = innerHeight - B - H(w) / 2;
      const dockCx = innerWidth - R - W0 / 2;
      const dockCy = innerHeight - B - H(W0) / 2;
      const tx = s.left + s.width / 2 + (dockCx - (s.left + s.width / 2)) * t;
      const ty = s.top + s.height / 2 + (dockCy - (s.top + s.height / 2)) * t;
      gsap.set(el, { width: w, x: tx - boxCx, y: ty - boxCy });
      const nowDocked = p >= 0.999;
      if (nowDocked !== docked) {
        docked = nowDocked;
        el.classList.toggle("is-docked", docked);
        if (docked) gsap.set(el, { clearProps: "width,x,y" });
      }
    };
    if (slot && !hidden) {
      el.classList.add("in-hero");
      flight = ScrollTrigger.create({
        trigger: slot.closest("[data-hero]"),
        start: "top top",
        end: "bottom 40%",
        onUpdate: (self) => fly(self.progress),
        onRefresh: (self) => {
          gsap.set(el, { clearProps: "width,x,y" });
          W0 = el.offsetWidth;
          fly(self.progress);
        },
      });
      fly(0);
      // Drop into the hero
      gsap.from(body, { y: -innerHeight * 0.6, rotation: -30, duration: 1.3, delay: introDelay + 0.5, ease: "bounce.out", onComplete: () => wave() });
    } else {
      el.classList.add("is-docked");
      gsap.from(body, { y: 160, rotation: -25, duration: 1, delay: introDelay + 0.6, ease: "back.out(1.6)", onComplete: () => wave() });
    }

    /* --- Drag anywhere along the edges (once docked), snaps to a side --- */
    const saved = JSON.parse(store.get("sessionStorage", "pkc-tikku-pos") || "null");
    const applyPos = (pos, animate) => {
      if (!pos) return;
      const { R } = dockBox();
      const toLeft = pos.side === "left" ? -(innerWidth - W0 - 2 * R) : 0;
      const maxUp = -(innerHeight - H(W0) - 120);
      const vars = { "--dx": `${toLeft}px`, "--dy": `${Math.max(maxUp, Math.min(0, pos.dy))}px` };
      el.classList.toggle("on-left", pos.side === "left");
      if (animate) gsap.to(el, { ...vars, duration: 0.7, ease: "elastic.out(1, 0.6)" });
      else gsap.set(el, vars);
    };
    // Drag offset lives in the stylesheet (translate: var(--dx) var(--dy)) so clearProps cannot wipe it.
    applyPos(saved, false);
    window.addEventListener("resize", () => applyPos(JSON.parse(store.get("sessionStorage", "pkc-tikku-pos") || "null"), false));

    let drag = null;
    btn.addEventListener("pointerdown", (e) => {
      if (!docked || hidden) return;
      const cs = getComputedStyle(el);
      drag = { x: e.clientX, y: e.clientY, dx: parseFloat(cs.getPropertyValue("--dx")) || 0, dy: parseFloat(cs.getPropertyValue("--dy")) || 0, moved: false, id: e.pointerId };
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const mx = e.clientX - drag.x;
      const my = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(mx, my) < 8) return;
      if (!drag.moved) {
        drag.moved = true;
        el.classList.add("is-dragging");
        btn.setPointerCapture?.(drag.id);
        hideBubble();
        closePanel(false);
        setMood("oh");
      }
      gsap.set(el, { "--dx": `${drag.dx + mx}px`, "--dy": `${drag.dy + my}px` });
      gsap.to(body, { rotation: gsap.utils.clamp(-25, 25, mx * 0.08), duration: 0.3 });
    });
    const endDrag = (e) => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      if (drag.moved) {
        const r = btn.getBoundingClientRect();
        const { B } = dockBox();
        const side = r.left + r.width / 2 < innerWidth / 2 ? "left" : "right";
        const dy = r.bottom - (innerHeight - B);
        const pos = { side, dy: Math.min(0, dy) };
        store.set("sessionStorage", "pkc-tikku-pos", JSON.stringify(pos));
        applyPos(pos, true);
        el.classList.remove("is-dragging");
        gsap.to(body, { rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
        setMood("happy");
        justDragged = true;
        setTimeout(() => (justDragged = false), 60);
        say(side === "left" ? "Ooh, the left side. Nice view." : "Back on the right. Cosy.", 2000);
      }
      drag = null;
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }
})();
