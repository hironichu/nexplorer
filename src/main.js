///deno-lint-ignore-file
///deno-fmt-ignore-file
// const { invoke } = window.__TAURI__.tauri;
const { path, process, dialog } = window.__TAURI__;
import { str } from "https://deno.land/x/denosass@1.0.4/src/api.js";
window.scssParser = str;
window.containerDiv;
window.CURRENT_DIR = "";
window.SHOW_EXT = false;
window.SHOW_HIDDEN = false;
window.EXPLORERS = [];
window.ACTIVE = null;
window.ContextMenu;
import "./components/Explorer.js";
import "./components/ContextMenu.js";
// import Explorer from "./components/Explorer.js";
///
/// -
///

window.newExplorer = function (ACTIVE_PATH) {
  if (window.containerDiv === undefined || window.containerDiv === "") return;
  const explorer = document.createElement("explorer-data");
  explorer.setAttribute("path", ACTIVE_PATH);
  explorer.dataset.hidden = SHOW_HIDDEN;
  explorer.dataset.ext = SHOW_EXT;
  window.ACTIVE = explorer;
  window.containerDiv.insertAdjacentElement(
    "beforeend",
    explorer,
  );
  explorer.dataset.state = "init";
};

(async () => {
  try {
    if (CURRENT_DIR === "") {
      CURRENT_DIR = await path.homeDir();
    }

    window.ContextMenu = document.getElementsByTagName("context-menu")[0];
    window.containerDiv = document.getElementById("container");
    // //add a listener to click on document, if the contextMenu is open, close it
    document.addEventListener("click", (e) => {
      if (e.target.tagName !== "context-menu") {
        ContextMenu.close();
      }
      //check if we are clicking on an explorer, if so change the active explorer
      if (e.target.tagName === "explorer-data") {
        ACTIVE = e.target;
      }
      e.preventDefault();
      return false;
    }, { capture: true });
    newExplorer(CURRENT_DIR);
    document.querySelector("[data-action='refresh']").addEventListener("click", () => window.ACTIVE.refresh());
    document.querySelector("[data-action='forward']").addEventListener("click", () => window.ACTIVE.navigate("forward"));
    document.querySelector("[data-action='back']").addEventListener("click", () => window.ACTIVE.navigate("back"));
  } catch (e) {
    const diag = dialog.message(e, { title: "Error", type: "error" });
    Promise.all([diag]).then(() => {
      process.exit(0);
    });
  }
})();

document.addEventListener("DOMContentLoaded", async () => {
});
