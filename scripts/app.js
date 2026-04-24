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
    "templates/home-happiness/index.html",
    "templates/always-together/index.html",
    "templates/warm-bonds/index.html",
    "templates/cherished-times/index.html",
    "templates/joyful-times/index.html"
  ],

  romantic: [
    "templates/blush-love/index.html",
    "templates/candlelight-moments/index.html",
    "templates/forever-yours/index.html",
    "templates/golden-love/index.html",
    "templates/sweet-affection/index.html"
  ],

  casual: [
    "templates/easy-breezy/index.html",
    "templates/everyday-joy/index.html",
    "templates/simple-delight/index.html",
    "templates/soft-vibes/index.html",
    "templates/sunny-smiles/index.html"
  ],

  traditional: [
    "templates/cultural-festive/index.html",
    "templates/golden-mandala/index.html",
    "templates/royal-aura/index.html",
    "templates/sacred-simplicity/index.html",
    "templates/vintage-glory/index.html"
  ],

  fun: [
    "templates/color-carnival/index.html",
    "templates/crazy-confetti/index.html",
    "templates/electric-energy/index.html",
    "templates/laugh-riot/index.html",
    "templates/party-pop/index.html"
  ]
};

// ===============================
  // TEMPLATE DATA
  // ===============================
 
function showTemplates(vibe) {
  templatesGrid.innerHTML = "";

  const templatesSection = document.getElementById("templates-section");

  // show section
  templatesSection.style.display = "block";
  templatesSection.classList.remove("hidden");

  if (!templates[vibe]) return;

  templates[vibe].forEach((templatePath) => {
    const name = templatePath.split("/")[2].replace(/-/g, " ");

    const btn = document.createElement("button");
    btn.classList.add("vibe-btn"); // same style
    btn.innerText = name;

    btn.addEventListener("click", () => {
      window.location.href = `preview.html?template=${encodeURIComponent(templatePath)}`;
    });

    templatesGrid.appendChild(btn);
  });

  // ✅ ADD THIS (scroll effect)
  templatesSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
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

  

  vibeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      console.log("Clicked:", btn.dataset.vibe); // 🔍 debug
      const vibe = btn.dataset.vibe;
      showTemplates(vibe);
    });
  });

});