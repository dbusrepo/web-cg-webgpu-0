import ComponentBase from "../component-base.js";

import css from "dom-css";
// import screenfull from "screenfull";

import "./menu-bar.css";

// const addFullButton = (parent, text, ) => {
// };

export class MenuBar extends ComponentBase {
    constructor(root, opts, theme) {
        super(root, opts, theme, false);

        // Create menu bar
        this.element = document.createElement("div");
        this.element.classList.add("guify-bar");
        root.appendChild(this.element);

        if (opts.title) {
            // Create a text label inside of the bar
            let text = this.element.appendChild(document.createElement("div"));
            text.classList.add("guify-bar-title");
            text.innerHTML = opts.title;
            this.label = text;
        }

        // Make the menu collapse button
        let menuButton = this.element.appendChild(document.createElement("button"));
        menuButton.classList.add("controls");
        menuButton.classList.add("guify-bar-button");
        menuButton.innerHTML = "Controls";
        css(menuButton, {
            left: opts.align == "left" ? "0" : "unset",
            right: opts.align == "left" ? "unset" : "0",
        });
        menuButton.onclick = () => {
            this.emit("ontogglepanel");
        };

        const fullscreenButton = this.element.appendChild(document.createElement("button"));
        fullscreenButton.classList.add("full-button");
        fullscreenButton.classList.add("guify-bar-button");
        fullscreenButton.innerHTML = "「 FS 」";
        fullscreenButton.setAttribute("aria-label", "Toggle Fullscreen");
        // fullscreenButton.disabled = true;
        css(fullscreenButton, {
            left: opts.align == "left" ? "unset" : "0",
            right: opts.align == "left" ? "0" : "unset",
        });
        fullscreenButton.onclick = () => {
            this.emit("onfullscreenrequested");
        };

        const fullwinButton = this.element.appendChild(document.createElement("button"));
        fullwinButton.classList.add("full-button");
        fullwinButton.classList.add("guify-bar-button");
        fullwinButton.innerHTML = "「 FW 」";
        fullwinButton.setAttribute("aria-label", "Toggle Fullwin");
        // fullwinButton.disabled = true;
        css(fullwinButton, {
            left: opts.align == "left" ? "unset" : "0",
            right: opts.align == "left" ? "0" : "unset",
        });
        fullwinButton.onclick = () => {
            this.emit("onfullwinreenrequested");
        };
    }

    SetVisible(show) {
        this.element.style.display = show ? "block" : "none";
    }

    getEl() {
        return this.element;
    }

}
