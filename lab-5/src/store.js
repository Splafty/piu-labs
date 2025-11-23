import { randomHsl } from "./helpers.js";

const STORAGE_KEY = "lab5_shapes";

class Store {
  constructor() {
    this.subscribers = [];

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    this.state = saved ?? { shapes: [] };
  }

  subscribe(fn) {
    this.subscribers.push(fn);
  }

  notify() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    this.subscribers.forEach(fn => fn(this.state));
  }

  addShape(type, color) {
    this.state.shapes.push({
      id: crypto.randomUUID(),
      type,
      color
    });
    this.notify();
  }

  removeShape(id) {
    this.state.shapes = this.state.shapes.filter(s => s.id !== id);
    this.notify();
  }

  recolor(type) {
    this.state.shapes
      .filter(s => s.type === type)
      .forEach(s => (s.color = randomHsl()));
    this.notify();
  }

  getCounts() {
    return {
      squares: this.state.shapes.filter(s => s.type === "square").length,
      circles: this.state.shapes.filter(s => s.type === "circle").length
    };
  }
}

export const store = new Store();
