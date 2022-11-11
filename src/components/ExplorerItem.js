import Filetype from "../core/Filetype.js";
import File from "../core/File.js";
import Folder from "../core/Folder.js";
const { fs, path, dialog } = window.__TAURI__;
export default class ExplorerItem extends HTMLElement {
  constructor(name = null, type = 0, config = null, parent = null) {
    super();
    if (name.length < 1) return; //
    if (type !== 0 && type !== 1) throw new Error("No Type provided");
    this.focus = false;
    this.name = name;
    this.type = type === 0 ? "folder" : "file";
    this.config = config;
    this.config.parent = parent;
    this.parent = parent;
    if (!this.parent) throw new Error("Parent not found");
    this.object = type == 0
      ? new Folder({ name, ...config })
      : new File({ name, ...config });
    this.dataset.name = this.name;
    this.dataset.type = this.type;
    this.classList.add("explorerItem");
    const nameFile = document.createElement("h3");
    nameFile.classList.add("explorerItemName");
    nameFile.textContent = this.name;
    this.insertAdjacentElement("beforeend", nameFile);
    this.getExt();
    this.setIcon();
    this.initEvents();
  }
  getExt() {
    if (this.type == "file" && this.config !== null) {
      path.extname(this.config.path).then((ext) => {
        this.config.extension = ext.replace(".", "");
      }).catch((_) => {
        this.config.extension = "other";
      });
    }
  }
  setIcon() {
    if (this.type == "file" && this.config !== null) {
      const type = Filetype[this.config.extension]
        ? this.config.extension
        : "other";
      this.dataset.itemtype = type;
    } else {
      this.dataset.itemtype = "folder";
    }
  }
  initEvents() {
    this.on("click", (e) => {
      if (e.shiftKey && !e.ctrlKey) {
        this.parent.selectItem(e.target);
      } else if (e.ctrlKey && !e.shiftKey) {
        this.parent.selectItem(e.target, true, true);
      } else {
        this.parent.selectItem(e.target, true);
      }
      e.preventDefault();
      return false;
    }, { capture: true });
    this.on("dblclick", async (e) => {
      try {
        this.object.open();
      } catch (e) {
        await dialog.message(e, { title: "Error", type: "error" });
      }
      e.preventDefault();
      return false;
    }, { capture: true });
    this.on("contextmenu", (e) => {
      if (e.button == 2) {
        window.ContextMenu.show(e, this);
      }
      e.preventDefault();
      return false;
    }, { capture: true, passive: false });
  }
  async connectedCallback() {
    if (this.type == "file") {
      this.size = await this.object.size ?? NaN;
    }
  }
  disconnectedCallback() {
  }
  attributeChangedCallback(name, oldValue, newValue) {
    console.log("Attribute changed");
  }

  static get observedAttributes() {
    return ["name", "hidden"];
  }
  //add event listeners
  on(event, callback) {
    this.addEventListener(event, callback);
  }
  //remove event listeners
  off(event, callback) {
    this.removeEventListener(event, callback);
  }
  //dispatch events
  emit(event, data) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

//Check if defined and register
if (!customElements.get("explorer-item")) {
  customElements.define("explorer-item", ExplorerItem);
}
