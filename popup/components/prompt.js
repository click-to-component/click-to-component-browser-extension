import { BaseHtmlElement } from "../common/BaseElement.js";

const promptContentName = "prompt-content";

window.customElements.define(
  promptContentName,
  class PromptContent extends BaseHtmlElement {
    inputValue = "";

    static get observedAttributes() {
      return [
        "content",
        "confirmText",
        "cancelText",
        "confirmClassName",
        "default-value",
      ];
    }

    constructor() {
      super();
      this.attributesProps(PromptContent.observedAttributes);
    }

    attributeChangedCallback(...args) {
      const [name] = args;

      if (name === "default-value") {
        this.inputValue = this["default-value"] || "";
      }

      super.attributeChangedCallback(...args);
    }

    render() {
      const container = this.el(
        "div",
        {
          key: "container",
          className: "container",
        },
        this.el("p", {
          key: "content",
          innerText: this.content,
        }),
        this.el("input", {
          key: "input",
          value: this.inputValue,
          onchange: (e) => {
            this.inputValue = e.target.value;
          },
          onkeyup: (e) => {
            if (e.key === "Enter") {
              this.dispatchEvent(new Event("submit"));
            }
          },
        }),
        this.el(
          "form",
          {
            key: "form",
            method: "dialog",
          },
          this.el("button", {
            key: "cancel",
            innerText: this.cancelText || "Cancel",
            className: "button",
            value: "cancel",
            formMethod: "dialog",
          }),
          this.el("button", {
            key: "confirm",
            innerText: this.confirmText || "OK",
            className: [
              "button",
              "button--primary",
              this.confirmClassName,
            ].join(" "),
            formMethod: "dialog",
            value: "confirm",
          }),
        ),
      );

      return [
        container,
        this.el("style", {
          key: "style",
          textContent: `
              ${this.baseStyle}
              .container {
                display: flex;
                flex-direction: column;
                gap: 1rem;
              }

              p {
                word-wrap: break-word;
              }

              form {
                display: flex;
                gap: 0.5rem;
                justify-content: flex-end;
              }
            `,
        }),
      ];
    }
  },
);

async function showPrompt(content, config) {
  const { confirmText, cancelText, confirmClassName, defaultValue } =
    config || {};

  const { promise, resolve } = Promise.withResolvers();
  const confirmDialogContent = document.createElement(promptContentName);
  confirmDialogContent.content = content;
  confirmDialogContent.confirmText = confirmText;
  confirmDialogContent.cancelText = cancelText;
  confirmDialogContent.confirmClassName = confirmClassName;
  confirmDialogContent["default-value"] = defaultValue;
  confirmDialogContent.onsubmit = (e) => {
    e.preventDefault();

    resolve([true, confirmDialogContent.inputValue]);

    dialog.close();
  };

  const dialog = document.createElement("dialog");
  dialog.className = "dialog";
  dialog.appendChild(confirmDialogContent);
  dialog.addEventListener("close", () => {
    if (dialog.returnValue === "confirm") {
      resolve([true, confirmDialogContent.inputValue]);
    } else {
      resolve([false]);
    }

    dialog.remove();
  });

  document.body.appendChild(dialog);
  dialog.showModal();

  return promise;
}

export { promptContentName, showPrompt };
