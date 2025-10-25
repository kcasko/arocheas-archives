export function setupSearch() {
  const archiveData = { games: [], packs: [], items: [] };
  const config = {
    games: { endpoint: '/api/games', listId: 'game-list', fieldName: 'Games' },
    packs: { endpoint: '/api/packs', listId: 'pack-list', fieldName: 'Packs' },
    items: { endpoint: '/api/items', listId: 'item-list', fieldName: 'Items' }
  };

  const input = document.getElementById('search-input');
  const category = document.getElementById('category-select');
  const reset = document.getElementById('reset-btn');
  const browse = document.getElementById('browse-btn');
  const lists = {
    games: document.querySelector('#game-list'),
    packs: document.querySelector('#pack-list'),
    items: document.querySelector('#item-list')
  };

  // Highlight matches
  function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  function renderList(key, items, term) {
    const list = lists[key];
    const noMsg = list.parentElement.querySelector('.no-results');
    list.innerHTML = '';
    if (!items.length) {
      noMsg.classList.remove('hidden');
      return;
    }
    noMsg.classList.add('hidden');
    items.forEach(txt => {
      const li = document.createElement('li');
      li.innerHTML = highlightMatch(txt, term);
      list.appendChild(li);
    });
  }

  function performSearch({ browse = false } = {}) {
    const term = input.value.trim().toLowerCase();
    const cat = category.value;
    const showAll = browse || term === '*';

    Object.entries(config).forEach(([key]) => {
      const list = lists[key];
      const noMsg = list.parentElement.querySelector('.no-results');
      const isInCategory = (cat === 'all' || cat === key);
      list.innerHTML = '';
      noMsg.classList.add('hidden');
      list.parentElement.style.display = 'none';

      if (!isInCategory) return;
      let results = [];
      if (showAll) results = archiveData[key];
      else if (term) results = archiveData[key].filter(i => i.toLowerCase().includes(term));

      if (results.length) {
        renderList(key, results, term);
        list.parentElement.style.display = 'block';
      } else if (term) {
        noMsg.classList.remove('hidden');
        list.parentElement.style.display = 'block';
      }
    });
  }

  async function loadSection(endpoint, listId, fieldName) {
    const key = listId.replace('-list', '');
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      archiveData[key] = (data.records || []).map(r => r.fields[fieldName] || "(Unnamed)");
    } catch (err) {
      console.error(`Failed to load ${key}:`, err);
    }
  }

  // Load data from live API
  Object.values(config).forEach(c => loadSection(c.endpoint, c.listId, c.fieldName));

  // Events
  input.addEventListener('input', () => performSearch());
  category.addEventListener('change', () => performSearch());
  reset.addEventListener('click', () => { input.value = ''; performSearch(); });
  browse.addEventListener('click', () => { input.value = ''; performSearch({ browse: true }); });
}
