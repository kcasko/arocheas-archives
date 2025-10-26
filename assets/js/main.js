// assets/js/main.js

// 🌸 Loader fade-out (non-blocking)
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loading-screen");
  if (loader) {
    setTimeout(() => {
      loader.classList.add("fade-out");
      setTimeout(() => loader.remove(), 600);
    }, 500);
  }
});

const input = document.getElementById("search-input");
const categorySelect = document.getElementById("category-select");
const resultsList = document.getElementById("item-list");
const modal = document.getElementById("item-modal");

// 🌼 Show lightweight search placeholder
function showLoading() {
  resultsList.innerHTML = `
    <div style="padding:1rem;color:#888;font-style:italic;">
      Searching…
    </div>
  `;
}

// 🔍 Perform search
async function performSearch() {
  const q = input.value.trim();
  const category = categorySelect.value;

  if (!q) {
    resultsList.innerHTML = "";
    return;
  }

  showLoading();

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.results) throw new Error("Invalid response from API");

    const filtered =
      category === "all"
        ? data.results
        : data.results.filter(
            (r) => r.source.toLowerCase() === category.toLowerCase()
          );

    if (!filtered.length) {
      resultsList.innerHTML = `<p class="no-results">No results found.</p>`;
      return;
    }

    // 🧸 Render results
    resultsList.innerHTML = filtered
      .map(
        (item) => `
        <li class="fade-in" onclick='showItemModal(${JSON.stringify(item)
          .replace(/'/g, "&#39;")
          .replace(/"/g, "&quot;")})'>
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.name}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;margin-right:10px;">`
              : ""
          }
          <div>${item.name}</div>
        </li>
      `
      )
      .join("");
  } catch (err) {
    console.error("Search failed:", err);
    resultsList.innerHTML = `<p class="no-results">Error fetching results.</p>`;
  }
}

// ⏱️ Input debounce for smooth typing
input.addEventListener("input", () => {
  clearTimeout(window._searchTimer);
  window._searchTimer = setTimeout(performSearch, 300);
});

categorySelect.addEventListener("change", performSearch);

// 🌙 Modal handling
window.showItemModal = function (item) {
  modal.querySelector(".modal-title").textContent = item.name || "(Unnamed)";
  modal.querySelector(".modal-image").src =
    item.image || "assets/placeholder.png";
  modal.querySelector(".modal-category").textContent =
    item.category || "—";
  modal.querySelector(".modal-subcategory").textContent =
    item.subcategory || "—";

  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.add("show"), 10);
};

// ✨ Close modal when clicking “×” or background
const closeBtn = document.getElementById("modal-close");
if (closeBtn) {
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

function closeModal() {
  modal.classList.remove("show");
  setTimeout(() => modal.classList.add("hidden"), 250);
}
