/**
 * World split — raise / ship / pipe (Norris on-track / off-track analog).
 * Authoring: one row of three cells, or three rows of one cell.
 * First heading is the world name. Last link is the door.
 */

function cellsFromBlock(block) {
  const rows = [...block.children];
  if (rows.length === 1) {
    return [...rows[0].children];
  }
  return rows.map((row) => row.querySelector(':scope > div') || row);
}

export default function decorate(block) {
  const list = document.createElement('div');
  list.className = 'ws-list';

  cellsFromBlock(block).forEach((cell) => {
    const world = document.createElement('article');
    world.className = 'ws-world';
    world.append(...cell.childNodes);

    const heading = world.querySelector('h2, h3');
    if (heading) heading.classList.add('ws-name');

    const links = [...world.querySelectorAll('a')];
    const last = links[links.length - 1];
    if (last?.parentElement) last.parentElement.classList.add('ws-door');

    list.append(world);
  });

  block.replaceChildren(list);
}
