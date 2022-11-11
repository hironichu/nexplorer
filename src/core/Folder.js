const { fs } = window.__TAURI__;
const { invoke } = window.__TAURI__.tauri;
// import ExplorerItem from "../components/ExplorerItem.js";

export default class Folder {
    constructor ({name, path, children = [], parent}) {
        this.parent = parent;
        this.name = name
        this.path = path
        this.children = children
    }
    get type() {
        return "folder"
    }
    get files() {
        return this.children.filter((child) => child.children === undefined);
    }
    get folders() {
        return this.children.filter((child) => child.children !== undefined);
    }
    /**
     * @name rename
     * @description Rename the folder
     * @param {String} rename The new name of the folder
     * @returns {Promise} A promise that resolves when the folder is renamed
     */
    async rename(rename) {
        return await invoke("rename_dir", {path: this.path, rename}).then(() => {
            this.name = rename;
        }).catch((e) => {
            throw e;
        });
    }
    /**
     * @name move
     * @description Move the folder to a new location
     * @param {DragEvent} event The event that triggered the function
     * @param {Folder} target The target folder
     * @returns {Promise} A promise that resolves when the folder is moved
     */
   async move(event, target) {
        const _ = event;
        const targetPath = target.getAttribute("path");
        return await fs.move(this.path, targetPath).then(() => {
            this.parent.refresh();
        }).catch((e) => {
            throw e;
        });
    }
    addFile (file) {
        // const fileObj = new File(file)
        // this.children.push(fileObj);
    }
    open() {
        this.parent.setAttribute("path", this.path);
    }
    delete() {
        try {
            fs.removeDir(this.path);
            this.parent.refresh();
        } catch (e) {
            return Promise.reject(e);
        }
    }
    getContextOptions() {
        return [
            {
                text: "Open",
                action: this.open.bind(this)
            },
            {
                text: "Rename",
                action: this.parent.rename.bind(this.parent, this)
            },
            {
                text: "Delete",
                action: this.parent.delete.bind(this.parent, this)
            }
        ]
    }
}