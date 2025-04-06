import { BaseHtmlElement } from "../common/BaseElement.js";
import { configListService } from "../services/configList.js";
import { showPrompt } from "./prompt.js";
import { showConfirmDialog } from "./confirm-dialog.js";
import { replacementItemName } from "./replacement-item.js";
import { showErrorMessage } from "./message.js";
import { editingReplacementService } from "../services/editingReplacement.js";

const currentConfigName = "current-config";

customElements.define(
  currentConfigName,
  class ConfigComp extends BaseHtmlElement {
    currentConfig = {};
    replacements = [];

    async update() {
      this.currentConfig = await configListService.getCurrent();
      this.replacements = this.currentConfig?.replacements || [];
      this.updateView();
    }

    async init() {
      await this.update();
    }

    constructor() {
      super();

      configListService.addOnChangeListener(async () => {
        await this.update();
      });

      this.init();
    }

    getReplacementItem({ replacement }) {
      return this.el(
        "li",
        {
          key: this.scopeKey("li"),
        },
        this.el(replacementItemName, {
          key: this.scopeKey("replacement-item"),
          id: replacement?.id,
          pattern: replacement?.pattern,
          replacement: replacement?.replacement,
          isregexp: replacement?.isRegExp,
          isnew: replacement?.isNew,
          onchange: async (e) => {
            const { detail } = e;
            const { values } = detail;

            await configListService.updateReplacement({
              id: this.currentConfig.id,
              replacementId: replacement.id,
              ...values,
              isNew: false,
            });

            chrome.runtime.sendMessage({
              action: "injectConfig",
            });
          },
          ondelete: async () => {
            await configListService.deleteReplacement({
              id: this.currentConfig.id,
              replacementId: replacement.id,
            });
            await editingReplacementService.set(replacement.id, undefined);
          },
        }),
      );
    }

    getReplacementList() {
      const replacements = this.replacements || [];

      if (!replacements.length) {
        return [
          this.el(
            "li",
            { key: `no-replacements-li` },
            this.el("p", {
              key: "no-replacements",
              innerText: "No replacements. Please add a replacements",
            }),
          ),
        ];
      }

      const configEls = [];
      let i = 0;
      for (const replacement of replacements) {
        this.withScope(`current-config-item-${replacement.id}`, () => {
          const configItem = this.getReplacementItem({
            replacement,
            i,
            length: this.replacements.length,
          });
          configEls.push(configItem);
        });
        i++;
      }

      return configEls;
    }

    getSettings() {
      const rename = this.el("button", {
        key: "settings-rename",
        innerText: "Rename",
        className: "button",
        onclick: async (e) => {
          e.preventDefault();

          if (!this.currentConfig?.id) {
            showErrorMessage("No config id found");
            return;
          }

          const [result, name] = await showPrompt(
            "Please enter a new config name",
            {
              defaultValue: this.currentConfig?.name,
              confirmText: "Rename",
            },
          );

          if (!result || !name) {
            return;
          }

          await configListService.update(
            {
              ...this.currentConfig,
              name,
            },
            this.currentConfig?.id,
          );
        },
      });

      const deleteItem = this.el("button", {
        key: "settings-delete",
        innerText: "Delete",
        className: "button button--danger",
        onclick: async (e) => {
          e.preventDefault();

          if (!this.currentConfig?.id) {
            showErrorMessage("No config id found");
            return;
          }

          try {
            await showConfirmDialog(
              `Confirm delete config [${this.currentConfig?.name}]?`,
              {
                confirmText: "Delete",
                confirmClassName: "button--danger",
              },
            );
          } catch {
            return;
          }

          await configListService.deleteItem(this.currentConfig?.id);

          chrome.runtime.sendMessage({
            action: "injectConfig",
          });
        },
      });

      return this.el(
        "div",
        {
          key: "settings",
          className: "button-container",
        },
        rename,
        deleteItem,
      );
    }

    render() {
      const hasCurrentConfig = this.currentConfig?.id;
      return [
        this.el(
          "section",
          {
            key: "container",
            className: "container",
          },
          hasCurrentConfig &&
            this.el(
              "div",
              {
                key: "replacement-container",
              },
              this.el("h4", {
                key: "replacement-title",
                className: "aux-title title",
                textContent: "Replacements",
              }),
              this.el(
                "ul",
                {
                  key: "list",
                  className: "list",
                },
                ...this.getReplacementList(),
                this.el(
                  "li",
                  {
                    key: "add-replacement-li",
                  },
                  this.el("button", {
                    key: "add-replacement",
                    innerText: "Add Replacement",
                    className: "button",
                    onclick: async (e) => {
                      e.preventDefault();
                      const newReplacement =
                        await configListService.addReplacement({
                          id: this.currentConfig.id,
                          isRegExp: false,
                          pattern: "",
                          replacement: "",
                          isNew: true,
                        });

                      await editingReplacementService.set(
                        newReplacement.id,
                        newReplacement,
                      );
                    },
                  }),
                ),
              ),
            ),
          hasCurrentConfig &&
            this.el(
              "div",
              {
                key: "settings-container",
              },
              this.el("h4", {
                key: "settings-title",
                className: "aux-title title",
                textContent: "Settings",
              }),
              this.getSettings(),
            ),
          !hasCurrentConfig &&
            this.el("h4", {
              key: "no-config",
              className: "aux-title",
              textContent: "No config selected, default open VS Code.",
            }),
        ),

        this.el("style", {
          key: "style",
          textContent: `
            ${this.baseStyle}
            .container {
              display: flex;
              flex-direction: column;
              gap: 1rem;
              padding: 0 1rem 1rem 1rem;

              .title {
                margin-bottom: 0.5rem;
              }
            }
            .list {
              display: flex;
              flex-direction: column;
              border: 1px solid var(--border-color);
              border-radius: 0.5rem;

              li {
                border-bottom: 1px solid var(--border-color);
                padding: 1rem;
              }
            }
          `,
        }),
      ];
    }
  },
);

export { currentConfigName };
