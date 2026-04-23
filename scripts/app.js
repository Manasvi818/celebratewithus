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
function renderTemplates(vibe) 
  templatesGrid.innerHTML = "";

  const filtered = window.TEMPLATES.filter(t => t.vibe === vibe);

  filtered.forEach(template => {

  const card = document.createElement("div");
  card.className = "template-card";

  card.innerHTML = `
    <img src="${template.image}" alt="${template.title}">
    <h3>${template.title}</h3>
  `;

  // ✅ ADD CLICK HERE (THIS FIXES EVERYTHING)
  card.addEventListener("click", () => {
    showPreview(template);
  });

  templatesGrid.appendChild(card);

});

    

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

// Show templates when vibe is clicked
vibeButtons.forEach(button => {
  button.addEventListener("click", () => {
    const selectedVibe = button.dataset.vibe;

    templatesGrid.innerHTML = ""; // clear previous

    const filtered = window.TEMPLATES.filter(t => t.vibe === selectedVibe);

    filtered.forEach(template => {
      const card = `
  <div class="template-card" data-id="${template.id}">
    <img src="${template.image}" alt="${template.title}">
    <h3>${template.title}</h3>
  </div>
`;
      templatesGrid.innerHTML += card;
    });

    templatesSection.classList.remove("hidden");
    templatesSection.classList.add("fade-slide");
  });
});

document.addEventListener("DOMContentLoaded", function () {

  // Only run on template.html
  const imageEl = document.getElementById("templateImage");
  const titleEl = document.getElementById("previewTitle");

  if (!imageEl) return; // prevents errors on index page

  // Get ID from URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get("template");

  if (!id) {
    console.error("No template ID in URL");
    return;
  }

  // Find template from data
  const template = window.TEMPLATES.find(t => t.id === id);
console.log("Template object:", template); 
console.log("Image path:", template?.image);
console.log("Image element:", imageEl);

  if (!template) {
    console.error("Template not found:", id);
    return;
  }

  // ✅ SET IMAGE (IMPORTANT PATH FIX)
  imageEl.src = template.image;

  // ✅ SET TITLE
  titleEl.innerText = template.title;

});

document.addEventListener("DOMContentLoaded", function () {

  const templatesGrid = document.getElementById("templatesGrid");
  const vibeButtons = document.querySelectorAll(".vibe-btn");
  const templatesSection = document.getElementById("templates-section");

  // If not on index page, stop
  if (!templatesGrid) return;

  vibeButtons.forEach(button => {
    button.addEventListener("click", () => {

      const selectedVibe = button.dataset.vibe;

      templatesGrid.innerHTML = "";

      const filtered = window.TEMPLATES.filter(t => t.vibe === selectedVibe);

      filtered.forEach(template => {

        const card = document.createElement("div");
        card.className = "template-card";

        card.innerHTML = `
          <a href="pages/template.html?id=${template.id}">
            <img src="${template.image}" alt="${template.title}">
            <h3>${template.title}</h3>
          </a>
        `;

        templatesGrid.appendChild(card);
      });

      templatesSection.classList.remove("hidden");
      templatesSection.classList.add("fade-slide");
    });
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

// 🔥 FORCE PREVIEW UPDATE (WORKS WITHOUT SEARCHING OLD CODE)
document.addEventListener("click", function (e) {

  const card = e.target.closest(".template-card");
  if (!card) return;

  const templateId = card.dataset.id;

  const frame = document.getElementById("previewFrame");
  const title = document.getElementById("previewTitle");

  if (frame && templateId) {
    frame.src = `/demo/${templateId}/index.html`;
  }

  if (title) {
    title.innerText = templateId.replace(/-/g, " ");
  }

});

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