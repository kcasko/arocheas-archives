// assets/js/search.js
export function setupSearch(archiveData, config) {
  console.log("🧩 MiniSearch setup initializing...");

  const input = document.getElementById("search-input");
  const category = document.getElementById("category-select");
  const reset = document.getElementById("reset-btn");
  const browse = document.getElementById("browse-btn");

  const lists = {
    games: document.getElementById("game-list"),
    packs: document.getElementById("pack-list"),
    items: document.getElementById("item-list")
  };

  // --- Build unified dataset for MiniSearch ---
  const allItems = [
    ...archiveData.games.map(name => ({ id: `g-${name}`, name, category: "games" })),
    ...archiveData.packs.map(name => ({ id: `p-${name}`, name, category: "packs" })),
    ...archiveData.items.map(name => ({ id: `i-${name}`, name, category: "items" }))
  ];

  // --- Initialize MiniSearch index ---
  const miniSearch = new MiniSearch({
    fields: ["name", "category"], // searchable fields
    storeFields: ["name", "category"], // returned fields
    searchOptions: {
      fuzzy: 0.3,  // allow minor typos
      prefix: true // partial word matches
    }
  });

  miniSearch.addAll(allItems);
  console.log(`✅ MiniSearch index built with ${allItems.length} entries`);

  // --- Helper: highlight text matches ---
  function highlightMatch(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), `<span class="highlight">$1</span>`);
  }

  // --- Render one category ---
  function renderList(key, results, term) {
    const list = lists[key];
    const noMsg = list.parentElement.querySelector(".no-results");
    list.innerHTML = "";

    const filtered = results.filter(r => r.category === key);

    if (!filtered.length) {
      noMsg.classList.remove("hidden");
      return;
    }

    noMsg.classList.add("hidden");
    filtered.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = highlightMatch(item.name, term);
      list.appendChild(li);
    });
  }

  // --- Core search logic ---
  function performSearch({ browseMode = false } = {}) {
    const term = input.value.trim().toLowerCase();
    const selectedCat = category.value;
    let results = [];

    if (browseMode || !term) {
      results = allItems;
    } else {
      // Sort by MiniSearch's internal relevance score
      results = miniSearch.search(term).sort((a, b) => b.score - a.score);
    }

    // Determine which categories to show
    const visibleCats = selectedCat === "all" ? Object.keys(lists) : [selectedCat];

    Object.keys(lists).forEach(cat => {
      if (visibleCats.includes(cat)) {
        renderList(cat, results, term);
      } else {
        lists[cat].innerHTML = "";
        lists[cat].parentElement.querySelector(".no-results").classList.add("hidden");
      }
    });
  }

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
      Object.values(lists).forEach(list => (list.innerHTML = ""));
      document.querySelectorAll(".no-results").forEach(msg => msg.classList.add("hidden"));
    }
  });

  // --- Debounce for smoother search ---
  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(), 200);
  });

  category.addEventListener("change", performSearch);

  // --- Reset everything ---
  reset.addEventListener("click", () => {
    input.value = "";
    category.value = "all";
    browsing = false;
    browse.textContent = "Browse";
    browse.classList.remove("active");
    Object.values(lists).forEach(list => (list.innerHTML = ""));
    document.querySelectorAll(".no-results").forEach(msg => msg.classList.add("hidden"));
  });

  // --- Keyboard shortcuts ---
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") performSearch();
    if (e.key === "Escape") {
      input.value = "";
      performSearch();
    }
  });

  console.log("✅ MiniSearch ready!");
}
