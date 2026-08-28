const root = document.documentElement;
const sceneShell = document.querySelector(".site-shell");
const sceneMeasure = document.querySelector("[data-scene-measure]");
const buttons = Array.from(document.querySelectorAll(".language-button"));
const languageArt = Array.from(document.querySelectorAll(".language-art"));
const requiredAssets = Array.from(document.querySelectorAll("[data-required-asset]"));
const hotspots = Array.from(document.querySelectorAll("[data-hotspot-art]"));

requiredAssets.forEach((asset) => {
  asset.addEventListener(
    "error",
    () => {
      document.body.classList.add("has-missing-assets");
    },
    { once: true },
  );
});

const sceneOverscan = 76;
const artFocus = {
  logo: { x: 0, y: 0 },
  soon: { x: 1.09, y: 1 },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCoverBox(containerWidth, containerHeight, imageWidth, imageHeight, options = {}) {
  const overscan = options.overscan || 0;
  const scale = Math.max(
    (containerWidth + overscan * 2) / imageWidth,
    (containerHeight + overscan * 2) / imageHeight,
  );
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const focusX = options.focusX ?? 0.5;
  const focusY = options.focusY ?? 0.5;

  return {
    left: (containerWidth - width) * focusX,
    top: (containerHeight - height) * focusY,
    width,
    height,
  };
}

function updateHotspots(shellRect, imageWidth, imageHeight) {
  hotspots.forEach((hotspot) => {
    const focus = artFocus[hotspot.dataset.hotspotArt] || { x: 0.5, y: 0.5 };
    const artBox = getCoverBox(shellRect.width, shellRect.height, imageWidth, imageHeight, {
      focusX: focus.x,
      focusY: focus.y,
    });
    const left = Number(hotspot.dataset.hotspotLeft) || 0;
    const top = Number(hotspot.dataset.hotspotTop) || 0;
    const width = Number(hotspot.dataset.hotspotWidth) || 0;
    const height = Number(hotspot.dataset.hotspotHeight) || 0;

    hotspot.style.setProperty("--scene-hotspot-left", `${artBox.left + artBox.width * left / 100}px`);
    hotspot.style.setProperty("--scene-hotspot-top", `${artBox.top + artBox.height * top / 100}px`);
    hotspot.style.setProperty("--scene-hotspot-width", `${artBox.width * width / 100}px`);
    hotspot.style.setProperty("--scene-hotspot-height", `${artBox.height * height / 100}px`);
  });
}

function setLanguage(language) {
  const nextLanguage = language === "en" ? "en" : "zh";
  root.dataset.lang = nextLanguage;
  root.lang = nextLanguage === "zh" ? "zh-CN" : "en";

  buttons.forEach((button) => {
    const isActive = button.dataset.lang === nextLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  languageArt.forEach((art) => {
    art.classList.toggle("is-active", art.dataset.lang === nextLanguage);
  });

  localStorage.setItem("zk-website-language", nextLanguage);
}

function updateSceneContentBox() {
  if (
    !sceneShell ||
    !sceneMeasure ||
    !sceneMeasure.naturalWidth ||
    !sceneMeasure.naturalHeight
  ) {
    return;
  }

  const shellRect = sceneShell.getBoundingClientRect();
  const sceneBox = getCoverBox(
    shellRect.width,
    shellRect.height,
    sceneMeasure.naturalWidth,
    sceneMeasure.naturalHeight,
    { overscan: sceneOverscan },
  );

  sceneShell.style.setProperty("--scene-content-left", `${sceneBox.left}px`);
  sceneShell.style.setProperty("--scene-content-top", `${sceneBox.top}px`);
  sceneShell.style.setProperty("--scene-content-width", `${sceneBox.width}px`);
  sceneShell.style.setProperty("--scene-content-height", `${sceneBox.height}px`);
  updateHotspots(shellRect, sceneMeasure.naturalWidth, sceneMeasure.naturalHeight);
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

if (sceneMeasure) {
  if (sceneMeasure.complete) {
    updateSceneContentBox();
  }

  sceneMeasure.addEventListener("load", updateSceneContentBox, { once: true });
}

window.addEventListener("resize", updateSceneContentBox);
window.addEventListener("orientationchange", updateSceneContentBox);

const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
setLanguage(requestedLanguage || localStorage.getItem("zk-website-language") || "zh");
updateSceneContentBox();