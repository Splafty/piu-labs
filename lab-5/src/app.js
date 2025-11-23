import { bindUI } from "./ui.js";
import { store } from "./store.js";

bindUI();
store.notify(); // pierwsze renderowanie
