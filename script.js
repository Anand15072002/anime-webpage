const API_BASE = "https://animeapi.skin";
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let trendingAnimeList = [];
let currentAnimeData = null;
let currentPageName = 'home';
let previousPage = 'home';

const selectors = {
  trending: document.getElementById('trending-list'),
  searchList: document.getElementById('search-list'),
  animeList: document.getElementById('anime-list'),
  spinner: document.getElementById('loading-spinner'),
  searchInput: document.querySelector('.search'),
  homePage: document.getElementById('home-page'),
  detailPage: document.getElementById('detail-page'),
  searchSection: document.getElementById('search-section'),
  fullAnimeList: document.getElementById('full-anime-list'),
  newSeasonsList: document.getElementById('new-seasons-list'),
  popularList: document.getElementById('popular-list')
};


function toggleMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('active');
}

function showPage(pageName) {
  
  document.querySelectorAll('.page-section').forEach(page => {
    page.classList.remove('active');
  });

  selectors.detailPage.style.display = 'none';

  document.getElementById('hamburger').classList.remove('active');
  document.getElementById('nav-links').classList.remove('active');

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

  previousPage = currentPageName;
  currentPageName = pageName;

  switch (pageName) {
    case 'home':
      document.getElementById('home-page').classList.add('active');
      document.title = 'Anime Streaming';
      break;
    case 'anime-list':
      document.getElementById('anime-list-page').classList.add('active');
      document.title = 'Complete Anime List - Anime Streaming';
      loadFullAnimeList();
      break;
    case 'new-seasons':
      document.getElementById('new-seasons-page').classList.add('active');
      document.title = 'New Seasons - Anime Streaming';
      loadNewSeasons();
      break;
    case 'popular':
      document.getElementById('popular-page').classList.add('active');
      document.title = 'Popular Anime - Anime Streaming';
      loadPopularAnime();
      break;
  }

  window.scrollTo(0, 0);
}

function goBack() {
  showPage(previousPage);
}

function showDetailPage(animeData) {
  currentAnimeData = animeData;
  document.querySelectorAll('.page-section').forEach(page => {
    page.classList.remove('active');
  });
  selectors.detailPage.style.display = 'block';

  const title = animeData.title || animeData.name || 'Anime Details';
  document.title = `${title} - Anime Streaming`;

  updateDetailPage(animeData);
  loadAnimeDetails(title);
  window.scrollTo(0, 0);
}

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
  const card = document.createElement('div');
  card.className = 'anime-card';
  card.dataset.title = anime.title || anime.name || anime.title_en || '';

  const img = document.createElement('img');
  img.src = anime.image || anime.img || anime.thumbnail || anime.thumbnail_url || anime.poster || anime.coverImage || anime.image_url || 'https://via.placeholder.com/150x180/333/fff?text=No+Image';
  img.alt = anime.title || anime.name || 'anime';
  img.onerror = () => { img.src = 'https://via.placeholder.com/150x180/333/fff?text=No+Image'; };
  card.appendChild(img);

  const p = document.createElement('p');
  p.textContent = anime.title || anime.name || 'Untitled';
  card.appendChild(p);

  return card;
}

async function loadFullAnimeList() {
  const container = selectors.fullAnimeList;
  if (container.innerHTML.includes('Loading complete')) {
    showMessage(container, 'Loading complete anime list...');
    try {
      const list = await getAnimeByPage(1);
      clear(container);
      if (!list.length) {
        showMessage(container, 'No anime found.');
        return;
      }
      list.forEach(a => container.appendChild(createAnimeCard(a)));
    } catch (err) {
      console.error('Full anime list error:', err);
      showMessage(container, 'Failed to load anime list.');
    }
  }
}

async function loadNewSeasons() {
  const container = selectors.newSeasonsList;
  if (container.innerHTML.includes('Loading new')) {
    showMessage(container, 'Loading new seasonal anime...');
    try {
      const list = await getTrendingAnime();
      clear(container);
      if (!list.length) {
        showMessage(container, 'No new seasons found.');
        return;
      }
      list.forEach(a => container.appendChild(createAnimeCard(a)));
    } catch (err) {
      console.error('New seasons error:', err);
      showMessage(container, 'Failed to load new seasons.');
    }
  }
}

async function loadPopularAnime() {
  const container = selectors.popularList;
  if (container.innerHTML.includes('Loading popular')) {
    showMessage(container, 'Loading popular anime...');
    try {
      const list = await getTrendingAnime();
      clear(container);
      if (!list.length) {
        showMessage(container, 'No popular anime found.');
        return;
      }
      list.forEach(a => container.appendChild(createAnimeCard(a)));
    } catch (err) {
      console.error('Popular anime error:', err);
      showMessage(container, 'Failed to load popular anime.');
    }
  }
}

function updateFeaturedAnime(animeDetails) {
  const featuredImg = document.getElementById('featured-img');
  const featuredTitle = document.getElementById('featured-title');
  const featuredDescription = document.getElementById('featured-description');
  const featuredEpisodes = document.getElementById('featured-episodes');
  const featuredTags = document.getElementById('featured-tags');

  const animeImage = animeDetails.image || animeDetails.img || animeDetails.thumbnail || animeDetails.thumbnail_url || animeDetails.poster || animeDetails.coverImage || animeDetails.image_url || 'https://via.placeholder.com/280x350/333/fff?text=No+Image';
  featuredImg.src = animeImage;
  featuredImg.alt = animeDetails.title || animeDetails.name || 'Featured Anime';
  featuredImg.onerror = () => { featuredImg.src = 'https://via.placeholder.com/280x350/333/fff?text=No+Image'; };

  const animeTitle = animeDetails.title || animeDetails.name || animeDetails.title_english || animeDetails.title_romaji || 'Untitled Anime';
  featuredTitle.textContent = animeTitle;

  const animeDescription = animeDetails.description || animeDetails.synopsis || animeDetails.summary || animeDetails.plot || animeDetails.overview || `${animeTitle} - Complete anime series with episodes available for streaming. Watch now with subtitles and high definition quality.`;
  featuredDescription.textContent = animeDescription;

  let episodeText = '';
  const totalEps = animeDetails.episodes || animeDetails.totalEpisodes || animeDetails.episode_count || animeDetails.episodeCount;
  const duration = animeDetails.duration || animeDetails.episodeDuration || animeDetails.episode_duration || '24m';
  const status = animeDetails.status || animeDetails.airing_status || animeDetails.air_status;
  const year = animeDetails.year || animeDetails.releaseDate || animeDetails.aired?.from || animeDetails.release_date || '';

  if (totalEps) {
    episodeText = `EP ${totalEps}`;
  } else {
    episodeText = 'Episodes Available';
  }

  if (duration) episodeText += ` · ${duration}`;
  if (status) episodeText += ` · ${status}`;
  if (year) {
    const yearOnly = typeof year === 'string' ? year.substring(0, 4) : year.toString().substring(0, 4);
    episodeText += ` · ${yearOnly}`;
  }

  featuredEpisodes.textContent = episodeText;

  featuredTags.innerHTML = '';
  const subSpan = document.createElement('span');
  subSpan.textContent = 'SUB';
  featuredTags.appendChild(subSpan);

  const hdSpan = document.createElement('span');
  hdSpan.textContent = 'HD';
  featuredTags.appendChild(hdSpan);

  if (animeDetails.dub || animeDetails.hasDub || animeDetails.dubbed || animeDetails.dub_available) {
    const dubSpan = document.createElement('span');
    dubSpan.textContent = 'DUB';
    featuredTags.appendChild(dubSpan);
  }
}

function selectRandomFeaturedAnime(animeList) {
  if (animeList && animeList.length > 0) {
    const randomIndex = Math.floor(Math.random() * animeList.length);
    const randomAnime = animeList[randomIndex];
    updateFeaturedAnime(randomAnime);
  }
}

function updateDetailPage(animeData) {
  const detailBg = document.getElementById('detail-bg');
  const detailPoster = document.getElementById('detail-poster');
  const detailTitle = document.getElementById('detail-title');
  const detailMeta = document.getElementById('detail-meta');
  const detailTags = document.getElementById('detail-tags');
  const detailDescription = document.getElementById('detail-description');

  const animeImage = animeData.image || animeData.img || animeData.thumbnail || animeData.thumbnail_url || animeData.poster || animeData.coverImage || animeData.image_url || 'https://via.placeholder.com/220x300/333/fff?text=No+Image';

  detailBg.src = animeImage;
  detailPoster.src = animeImage;
  detailPoster.onerror = () => { detailPoster.src = 'https://via.placeholder.com/220x300/333/fff?text=No+Image'; };
  detailBg.onerror = () => { detailBg.src = 'https://via.placeholder.com/800x400/333/fff?text=Background'; };

  const animeTitle = animeData.title || animeData.name || animeData.title_english || animeData.title_romaji || 'Untitled Anime';
  detailTitle.textContent = animeTitle;

  let metaInfo = [];
  const totalEps = animeData.episodes || animeData.totalEpisodes || animeData.episode_count || animeData.episodeCount;
  const duration = animeData.duration || animeData.episodeDuration || animeData.episode_duration || '24m';
  const status = animeData.status || animeData.airing_status || animeData.air_status;
  const year = animeData.year || animeData.releaseDate || animeData.aired?.from || animeData.release_date || '';

  if (totalEps) metaInfo.push(`${totalEps} Episodes`);
  if (duration) metaInfo.push(duration);
  if (status) metaInfo.push(status);
  if (year) {
    const yearOnly = typeof year === 'string' ? year.substring(0, 4) : year.toString().substring(0, 4);
    metaInfo.push(yearOnly);
  }

  detailMeta.innerHTML = metaInfo.join(' <span style="color: #666;">•</span> ') || 'Loading details...';

  detailTags.innerHTML = '';
  const subSpan = document.createElement('span');
  subSpan.textContent = 'SUB';
  detailTags.appendChild(subSpan);

  const hdSpan = document.createElement('span');
  hdSpan.textContent = 'HD';
  detailTags.appendChild(hdSpan);

  if (animeData.dub || animeData.hasDub || animeData.dubbed || animeData.dub_available) {
    const dubSpan = document.createElement('span');
    dubSpan.textContent = 'DUB';
    detailTags.appendChild(dubSpan);
  }

  if (animeData.type || animeData.format || animeData.media_type) {
    const animeType = animeData.type || animeData.format || animeData.media_type;
    const typeSpan = document.createElement('span');
    typeSpan.textContent = animeType.toUpperCase();
    typeSpan.style.backgroundColor = '#444';
    typeSpan.style.color = '#00ff88';
    detailTags.appendChild(typeSpan);
  }

  const genres = animeData.genres || animeData.genre || animeData.categories || [];
  if (Array.isArray(genres) && genres.length > 0) {
    genres.slice(0, 4).forEach(genre => {
      const genreSpan = document.createElement('span');
      const genreName = typeof genre === 'string' ? genre : (genre.name || genre.title || genre);
      genreSpan.textContent = genreName;
      genreSpan.style.backgroundColor = '#333';
      genreSpan.style.color = '#ffcc00';
      detailTags.appendChild(genreSpan);
    });
  }

  if (animeData.rating || animeData.score || animeData.mal_score || animeData.imdb_rating) {
    const rating = animeData.rating || animeData.score || animeData.mal_score || animeData.imdb_rating;
    const ratingSpan = document.createElement('span');
    ratingSpan.textContent = `★${rating}`;
    ratingSpan.style.backgroundColor = '#ff6b35';
    ratingSpan.style.color = '#fff';
    detailTags.appendChild(ratingSpan);
  }

  const animeDescription = animeData.description || animeData.synopsis || animeData.summary || animeData.plot || animeData.overview || `${animeTitle} - Complete anime series with episodes available for streaming. Watch now with subtitles and high definition quality.`;
  detailDescription.textContent = animeDescription;
}

async function loadAnimeDetails(title) {
  const episodesContainer = document.getElementById('detail-episodes-container');

  try {
    showMessage(episodesContainer, 'Loading detailed anime information...');
    const animeDetails = await getAnimeDetails(title);

    if (animeDetails && (animeDetails.title || animeDetails.name)) {
      updateDetailPage({ ...currentAnimeData, ...animeDetails });
    }
  } catch (err) {
    console.warn('Failed to fetch anime details:', err);
  }

  showMessage(episodesContainer, `Loading episodes for "${title}"...`);
  try {
    const eps = await getEpisodes(title);
    clear(episodesContainer);

    if (!eps.length) {
      showMessage(episodesContainer, 'No episodes found for this anime.');
      return;
    }

    const episodesWrapper = document.createElement('div');
    episodesWrapper.className = 'episodes-wrapper';

    eps.forEach((ep, index) => {
      const div = document.createElement('div');
      div.className = 'episode-card';

      const epImg = document.createElement('img');
      epImg.src = ep.image || ep.thumbnail || ep.thumbnail_url || ep.poster || 'https://via.placeholder.com/280x160/333/fff?text=Episode';
      epImg.alt = ep.title || ep.name || 'Episode';
      epImg.onerror = () => { epImg.src = 'https://via.placeholder.com/280x160/333/fff?text=Episode'; };

      const epInfo = document.createElement('div');
      epInfo.className = 'episode-info';

      const epNumber = ep.number ?? ep.ep ?? ep.episode ?? (index + 1);
      const epTitle = ep.title || ep.name || `Episode ${epNumber}`;
      const epDuration = ep.duration || '~24 min';

      epInfo.innerHTML = `
                        <div class="episode-number">Episode ${epNumber}</div>
                        <div class="episode-title">${epTitle}</div>
                        <div class="episode-duration">${epDuration}</div>
                    `;

      div.appendChild(epImg);
      div.appendChild(epInfo);
      episodesWrapper.appendChild(div);
    });

    episodesContainer.appendChild(episodesWrapper);
  } catch (err) {
    console.error('Episodes error:', err);
    showMessage(episodesContainer, 'Failed to load episodes. Please try again later.');
  }
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

async function getAnimeDetails(title) {
  return await fetchJSON(`${API_BASE}/info?title=${encodeURIComponent(title)}`);
}

async function renderTrending() {
  const container = selectors.trending;
  showMessage(container, 'Loading trending anime...');
  try {
    const list = await getTrendingAnime();
    trendingAnimeList = list;
    clear(container);
    if (!list.length) {
      showMessage(container, 'No trending anime found.');
      return;
    }

    list.forEach(a => container.appendChild(createAnimeCard(a)));
    selectRandomFeaturedAnime(list);

  } catch (err) {
    console.error('Trending error:', err);
    showMessage(container, 'Failed to load trending. Check console for details.');

    const fallbackAnime = {
      title: "Popular Anime Collection",
      name: "Popular Anime Collection",
      description: "Explore our vast collection of popular anime series and movies. From action-packed adventures to heartwarming slice-of-life stories, discover your next favorite anime here.",
      type: "Collection",
      status: "Available",
      year: "2024"
    };
    updateFeaturedAnime(fallbackAnime);
  }
}

async function doSearch(keyword) {
  const container = selectors.searchList;
  const searchSection = selectors.searchSection;
  searchSection.classList.remove('hidden');

  showMessage(container, `Searching for "${keyword}"...`);
  try {
    const list = await searchAnime(keyword);
    clear(container);
    if (!list.length) {
      showMessage(container, 'No results found.');
      return;
    }
    list.forEach(a => container.appendChild(createAnimeCard(a)));
  } catch (err) {
    console.error('Search error:', err);
    showMessage(container, 'Search failed. Check console for details.');
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

  const img = card.querySelector('img');
  const titleText = card.querySelector('p').textContent;

  const clickedAnimeData = {
    title: titleText,
    name: titleText,
    image: img.src.includes('placeholder') ? null : img.src,
    description: `Loading detailed information for ${titleText}. Please wait while we fetch the complete anime details including synopsis, episode count, release year, and more...`,
    type: 'Anime',
    status: 'Loading details...',
    year: 'Fetching...'
  };

  showDetailPage(clickedAnimeData);
});

document.getElementById('featured-img').addEventListener('click', () => {
  if (trendingAnimeList.length > 0) {
    const randomAnime = trendingAnimeList[Math.floor(Math.random() * trendingAnimeList.length)];
    showDetailPage(randomAnime);
  }
});

selectors.searchInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    if (!q) {
      selectors.searchSection.classList.add('hidden');
      return;
    }
    doSearch(q);
  }
});

document.addEventListener('click', (e) => {
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.getElementById('hamburger');

  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    navLinks.classList.remove('active');
    hamburger.classList.remove('active');
  }
});

window.addEventListener('scroll', () => {
  if (selectors.detailPage.style.display !== 'none') return;
  if (currentPageName !== 'home') return;

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