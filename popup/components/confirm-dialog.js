// "nearest ancestor" does not permit crossing shadow boundaries.
// Crossing shadow boundaries would require using shadow-including ancestor.
// See https://github.com/whatwg/html/issues/7971

import { BaseHtmlElement } from "../common/BaseElement.js";

const confirmDialogName = "confirm-dialog";

window.customElements.define(
  confirmDialogName,
  class ConfirmDialogContent extends BaseHtmlElement {
    static get observedAttributes() {
      return ["content", "confirmText", "cancelText", "confirmClassName"];
    }

    constructor() {
      super();
      this.attributesProps(ConfirmDialogContent.observedAttributes);
      this.eventsProps(["resolve", "reject"]);
    }

    showModal() {
      this.dialogEl.showModal();
    }

    render() {
      const dialog = this.el(
        "dialog",
        {
          key: "dialog",
          className: "dialog",
          onclose: () => {
            if (dialog.returnValue === "confirm") {
              this.dispatchEvent(
                new CustomEvent("resolve", {
                  detail: {},
                }),
              );
            } else {
              this.dispatchEvent(
                new CustomEvent("reject", {
                  detail: {},
                }),
              );
            }
          },
        },
        this.el(
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
        ),
      );

      this.dialogEl = dialog;

      return [
        dialog,
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
  const confirmDialog = document.createElement(confirmDialogName);
  confirmDialog.content = content;
  confirmDialog.confirmText = confirmText;
  confirmDialog.cancelText = cancelText;
  confirmDialog.confirmClassName = confirmClassName;
  confirmDialog.addEventListener("resolve", resolve);
  confirmDialog.addEventListener("reject", reject);

  document.body.appendChild(confirmDialog);
  confirmDialog.showModal();

  return promise;
}

export { showConfirmDialog };
