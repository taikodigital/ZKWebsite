const root = document.documentElement;
const sceneShell = document.querySelector(".site-shell");
const sceneBg = document.querySelector(".scene-bg");
const buttons = Array.from(document.querySelectorAll(".language-button"));
const languageArt = Array.from(document.querySelectorAll(".language-art"));
const requiredAssets = Array.from(document.querySelectorAll("[data-required-asset]"));

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
  if (!sceneShell || !sceneBg || !sceneBg.naturalWidth || !sceneBg.naturalHeight) {
    return;
  }

  const shellRect = sceneShell.getBoundingClientRect();
  const imageRatio = sceneBg.naturalWidth / sceneBg.naturalHeight;
  const shellRatio = shellRect.width / shellRect.height;

  let contentWidth = shellRect.width;
  let contentHeight = shellRect.height;
  let contentLeft = 0;
  let contentTop = 0;

  if (shellRatio > imageRatio) {
    contentHeight = shellRect.height;
    contentWidth = contentHeight * imageRatio;
    contentLeft = (shellRect.width - contentWidth) / 2;
  } else {
    contentWidth = shellRect.width;
    contentHeight = contentWidth / imageRatio;
    contentTop = (shellRect.height - contentHeight) / 2;
  }

  sceneShell.style.setProperty("--scene-content-left", `${contentLeft}px`);
  sceneShell.style.setProperty("--scene-content-top", `${contentTop}px`);
  sceneShell.style.setProperty("--scene-content-width", `${contentWidth}px`);
  sceneShell.style.setProperty("--scene-content-height", `${contentHeight}px`);
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

if (sceneBg) {
  if (sceneBg.complete) {
    updateSceneContentBox();
  }

  sceneBg.addEventListener("load", updateSceneContentBox, { once: true });
}

window.addEventListener("resize", updateSceneContentBox);
window.addEventListener("orientationchange", updateSceneContentBox);

const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
setLanguage(requestedLanguage || localStorage.getItem("zk-website-language") || "zh");
updateSceneContentBox();
