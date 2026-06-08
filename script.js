const root = document.documentElement;
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
