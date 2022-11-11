import { str } from "https://deno.land/x/denosass@1.0.4/src/api.js";
export default class ContextMenu extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.Shadowstyle = document.createElement("style");
    this.classList.add("context-menu");
    this.elemOptions = document.createElement("div");
    this.elemOptions.classList.add("context-options");
    this.options = new Map();
    this.shadow.append(this.Shadowstyle, this.elemOptions);
  }
  static get observedAttributes() {
    return ["active"];
  }
  connectedCallback() {
    try {
        const compiled = str(this.scss, {load_paths: [], style: "expanded", quiet: true})
        this.Shadowstyle.textContent = compiled;
    } catch (e) {
        console.error(e);
    }
  }
  get scss(){
    return ` 
    .context-menu-option {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 150px;
      padding: 10px 10px;
      font-size: 1.1em;
      font-weight: 100;
      color: black;
      font-family: monospace;
      cursor: pointer;
      transition: background 100ms ease-in;
        &:hover {
          background: #eee;
        }
        >.context-options {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          width: 50px;
        }
    }`;
  }
  disconnectedCallback() {
  }
  adoptedCallback() {
    console.log("Adopted");
  }
  async attributeChangedCallback(name, _oldValue, newValue) {
    switch (name) {
      case "active":
        {
          if (newValue === "true") {
            this.classList.add("active");
          } else {
            this.classList.remove("active");
          }
        }
        break;
    }
  }
  show(event, elem) {
    this.elemOptions.innerHTML = "";
    this.focus();
    this.object = elem;
    this.getOptions(elem.object.getContextOptions())
    //check if the mouse is at either edge to prevent the menu from going off screen
    if (event.clientX > window.innerWidth - 150) {
      this.style.left = `${event.clientX - 150}px`;
    } else {
      this.style.left = `${event.clientX + 20}px`;
    }
    if (event.clientY > window.innerHeight - 150) {
      this.style.top = `${event.clientY - 150}px`;
    } else {
      this.style.top = `${event.clientY}px`;
    }
    this.setAttribute("active", "true");
  }
  getOptions(ctxOpts) {
    ctxOpts.forEach((option) => {
      const opt = document.createElement("div");
      opt.classList.add("context-menu-option");
      opt.textContent = option.text;
      opt.addEventListener("click", option.action.bind(this), { capture: true });
      this.elemOptions.append(opt);
    });
  }
  close() {
    this.elemOptions.innerHTML = "";
    this.object = null;
    this.options.clear();
    //clear the content
    this.setAttribute("active", "false");
  }
}

customElements.define("context-menu", ContextMenu);
