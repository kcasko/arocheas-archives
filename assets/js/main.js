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

  /**
   * Load one category (Games, Packs, or Items) from the API
   */
  async function loadSection(endpoint, listId, fieldName) {
    const key = listId.replace("-list", "s"); // e.g. 'game-list' → 'games'
    const list = document.getElementById(listId);
    const noMsg = list.parentElement.querySelector(".no-results");

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const records = data.records || [];

      // Store Airtable data into the global object
      window.archiveData[key] = records.map(r => r.fields[fieldName] || "(Unnamed)");

      noMsg.classList.add("hidden");
      list.innerHTML = "";
      console.log(`✅ Loaded ${window.archiveData[key].length} ${key}`);
    } catch (err) {
      console.error(`❌ Failed to load ${listId}:`, err);
      list.innerHTML = "<li style='color:#e66;'>Error loading data</li>";
      noMsg.classList.remove("hidden");
    }

    return window.archiveData[key];
  }

  /**
   * Load all Airtable data first, then start the search UI
   */
  Promise.all([
    loadSection(config.games.endpoint, config.games.listId, config.games.fieldName),
    loadSection(config.packs.endpoint, config.packs.listId, config.packs.fieldName),
    loadSection(config.items.endpoint, config.items.listId, config.items.fieldName)
  ])
    .then(() => {
      console.log("✅ All data loaded successfully:", window.archiveData);
      setupSearch(window.archiveData, config);
    })
    .catch(err => console.error("❌ Data load error:", err));

  /**
   * 🎵 Background Music Toggle
   */
  const toggle = document.getElementById("music-toggle");
  const music = document.getElementById("bg-music");
  let playing = false;

  toggle.addEventListener("click", async () => {
    try {
      if (!playing) {
        // Fade in and start music
        music.volume = 0;
        await music.play();
        toggle.classList.add("active");

        const fadeIn = setInterval(() => {
          if (music.volume < 0.5) music.volume += 0.05;
          else clearInterval(fadeIn);
        }, 200);

        playing = true;
      } else {
        // Fade out and pause
        const fadeOut = setInterval(() => {
          if (music.volume > 0) music.volume -= 0.05;
          else {
            clearInterval(fadeOut);
            music.pause();
          }
        }, 200);

        toggle.classList.remove("active");
        playing = false;
      }
    } catch (e) {
      console.warn("⚠️ Autoplay blocked by browser:", e);
    }
  });
});
