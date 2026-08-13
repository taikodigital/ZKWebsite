const root = document.documentElement;
const buttons = Array.from(document.querySelectorAll(".language-button"));
const requiredAssets = Array.from(
  document.querySelectorAll("[data-required-asset]"),
);

function setLanguage(language) {
  const nextLanguage = language === "en" ? "en" : "zh";
  root.dataset.lang = nextLanguage;
  root.lang = nextLanguage === "zh" ? "zh-CN" : "en";

  buttons.forEach((button) => {
    const isActive = button.dataset.lang === nextLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  localStorage.setItem("zk-website-language", nextLanguage);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.lang);
  });
});

requiredAssets.forEach((asset) => {
  asset.addEventListener(
    "error",
    () => {
      document.body.classList.add("has-missing-assets");
    },
    { once: true },
  );
});

const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
setLanguage(requestedLanguage || localStorage.getItem("zk-website-language") || "zh");

/* ---------- Uniform scaling ----------
   The hero layer is designed at a fixed base width (BASE_W = 390px, phone
   size). The background image is displayed with object-fit: contain inside
   the stage. We compute the exact rectangle the image occupies, then scale
   the whole hero layer by (image width / BASE_W) so the title, button and
   text all grow together in proportion — never just the text alone. */

const stage = document.querySelector(".site-shell");
const hero = document.querySelector(".hero-content");
const bg = document.querySelector(".scene-bg");
const BASE_W = 390;

function fitHeroToImage() {
  if (!stage || !hero || !bg) return;
  const cw = stage.clientWidth;
  const ch = stage.clientHeight;
  if (!cw || !ch) return;

  const iw = bg.naturalWidth || 1080;
  const ih = bg.naturalHeight || 2400;
  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const x = (cw - dw) / 2;
  const y = (ch - dh) / 2;

  const uniform = dw / BASE_W;

  hero.style.left = `${x}px`;
  hero.style.top = `${y}px`;
  hero.style.width = `${BASE_W}px`;
  hero.style.height = `${(BASE_W * ih) / iw}px`;
  hero.style.transform = `scale(${uniform})`;
  hero.style.transformOrigin = "top left";
}

if (bg && hero && stage) {
  if (bg.complete && bg.naturalWidth > 0) {
    fitHeroToImage();
  } else {
    bg.addEventListener("load", fitHeroToImage, { once: true });
  }
  window.addEventListener("resize", fitHeroToImage);
  window.addEventListener("orientationchange", fitHeroToImage);
}
