const baseName = "click-to-component-browser";
const version = "0.1.3";
const targetName = `${baseName}-target`;
const unknownComponentName = "Unknown Component";

// this funciton will update after popover is defined
let hidePopover = function () {};

function getReactInstanceForElement(element) {
  // Prefer React DevTools, which has direct access to `react-dom` for mapping `element` <=> Fiber
  if ("__REACT_DEVTOOLS_GLOBAL_HOOK__" in window) {
    // @ts-expect-error - TS2339 - Property '__REACT_DEVTOOLS_GLOBAL_HOOK__' does not exist on type 'Window & typeof globalThis'.
    const { renderers } = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

    for (const renderer of renderers.values()) {
      try {
        const fiber = renderer.findFiberByHostInstance(element);

        if (fiber) {
          return fiber;
        }
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        // If React is mid-render, references to previous nodes may disappear during the click events
        // (This is especially true for interactive elements, like menus)
      }
    }
  }

  if ("_reactRootContainer" in element) {
    // @ts-expect-error - TS2339 - Property '_reactRootContainer' does not exist on type 'HTMLElement'.
    return element._reactRootContainer._internalRoot.current.child;
  }

  for (const key in element) {
    // Pre-Fiber access React internals
    if (key.startsWith("__reactInternalInstance$")) {
      return element[key];
    }

    // Fiber access to React internals
    if (key.startsWith("__reactFiber")) {
      return element[key];
    }
  }
}

function getSourceForReactInstance({ _debugSource, _debugOwner }) {
  // source is sometimes stored on _debugOwner
  const source = _debugSource || (_debugOwner && _debugOwner._debugSource);

  if (!source) return;

  const {
    // It _does_ exist!
    // @ts-ignore Property 'columnNumber' does not exist on type 'Source'.ts(2339)
    columnNumber = 1,
    fileName,
    lineNumber = 1,
  } = source;

  return { columnNumber, fileName, lineNumber };
}

function setTarget(el, type = "") {
  el.setAttribute(targetName, type);
}

function cleanTarget(type) {
  let targetElList = null;
  if (type) {
    targetElList = document.querySelectorAll(`[${targetName}="${type}"]`);
  } else {
    targetElList = document.querySelectorAll(`[${targetName}]`);
  }

  targetElList.forEach((el) => {
    el.removeAttribute(targetName);
  });
}

function parseSourceCodeLocation(sourceCodeLocation) {
  const [fileName, lineNumber, columnNumber] = sourceCodeLocation.split(":");

  return { columnNumber, fileName, lineNumber };
}

function getSourceCodeLocationString(sourceCodeLocation) {
  const { columnNumber, fileName, lineNumber } = sourceCodeLocation;
  return `${fileName}:${lineNumber}:${columnNumber}`;
}

function getElSourceCodeLocation(el) {
  const dataSourceCodeLocationStr = el?.dataset?.__sourceCodeLocation;
  if (dataSourceCodeLocationStr) {
    const sourceCodeLocation = parseSourceCodeLocation(
      dataSourceCodeLocationStr,
    );
    return sourceCodeLocation;
  }

  // react
  const instance = getReactInstanceForElement(el);
  if (instance) {
    const sourceCodeLocation = getSourceForReactInstance(instance);
    return sourceCodeLocation;
  }
}

function getElWithSourceCodeLocation(el) {
  try {
    while (el) {
      const sourceCodeLocation = getElSourceCodeLocation(el);

      if (sourceCodeLocation) {
        return {
          el,
          sourceCodeLocation,
        };
      }

      el = el.parentElement;
    }
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    // do nothing
  }
}

function getUrlByConfig(sourceCodeLocationStr) {
  const config = window.__CLICK_TO_COMPONENT_CONFIG__;
  const configReplacements = config?.replacements;

  if (Array.isArray(configReplacements) && configReplacements.length > 0) {
    let result = sourceCodeLocationStr;

    for (const configReplacement of configReplacements) {
      const { isRegExp, pattern, replacement } = configReplacement;

      if (isRegExp) {
        const regexp = new RegExp(pattern);
        result = result.replace(regexp, replacement);
      } else {
        result = result.replace(pattern, replacement);
      }
    }

    return result;
  }

  // Default VSCode
  if (sourceCodeLocationStr.startsWith("/")) {
    return `vscode://file${sourceCodeLocationStr}`;
  }

  return `vscode://file/${sourceCodeLocationStr}`;
}

function openEditor(sourceCodeLocationStr) {
  // __CLICK_TO_COMPONENT_URL_FUNCTION__ can be async
  const urlPromise = Promise.resolve().then(() => {
    if (typeof window.__CLICK_TO_COMPONENT_URL_FUNCTION__ !== "function") {
      return getUrlByConfig(sourceCodeLocationStr);
    }

    return window.__CLICK_TO_COMPONENT_URL_FUNCTION__(sourceCodeLocationStr);
  });

  urlPromise
    .then((url) => {
      if (!url) {
        console.error(
          `[${baseName}] url is empty, please check __CLICK_TO_COMPONENT_URL_FUNCTION__`,
        );
        return;
      }

      window.open(url);
    })
    .catch((e) => {
      console.error(e);
    })
    .finally(() => {
      cleanTarget();
    });
}

function initAltClick() {
  const style = document.createElement("style");
  style.textContent = `
[${baseName}] * {
  pointer-events: auto !important;
}

[${targetName}] {
  cursor: var(--${baseName}-cursor, context-menu) !important;
  outline: 1px auto !important;
}

@supports (outline-color: Highlight) {
  [${targetName}] {
    outline: var(--${baseName}-outline, 1px auto Highlight) !important;
  }
}

@supports (outline-color: -webkit-focus-ring-color) {
  [${targetName}] {
    outline: var(--${baseName}-outline, 1px auto -webkit-focus-ring-color) !important;
  }
}`.trim();
  document.head.appendChild(style);

  window.addEventListener(
    "click",
    (e) => {
      if (e.altKey && e.button === 0) {
        const elWithSourceCodeLocation = getElWithSourceCodeLocation(e.target);

        if (elWithSourceCodeLocation) {
          const { sourceCodeLocation } = elWithSourceCodeLocation;
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const sourceCodeLocationStr =
            getSourceCodeLocationString(sourceCodeLocation);

          openEditor(sourceCodeLocationStr);
        }
      }

      hidePopover();
    },
    true,
  );

  window.addEventListener(
    "mousemove",
    (e) => {
      cleanTarget("hover");

      if (e.altKey) {
        const elWithSourceCodeLocation = getElWithSourceCodeLocation(e.target);

        if (!elWithSourceCodeLocation) {
          return;
        }

        const { el } = elWithSourceCodeLocation;

        setTarget(el, "hover");
      }
    },
    true,
  );

  window.addEventListener(
    "keyup",
    (e) => {
      if (e.key === "Alt") {
        cleanTarget();
      }
    },
    true,
  );

  window.addEventListener(
    "blur",
    () => {
      cleanTarget();
    },
    true,
  );
}

function initPopover() {
  const anchorName = `${baseName}-anchor`;
  const popoverName = `${baseName}-popover`;
  function cleanAndSetAnchor(el) {
    document.querySelectorAll(`[${anchorName}]`).forEach((el) => {
      el.removeAttribute(anchorName);
    });

    el.setAttribute(anchorName, "");
  }

  function getElListWithSourceCodeLocation(el) {
    const elWithSourceCodeLocationList = [];

    let elWithSourceCodeLocation = getElWithSourceCodeLocation(el);

    while (elWithSourceCodeLocation) {
      elWithSourceCodeLocationList.push(elWithSourceCodeLocation);

      const { el } = elWithSourceCodeLocation;
      elWithSourceCodeLocation = getElWithSourceCodeLocation(el.parentElement);
    }

    return elWithSourceCodeLocationList;
  }

  function getPopoverEl() {
    const popoverStyleElKey = `${popoverName}-style`;
    const popoverStyleEl = document.querySelector(
      `[key='${popoverStyleElKey}']`,
    );
    if (!popoverStyleEl) {
      const styleEl = document.createElement("style");
      styleEl.setAttribute("type", "text/css");
      styleEl.setAttribute("key", popoverStyleElKey);
      styleEl.textContent = `[${anchorName}] {
    anchor-name: --${anchorName};
  }

  ${popoverName} {
    inset: unset;
    position: fixed;
    position-anchor: --${anchorName};
    top: anchor(bottom);
    justify-self: anchor-center;
    position-try: most-height flip-block;
    box-sizing: border-box;
    max-width: 100%;
    margin: 0;
    border: 1.5px solid currentColor;
  }`;
      document.head.appendChild(styleEl);
    }

    const popoverEl = document.querySelector(popoverName);

    if (popoverEl) {
      return popoverEl;
    }

    const newPopoverEl = document.createElement(popoverName);
    newPopoverEl.setAttribute("popover", "manual");
    document.body.appendChild(newPopoverEl);

    return newPopoverEl;
  }

  if (customElements.get("vue-click-to-component-popover")) {
    console.warn(
      `[${baseName}] you can remove \`import 'vue-click-to-component/client';\` in your project when you are using Click To Component extension.`,
    );
  }

  if (customElements.get(popoverName)) {
    console.warn(`[${baseName}] ${popoverName} is already defined.`);
    return;
  }

  customElements.define(
    popoverName,
    class extends HTMLElement {
      static get observedAttributes() {
        return [];
      }

      constructor() {
        super();

        this.shadow = this.attachShadow({ mode: "open" });
        this.listEl = null;
        this.componentInfoList = [];

        this.setStyle();
        this.setForm();
      }

      updateComponentInfoList(componentInfoList) {
        this.componentInfoList = componentInfoList;
        this.listEl.innerHTML = "";

        for (const item of componentInfoList) {
          const itemEL = document.createElement("li");
          itemEL.classList.add(`${popoverName}__list__item`);

          const buttonEl = document.createElement("button");
          const sourceCodeLocationStr = getSourceCodeLocationString(
            item.sourceCodeLocation,
          );
          buttonEl.type = "submit";
          buttonEl.value = sourceCodeLocationStr;
          buttonEl.addEventListener("mouseenter", () => {
            setTarget(item.el, "popover");
          });
          buttonEl.addEventListener("mouseleave", () => {
            cleanTarget();
          });
          buttonEl.innerHTML = `<code class="${popoverName}__list__item__local-name">&lt;${item?.el?.localName || unknownComponentName}&gt;</code>
<cite class="${popoverName}__list__item__source-code-location">
  <span dir="ltr">
    ${sourceCodeLocationStr.replace(/.*(src|pages)/, "$1")}
  </span>
</cite>`;

          itemEL.appendChild(buttonEl);

          this.listEl.appendChild(itemEL);
        }
      }

      setForm() {
        const formEl = document.createElement("form");
        formEl.classList.add(`${popoverName}__form`);
        formEl.addEventListener("submit", (e) => {
          e.preventDefault();

          const submitter = e.submitter;

          if (submitter.tagName !== "BUTTON") {
            return;
          }

          const sourceCodeLocationStr = submitter.value;

          if (!sourceCodeLocationStr) {
            return;
          }

          openEditor(sourceCodeLocationStr);
          hidePopover();
        });

        const listEl = document.createElement("ul");
        listEl.classList.add(`${popoverName}__list`);
        formEl.appendChild(listEl);
        this.listEl = listEl;

        this.shadow.appendChild(formEl);
      }

      setStyle() {
        const styleEl = document.createElement("style");
        styleEl.textContent = `
.${popoverName}__list {
display: flex;
flex-direction: column;
gap: 2px;
padding: 0;
margin: 0;
list-style: none;
max-height: 300px;
overflow-y: auto;
}

.${popoverName}__list__item {
button {
  all: unset;
  box-sizing: border-box;
  outline: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 4px;
  border-radius: 4px;
  font-size: 14px;

  &:hover, &:focus, &:active {
    cursor: pointer;
    background: royalblue;
    color: white;
    box-shadow: var(--shadow-elevation-medium);

    code {
      color: white;
    }
  }

  code {
    color: royalblue;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      'Liberation Mono', 'Courier New', monospace;
  }

  cite {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    /* text-overflow ellipsis on left sida. Inner span element set dir="ltr" */
    direction: rtl;
    font-weight: normal;
    font-style: normal;
    font-size: 12px;
    opacity: 0.5;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      'Liberation Mono', 'Courier New', monospace;
  }
}
}`;

        this.shadow.appendChild(styleEl);
      }
    },
  );

  let currentPopoverEl;

  window.addEventListener(
    "contextmenu",
    (e) => {
      if (e.altKey && e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const popoverEl = getPopoverEl();
        currentPopoverEl = popoverEl;

        const elListWithSourceCodeLocationList =
          getElListWithSourceCodeLocation(e.target);

        if (elListWithSourceCodeLocationList.length === 0) {
          return;
        }

        const { el } = elListWithSourceCodeLocationList[0];

        cleanAndSetAnchor(el);

        popoverEl.updateComponentInfoList(elListWithSourceCodeLocationList);

        popoverEl.showPopover();
        document.activeElement.blur();
      }
    },
    true,
  );

  hidePopover = function () {
    currentPopoverEl?.hidePopover?.();
  };
}

function init() {
  if (window.__CLICK_TO_COMPONENT_INIT__) {
    return;
  }

  console.log(`[${baseName}] enabled`, { version });

  try {
    initAltClick();
  } catch (error) {
    console.warn(`[${baseName}] init failed`, error);
  }

  try {
    initPopover();
  } catch (error) {
    console.warn(`[${baseName}] init popover failed`, error);
  }

  window.__CLICK_TO_COMPONENT_INIT__ = true;
}

init();

export { version };
