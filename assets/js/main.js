import { setupSearch } from "./search.js";

document.addEventListener("DOMContentLoaded", () => {
  const archiveData = { games: [], packs: [], items: [] };

  const config = {
    games: { endpoint: "/api/games", listId: "game-list", fieldName: "Games" },
    packs: { endpoint: "/api/packs", listId: "pack-list", fieldName: "Packs" },
    items: { endpoint: "/api/items", listId: "item-list", fieldName: "Items" }
  };

  async function loadSection(endpoint, listId, fieldName) {
    const key = listId.replace("-list", "");
    const list = document.getElementById(listId);
    const noMsg = list.parentElement.querySelector(".no-results");

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const records = data.records || [];
      archiveData[key] = records.map(r => r.fields[fieldName] || "(Unnamed)");
      noMsg.classList.add("hidden");
      list.innerHTML = "";
      console.log(`✅ Loaded ${archiveData[key].length} ${key}`);
    } catch (err) {
      console.error(`Failed to load ${listId}:`, err);
      list.innerHTML = "<li style='color:#e66;'>Error loading data</li>";
      noMsg.classList.remove("hidden");
    }
  }

  // Load all three data categories
  loadSection(config.games.endpoint, config.games.listId, config.games.fieldName);
  loadSection(config.packs.endpoint, config.packs.listId, config.packs.fieldName);
  loadSection(config.items.endpoint, config.items.listId, config.items.fieldName);

  // Setup search + browse UI
  setupSearch(archiveData, config);

  // 🎵 Background Music Toggle
  const toggle = document.getElementById("music-toggle");
  const music = document.getElementById("bg-music");
  let playing = false;

  toggle.addEventListener("click", async () => {
    try {
      if (!playing) {
        music.volume = 0;
        await music.play();
        toggle.classList.add("active");
        const fadeIn = setInterval(() => {
          if (music.volume < 0.5) music.volume += 0.05;
          else clearInterval(fadeIn);
        }, 200);
        playing = true;
      } else {
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
      console.warn("Autoplay blocked:", e);
    }
  });
});
