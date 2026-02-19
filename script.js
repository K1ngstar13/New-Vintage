// script.js — Modern Vintage interactions for NVBL

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
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbClose = $("#lbClose");
  const galleryItems = $$(".g");

  const toast = $("#toast");
  const copyAddressBtn = $("#copyAddressBtn");
  const copyPhoneBtn = $("#copyPhoneBtn");
  const addressText = $("#addressText")?.innerText?.replace(/\s+/g, " ").trim() ||
    "3864 N Mississippi Ave, Portland, OR 97227";
  const phoneText = "(503) 830-2682";

  const statusDot = $("#statusDot");
  const statusText = $("#statusText");

  const carousel = $("#reviewCarousel");
  const prevReview = $("#prevReview");
  const nextReview = $("#nextReview");

  // Year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Toast helper
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // Smooth scroll
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

  // Nav shadow on scroll
  function handleScroll() {
    if (!nav) return;
    if (window.scrollY > 6) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // Active section highlight (IntersectionObserver)
  if ("IntersectionObserver" in window && sections.length) {
    const obs = new IntersectionObserver((entries) => {
      // Pick the most visible entry
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const id = "#" + visible.target.id;
      navLinks.forEach(a => {
        const href = a.getAttribute("href");
        a.classList.toggle("active", href === id);
      });
    }, {
      root: null,
      threshold: [0.15, 0.25, 0.35, 0.5, 0.65]
    });

    sections.forEach(sec => obs.observe(sec));
  }

  // Lightbox
  function openLB(src) {
    if (!lightbox || !lbImg) return;
    lbImg.src = src;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  }
  function closeLB() {
    if (!lightbox || !lbImg) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lbImg.src = "";
  }

  galleryItems.forEach(el => {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Open photo");

    el.addEventListener("click", () => openLB(el.dataset.full));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openLB(el.dataset.full);
    });
  });

  if (lbClose) lbClose.addEventListener("click", closeLB);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLB();
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox?.classList.contains("open")) closeLB();
  });

  // Copy helpers
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
    copyAddressBtn.addEventListener("click", () => {
      copyToClipboard(addressText, "Address");
    });
  }
  if (copyPhoneBtn) {
    copyPhoneBtn.addEventListener("click", () => {
      copyToClipboard(phoneText, "Phone");
    });
  }

  // Open/Closed status based on posted hours
  // Posted hours:
  // Mon: Closed
  // Tue: Closed
  // Wed-Sun: 10:00 - 19:00
  function getLocalNow() {
    return new Date();
  }

  function isOpenNow(date) {
    const day = date.getDay(); // 0 Sun ... 6 Sat
    // Closed Mon(1), Tue(2)
    if (day === 1 || day === 2) return { open: false, next: nextOpenDate(date) };

    const openMin = 10 * 60;  // 10:00
    const closeMin = 19 * 60; // 19:00
    const mins = date.getHours() * 60 + date.getMinutes();
    const open = mins >= openMin && mins < closeMin;
    return { open, next: open ? null : nextOpenDate(date) };
  }

  function nextOpenDate(fromDate) {
    // Find next day that is Wed-Sun, and time 10:00
    const d = new Date(fromDate);
    d.setSeconds(0, 0);

    for (let i = 0; i < 8; i++) {
      d.setDate(fromDate.getDate() + i);
      const day = d.getDay();
      const isOpenDay = !(day === 1 || day === 2); // not Mon/Tue
      if (isOpenDay) {
        d.setHours(10, 0, 0, 0);
        // If it's today, only return if future time
        if (i === 0 && d <= fromDate) continue;
        return d;
      }
    }
    return null;
  }

  function formatNextOpen(d) {
    if (!d) return "";
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const dayName = days[d.getDay()];
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hr12 = ((hours + 11) % 12) + 1;
    return `${dayName} ${hr12}:${mins} ${ampm}`;
  }

  function updateOpenStatus() {
    if (!statusDot || !statusText) return;

    const now = getLocalNow();
    const { open, next } = isOpenNow(now);

    if (open) {
      statusDot.classList.add("open");
      statusDot.classList.remove("closed");
      statusText.textContent = "Open now • until 7:00 PM";
    } else {
      statusDot.classList.remove("open");
      statusDot.classList.add("closed");
      const nextStr = formatNextOpen(next);
      statusText.textContent = nextStr ? `Closed • opens ${nextStr}` : "Closed";
    }
  }
  updateOpenStatus();
  // refresh every minute
  setInterval(updateOpenStatus, 60 * 1000);

  // Reviews carousel buttons
  function scrollCarousel(dir) {
    if (!carousel) return;
    const card = carousel.querySelector(".review");
    const step = card ? (card.getBoundingClientRect().width + 12) : 340;
    carousel.scrollBy({ left: dir * step, behavior: "smooth" });
  }
  if (prevReview) prevReview.addEventListener("click", () => scrollCarousel(-1));
  if (nextReview) nextReview.addEventListener("click", () => scrollCarousel(1));
})();
