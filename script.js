const API_BASE = "https://animeapi.skin";
let currentPage = 1;
let isLoading = false;
let hasMore = true;

const selectors = {
  trending: document.getElementById('trending-list'),
  searchList: document.getElementById('search-list'),
  animeList: document.getElementById('anime-list'),
  episodes: document.getElementById('episodes-container'),
  spinner: document.getElementById('loading-spinner'),
  searchInput: document.querySelector('.search'),
};

async function fetchJSON(endpoint, useProxyIfFail = true) {
  try {
    const res = await fetch(endpoint, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return normalize(json);
  } catch (err) {
    console.warn('Direct fetch failed for', endpoint, err.message);
    if (useProxyIfFail) {
      try {
        const proxy = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(endpoint);
        const res2 = await fetch(proxy);
        if (!res2.ok) throw new Error(`Proxy HTTP ${res2.status}`);
        const json2 = await res2.json();
        return normalize(json2);
      } catch (err2) {
        console.error('Proxy fetch also failed:', err2.message);
      }
    }
    throw err;
  }
}

function normalize(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.anime)) return payload.anime;
  return [];
}

function clear(container) {
  container.innerHTML = '';
}

function showMessage(container, text) {
  container.innerHTML = `<div class="message">${text}</div>`;
}

function createAnimeCard(anime) {
  console.log("Anime object:", anime);
  const card = document.createElement('div');
  card.className = 'anime-card';
  card.dataset.title = anime.title || anime.name || anime.title_en || '';

  const img = document.createElement('img');
  img.src = anime.image || anime.img || anime.thumbnail || anime.poster || anime.coverImage || anime.image_url || 'anime.png';
  img.alt = anime.title || anime.name || 'anime';
  img.onerror = () => { img.src = 'anime.png'; };
  card.appendChild(img);

  const p = document.createElement('p');
  p.textContent = anime.title || anime.name || 'Untitled';
  card.appendChild(p);

  return card;
}

async function getTrendingAnime() {
  return await fetchJSON(`${API_BASE}/trending`);
}

async function searchAnime(keyword, page = 1) {
  return await fetchJSON(`${API_BASE}/search?q=${encodeURIComponent(keyword)}&page=${page}`);
}

async function getAnimeByPage(page = 1) {
  return await fetchJSON(`${API_BASE}/new?page=${page}`);
}

async function getEpisodes(title) {
  return await fetchJSON(`${API_BASE}/episodes?title=${encodeURIComponent(title)}`);
}

async function renderTrending() {
  const container = selectors.trending;
  showMessage(container, 'Loading trending anime...');
  try {
    const list = await getTrendingAnime();
    clear(container);
    if (!list.length) { showMessage(container, 'No trending anime found.'); return; }
    list.forEach(a => container.appendChild(createAnimeCard(a)));
  } catch (err) {
    console.error('Trending error:', err);
    showMessage(container, 'Failed to load trending. Check console for details.');
  }
}

async function doSearch(keyword) {
  const container = selectors.searchList;
  showMessage(container, `Searching for "${keyword}"...`);
  try {
    const list = await searchAnime(keyword);
    clear(container);
    if (!list.length) { showMessage(container, 'No results found.'); return; }
    list.forEach(a => container.appendChild(createAnimeCard(a)));
  } catch (err) {
    console.error('Search error:', err);
    showMessage(container, 'Search failed. Check console for details.');
  }
}

async function loadEpisodes(title) {
  const container = selectors.episodes;
  showMessage(container, `Loading episodes for "${title}"...`);
  try {
    const eps = await getEpisodes(title);
    clear(container);
    if (!eps.length) { 
      showMessage(container, 'No episodes found.'); 
      return; 
    }

    eps.forEach(ep => {
      const div = document.createElement('div');
      div.className = 'episode-card';
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.marginBottom = '10px';
      
      const epImg = document.createElement('img');
      epImg.src = ep.image || ep.thumbnail || ep.poster || 'anime.png';
      epImg.alt = ep.title || ep.name || 'Episode';
      epImg.onerror = () => { epImg.src = 'anime.png'; };
      epImg.style.width = '120px';
      epImg.style.height = '70px';
      epImg.style.objectFit = 'cover';
      epImg.style.borderRadius = '6px';
      epImg.style.marginRight = '10px';
      epImg.style.flexShrink = '0';

      const epInfo = document.createElement('div');
      epInfo.innerHTML = `<p><strong>Episode ${ep.number ?? ep.ep ?? ep.episode ?? '—'}:</strong> ${ep.title || ep.name || 'No title'}</p>`;

      div.appendChild(epImg);
      div.appendChild(epInfo);
      container.appendChild(div);
    });
  } catch (err) {
    console.error('Episodes error:', err);
    showMessage(container, 'Failed to load episodes. Check console for details.');
  }
}

async function renderAnimeList(page = 1) {
  if (isLoading || !hasMore) return;
  isLoading = true;
  selectors.spinner.style.display = 'block';
  try {
    const list = await getAnimeByPage(page);
    if (!list.length) {
      hasMore = false;
      selectors.spinner.innerHTML = '<p>No more anime to load.</p>';
      return;
    }
    list.forEach(a => selectors.animeList.appendChild(createAnimeCard(a)));
  } catch (err) {
    console.error('All anime load error:', err);
    if (!document.querySelector('#anime-list .message')) {
      showMessage(selectors.animeList, 'Failed to load list. See console for error.');
    }
  } finally {
    selectors.spinner.style.display = hasMore ? 'none' : 'block';
    isLoading = false;
  }
}

document.addEventListener('click', (ev) => {
  const card = ev.target.closest('.anime-card');
  if (!card) return;
  const title = card.dataset.title;
  if (!title) return console.warn('Clicked card without title');

  loadEpisodes(title);
});

selectors.searchInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    if (!q) return;
    doSearch(q);
  }
});

window.addEventListener('scroll', () => {
  const threshold = 150;
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - threshold)) {
    if (!isLoading && hasMore) {
      currentPage++;
      renderAnimeList(currentPage);
    }
  }
});

renderTrending();
renderAnimeList(currentPage);
