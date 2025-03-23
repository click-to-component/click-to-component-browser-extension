const script = document.createElement("script");
script.src = chrome.runtime.getURL("injected_scripts/click_to_component.js");
document.documentElement.appendChild(script);

chrome.runtime.sendMessage({
  action: "injectConfig",
});
