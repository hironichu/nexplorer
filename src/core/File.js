const { fs , shell} = window.__TAURI__;
import ExplorerItem from "../components/ExplorerItem.js";

export default class File {
    
    constructor ({name, path, parent}) {
        if (!path || !name) throw new Error("No path or name provided");
        this.parent = parent;
        this.name = name;
        this.extension = window.__TAURI__.path.extname(path).then((ext) => ext.replace(".", "")).catch((_e) => "other");
        this.path = path
    }
    get type() {
        return this.extension;
    }
    get content() {
        return new Uint8Array();
        // try {
        //     const data = fs.readBinaryFile(this.path)
        //     return Promise.resolve(data);
        // } catch (e) {
        //     return Promise.reject(e);
        // }
    }
    get size() {
        return 0;
        // try {
        //     this.fileSize = this.content.then((data) => data.length);
        //     return this.fileSize;
        // } catch (e) {
        //     return Promise.reject(e);
        // }
    }
    get date() {
        return new Date();
    }
    /**
     * @name rename
     * @description Rename the file
     * @param {String} rename The new name of the file
     * @returns {Promise} A promise that resolves when the file is renamed
     */
    rename(rename) {
        fs.renameFile(this.path, rename).then(() => {
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
    open() {
        //use the shell to open the file
        try {
            shell.open(this.path);
        } catch (e) {
            return Promise.reject(e);
        }
    }
    delete() {
        try {
            fs.removeFile(this.path);
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
            },
            {
                text: "Properties",
                action: () => {}//this.parent.delete.bind(this.parent, this)
            }
        ]
    }
}

