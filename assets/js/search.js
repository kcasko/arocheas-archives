// assets/js/search.js
export function setupSearch(archiveData, config) {
  const input = document.getElementById("search-input");
  const category = document.getElementById("category-select");
  const reset = document.getElementById("reset-btn");
  const browse = document.getElementById("browse-btn");

  const lists = {
    games: document.getElementById("game-list"),
    packs: document.getElementById("pack-list"),
    items: document.getElementById("item-list"),
  };

  // Helper: highlight text matches
  function highlightMatch(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), `<span class="highlight">$1</span>`);
  }

  // Render results for one section
  function renderList(key, items, term) {
    const list = lists[key];
    const noMsg = list.parentElement.querySelector(".no-results");

    list.innerHTML = "";
    if (!items.length) {
      noMsg.classList.remove("hidden");
      return;
    }

    noMsg.classList.add("hidden");
    items.forEach(name => {
      const li = document.createElement("li");
      li.innerHTML = highlightMatch(name, term);
      list.appendChild(li);
    });
  }

  // Core search logic
  function performSearch({ browseMode = false } = {}) {
    const term = input.value.trim().toLowerCase();
    const selectedCat = category.value;

    Object.entries(config).forEach(([key, conf]) => {
      const isInCategory = selectedCat === "all" || selectedCat === key;
      let filtered = [];

      if (browseMode && isInCategory) {
        // Browse shows *everything* for this category
        filtered = archiveData[key];
      } else if (term && isInCategory) {
        // Search matches text
        filtered = archiveData[key].filter(x => x.toLowerCase().includes(term));
      }

      renderList(key, filtered, term);
    });
  }

  // Wire up search events
  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(), 200);
  });

  category.addEventListener("change", () => performSearch());
  reset.addEventListener("click", () => {
    input.value = "";
    category.value = "all";
    Object.values(lists).forEach(list => (list.innerHTML = ""));
    document.querySelectorAll(".no-results").forEach(n => n.classList.add("hidden"));
  });

  // --- Browse Toggle ---
let browsing = false;

browse.addEventListener("click", () => {
  browsing = !browsing;

  if (browsing) {
    browse.textContent = "Hide";
    browse.classList.add("active");
    performSearch({ browseMode: true });
  } else {
    browse.textContent = "Browse";
    browse.classList.remove("active");

    // Clear all results and hide "no results" messages
    Object.values(lists).forEach(list => (list.innerHTML = ""));
    document.querySelectorAll(".no-results").forEach(msg => msg.classList.add("hidden"));
  }
});

  // Optional keyboard shortcuts
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") performSearch();
    if (e.key === "Escape") {
      input.value = "";
      performSearch();
    }
  });
}
