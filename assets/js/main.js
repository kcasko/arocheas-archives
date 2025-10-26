// assets/js/main.js
import { setupSearch } from "./search.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initializing Arochea’s Archives...");

  // global data store
  window.archiveData = { games: [], packs: [], items: [] };

  const config = {
    games: { endpoint: "/api/games", listId: "game-list", fieldName: "Games" },
    packs: { endpoint: "/api/packs", listId: "pack-list", fieldName: "Packs" },
    items: { endpoint: "/api/items", listId: "item-list", fieldName: "Items" },
  };

  // 🩷 shimmer + fetch for each category
  async function loadSection(endpoint, listId, fieldName) {
    const key = listId.replace("-list", "s");
    const list = document.getElementById(listId);
    const noMsg = list.parentElement.querySelector(".no-results");
    const card = list.parentElement;

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

      if (key === "items") {
        window.archiveData.items = records.map((r) => ({
          name: r.fields[fieldName] || "(Unnamed)",
          image: r.fields.Image?.[0]?.url || null,
          category: r.fields.Categories || null,
          subcategory: r.fields["Sub Categories"] || null,
          game: r.fields.Game || null,
          pack: r.fields.Pack || null,
        }));
      } else {
        window.archiveData[key] =
          records.map((r) => r.fields[fieldName] || "(Unnamed)") || [];
      }

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

  // 🌸 load everything concurrently
  Promise.all([
    loadSection(config.games.endpoint, config.games.listId, config.games.fieldName),
    loadSection(config.packs.endpoint, config.packs.listId, config.packs.fieldName),
    loadSection(config.items.endpoint, config.items.listId, config.items.fieldName),
  ])
    .then(() => {
      console.log("✅ All data loaded successfully:", window.archiveData);
      const loader = document.getElementById("loading-screen");
      if (loader) {
        loader.classList.add("fade-out");
        setTimeout(() => loader.remove(), 1000);
      }
      setupSearch(window.archiveData, config);
      initModalControls();
    })
    .catch((err) => console.error("❌ Data load error:", err));

  // 🌙 Modal + scroll-lock controls
  function initModalControls() {
    const modal = document.getElementById("item-modal");
    const closeBtn = document.getElementById("modal-close");

    if (!modal || !closeBtn) return;

    // helper to close
    function closeModal() {
      modal.classList.add("hide");
      document.body.classList.remove("modal-open");
      setTimeout(() => {
        modal.classList.add("hidden");
        modal.classList.remove("show", "hide");
      }, 250);
    }

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // expose global opener for search.js
    window.showItemModal = function (item) {
      const title = modal.querySelector(".modal-title");
      const image = modal.querySelector(".modal-image");
      const game = modal.querySelector(".modal-game");
      const pack = modal.querySelector(".modal-pack");
      const category = modal.querySelector(".modal-category");
      const subcategory = modal.querySelector(".modal-subcategory");

      title.textContent = item.name || "(Unnamed)";
      image.src = item.image || "assets/placeholder.png";
      game.textContent = item.game || "—";
      pack.textContent = item.pack || "—";
      category.textContent = item.itemCategory || item.category || "Uncategorized";
      subcategory.textContent = item.subcategory || "—";

      modal.classList.remove("hidden", "hide");
      setTimeout(() => modal.classList.add("show"), 10);
      document.body.classList.add("modal-open");
    };
  }
});
