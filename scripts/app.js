/* ============================================================
   AmazePages — app.js
   Handles:
   - Start button scroll
   - Vibe filter selection
   - Sticky shrink animation
   - Template rendering
   ============================================================ */

// Get DOM elements
const vibeButtons = document.querySelectorAll(".vibe-btn");
const startBtn = document.getElementById("startBtn");
const vibeSection = document.querySelector(".choose-vibe");
const templatesGrid = document.getElementById("templatesGrid");

// ===============================
// 1️⃣ Start Button Scroll to Vibes
// ===============================
startBtn.addEventListener("click", () => {
  vibeSection.scrollIntoView({ behavior: "smooth" });
});

// ===============================
// 2️⃣ Sticky Shrink Animation
// ===============================
window.addEventListener("scroll", () => {
  if (window.scrollY > 120) {
    vibeSection.classList.add("shrunk");
  } else {
    vibeSection.classList.remove("shrunk");
  }
});

// ===============================
// 3️⃣ Render Templates
// ===============================
function renderTemplates(vibe) {
  templatesGrid.innerHTML = "";

  const filtered = window.TEMPLATES.filter(t => t.vibe === vibe);

  filtered.forEach(template => {

    const card = document.createElement("div");
    card.className = "template-card";

    card.innerHTML = `
      <img src="${template.image}" alt="${template.title}">
      <h3>${template.title}</h3>
    `;

    // ✅ CLICK HANDLER
    card.addEventListener("click", () => {
      showPreview(template);
    });

    templatesGrid.appendChild(card);

  });
}
  

    

// Default: show formal templates
renderTemplates("casual");

// ===============================
// 4️⃣ Vibe Buttons Interaction
// ===============================
const templatesSection = document.getElementById("templates-section");

vibeButtons.forEach(btn => {
  btn.addEventListener("click", () => {

    // Active button UI
    vibeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const vibe = btn.dataset.vibe;

    // Skeleton loading
    templatesGrid.innerHTML = `
      <div class='skeleton'></div>
      <div class='skeleton'></div>
      <div class='skeleton'></div>
    `;

    setTimeout(() => {

      // Render templates
      renderTemplates(vibe);

      // Animate cards
      document.querySelectorAll(".template-card").forEach((card, i) => {
        setTimeout(() => card.classList.add("card-anim"), i * 80);
      });

      // Show section
      templatesSection.classList.remove("hidden");
      templatesSection.classList.add("fade-slide");

      templatesSection.scrollIntoView({ behavior: "smooth" });

    }, 350);
  });
});

function goBack() {
  window.history.back();
}




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