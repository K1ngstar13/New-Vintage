// script.js — NVBL (bright Squarespace-style interactions)

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Elements
  const nav = $("#nav");
  const navLinks = $$(".nav-links a");
  const sections = navLinks
    .map(a => $(a.getAttribute("href")))
    .filter(Boolean);

  const yearEl = $("#year");
  const toast = $("#toast");

  const copyAddressBtn = $("#copyAddressBtn");
  const copyPhoneBtn = $("#copyPhoneBtn");
  const addressEl = $("#addressText");

  // Lightbox
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbClose = $("#lbClose");

  // Mosaic tiles + feature image open in lightbox
  const lightboxItems = [
    ...$$(".tile"),
    ...$$(".feature-media")
  ];

  // ====== Year ======
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ====== Toast helper ======
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // ====== Nav shadow on scroll ======
  function handleScroll() {
    if (!nav) return;
    if (window.scrollY > 6) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // ====== Smooth scroll ======
  function smoothScrollTo(hash) {
    const el = $(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  navLinks.forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      e.preventDefault();
      smoothScrollTo(href);
      history.pushState(null, "", href);
    });
  });

  // ====== Active link highlighting ======
  if ("IntersectionObserver" in window && sections.length) {
    const obs = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const id = "#" + visible.target.id;

      navLinks.forEach(a => {
        a.classList.toggle("active", a.getAttribute("href") === id);
      });
    }, {
      threshold: [0.15, 0.25, 0.35, 0.5, 0.65]
    });

    sections.forEach(sec => obs.observe(sec));
  }

  // ====== Lightbox ======
  function openLightbox(src) {
    if (!lightbox || !lbImg) return;
    lbImg.src = src;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    if (!lightbox || !lbImg) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lbImg.src = "";
  }

  // Bind all items that have data-full or background image
  lightboxItems.forEach(el => {
    // Make keyboard accessible
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Open image");

    const full = el.getAttribute("data-full");

    el.addEventListener("click", () => {
      if (full) return openLightbox(full);

      // For feature-media if no data-full: try to extract background-image URL
      const bg = window.getComputedStyle(el).backgroundImage;
      const match = bg && bg.match(/url\(["']?(.*?)["']?\)/i);
      if (match && match[1]) openLightbox(match[1]);
    });

    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
    });
  });

  if (lbClose) lbClose.addEventListener("click", closeLightbox);

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox?.classList.contains("open")) {
      closeLightbox();
    }
  });

  // ====== Copy helpers ======
  const addressText =
    (addressEl?.innerText || "3864 N Mississippi Ave, Portland, OR 97227")
      .replace(/\s+/g, " ")
      .trim();

  const phoneText = "(503) 830-2682";

  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast(`${label} copied`);
    }
  }

  if (copyAddressBtn) {
    copyAddressBtn.addEventListener("click", () => copyToClipboard(addressText, "Address"));
  }

  if (copyPhoneBtn) {
    copyPhoneBtn.addEventListener("click", () => copyToClipboard(phoneText, "Phone"));
  }
})();
