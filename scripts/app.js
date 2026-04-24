/* ============================================================
   AmazePages — app.js
   Handles:
   - Start button scroll
   - Vibe filter selection
   - Sticky shrink animation
   - Template rendering
   ============================================================ */

// ===============================
// DOM ELEMENTS
// ===============================
const vibeButtons = document.querySelectorAll(".vibe-btn");
const startBtn = document.getElementById("startBtn");
const templatesGrid = document.getElementById("templatesGrid");
const vibeSection = document.querySelector(".choose-vibe");

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
// RENDER FUNCTION
// ===============================
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

    // ✅ REDIRECT ON CLICK
    btn.addEventListener("click", () => {
      window.location.href = `preview.html?template=${templatePath}`;
    });

    templatesGrid.appendChild(btn);
  });
}

// ===============================
// START BUTTON
// ===============================
startBtn.addEventListener("click", () => {
  vibeSection.scrollIntoView({ behavior: "smooth" });
});

// ===============================
// SCROLL EFFECT
// ===============================
window.addEventListener("scroll", () => {
  if (window.scrollY > 120) {
    vibeSection.classList.add("shrunk");
  } else {
    vibeSection.classList.remove("shrunk");
  }
});

// ===============================
// DEFAULT LOAD
// ===============================
showTemplates("casual");

// ===============================
// VIBE BUTTON CLICK
// ===============================
vibeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const vibe = btn.dataset.vibe;
    showTemplates(vibe);
  });
});



// =====================================
// ✅ SAVE TEMPLATE + REDIRECT FUNCTION
// =====================================


function updatePreview(template) {
  const frame = document.getElementById("previewFrame");

  if (frame) {
    frame.src = `/demo/${template.id}/index.html`;
  }
}


function showPreview(template) {

  const previewSection = document.getElementById("preview-section");
  const frame = document.getElementById("previewFrame");
  const title = document.getElementById("previewTitle");

  // Show section
  previewSection.classList.remove("hidden");
  previewSection.classList.add("fade-slide");

  // Set iframe
  frame.src = `/demo/${template.id}/index.html`;

  // Set title
  title.innerText = template.title;

  // Scroll to preview
  previewSection.scrollIntoView({ behavior: "smooth" });
}