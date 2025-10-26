// assets/js/search.js
export async function setupSearch(config) {
  console.log("🧩 Initializing Arochea’s Archives Search...");

  // --- UI ELEMENTS ---
  const input = document.getElementById("search-input");
  const category = document.getElementById("category-select");
  const reset = document.getElementById("reset-btn");
  const browse = document.getElementById("browse-btn");

  const lists = {
    games: document.getElementById("game-list"),
    packs: document.getElementById("pack-list"),
    items: document.getElementById("item-list"),
  };

  // --- FETCH DATA FROM /api/all ---
  let archiveData = { games: [], packs: [], items: [] };

  try {
    const res = await fetch("/api/all");
    if (!res.ok) throw new Error(`Failed to fetch archive data (${res.status})`);
    const data = await res.json();

    archiveData = {
      games: data.Games?.map((g) => g.fields?.Name || g.fields?.Title).filter(Boolean) || [],
      packs: data.Packs?.map((p) => p.fields?.Name).filter(Boolean) || [],
      items:
        data.Items?.map((i) => ({
          name: i.fields?.Items || "(Unnamed)",
          image: i.fields?.Image?.[0]?.url || null,
          game: i.fields?.Game || null,
          pack: i.fields?.Pack || null,
          category: i.fields?.Categories || null,
          subcategory: i.fields?.["Sub Categories"] || null,
        })) || [],
    };

    console.log("📦 Archive data loaded:", {
      games: archiveData.games.length,
      packs: archiveData.packs.length,
      items: archiveData.items.length,
    });
  } catch (err) {
    console.error("❌ Error fetching /api/all:", err);
  }

  // --- BUILD COMBINED DATASET ---
  const allItems = [
    ...archiveData.games.map((name) => ({
      id: `g-${name}`,
      name,
      category: "games",
    })),
    ...archiveData.packs.map((name) => ({
      id: `p-${name}`,
      name,
      category: "packs",
    })),
    ...archiveData.items.map((item) => ({
      id: `i-${item.name}`,
      name: item.name,
      image: item.image,
      game: item.game || null,
      pack: item.pack || null,
      category: "items",
      itemCategory: item.category,
      subcategory: item.subcategory,
    })),
  ];

  // --- MINISEARCH INIT ---
  const miniSearch = new MiniSearch({
    fields: ["name", "category"],
    storeFields: ["name", "category", "image", "game", "pack", "itemCategory", "subcategory"],
    searchOptions: { fuzzy: 0.3, prefix: true },
  });

  miniSearch.addAll(allItems);
  console.log(`✅ MiniSearch index built with ${allItems.length} entries`);

  // --- HIGHLIGHT HELPER ---
  function highlightMatch(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), `<span class="highlight">$1</span>`);
  }

  // --- MODAL HANDLING ---
  function showItemModal(item) {
    const modal = document.getElementById("item-modal");
    modal.querySelector(".modal-title").textContent = item.name;
    modal.querySelector(".modal-image").src = item.image || "assets/placeholder.png";
    modal.querySelector(".modal-game").textContent = item.game || "—";
    modal.querySelector(".modal-pack").textContent = item.pack || "—";
    modal.querySelector(".modal-category").textContent = item.itemCategory || "Uncategorized";
    modal.querySelector(".modal-subcategory").textContent = item.subcategory || "—";

    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.add("show"), 10);
  }

  document.getElementById("modal-close").addEventListener("click", () => {
    const modal = document.getElementById("item-modal");
    modal.classList.remove("show");
    setTimeout(() => modal.classList.add("hidden"), 300);
  });

  // --- SERVER SEARCH FALLBACK ---
  async function fetchServerSearch(query) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Server search failed (${res.status})`);
      const data = await res.json();

      const allResults = [];
      for (const [table, records] of Object.entries(data.results)) {
        records.forEach((r) => {
          allResults.push({
            id: `${table[0].toLowerCase()}-${r.id}`,
            name: r.fields?.Name || r.fields?.Items || "(Unnamed)",
            category: table.toLowerCase().replace(" ", "-"),
            image: r.fields?.Image?.[0]?.url || null,
            game: r.fields?.Game || null,
            pack: r.fields?.Pack || null,
            itemCategory: r.fields?.Categories || null,
            subcategory: r.fields?.["Sub Categories"] || null,
          });
        });
      }

      console.log(`🌐 Server search returned ${allResults.length} results`);
      return allResults;
    } catch (err) {
      console.warn("⚠️ Server search error:", err);
      return [];
    }
  }

  // --- RENDER LISTS ---
  function renderList(key, results, term) {
    const list = lists[key];
    const noMsg = list.parentElement.querySelector(".no-results");
    list.innerHTML = "";

    const filtered = results.filter((r) => r.category === key);
    if (!filtered.length) {
      noMsg.classList.remove("hidden");
      return;
    }

    noMsg.classList.add("hidden");
    filtered.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = highlightMatch(item.name, term);
      if (item.image || item.itemCategory) {
        li.addEventListener("click", () => showItemModal(item));
        li.style.cursor = "pointer";
      }
      list.appendChild(li);
    });
  }

  // --- SEARCH LOGIC ---
  function performSearch({ browseMode = false } = {}) {
    const term = input.value.trim().toLowerCase();
    const selectedCat = category.value;
    let results = [];

    if (browseMode || !term) {
      results = allItems;
      updateLists();
    } else {
      results = miniSearch.search(term).sort((a, b) => b.score - a.score);
      updateLists();

      // Fallback if MiniSearch finds few results
      if (results.length < 3) {
        console.log("⚡ Fallback to server search...");
        fetchServerSearch(term).then((serverResults) => {
          if (serverResults.length) {
            results = [...results, ...serverResults];
            updateLists();
          }
        });
      }
    }

    function updateLists() {
      const visibleCats = selectedCat === "all" ? Object.keys(lists) : [selectedCat];
      Object.keys(lists).forEach((cat) => {
        if (visibleCats.includes(cat)) renderList(cat, results, term);
        else {
          lists[cat].innerHTML = "";
          lists[cat].parentElement.querySelector(".no-results").classList.add("hidden");
        }
      });
    }

    console.log(`🔎 Search term: "${term}" | Results: ${results.length}`);
  }

  // --- UI EVENTS ---
  browse.addEventListener("click", () => {
    const active = browse.classList.toggle("active");
    browse.textContent = active ? "Hide" : "Browse";
    performSearch({ browseMode: active });
  });

  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(), 200);
  });

  category.addEventListener("change", performSearch);

  reset.addEventListener("click", () => {
    input.value = "";
    category.value = "all";
    browse.classList.remove("active");
    browse.textContent = "Browse";
    Object.values(lists).forEach((list) => (list.innerHTML = ""));
    document.querySelectorAll(".no-results").forEach((msg) => msg.classList.add("hidden"));
  });

  console.log("🌸 Arochea’s Archives Search ready!");
}
