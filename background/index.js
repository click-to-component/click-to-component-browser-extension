const configListStorageKey = "configList";
const currentConfigStorageKey = "currentConfig";

// copy from popup/services/configList.js
const builtinConfigs = [
  {
    id: "builtin-vscode",
    name: "VS Code",
    replacements: [
      {
        id: "builtin-vscode-replacement",
        isRegExp: true,
        pattern: "^(.*):(.*):(.*)$",
        replacement: "vscode://file/$1:$2:$3",
      },
    ],
  },
  {
    id: "builtin-webstorm",
    name: "WebStorm",
    replacements: [
      {
        id: "builtin-webstorm-replacement",
        isRegExp: true,
        pattern: "^(.*):(.*):(.*)$",
        replacement: "webstorm://open?file=$1&line=$2&column=$3",
      },
    ],
  },
  {
    id: "builtin-cursor",
    name: "Cursor",
    replacements: [
      {
        id: "builtin-cursor-replacement",
        isRegExp: true,
        pattern: "^(.*):(.*):(.*)$",
        replacement: "cursor://file/$1:$2:$3",
      },
    ],
  },
  {
    id: "builtin-trae",
    name: "TRAE",
    replacements: [
      {
        id: "builtin-trae-replacement",
        isRegExp: true,
        pattern: "^(.*):(.*):(.*)$",
        replacement: "trae://file/$1:$2:$3",
      },
    ],
  },
  {
    id: "builtin-trae-cn",
    name: "TRAE CN",
    replacements: [
      {
        id: "builtin-trae-cn-replacement",
        isRegExp: true,
        pattern: "^(.*):(.*):(.*)$",
        replacement: "trae-cn://file/$1:$2:$3",
      },
    ],
  },
].map((d) => {
  return {
    ...d,
    isBuiltin: true,
  };
});

let injectConfigResult = {};

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };

  const tabs = await chrome?.tabs?.query(queryOptions);

  const tab = tabs?.[0];

  return tab;
}

async function getConfigList() {
  const result = await chrome?.storage?.local?.get([configListStorageKey]);
  const list = result?.[configListStorageKey] || [];
  return [...builtinConfigs, ...list];
}

async function getCurrentConfigInfo() {
  const result = await chrome?.storage?.local?.get([currentConfigStorageKey]);
  const config = result?.[currentConfigStorageKey] || {};
  return config;
}

async function getCurrentConfig() {
  const list = await getConfigList();
  const currentConfigInfo = await getCurrentConfigInfo();

  const item = list.find((d) => d?.id === currentConfigInfo?.id);

  return item;
}

async function injectConfig(tabId) {
  const currentConfig = await getCurrentConfig();

  const replacements = currentConfig?.replacements || [];

  const serializableConfig = {
    name: currentConfig?.name,
    replacements: replacements.map((d) => ({
      pattern: d.pattern,
      replacement: d.replacement,
      isRegExp: d.isRegExp,
    })),
  };

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      args: [serializableConfig],
      func: (value) => {
        window.__CLICK_TO_COMPONENT_CONFIG__ = value;
        console.log(
          "[click-to-component-browser-extension config]",
          window.__CLICK_TO_COMPONENT_CONFIG__,
        );
      },
      world: "MAIN",
    });

    injectConfigResult = {
      success: true,
      message: "Config injected",
    };
  } catch (error) {
    console.error(error);
    injectConfigResult = {
      success: false,
      message: error?.message || "Unknown error",
    };
  }

  chrome.runtime.sendMessage({ action: "injectConfigChange" });
}

async function injectConfigToCurrentTab() {
  const tab = await getCurrentTab();
  const tabId = tab?.id;

  if (!tabId) {
    return;
  }

  injectConfig(tabId);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    injectConfig(tabId);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "injectConfig") {
    injectConfigToCurrentTab();
  } else if (message.action === "getInjectConfigResult") {
    sendResponse(injectConfigResult);
  }
});
