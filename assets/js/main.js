// assets/js/main.js
import { setupSearch } from "./search.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initializing Arochea’s Archives...");

  // Global store for all Airtable data
  window.archiveData = { games: [], packs: [], items: [] };

  // Airtable endpoint configuration
  const config = {
    games: { endpoint: "/api/games", listId: "game-list", fieldName: "Games" },
    packs: { endpoint: "/api/packs", listId: "pack-list", fieldName: "Packs" },
    items: { endpoint: "/api/items", listId: "item-list", fieldName: "Items" }
  };

  // Load one category (Games, Packs, or Items) from Airtable
  async function loadSection(endpoint, listId, fieldName) {
    const key = listId.replace("-list", "s");
    const list = document.getElementById(listId);
    const noMsg = list.parentElement.querySelector(".no-results");
    const card = list.parentElement;

    // Add shimmer placeholders while loading
    list.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const shimmer = document.createElement("div");
      shimmer.className = "loading-shimmer";
      list.appendChild(shimmer);
    }

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const records = data.records || [];

      // Store results globally
      window.archiveData[key] = records.map(r => r.fields[fieldName] || "(Unnamed)");

      // Clean up + fade in
      list.innerHTML = "";
      card.classList.add("fade-in");
      noMsg.classList.add("hidden");
      console.log(`✅ Loaded ${window.archiveData[key].length} ${key}`);
    } catch (err) {
      console.error(`❌ Failed to load ${listId}:`, err);
      list.innerHTML = "<li style='color:#e66;'>Error loading data</li>";
      noMsg.classList.remove("hidden");
    }

    return window.archiveData[key];
  }

  // Load all Airtable data, then initialize search
  Promise.all([
    loadSection(config.games.endpoint, config.games.listId, config.games.fieldName),
    loadSection(config.packs.endpoint, config.packs.listId, config.packs.fieldName),
    loadSection(config.items.endpoint, config.items.listId, config.items.fieldName)
  ])
    .then(() => {
      console.log("✅ All data loaded successfully:", window.archiveData);

      // Fade out the loading screen
      const loader = document.getElementById("loading-screen");
      loader.classList.add("fade-out");
      setTimeout(() => loader.remove(), 1000);

      // Initialize the MiniSearch setup
      setupSearch(window.archiveData, config);
    })
    .catch(err => console.error("❌ Data load error:", err));
});
