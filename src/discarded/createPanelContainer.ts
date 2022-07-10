import { ButtonComponent, setIcon } from "obsidian";

export function createPanelContainer(containerEl: Element, g: Generator<Array<any> | undefined>): HTMLDivElement {
    const panelContainer = containerEl.createDiv();
    panelContainer.addClasses([
        "path-finder",
        "panel-container",
        "is-close"
    ]);

    const openButton = panelContainer.createDiv();
    openButton.addClasses([
        "path-finder",
        "panel-button",
        "mod-open"
    ]);
    setIcon(openButton, "down-chevron-glyph", 20);
    openButton.onClickEvent((evt) => {
        panelContainer.toggleClass("is-close", false);
    })
    openButton.setAttribute("aria-label", "Open");

    const closeButton = panelContainer.createDiv();
    closeButton.addClasses([
        "path-finder",
        "panel-button",
        "mod-close"
    ]);
    setIcon(closeButton, "cross", 20);
    closeButton.onClickEvent(function (this, evt) {
        this.style.display = "none";
        panelContainer.toggleClass("is-close", true);
    })
    closeButton.setAttribute("aria-label", "Close");

    panelContainer.addEventListener("mouseenter", function (this, evt) {
        if (!this.hasClass("is-close"))
            closeButton.style.display = "flex";
    })
    panelContainer.addEventListener("mouseleave", function (this, evt) {
        if (!this.hasClass("is-close"))
            closeButton.style.display = "none";
    })

    const test = panelContainer.createDiv();
    test.addClasses([
        "path-finder",
        "panel-display",
    ])
    test.appendText("aha!");
    return panelContainer;
}