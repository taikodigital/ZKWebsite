const root = document.documentElement;
const sceneShell = document.querySelector(".site-shell");
const sceneStage = document.querySelector("[data-scene-stage]");
const sceneMeasure = document.querySelector("[data-scene-measure]");
const floatingLayers = Array.from(document.querySelectorAll("[data-depth]"));
const buttons = Array.from(document.querySelectorAll(".language-button"));
const languageArt = Array.from(document.querySelectorAll(".language-art"));
const requiredAssets = Array.from(document.querySelectorAll("[data-required-asset]"));
const hotspots = Array.from(document.querySelectorAll("[data-hotspot-art]"));

const dragState = {
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  startTargetX: 0,
  startTargetY: 0,
  targetX: 0,
  targetY: 0,
  currentX: 0,
  currentY: 0,
  frame: 0,
};

const sceneMaxVerticalCrop = 32;
const sceneMaxVerticalCropRatio = 0.04;
const maxDrag = 80;
const dragScale = 0.36;
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

function getSceneContentBox(containerWidth, containerHeight, imageWidth, imageHeight) {
  const containScale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
  const widthFitScale = containerWidth / imageWidth;
  const verticalCropAllowance = Math.min(
    sceneMaxVerticalCrop,
    containerHeight * sceneMaxVerticalCropRatio,
  );
  const verticalCropLimitScale = (containerHeight + verticalCropAllowance * 2) / imageHeight;
  const scale = Math.max(containScale, Math.min(widthFitScale, verticalCropLimitScale));
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
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
  const sceneBox = getSceneContentBox(
    shellRect.width,
    shellRect.height,
    sceneMeasure.naturalWidth,
    sceneMeasure.naturalHeight,
  );

  sceneShell.style.setProperty("--scene-content-left", `${sceneBox.left}px`);
  sceneShell.style.setProperty("--scene-content-top", `${sceneBox.top}px`);
  sceneShell.style.setProperty("--scene-content-width", `${sceneBox.width}px`);
  sceneShell.style.setProperty("--scene-content-height", `${sceneBox.height}px`);
  updateHotspots(shellRect, sceneMeasure.naturalWidth, sceneMeasure.naturalHeight);
}

function applyLayerMotion() {
  floatingLayers.forEach((layer) => {
    const depth = Number(layer.dataset.depth) || 0;
    layer.style.setProperty("--parallax-x", `${dragState.currentX * depth}px`);
    layer.style.setProperty("--parallax-y", `${dragState.currentY * depth}px`);
  });
}

function animateLayerMotion() {
  if (!dragState.active) {
    dragState.targetX *= 0.86;
    dragState.targetY *= 0.86;
  }

  dragState.currentX += (dragState.targetX - dragState.currentX) * 0.18;
  dragState.currentY += (dragState.targetY - dragState.currentY) * 0.18;
  applyLayerMotion();

  const stillMoving =
    dragState.active ||
    Math.abs(dragState.targetX) > 0.08 ||
    Math.abs(dragState.targetY) > 0.08 ||
    Math.abs(dragState.currentX) > 0.08 ||
    Math.abs(dragState.currentY) > 0.08;

  if (stillMoving) {
    dragState.frame = requestAnimationFrame(animateLayerMotion);
    return;
  }

  dragState.targetX = 0;
  dragState.targetY = 0;
  dragState.currentX = 0;
  dragState.currentY = 0;
  dragState.frame = 0;
  applyLayerMotion();
}

function requestLayerMotionFrame() {
  if (!dragState.frame) {
    dragState.frame = requestAnimationFrame(animateLayerMotion);
  }
}

function beginSceneDrag(event) {
  if (!sceneStage || (event.pointerType === "mouse" && event.button !== 0)) {
    return;
  }

  dragState.active = true;
  dragState.pointerId = event.pointerId;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.startTargetX = dragState.targetX;
  dragState.startTargetY = dragState.targetY;
  sceneStage.classList.add("is-dragging");
  sceneStage.setPointerCapture(event.pointerId);
  event.preventDefault();
  requestLayerMotionFrame();
}

function moveSceneDrag(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) {
    return;
  }

  dragState.targetX = clamp(
    dragState.startTargetX + (event.clientX - dragState.startX) * dragScale,
    -maxDrag,
    maxDrag,
  );
  dragState.targetY = clamp(
    dragState.startTargetY + (event.clientY - dragState.startY) * dragScale,
    -maxDrag,
    maxDrag,
  );
  dragState.currentX = dragState.targetX;
  dragState.currentY = dragState.targetY;
  applyLayerMotion();
  event.preventDefault();
  requestLayerMotionFrame();
}

function endSceneDrag(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) {
    return;
  }

  dragState.active = false;
  dragState.pointerId = null;
  dragState.targetX = 0;
  dragState.targetY = 0;
  sceneStage.classList.remove("is-dragging");

  if (sceneStage.hasPointerCapture(event.pointerId)) {
    sceneStage.releasePointerCapture(event.pointerId);
  }

  requestLayerMotionFrame();
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

if (sceneStage) {
  sceneStage.addEventListener("pointerdown", beginSceneDrag);
  window.addEventListener("pointermove", moveSceneDrag);
  window.addEventListener("pointerup", endSceneDrag);
  window.addEventListener("pointercancel", endSceneDrag);
  sceneStage.addEventListener("lostpointercapture", () => {
    dragState.active = false;
    dragState.pointerId = null;
    dragState.targetX = 0;
    dragState.targetY = 0;
    sceneStage.classList.remove("is-dragging");
    requestLayerMotionFrame();
  });
}

window.addEventListener("resize", updateSceneContentBox);
window.addEventListener("orientationchange", updateSceneContentBox);

const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
setLanguage(requestedLanguage || localStorage.getItem("zk-website-language") || "zh");
updateSceneContentBox();
applyLayerMotion();
