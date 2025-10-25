export function setupSearch(archiveData, config) {
  const input = document.getElementById("search-input");
  const category = document.getElementById("category-select");
  const reset = document.getElementById("reset-btn");
  const browse = document.getElementById("browse-btn");

  const lists = {
    games: document.querySelector("#game-list"),
    packs: document.querySelector("#pack-list"),
    items: document.querySelector("#item-list")
  };

  function highlightMatch(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  function renderList(key, filteredItems, term) {
    const list = lists[key];
    const noMsg = list.parentElement.querySelector(".no-results");
    list.innerHTML = "";

    if (filteredItems.length === 0) {
      noMsg.classList.toggle("hidden", !term);
    } else {
      noMsg.classList.add("hidden");
      filteredItems.forEach(itemText => {
        const li = document.createElement("li");
        li.innerHTML = highlightMatch(itemText, term);
        list.appendChild(li);
      });
    }
  }

  function performSearch({ browseMode = false } = {}) {
    const term = input.value.trim().toLowerCase();
    const cat = category.value;

    Object.entries(config).forEach(([key]) => {
      const inCategory = cat === "all" || cat === key;
      let filtered = [];

      if (browseMode && inCategory) filtered = archiveData[key];
      else if (term && inCategory)
        filtered = archiveData[key].filter(item => item.toLowerCase().includes(term));

      renderList(key, filtered, term);
    });
  }

  // Wire up events
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => performSearch(), 200);
  });
  category.addEventListener("change", () => performSearch());
  reset.addEventListener("click", () => {
    input.value = "";
    category.value = "all";
    performSearch();
  });
  browse.addEventListener("click", () => performSearch({ browseMode: true }));

  input.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      input.value = "";
      performSearch();
      e.preventDefault();
    }
    if (e.key === "Enter") {
      performSearch();
      e.preventDefault();
    }
  });
}
