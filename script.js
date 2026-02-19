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

  // Clickable images
  const clickable = $$(".g");

  // Booking
  const form = $("#bookingForm");
  const saveDraftBtn = $("#saveDraftBtn");
  const clearDraftBtn = $("#clearDraftBtn");

  // Year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Toast
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // Nav shadow
  function handleScroll() {
    if (!nav) return;
    if (window.scrollY > 6) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

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

  // Active link highlight
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

  // Lightbox
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
      const full = el.getAttribute("data-full");
      if (full) return openLightbox(full);
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

  // Copy helpers
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

  // Booking Draft (localStorage)
  const DRAFT_KEY = "nvbl_booking_draft_v1";

  function getFormData() {
    const data = {
      name: $("#name")?.value?.trim() || "",
      phone: $("#phone")?.value?.trim() || "",
      email: $("#email")?.value?.trim() || "",
      service: $("#service")?.value || "",
      date: $("#date")?.value || "",
      time: $("#time")?.value || "",
      notes: $("#notes")?.value?.trim() || ""
    };
    return data;
  }

  function setFormData(data) {
    if (!data) return;
    if ($("#name")) $("#name").value = data.name || "";
    if ($("#phone")) $("#phone").value = data.phone || "";
    if ($("#email")) $("#email").value = data.email || "";
    if ($("#service")) $("#service").value = data.service || "";
    if ($("#date")) $("#date").value = data.date || "";
    if ($("#time")) $("#time").value = data.time || "";
    if ($("#notes")) $("#notes").value = data.notes || "";
  }

  function saveDraft() {
    const data = getFormData();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    showToast("Draft saved");
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setFormData({ name:"", phone:"", email:"", service:"", date:"", time:"", notes:"" });
    showToast("Draft cleared");
  }

  // Load existing draft
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) setFormData(JSON.parse(saved));
  } catch {}

  if (saveDraftBtn) saveDraftBtn.addEventListener("click", saveDraft);
  if (clearDraftBtn) clearDraftBtn.addEventListener("click", clearDraft);

  // Booking submit -> opens email with prefilled request
  // NOTE: Replace BOOKING_EMAIL if you want requests sent to a specific inbox.
  const BOOKING_EMAIL = ""; // e.g. "appointments@nvbl.co" (leave blank to just save + show message)

  function buildMessage(d) {
    const preferred = [d.date || "—", d.time || "—"].join(" @ ");
    return (
`Booking Request — New Vintage Beauty Lounge

Name: ${d.name}
Phone: ${d.phone}
Email: ${d.email}
Service: ${d.service}
Preferred: ${preferred}

Notes:
${d.notes || "—"}

Location:
3864 N Mississippi Ave, Portland, OR 97227
Phone: (503) 830-2682
`);
  }

  function mailtoLink(to, subject, body) {
    const s = encodeURIComponent(subject);
    const b = encodeURIComponent(body);
    return `mailto:${to}?subject=${s}&body=${b}`;
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const d = getFormData();
      if (!d.name || !d.phone || !d.email || !d.service) {
        showToast("Please complete required fields");
        return;
      }

      saveDraft();

      const subject = `Appointment Request — ${d.name} (${d.service})`;
      const body = buildMessage(d);

      if (BOOKING_EMAIL) {
        window.location.href = mailtoLink(BOOKING_EMAIL, subject, body);
        showToast("Opening your email app…");
      } else {
        // If you don’t have a booking email yet, still give the user a clean result
        showToast("Request prepared. Add BOOKING_EMAIL in script.js to enable 1-click email.");
        // Optional: copy message to clipboard for manual pasting
        navigator.clipboard?.writeText(body).then(() => {
          showToast("Request copied to clipboard");
        }).catch(() => {});
      }
    });
  }
})();
