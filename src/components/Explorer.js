
import ExplorerItem from "./ExplorerItem.js";
const { fs, path, dialog } = window.__TAURI__;
export default class Explorer extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.elements = new Map();
        this.history = [];
        this.selected = new Set();
        this.state = "init";
        this.Shadowstyle = document.createElement("style");
        this.explorer = document.createElement("div");
        this.explorer.classList.add("explorer");
        this.explorer.id = "explorer";
        this.focused = null;
        this.shadowRoot.append(this.Shadowstyle, this.explorer);
    }
    static get observedAttributes() {
        return ['path', 'data-mode', 'data-state'];
    }
    disconnectedCallback() {
        this.history.clear();
        this.elements.clear();
        this.explorer.innerHTML = "";
        this.shadowRoot.getElementById("explorer").innerHTML = "";
    }
    connectedCallback() {
        try {
            const compiled = window.scssParser(this.scss, {load_paths: [], style: "expanded", quiet: true})
            this.Shadowstyle.textContent = compiled;
            document.getElementById("currentPath").addEventListener("change", (e) => {
                this.setAttribute("path", e.target.value.trim());
            });
            this.explorer.addEventListener("click", (e) => {
                if (e.target.id === "explorer") {
                    this.selected.forEach((selitem) => {
                        selitem.removeAttribute("data-selected");
                    });
                    this.selected.clear();
                }
            });
            document.addEventListener("keydown", (e) => {
                if (e.key === "F5") {
                    this.refresh();
                }
            }, { passive: false });
        } catch (e) {
            console.error(e);
        }
    }

    async attributeChangedCallback(name, oldValue, newValue) {
        switch ( name ) {
            case "path":{
                if (this.dataset.state === "loading") return ;
                if (oldValue === newValue) return this.refresh();
                try {
                    newValue = await path.normalize(newValue);
                    newValue = newValue.replace(/\/$/, "");
                    //clear selected items
                    this.selected.forEach((selitem) => {
                        selitem.removeAttribute("data-selected");
                    });
                    this.selected.clear();
                    this.location = newValue;
                    document.getElementById("currentPath").value = newValue;
                    this.elements.clear();  
                    await this.getFiles(newValue);
                    this.renderItems();
                    this.history.push(newValue);
                } catch (e) {
                    dialog.message(e, { title: "Error", type: "error" });
                }
            } break;
            case "data-mode":{
                //
            } break;
            case "data-state":{
                this.state = newValue;
                if (newValue === "loading") {
                    this.explorer.classList.add("loading");
                }
                if (newValue === "init") {
                    this.explorer.classList.remove("loading");
                }
            } break;
            default: 
                //
            break;
        }

    }
    async refresh() {
        this.elements.clear();
        await this.getFiles(this.location);
        this.renderItems();
    }
    renderItems() {
        this.explorer.innerHTML = "";
        this.explorer.append(...this.elements.values());
        this.dataset.state = "init";
    }
    async getFiles(Localpath) {
        try {
            if (!Localpath || (Localpath === null || Localpath === "null") ) throw new Error("Invalid path");
            if (Localpath.length === 0) throw new Error("Path too short");
            if (this.dataset.state === "loading") return ;
            const dirs = await fs.readDir(Localpath);
            if (dirs.length <= 0) return ;
            dirs.map((data) => {
                let elem;
                if (data.children) {
                    elem = new ExplorerItem(data.name,0, { path: data.path, children: data.children }, this);
                } else {
                    elem = new ExplorerItem(data.name,1, { path: data.path }, this);
                }
                this.elements.set(data.name, elem);
            });
            //optimize
            this.elements = new Map([...this.elements.entries()].sort());
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
    delete(elem) {
        try {
            dialog.confirm("Are you sure you want to delete this item?", { title: "Delete", type: "warning" }).then((res) => {
                if (res) {
                    elem.delete();
                    this.refresh();
                }
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
    rename(_elem) {
        try {
            dialog.message("Under development", { title: "Rename", type: "info" });
            // prompt("Type the new name of the element").then((res) => {
            //     if (res && res.length > 0) {
            //         elem.rename(res);
            //         this.refresh();
            //     }
            // });
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
    selectItem(item, single = false, onebyone = false) {
        if (single) {
            if (onebyone){
                if (this.selected.has(item)) {
                    item.removeAttribute("data-selected");
                    this.selected.delete(item);
                } else {
                    item.setAttribute("data-selected", "");
                    this.selected.add(item);
                }
            } else {
                this.selected.forEach((selitem) => {
                    selitem.removeAttribute("data-selected");
                });
                this.selected.clear();
                item.setAttribute("data-selected", "");
                this.selected.add(item);
            }
        } else {
                if (this.selected.size > 0) {
                    const last = this.selected.values().next().value;
                    const elemArray = [...this.elements.values()];
                    const lastindex = elemArray.indexOf(last);
                    const thisindex = elemArray.indexOf(item);
                    const start = Math.min(lastindex, thisindex);
                    const end = Math.max(lastindex, thisindex);
                    const selected = elemArray.slice(start, end + 1);
                    selected.forEach((selitem) => {
                        selitem.setAttribute("data-selected", "");
                        this.selected.add(selitem);
                    });
                } else {
                    this.selectItem(item, true);
                }
        }
    }
    navigate (direction) {
        switch (direction) {
            case "forward": {

                const index = this.history.indexOf(this.location);
                if (index < this.history.length - 1) {
                    if (this.history[index + 1] && this.history[index + 1] !== this.location) {
                        this.setAttribute("path", this.history[index + 1]);
                    }
                }
            } break;
            case "back": {
                const index = this.history.indexOf(this.location);
                if (index > 0) {
                    this.setAttribute("path", this.history[index - 1]);
                }
            } break;
            default:
                //
            break;
        }
    }
    get scss() {
        return `
        @use "sass:list";
        @use "sass:map";
        $icons: ("file": "📄","folder": "📁","png": "🖼️","jpg": "🖼️","c": "👨‍💻","jpeg": "🖼️","mp4": "🎥","mov": "🎥","mkv": "🎥","mp3": "🎵","wave": "🎵","pdf": "📄","zip": "🗜️","rar": "🗜️","js": "👨‍💻","ts": "👨‍💻","rs": "👨‍💻","html": "👨‍💻","css": "👨‍💻","txt": "📄","md": "📄","other": "📄");    

        @mixin file_type() {
            @each $name, $glyph in $icons {
                &[data-itemtype="#{$name}"] {
                    &::before {
                        content: "#{$glyph}";
                    }
                }
            }
        }
        .explorer {
            position: relative;
            padding: 10px 10px;
            display: flex;
            flex-flow: wrap;
            height: 100%;
            width: 100%;
            margin: auto;
            overflow-x: hidden;
            overflow-y: auto;
            column-gap: 1rem;
            row-gap: 1rem;
            flex-direction: row;
            transition: all .2s ease-in-out;
            align-content: start;
            justify-content: stretch;
            box-shadow: 0 0 10px 0 rgba(0,0,0,0.2), 0 10px 20px 0 rgba(0,0,0,0.19);
            &.loading {
                opacity: 0.5;
                &::before {
                    content: "🕗";
                    text-transform: uppercase;
                    text-align: center;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    vertical-align: middle;
                    position: absolute;
                    top: 0;
                    color: white;
                    left: 0;
                    -webkit-backdrop-filter: blur(10px);
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 1);
                    z-index: 1;
                }
              }
            >.explorerItem {
            width: 100px;
            height: 100px;
            display: flex;
            justify-content: space-evenly;
            align-items: center;
            text-align: center;
            word-wrap: anywhere;
            border-radius: 4px;
            -webkit-user-select: none;
            flex-direction: column;
              user-select:none;
              &[data-selected] {
                background: rgba(0,0,0,0.1);
              }
              &::before {
                height: 50px;
                font-size: 4.1em;
                width: 50px;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 5px;
                display: flex;
                position: relative;
                transition: all 0.1s ease-in;
                backdrop-filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 1));
              }
              >h3 {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                width: 100px;
                height: 20px;
                font-size: 14px;
                word-wrap: break-word;
                word-break: break-word;
                user-select:none;
                margin: 0 auto;
                transition: all 0.2s ease-in-out;
                &[contenteditable="true"] {
                    border: 1px solid rgba(0,0,0,0.2);
                    border-radius: 5px;
                    padding: 5px;
                    background: rgba(255,255,255,0.5);
                    &:focus {
                        outline: none;
                    }
                }
              }
              &:hover {
                cursor: pointer;
                user-select:none;
                &::before {
                  transform: scale(1.15);
                }
              }
              @include file_type;
            }
          }`;
    }
}
if (!customElements.get('explorer-data')) {
    customElements.define("explorer-data", Explorer);
}