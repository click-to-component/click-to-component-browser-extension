import { BaseHtmlElement } from "../common/BaseElement.js";
import { editingReplacementService } from "../services/editingReplacement.js";

const replacementItemName = "replacement-item";

window.customElements.define(
  replacementItemName,
  class ReplacementItem extends BaseHtmlElement {
    editing = false;

    async setEditing(editing) {
      let editingData = undefined;

      if (editing) {
        editingData = {
          pattern: this.pattern || "",
          replacement: this.replacement || "",
          isRegExp: this.isregexp === "true",
        };
      }

      await editingReplacementService.set(this.id, editingData);
    }

    async updateEditingData() {
      const editingData = await editingReplacementService.get(this.id);
      this.editingData = editingData;
      this.editing = Boolean(editingData);
      this.updateView();
    }

    static get observedAttributes() {
      return ["id", "pattern", "replacement", "isregexp", "isnew"];
    }

    constructor() {
      super();

      this.attributesProps(ReplacementItem.observedAttributes);
      this.eventsProps(["delete"]);

      editingReplacementService.addOnChangeListener(async () => {
        await this.updateEditingData();
      });
    }

    attributeChangedCallback(...args) {
      const [name] = args;

      if (name === "id") {
        this.updateEditingData();
      }

      super.attributeChangedCallback(...args);
    }

    getContent() {
      const pattern = this.pattern || "";
      const replacement = this.replacement || "";
      const isRegExp = this.isregexp === "true";
      const values = {
        pattern,
        replacement,
        isRegExp,
      };

      if (this.editing) {
        const editingValues = this.editingData || values;
        let form = null;
        const labels = [];

        function getReplacementValue() {
          const formData = new FormData(form);
          const values = Object.fromEntries(formData.entries());
          return {
            ...values,
            isRegExp: Boolean(values.isRegExp),
          };
        }

        const handleInput = (e) => {
          e.preventDefault();

          const replacementValue = getReplacementValue();
          editingReplacementService.set(this.id, replacementValue);
        };

        for (const fieldName of ["pattern", "replacement"]) {
          const input = this.el("input", {
            key: `form-input-${fieldName}`,
            type: "text",
            name: fieldName,
            value: editingValues[fieldName],
            oninput: handleInput,
          });

          const label = this.el(
            "label",
            {
              key: `form-label-${fieldName}`,
            },
            this.el("span", {
              key: `form-label-span-${fieldName}`,
              innerText: fieldName,
            }),
            input,
          );

          labels.push(label);
        }

        for (const fieldName of ["isRegExp"]) {
          const input = this.el("input", {
            key: `form-input-${fieldName}`,
            type: "checkbox",
            name: fieldName,
            checked: editingValues[fieldName],
            oninput: handleInput,
          });

          const label = this.el(
            "label",
            {
              key: `form-label-${fieldName}`,
            },
            this.el("span", {
              key: `form-label-span-${fieldName}`,
              innerText: fieldName,
            }),
            input,
          );

          labels.push(label);
        }

        const save = this.el("button", {
          key: "form-save",
          innerText: "Save",
          className: "button button--primary",
          onclick: async (e) => {
            e.preventDefault();
            const replacementValue = getReplacementValue();

            this.dispatchEvent(
              new CustomEvent("change", {
                detail: {
                  values: replacementValue,
                },
              }),
            );

            this.setEditing(false);
          },
        });

        const cancel = this.el("button", {
          key: "form-cancel",
          innerText: "Cancel",
          className: "button",
          onclick: async (e) => {
            e.preventDefault();
            if (this.isnew === "true") {
              this.dispatchEvent(new CustomEvent("delete", {}));
              return;
            }
            this.setEditing(false);
          },
        });

        const actions = this.el(
          "div",
          {
            key: "form-actions",
            className: "button-container",
          },
          save,
          cancel,
        );

        form = this.el(
          "form",
          {
            key: "form",
            className: "editForm",
          },
          ...labels,
          actions,
        );

        return form;
      }

      return this.el(
        "div",
        {
          key: "container",
          className: "container",
        },

        this.el("pre", {
          key: "label",
          innerText: `replace(${isRegExp ? "new RegExp(" : ""}${JSON.stringify(pattern)}${isRegExp ? ")" : ""}, ${JSON.stringify(replacement)})`,
        }),

        this.el(
          "button",
          {
            key: "edit",
            className: "text-button hover-show-action",
            onclick: async () => {
              this.setEditing(true);
            },
          },
          this.el("i", {
            key: "edit-icon",
            className: ["fa-solid", "fa-pen"].join(" "),
          }),
        ),

        this.el(
          "button",
          {
            key: "delete",
            className: "text-button hover-show-action",
            onclick: async (e) => {
              e.preventDefault();
              this.dispatchEvent(new CustomEvent("delete", {}));
            },
          },
          this.el("i", {
            key: "delete-icon",
            className: ["fa-solid", "fa-trash"].join(" "),
          }),
        ),
      );
    }

    render() {
      return [
        this.getContent(),

        this.el("style", {
          key: "style",
          textContent: `
            ${this.baseStyle}
            .hover-show-action {
              display: none;
            }

            .container {
              display: flex;
              align-items: center;

              pre {
                margin: 0;
                font-family: "Consolas", "Menlo", "Monaco", "Courier New", monospace;
                white-space: normal;
                word-break: break-all;
                flex: 1 1 0;
              }

              &:hover {
                .hover-show-action {
                  display: inline-block;
                }
              }
            }

            form {
              display: flex;
              gap: 0.25em;
              flex-direction: column;
            }

            label {
              display: flex;
              gap: 0.25em;
              align-items: center;

              span {
                width: 7em;
                text-align: right;
              }

              input[type="text"] {
                flex: 1;
              }
            }
          `,
        }),
      ];
    }
  },
);

export { replacementItemName };
