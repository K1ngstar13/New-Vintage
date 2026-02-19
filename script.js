// script.js — NVBL Modern (Squarespace-style) + image fix + lightbox + smooth scroll

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const nav = $("#nav");
  const navLinks = $$(".links a");
  const sections = navLinks.map(a => $(a.getAttribute("href"))).filter(Boolean);

  const toast = $("#toast");
  const yearEl = $("#year");

  const copyAddressBtn = $("#copyAddressBtn");
  const copyPhoneBtn = $("#copyPhoneBtn");
  const addressEl = $("#addressText");
  const phoneText = "(503) 830-2682";

  // Lightbox
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbClose = $("#lbClose");

  // Clickable image containers
  const clickable = [
    ...$$(".g"),
    ...$$(".photo"),
  ];

  // 1) Year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // 2) Toast
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // 3) Nav shadow
  function handleScroll() {
    if (!nav) return;
    if (window.scrollY > 6) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // 4) Smooth scroll
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

  // 5) Active section highlighting
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
    }, { threshold: [0.15, 0.25, 0.35, 0.5, 0.65] });

    sections.forEach(sec => obs.observe(sec));
  }

  // 6) Lightbox open/close
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
  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox?.classList.contains("open")) closeLightbox();
  });

  clickable.forEach(el => {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");

    el.addEventListener("click", () => {
      // Priority: data-full
      const full = el.getAttribute("data-full");
      if (full) return openLightbox(full);

      // Otherwise open the first image inside it
      const img = el.querySelector("img");
      if (img?.src) openLightbox(img.src);
    });

    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
    });
  });

  // 7) Copy helpers
  const addressText =
    (addressEl?.innerText || "3864 N Mississippi Ave, Portland, OR 97227")
      .replace(/\s+/g, " ")
      .trim();

  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`);
    } catch {
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

  if (copyAddressBtn) copyAddressBtn.addEventListener("click", () => copyToClipboard(addressText, "Address"));
  if (copyPhoneBtn) copyPhoneBtn.addEventListener("click", () => copyToClipboard(phoneText, "Phone"));

  // 8) FIX IMAGES: if any path is wrong, swap to a nice placeholder automatically
  // This prevents "broken image icons" from ruining the layout.
  const placeholderSVG = (label = "NVBL") => {
    const bg = encodeURIComponent(`#f6f7f7`);
    const stroke = encodeURIComponent(`rgba(15,18,20,.14)`);
    const text = encodeURIComponent(`#5b6470`);
    const accent = encodeURIComponent(`#1f8f5f`);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0" stop-color="${bg}"/>
            <stop offset="1" stop-color="#ffffff"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#g)"/>
        <rect x="60" y="60" width="1080" height="680" rx="48" fill="#ffffff" stroke="${stroke}" stroke-width="4"/>
        <circle cx="140" cy="140" r="18" fill="${accent}"/>
        <text x="190" y="155" font-family="Inter, Arial" font-size="34" fill="${text}">Image not found</text>
        <text x="190" y="215" font-family="Fraunces, Georgia" font-size="54" fill="#0f1214">${label}</text>
        <text x="190" y="275" font-family="Inter, Arial" font-size="28" fill="${text}">Check your /images filenames & paths</text>
      </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const imgs = $$("img");
  imgs.forEach(img => {
    img.addEventListener("error", () => {
      // Swap broken images to a clean placeholder
      img.src = placeholderSVG("New Vintage Beauty Lounge");
      img.alt = "Placeholder image (original file missing)";
      img.style.objectFit = "cover";
    }, { once: true });
  });
})();
