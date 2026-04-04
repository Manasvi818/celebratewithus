// scripts/templates-data.js
// Full list of all 30 templates

window.TEMPLATES = [

  // --------------------
  // CASUAL (5)
  // --------------------
  { id: "easy-breezy",       title: "Easy Breezy",       vibe: "casual", image: "assets/images/easy-breezy.png" },
  { id: "everyday-joy",      title: "Everyday Joy",      vibe: "casual", image: "assets/images/everyday-joy.png" },
  { id: "simple-delight",    title: "Simple Delight",    vibe: "casual", image: "assets/images/simple-delight.png" },
  { id: "soft-vibes",        title: "Soft Vibes",        vibe: "casual", image: "assets/images/soft-vibes.png" },
  { id: "sunny-smiles",      title: "Sunny Smiles",      vibe: "casual", image: "assets/images/sunny-smiles.png" },


  // --------------------
  // FAMILY-TIME (5)
  // --------------------
  { id: "home-happiness",    title: "Home Happiness",    vibe: "family", image: "assets/images/home-happiness.png" },
  { id: "always-together",   title: "Always Together",   vibe: "family", image: "assets/images/always-together.png" },
  { id: "warm-bonds",        title: "Warm Bonds",        vibe: "family", image: "assets/images/warm-bonds.png" },
  { id: "cherished-times",   title: "Cherished Times",   vibe: "family", image: "assets/images/cherished-times.png" },
  { id: "joyful-family",     title: "Joyful Family",     vibe: "family", image: "assets/images/joyful-times.png" },

  // --------------------
  // FUN / QUIRKY (5)
  // --------------------
  { id: "color-carnival",    title: "Color Carnival",    vibe: "fun",    image: "assets/images/color-carnival.png" },
  { id: "crazy-confetti",    title: "Crazy Confetti",    vibe: "fun",    image: "assets/images/crazy-confetti.png" },
  { id: "electric-energy",   title: "Electric Energy",   vibe: "fun",    image: "assets/images/electric-energy.png" },
  { id: "laugh-riot",        title: "Laugh Riot",        vibe: "fun",    image: "assets/images/laugh-riot.png" },
  { id: "party-pop",         title: "Party Pop",         vibe: "fun",    image: "assets/images/party-pop.png" },


  // --------------------
  // ROMANTIC (5)
  // --------------------
  { id: "blush-love",        title: "Blush Love",        vibe: "romantic", image: "assets/images/blush-love.png" },
  { id: "candlelight-moments", title: "Candlelight Moments", vibe: "romantic", image: "assets/images/candlelight-moments.png" },
  { id: "forever-yours",     title: "Forever Yours",     vibe: "romantic", image: "assets/images/forever-yours.png" },
  { id: "golden-love",       title: "Golden Love",       vibe: "romantic", image: "assets/images/golden-love.png" },
  { id: "sweet-affection",   title: "Sweet Affection",   vibe: "romantic", image: "assets/images/sweet-affection.png" },


  // --------------------
  // TRADITIONAL (5)
  // --------------------
  { id: "cultural-festive",  title: "Cultural Festive",  vibe: "traditional", image: "assets/images/cultural-festive.png" },
  { id: "golden-mandala",    title: "Golden Mandala",    vibe: "traditional", image: "assets/images/golden-mandala.png" },
  { id: "royal-aura",        title: "Royal Aura",        vibe: "traditional", image: "assets/images/royal-aura.png" },
  { id: "sacred-simplicity", title: "Sacred Simplicity", vibe: "traditional", image: "assets/images/sacred-simplicity.png" },
  { id: "vintage-glory",     title: "Vintage Glory",     vibe: "traditional", image: "assets/images/vintage-glory.png" }

];


function selectVibeFromList(templateId) {
  const exists = window.TEMPLATES.find(t => t.id === templateId);

  if (!exists) {
    alert("Invalid template selected");
    return;
  }

  localStorage.setItem("selectedTemplate", templateId);

  console.log("✅ Selected:", templateId);
}