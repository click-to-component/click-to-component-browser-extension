import { BaseHtmlElement } from "../common/BaseElement.js";

const floatingActionButtonName = "floating-action-button";

window.customElements.define(
  floatingActionButtonName,
  class FloatingActionButton extends BaseHtmlElement {
    static get observedAttributes() {
      return [];
    }

    render() {
      const slot = this.el("slot", {
        key: "slot",
      });

      return [
        slot,
        this.el("style", {
          key: "style",
          textContent: `
            ${this.baseStyle}
            :host {
              position: fixed;
              right: 1rem;
              bottom: 1rem;
              width: 3rem;
              height: 3rem;
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 9999;
              background-color: var(--primary-color);
              border-radius: 50%;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
              font-size: 1.5rem;
              color: #fff;
              cursor: pointer;
            }

            :host(:hover) {
              background-color: var(--blue-400);
            }
          `,
        }),
      ];
    }
  },
);

export { floatingActionButtonName };
