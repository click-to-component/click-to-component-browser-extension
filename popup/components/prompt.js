// "nearest ancestor" does not permit crossing shadow boundaries.
// Crossing shadow boundaries would require using shadow-including ancestor.
// See https://github.com/whatwg/html/issues/7971

import { BaseHtmlElement } from "../common/BaseElement.js";

const promptContentName = "prompt-content";

window.customElements.define(
  promptContentName,
  class PromptContent extends BaseHtmlElement {
    static get observedAttributes() {
      return ["content", "confirmText", "cancelText", "confirmClassName"];
    }

    constructor() {
      super();
      this.attributesProps(PromptContent.observedAttributes);
      this.isComposing = false;
    }

    showModal() {
      this.dialogEl.showModal();
    }

    render() {
      const formConfirmEl = this.el("button", {
        key: "confirm",
        innerText: this.confirmText || "OK",
        className: ["button", "button--primary", this.confirmClassName].join(
          " ",
        ),
        formMethod: "dialog",
        value: "confirm",
      });

      const dialog = this.el(
        "dialog",
        {
          key: "dialog",
          className: "dialog",
          onclose: () => {
            if (dialog.returnValue === "confirm") {
              this.dispatchEvent(
                new CustomEvent("resolve", {
                  detail: this.inputValue,
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
            name: "text",
            onchange: (e) => {
              this.inputValue = e.target.value;
            },
            onkeyup: (e) => {
              if (e.key === "Enter") {
                if (this.isComposing) {
                  this.isComposing = false;
                  return;
                }

                formConfirmEl.click();
              }
            },
            effect: (el) => {
              const abortController = new AbortController();
              el.addEventListener(
                "compositionstart",
                () => {
                  this.isComposing = true;
                },
                abortController.signal,
              );

              return () => {
                abortController.abort();
              };
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
            formConfirmEl,
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
  const { confirmText, cancelText, confirmClassName } = config || {};

  const { promise, resolve } = Promise.withResolvers();
  const confirmDialog = document.createElement(promptContentName);
  confirmDialog.content = content;
  confirmDialog.confirmText = confirmText;
  confirmDialog.cancelText = cancelText;
  confirmDialog.confirmClassName = confirmClassName;
  confirmDialog.addEventListener("resolve", (e) => {
    resolve([true, e.detail]);
  });
  confirmDialog.addEventListener("reject", () => {
    resolve([false]);
  });

  document.body.appendChild(confirmDialog);
  confirmDialog.showModal();

  return promise;
}

export { promptContentName, showPrompt };
