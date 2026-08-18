const requiredAssets = Array.from(
  document.querySelectorAll("[data-required-asset]"),
);

requiredAssets.forEach((asset) => {
  asset.addEventListener(
    "error",
    () => {
      document.body.classList.add("has-missing-assets");
    },
    { once: true },
  );
});

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
  let initDone = false;
  const init = () => {
    if (initDone) return;
    initDone = true;
    fitHeroToImage();

    // ResizeObserver fires only after the stage size has fully settled,
    // so we never read a mid-layout size (the bug that caused the title/
    // button to lag behind the background while dragging the window).
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => fitHeroToImage());
      ro.observe(stage);
    } else {
      // Older-browser fallback: defer to the next frame so layout is final.
      let rafId = 0;
      window.addEventListener("resize", () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(fitHeroToImage);
      });
    }

    // Safety net for rotation/viewport changes that may not resize the stage
    // synchronously (re-runs are harmless and cheap).
    window.addEventListener("orientationchange", () =>
      setTimeout(fitHeroToImage, 250),
    );
  };

  if (bg.complete && bg.naturalWidth > 0) {
    init();
  } else {
    bg.addEventListener("load", init, { once: true });
  }
}
