import { store } from "./store.js";
import { randomHsl } from "./helpers.js";

const board = document.getElementById("board");
const cntSquares = document.getElementById("cntSquares");
const cntCircles = document.getElementById("cntCircles");

store.subscribe(render);

function render(state) {
  const existingEls = [...board.children];

  state.shapes.forEach(shape => {
    let el = existingEls.find(e => e.dataset.id === shape.id);

    // jeśli nie istnieje to dodaj
    if (!el) {
      el = document.createElement("div");
      el.className = `shape ${shape.type}`;
      el.dataset.id = shape.id;
      board.appendChild(el);
    }

    // AKTUALIZACJA KOLORU - BEZ TEGO NIE DZIALA I JEST LIPA
    el.style.backgroundColor = shape.color;
  });

  // usuń elementy których nie ma w stanie
  existingEls.forEach(el => {
    if (!state.shapes.some(s => s.id === el.dataset.id)) {
      el.remove();
    }
  });

  const { squares, circles } = store.getCounts();
  cntSquares.textContent = squares;
  cntCircles.textContent = circles;
}


board.addEventListener("click", e => {
  if (e.target.classList.contains("shape")) {
    store.removeShape(e.target.dataset.id);
  }
});

export function bindUI() {
  document.getElementById("addSquare").onclick = () =>
    store.addShape("square", randomHsl());

  document.getElementById("addCircle").onclick = () =>
    store.addShape("circle", randomHsl());

  document.getElementById("recolorSquares").onclick = () =>
    store.recolor("square");

  document.getElementById("recolorCircles").onclick = () =>
    store.recolor("circle");
}
