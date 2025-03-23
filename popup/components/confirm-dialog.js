import { BaseHtmlElement } from "../common/BaseElement.js";

const confirmDialogContentName = "confirm-dialog";

window.customElements.define(
  confirmDialogContentName,
  class ConfirmDialogContent extends BaseHtmlElement {
    static get observedAttributes() {
      return ["content", "confirmText", "cancelText", "confirmClassName"];
    }

    constructor() {
      super();
      this.attributesProps(ConfirmDialogContent.observedAttributes);
    }

    render() {
      const container = this.el(
        "div",
        { key: "container" },

        this.el("p", { key: "content", innerText: this.content }),
        this.el(
          "form",
          {
            key: "form",
            method: "dialog",
          },
          this.el("button", {
            key: "cancel-button",
            innerText: this.cancelText || "Cancel",
            className: "button",
            value: "cancel",
            formMethod: "dialog",
          }),
          this.el("button", {
            key: "confirm-button",
            innerText: this.confirmText || "OK",
            className: ["button", this.confirmClassName].join(" "),
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
              p {
                margin: 0 0 1rem 0;
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

async function showConfirmDialog(
  content,
  { confirmText, cancelText, confirmClassName },
) {
  const { promise, resolve, reject } = Promise.withResolvers();
  const confirmDialogContent = document.createElement(confirmDialogContentName);
  confirmDialogContent.content = content;
  confirmDialogContent.confirmText = confirmText;
  confirmDialogContent.cancelText = cancelText;
  confirmDialogContent.confirmClassName = confirmClassName;

  const dialog = document.createElement("dialog");
  dialog.className = "confirm-dialog";
  dialog.appendChild(confirmDialogContent);
  dialog.addEventListener("close", () => {
    if (dialog.returnValue === "confirm") {
      resolve();
    } else {
      reject();
    }

    dialog.remove();
  });

  document.body.appendChild(dialog);
  dialog.showModal();

  return promise;
}

export { showConfirmDialog };
