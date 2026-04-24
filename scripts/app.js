/* ============================================================
   AmazePages — app.js
   Handles:
   - Start button scroll
   - Vibe filter selection
   - Sticky shrink animation
   - Template rendering
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // DOM ELEMENTS
  // ===============================
  const vibeButtons = document.querySelectorAll(".vibe-btn");
  const startBtn = document.getElementById("startBtn");
  const templatesGrid = document.getElementById("templatesGrid");
  const vibeSection = document.querySelector(".choose-vibe");

  console.log("Buttons found:", vibeButtons.length); // 🔍 debug

// ===============================
// TEMPLATE DATA
// ===============================
const templates = {
  family: [
    "templates/family/home-happiness/index.html",
    "templates/family/always-together/index.html",
    "templates/family/warm-bonds/index.html",
    "templates/family/cherished-times/index.html",
    "templates/family/joyful-times/index.html"
  ],

  romantic: [
    "templates/romantic/blush-love/index.html",
    "templates/romantic/candlelight-moments/index.html",
    "templates/romantic/forever-yours/index.html",
    "templates/romantic/golden-love/index.html",
    "templates/romantic/sweet-affection/index.html"
  ],

  casual: [
    "templates/casual/easy-breezy/index.html",
    "templates/casual/everyday-joy/index.html",
    "templates/casual/simple-delight/index.html",
    "templates/casual/soft-vibes/index.html",
    "templates/casual/sunny-smiles/index.html"
  ],

  traditional: [
    "templates/traditional/cultural-festive/index.html",
    "templates/traditional/golden-mandala/index.html",
    "templates/traditional/royal-aura/index.html",
    "templates/traditional/sacred-simplicity/index.html",
    "templates/traditional/vintage-glory/index.html"
  ],

  fun: [
    "templates/fun/color-carnival/index.html",
    "templates/fun/crazy-confetti/index.html",
    "templates/fun/electric-energy/index.html",
    "templates/fun/laugh-riot/index.html",
    "templates/fun/party-pop/index.html"
  ]
};

// ===============================
  // TEMPLATE DATA
  // ===============================
  const templates = { ... }; // keep same

  function showTemplates(vibe) {
    templatesGrid.innerHTML = "";

    const templatesSection = document.getElementById("templates-section");
    templatesSection.classList.remove("hidden");

    if (!templates[vibe]) return;

    templates[vibe].forEach((templatePath) => {
      const name = templatePath.split("/")[2].replace(/-/g, " ");

      const btn = document.createElement("button");
      btn.classList.add("template-btn");
      btn.innerText = name;

      btn.addEventListener("click", () => {
        window.location.href = `preview.html?template=${encodeURIComponent(templatePath)}`;
      });

      templatesGrid.appendChild(btn);
    });
  }

  startBtn.addEventListener("click", () => {
    vibeSection.scrollIntoView({ behavior: "smooth" });
  });

  window.addEventListener("scroll", () => {
    if (window.scrollY > 120) {
      vibeSection.classList.add("shrunk");
    } else {
      vibeSection.classList.remove("shrunk");
    }
  });

  showTemplates("casual");

  vibeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      console.log("Clicked:", btn.dataset.vibe); // 🔍 debug
      const vibe = btn.dataset.vibe;
      showTemplates(vibe);
    });
  });

});