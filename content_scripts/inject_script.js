const script = document.createElement("script");
script.type = "module";
script.src = chrome.runtime.getURL("injected_scripts/click_to_component.js");
document.body.appendChild(script);

chrome.runtime.sendMessage({
  action: "injectConfig",
});
