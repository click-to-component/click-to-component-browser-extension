const storageKey = "configList";

let injectConfigResult = {};

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };

  const tabs = await chrome?.tabs?.query(queryOptions);

  const tab = tabs?.[0];

  return tab;
}

async function getConfigList() {
  const result = await chrome?.storage?.local?.get([storageKey]);
  const list = result?.[storageKey] || [];
  return list;
}

async function getCurrentConfig() {
  const list = await getConfigList();

  const item = list.find((d) => d.isCurrent);

  return item;
}

async function injectConfig() {
  const tab = await getCurrentTab();
  const tabId = tab?.id;

  if (!tabId) {
    return;
  }

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "injectConfig") {
    injectConfig();
  } else if (message.action === "getInjectConfigResult") {
    sendResponse(injectConfigResult);
  }
});
