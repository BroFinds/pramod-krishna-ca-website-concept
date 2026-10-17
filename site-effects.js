const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const progressBar = document.querySelector(".reading-progress");
const revealTargets = document.querySelectorAll(
  ".intro-section, .services-preview, .approach-band, .insights-preview, .page-hero, .about-statement, .principles-section, .partner-section, .service-index-section, .service-detail, .service-cta, .insights-empty-page, .editorial-note, .contact-details-section, .contact-form-note, .launch-review"
);
let revealObserver;

if (!motionPreference.matches && "IntersectionObserver" in window) {
  document.documentElement.classList.add("motion-ready");

  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  for (const target of revealTargets) {
    target.dataset.reveal = "";
    revealObserver.observe(target);
  }
}

const folio = document.querySelector(".hero-visual");
const folioStack = folio?.querySelector(".folio-stack");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const mobileMenus = document.querySelectorAll(".mobile-nav");

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  const openMenu = [...mobileMenus].find((menu) => menu.open);
  if (openMenu) {
    openMenu.open = false;
    openMenu.querySelector("summary").focus();
  }
});

document.addEventListener("click", (event) => {
  for (const menu of mobileMenus) {
    if (menu.open && !menu.contains(event.target)) {
      menu.open = false;
    }
  }
});

if (progressBar) {
  let progressFrame = 0;

  const updateProgress = () => {
    progressFrame = 0;
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    progressBar.style.setProperty("--reading-progress", Math.min(1, Math.max(0, progress)).toFixed(4));
  };

  const scheduleProgress = () => {
    if (!progressFrame) {
      progressFrame = window.requestAnimationFrame(updateProgress);
    }
  };

  window.addEventListener("scroll", scheduleProgress, { passive: true });
  window.addEventListener("resize", scheduleProgress, { passive: true });
  updateProgress();
}

if (folio && folioStack && !motionPreference.matches) {
  if (finePointer.matches) {
    folio.addEventListener("pointermove", (event) => {
      if (motionPreference.matches) {
        return;
      }

      const bounds = folio.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      folioStack.style.setProperty("--pointer-tilt-x", `${(x * 7).toFixed(2)}deg`);
      folioStack.style.setProperty("--pointer-tilt-y", `${(y * -5).toFixed(2)}deg`);
      folioStack.style.setProperty("--depth-x", `${(x * 0.45).toFixed(3)}rem`);
      folioStack.style.setProperty("--depth-y", `${(y * 0.35).toFixed(3)}rem`);
      folioStack.style.setProperty("--depth-middle-x", `${(x * 0.25).toFixed(3)}rem`);
      folioStack.style.setProperty("--depth-middle-y", `${(y * 0.19).toFixed(3)}rem`);
      folioStack.style.setProperty("--light-x", `${((x + 0.5) * 100).toFixed(1)}%`);
      folioStack.style.setProperty("--light-y", `${((y + 0.5) * 100).toFixed(1)}%`);
    });

    folio.addEventListener("pointerleave", () => {
      folioStack.style.removeProperty("--pointer-tilt-x");
      folioStack.style.removeProperty("--pointer-tilt-y");
      folioStack.style.removeProperty("--depth-x");
      folioStack.style.removeProperty("--depth-y");
      folioStack.style.removeProperty("--depth-middle-x");
      folioStack.style.removeProperty("--depth-middle-y");
      folioStack.style.removeProperty("--light-x");
      folioStack.style.removeProperty("--light-y");
    });
  }

  let pressTimeout;

  folio.addEventListener("pointerdown", (event) => {
    if (!motionPreference.matches && (event.pointerType === "touch" || !finePointer.matches)) {
      window.clearTimeout(pressTimeout);
      folio.classList.add("is-pressed");
    }
  });

  for (const eventName of ["pointerup", "pointercancel", "pointerleave"]) {
    folio.addEventListener(eventName, () => {
      pressTimeout = window.setTimeout(() => {
        folio.classList.remove("is-pressed");
      }, 420);
    });
  }
}

motionPreference.addEventListener("change", (event) => {
  if (!event.matches) {
    return;
  }

  revealObserver?.disconnect();
  document.documentElement.classList.remove("motion-ready");
  for (const target of revealTargets) {
    target.classList.add("is-visible");
  }

  folio?.classList.remove("is-pressed");
  folioStack?.style.removeProperty("--pointer-tilt-x");
  folioStack?.style.removeProperty("--pointer-tilt-y");
  folioStack?.style.removeProperty("--depth-x");
  folioStack?.style.removeProperty("--depth-y");
  folioStack?.style.removeProperty("--depth-middle-x");
  folioStack?.style.removeProperty("--depth-middle-y");
  folioStack?.style.removeProperty("--light-x");
  folioStack?.style.removeProperty("--light-y");
});
