import { BaseHtmlElement } from "../common/BaseElement.js";
import { configListService } from "../services/configList.js";
import { checkHasPermission, getCurrentTab } from "../utils.js";
import { currentConfigName } from "./current-config.js";
import { floatingActionButtonName } from "./floating-action-button.js";
import { showErrorMessage, showSuccessMessage } from "./message.js";
import { showPrompt } from "./prompt.js";

const configComp = "config-comp";

async function addConfig() {
  const [result, name] = await showPrompt("Please enter a config name");

  if (!result || !name) {
    return;
  }

  const item = configListService.createNewItem({
    name,
  });

  await configListService.insert(item);
}

async function requestPermission() {
  try {
    const currentTab = await getCurrentTab();
    if (!currentTab) {
      return;
    }

    const currentUrl = currentTab.url;

    const origin = `${new URL(currentUrl).origin}/*`;

    await chrome.permissions.request({
      origins: [origin],
    });

    showSuccessMessage("Request permission success");
    return true;
  } catch (error) {
    console.error(error);
    showErrorMessage("Request permission failed");
  }
}

customElements.define(
  configComp,
  class ConfigComp extends BaseHtmlElement {
    configList = [];
    hasPermisssion;
    injectConfigResult;
    firstInjectConfigResult;

    async setInjectConfigResult() {
      this.injectConfigResult = await chrome.runtime.sendMessage({
        action: "getInjectConfigResult",
      });

      if (!this.firstInjectConfigResult) {
        this.firstInjectConfigResult = this.injectConfigResult;
      }
    }

    async checkPermission() {
      this.hasPermisssion = await checkHasPermission();
    }

    async update() {
      this.configList = await configListService.getList();
      this.updateView();
    }

    async setBuiltInConfigsWhenNoConfig() {
      const list = await configListService.getList();

      if (!list.length) {
        await configListService.setBuiltinConfigs();
      }
    }

    async init() {
      try {
        await this.checkPermission();
      } catch (error) {
        console.error(error);
      }

      try {
        await this.setInjectConfigResult();
      } catch (error) {
        console.error(error);
      }

      await this.update();
    }

    constructor() {
      super();

      this.setBuiltInConfigsWhenNoConfig();

      configListService.addOnChangeListener(async () => {
        await this.update();
      });

      chrome.runtime.onMessage.addListener(async (message) => {
        if (message.action === "injectConfigChange") {
          await this.setInjectConfigResult();
          if (!this.injectConfigResult?.success) {
            showErrorMessage(this.injectConfigResult?.message);
          }
          this.updateView();
        }
      });

      this.init();
    }

    getConfigItem({ config }) {
      const configKey = config?.key;
      const configName = config?.name || configKey;
      const selected = config?.isCurrent && this.injectConfigResult?.success;

      return this.el("button", {
        key: this.scopeKey("button"),
        innerText: configName,
        className: ["button", selected ? "button--primary" : ""].join(" "),
        onclick: async (e) => {
          try {
            e.preventDefault();

            await configListService.setCurrent(config.id);

            chrome.runtime.sendMessage({
              action: "injectConfig",
            });
          } catch (err) {
            console.error(err);
            showErrorMessage(err?.message || "Unknown error");
            return;
          }
        },
      });
    }

    getConfigList() {
      const configList = this.configList || [];
      const configEls = [];

      let i = 0;
      for (const config of configList) {
        this.withScope(`config-item-${config.id}`, () => {
          const configItem = this.getConfigItem({
            config,
            i,
            length: this.configList.length,
          });
          configEls.push(configItem);
        });
        i++;
      }

      return configEls;
    }

    render() {
      const fab = this.el(
        floatingActionButtonName,
        {
          key: "fab",
          onclick: () => {
            addConfig();
          },
        },
        this.el("i", {
          key: "fab-icon",
          className: "fa-solid fa-plus",
        }),
      );

      return [
        (this.hasPermisssion !== true ||
          !this.firstInjectConfigResult?.success) &&
          this.el("button", {
            key: "request-permission",
            innerText:
              "Allow host permission for this site to enable inject config to the current page. (If you did not allow host permission, you will need to click the icon every time.)",
            className: "button button--primary",
            style: "width: 100%; text-align: left;",
            onclick: () => {
              (async () => {
                const result = await requestPermission();
                if (result) {
                  await this.checkPermission();
                }
              })();
            },
          }),

        this.el(
          "div",
          {
            key: "container",
            className: "container",
          },
          this.el(
            "div",
            {
              key: "list",
              className: "list",
            },
            ...this.getConfigList(),
          ),

          this.el(currentConfigName, {
            key: "current-config",
          }),
        ),

        fab,

        this.el("style", {
          key: "style",
          textContent: `
            ${this.baseStyle}
            .container {
              display: flex;
              flex-direction: column;
            }
            .list {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
              padding: 1rem;
            }
          `,
        }),
      ];
    }
  },
);

export { configComp };
