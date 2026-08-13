/**
 * Site search against the published query index.
 *
 * Contract (da-cli / Configuration Service `default` index):
 *   GET /query-index.json?offset=&limit=
 *   columns: path, title, description, image, robots, lastModified
 *   The public index is live-only. Preview does not update it.
 *   This block reads every page of the index (limit 256) because facets
 *   and totals must be complete. The house is small; if it grows past
 *   a few hundred rows, move filtering to the index.
 */
const INDEX_PATH = '/query-index.json';
const PAGE_SIZE = 256;
const CHROME = new Set(['/nav', '/footer', '/search']);

function robotsNoindex(robots) {
  return String(robots || '').toLowerCase().includes('noindex');
}

function searchable(row) {
  const path = row.path || '';
  if (!path || CHROME.has(path)) return false;
  if (robotsNoindex(row.robots)) return false;
  return true;
}

function haystack(row) {
  return [row.title, row.description, row.path]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

async function fetchIndexPage(offset, acc) {
  const res = await fetch(`${INDEX_PATH}?offset=${offset}&limit=${PAGE_SIZE}`);
  if (!res.ok) throw new Error(`query-index ${res.status}`);
  const json = await res.json();
  const page = Array.isArray(json.data) ? json.data : [];
  const next = acc.concat(page);
  if (page.length < PAGE_SIZE) return next;
  return fetchIndexPage(offset + PAGE_SIZE, next);
}

async function fetchIndex() {
  const rows = await fetchIndexPage(0, []);
  return rows.filter(searchable);
}

function resultItem(row) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = row.path || '/';
  const title = document.createElement('strong');
  title.textContent = row.title || row.path || 'Untitled';
  a.append(title);
  if (row.description) {
    const p = document.createElement('p');
    p.textContent = row.description;
    a.append(p);
  }
  const path = document.createElement('span');
  path.className = 'search-path';
  path.textContent = row.path || '';
  a.append(path);
  li.append(a);
  return li;
}

function render(list, status, rows, query) {
  list.replaceChildren();
  const q = query.trim().toLowerCase();
  const hits = q
    ? rows.filter((row) => haystack(row).includes(q))
    : rows;

  if (!hits.length) {
    status.textContent = q
      ? `No published pages match “${query.trim()}”.`
      : 'The index is empty. Pages appear here after they are published.';
    return;
  }

  status.textContent = q
    ? `${hits.length} ${hits.length === 1 ? 'page' : 'pages'} for “${query.trim()}”`
    : `${hits.length} published pages`;
  hits.forEach((row) => list.append(resultItem(row)));
}

export default async function decorate(block) {
  const heading = block.querySelector('h1, h2');
  const lede = [...block.querySelectorAll('p')].find((p) => !p.querySelector('a.button'));

  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');

  const label = document.createElement('label');
  label.className = 'sr-only';
  label.htmlFor = 'site-search';
  label.textContent = 'Search published pages';

  const input = document.createElement('input');
  input.id = 'site-search';
  input.name = 'q';
  input.type = 'search';
  input.autocomplete = 'off';
  input.placeholder = 'Search the house';

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button primary';
  button.textContent = 'Search';

  form.append(label, input, button);

  const status = document.createElement('p');
  status.className = 'search-status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Reading the published index…';

  const list = document.createElement('ul');
  list.className = 'search-results';

  block.replaceChildren();
  if (heading) block.append(heading);
  if (lede) block.append(lede);
  block.append(form, status, list);

  const params = new URLSearchParams(window.location.search);
  if (params.has('q')) input.value = params.get('q');

  let rows = [];
  try {
    rows = await fetchIndex();
    render(list, status, rows, input.value);
  } catch {
    status.textContent = 'Search is not available. The query index is live-only — publish pages, then rebuild the index.';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const next = new URL(window.location.href);
    const q = input.value.trim();
    if (q) next.searchParams.set('q', q);
    else next.searchParams.delete('q');
    window.history.replaceState({}, '', next);
    render(list, status, rows, input.value);
  });
}
