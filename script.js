const root = document.documentElement;
const sceneShell = document.querySelector(".site-shell");
const sceneMeasure = document.querySelector("[data-scene-measure]");
const languageArt = Array.from(document.querySelectorAll(".language-art"));
const requiredAssets = Array.from(document.querySelectorAll("[data-required-asset]"));
const hotspots = Array.from(document.querySelectorAll("[data-hotspot-art]"));
const trailerButton = document.querySelector(".watchTrailer-button");
const trailerDialog = document.querySelector(".trailer-dialog");
const trailerVideo = document.querySelector(".trailer-video");
const trailerCloseButton = document.querySelector(".trailer-dialog-close");

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

function closeTrailer() {
  trailerVideo.pause();
  trailerVideo.currentTime = 0;
  trailerDialog.close();
}

trailerButton.addEventListener("click", (event) => {
  event.preventDefault();
  trailerDialog.showModal();
  trailerVideo.currentTime = 0;
  trailerVideo.play().catch(() => {});
});

trailerCloseButton.addEventListener("click", closeTrailer);
trailerDialog.addEventListener("click", (event) => {
  if (event.target === trailerDialog) {
    closeTrailer();
  }
});

updateSceneContentBox();