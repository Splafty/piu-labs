(function () {
  const STORAGE_KEY = 'lab4_kanban_v2';
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const board = document.getElementById('board');

    const state = loadState() || {
      columns: [
        { id: 'todo', name: 'Do zrobienia', cards: [], sortAsc: true },
        { id: 'doing', name: 'W trakcie', cards: [], sortAsc: true },
        { id: 'done', name: 'Zrobione', cards: [], sortAsc: true },
      ],
    };

    // Render existing cards from state
    state.columns.forEach((col) => {
      const colEl = document.querySelector(`.column[data-col-id="${col.id}"]`);
      const cardsContainer = colEl.querySelector('.cards');
      cardsContainer.innerHTML = '';
      col.cards.forEach((card) =>
        cardsContainer.appendChild(createCardDOM(card, col.id))
      );
      updateCounter(colEl, col.cards.length);
    });

    // Event listeners
    board.addEventListener('click', boardClickHandler);
    board.addEventListener('input', boardInputHandler);
    board.addEventListener('blur', boardBlurHandler, true);
    board.addEventListener('keydown', boardKeydownHandler);

    saveState(state);
    loadYear();
  }

  function createCardDOM(card, colId) {
    const c = document.createElement('div');
    c.className = 'card';
    c.style.background = card.color || randomColor();
    c.dataset.cardId = card.id;
    c.dataset.colId = colId;

    const left = document.createElement('div');
    left.className = 'left';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = (card.content || '').split('\n')[0] || 'Nowa karta';

    const content = document.createElement('div');
    content.className = 'card-content';
    content.contentEditable = 'true';
    content.spellcheck = false;
    content.dataset.cardId = card.id;
    content.textContent = card.content || '';

    left.appendChild(title);
    left.appendChild(content);

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.innerHTML = `
      <button class="icon-btn move-left" title="Przenieś w lewo">←</button>
      <button class="icon-btn move-right" title="Przenieś w prawo">→</button>
      <button class="icon-btn color-card" title="Zmień kolor">🎨</button>
      <button class="icon-btn delete-card" title="Usuń">✕</button>
    `;

    c.append(left, actions);
    return c;
  }

  function boardClickHandler(e) {
    const target = e.target;
    const colEl = target.closest('.column');
    if (!colEl) return;
    const colId = colEl.dataset.colId;
    const cardsContainer = colEl.querySelector('.cards');
    let state = loadState();

    // Dodaj kartę
    if (target.closest('.add-card')) {
      const newCard = {
        id: idFor('card'),
        content: 'Nowa karta',
        color: randomColor(),
      };
      const col = state.columns.find((c) => c.id === colId);
      col.cards.push(newCard);
      saveState(state);
      cardsContainer.appendChild(createCardDOM(newCard, colId));
      updateCounter(colEl, col.cards.length);
      return;
    }

    // Koloruj kolumnę
    if (target.closest('.color-col')) {
      const col = state.columns.find((c) => c.id === colId);
      col.cards.forEach((c) => (c.color = randomColor()));
      saveState(state);
      [...cardsContainer.children].forEach((cardEl, i) => {
        cardEl.style.background = col.cards[i].color;
      });
      return;
    }

    // Sortuj kolumnę
    if (target.closest('.sort-col')) {
      const col = state.columns.find((c) => c.id === colId);
      col.sortAsc = !col.sortAsc;
      col.cards.sort((a, b) => {
        const ta = a.content.trim().toLowerCase();
        const tb = b.content.trim().toLowerCase();
        return col.sortAsc ? ta.localeCompare(tb) : tb.localeCompare(ta);
      });
      saveState(state);
      cardsContainer.innerHTML = '';
      col.cards.forEach((c) =>
        cardsContainer.appendChild(createCardDOM(c, colId))
      );
      colEl.querySelector('.sort-indicator').textContent = col.sortAsc
        ? '▲'
        : '▼';
      return;
    }

    // Karta
    const cardEl = target.closest('.card');
    if (!cardEl) return;
    const cardId = cardEl.dataset.cardId;

    // Usuń kartę
    if (target.closest('.delete-card')) {
      state = removeCard(state, cardId);
      saveState(state);
      cardEl.remove();
      refreshAllCounters();
      return;
    }

    // Zmień kolor karty
    if (target.closest('.color-card')) {
      const newColor = randomColor();
      const cardInfo = findCard(state, cardId);
      if (cardInfo) cardInfo.card.color = newColor;
      saveState(state);
      cardEl.style.background = newColor;
      return;
    }

    // Przenieś w lewo/prawo
    const allCols = [...document.querySelectorAll('.column')];
    const currentIndex = allCols.indexOf(colEl);
    if (target.closest('.move-left') && currentIndex > 0) {
      moveCard(state, cardId, -1);
      saveState(state);
      rebuildCards(state);
      return;
    }
    if (target.closest('.move-right') && currentIndex < allCols.length - 1) {
      moveCard(state, cardId, +1);
      saveState(state);
      rebuildCards(state);
      return;
    }
  }

  function boardInputHandler(e) {
    if (e.target.classList.contains('card-content')) {
      const cardId = e.target.dataset.cardId;
      const state = loadState();
      const cardInfo = findCard(state, cardId);
      if (cardInfo) {
        cardInfo.card.content = e.target.textContent;
        saveState(state);
      }
      const title = e.target
        .closest('.card')
        .querySelector('.card-title');
      title.textContent = (e.target.textContent || '').split('\n')[0];
    }
  }

  function boardBlurHandler(e) {
    if (e.target.classList.contains('card-content')) {
      const cardId = e.target.dataset.cardId;
      const state = loadState();
      const cardInfo = findCard(state, cardId);
      if (cardInfo) {
        cardInfo.card.content = e.target.textContent;
        saveState(state);
      }
    }
  }

  function boardKeydownHandler(e) {
    if (e.target.classList.contains('card-content') && e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
  }

  // ---------- Helpers ----------
  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function removeCard(state, cardId) {
    state.columns.forEach((col) => {
      col.cards = col.cards.filter((c) => c.id !== cardId);
    });
    return state;
  }

  function findCard(state, cardId) {
    for (const col of state.columns) {
      for (const card of col.cards) {
        if (card.id === cardId) return { col, card };
      }
    }
    return null;
  }

  function moveCard(state, cardId, dir) {
    const cols = state.columns;
    let fromIndex = -1;
    let cardData = null;
    cols.forEach((col, i) => {
      const idx = col.cards.findIndex((c) => c.id === cardId);
      if (idx !== -1) {
        fromIndex = i;
        [cardData] = col.cards.splice(idx, 1);
      }
    });
    if (cardData && cols[fromIndex + dir])
      cols[fromIndex + dir].cards.push(cardData);
  }

  function rebuildCards(state) {
    state.columns.forEach((col) => {
      const colEl = document.querySelector(`.column[data-col-id="${col.id}"]`);
      const cardsContainer = colEl.querySelector('.cards');
      cardsContainer.innerHTML = '';
      col.cards.forEach((c) =>
        cardsContainer.appendChild(createCardDOM(c, col.id))
      );
      updateCounter(colEl, col.cards.length);
    });
  }

  function idFor(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function randomColor() {
    const h = Math.floor(Math.random() * 360);
    const s = 70 - Math.floor(Math.random() * 10);
    const l = 50 - Math.floor(Math.random() * 6);
    return `hsl(${h} ${s}% ${l}%)`;
  }

  function updateCounter(colEl, value) {
    const counter = colEl.querySelector('.counter');
    counter.textContent =
      value ?? colEl.querySelectorAll('.card').length;
  }

  function refreshAllCounters() {
    document.querySelectorAll('.column').forEach((colEl) => {
      updateCounter(colEl);
    });
  }

  function loadYear() {
    const year = document.getElementById('copyright-year');
    year.textContent = new Date().getFullYear();
  }
})();