function setChildren(el, children = []) {
  const filteredChildren = children.filter(Boolean);

  for (let i = 0; i < filteredChildren.length; i++) {
    const child = filteredChildren[i];

    if (i === 0) {
      if (child === el.firstChild) {
        continue;
      }
      el.prepend(child);
    } else {
      if (child === filteredChildren[i - 1].nextSibling) {
        continue;
      }
      el.insertBefore(child, filteredChildren[i - 1].nextSibling);
    }
  }

  let nextChild = filteredChildren[filteredChildren.length - 1]?.nextSibling;
  let nextNextChild = nextChild?.nextSibling;

  while (nextChild) {
    nextChild.remove();
    nextChild = nextNextChild;
    nextNextChild = nextChild?.nextSibling;
  }
}

function renderScope(name = "") {
  const keyElMap = new Map();

  const scopes = [];

  function cleanEls() {
    for (const [key, elInfo] of keyElMap) {
      if (!elInfo.rendered) {
        elInfo.el.remove();
        keyElMap.delete(key);
      }
    }
  }

  function resetRendered() {
    for (const [, elInfo] of keyElMap) {
      elInfo.rendered = false;
    }
  }

  function applyProps(el, newPorps = {}, oldProps = {}) {
    for (const [key, value] of Object.entries(newPorps)) {
      if (value === oldProps?.[key]) {
        continue;
      }

      el[key] = value;
    }

    for (const [key] of Object.entries(oldProps)) {
      if (newPorps[key] !== undefined) {
        continue;
      }

      el[key] = undefined;
    }
  }

  function el(localName, props, ...children) {
    const key = props?.key;

    if (!key) {
      console.warn(`Missing key: ${name} ${localName}`, {
        props,
        children,
      });

      const el = document.createElement(localName);
      applyProps(el, props);
      setChildren(el, children);
      return el;
    }

    const elInfo = keyElMap.get(key);

    if (!elInfo) {
      const el = document.createElement(localName);
      applyProps(el, props);
      setChildren(el, children);
      keyElMap.set(key, {
        el,
        props,
        rendered: true,
      });
      return el;
    }

    if (elInfo.rendered) {
      console.warn(`Duplicate key: ${name} ${key}`, {
        currentProps: props,
        currentChildren: children,
        existEl: elInfo?.el,
        existProps: elInfo?.props,
      });

      const el = document.createElement(localName);
      applyProps(el, props);
      setChildren(el, children);
      return el;
    }

    if (elInfo.el?.localName !== localName) {
      const el = document.createElement(localName);
      applyProps(el, props);
      setChildren(el, children);

      keyElMap.set(key, {
        ...elInfo,
        el,
        props,
        rendered: true,
      });

      elInfo.el.remove();

      return el;
    }

    applyProps(elInfo.el, props, elInfo.props);
    setChildren(elInfo.el, children);
    keyElMap.set(key, {
      ...elInfo,
      props,
      rendered: true,
    });

    return elInfo.el;
  }

  function withScope(name, fn) {
    scopes.push(name);
    const result = fn();
    scopes.pop();
    return result;
  }

  function scopeKey(key) {
    return scopes.concat(key).join(">");
  }

  return { el, resetRendered, cleanEls, withScope, scopeKey };
}

function createEasyElementClass(ParentClass) {
  class BaseClass extends ParentClass {
    constructor() {
      super();
      this.shadow = this.getRoot();
      const { el, resetRendered, cleanEls, withScope, scopeKey } = renderScope(
        this.localName || "",
      );
      this.el = el;
      this.resetRendered = resetRendered;
      this.cleanEls = cleanEls;
      this.withScope = withScope;
      this.scopeKey = scopeKey;
    }

    eventsMap = new Map();

    render() {}

    attributesProps(attrs) {
      for (const attr of attrs) {
        Object.defineProperty(this, attr, {
          get() {
            return this.getAttribute(attr);
          },
          set(value) {
            if (!value) {
              this.removeAttribute(attr);
            } else {
              this.setAttribute(attr, value);
            }
          },
        });
      }
    }

    eventsProps(eventNames) {
      for (const eventName of eventNames) {
        const name = `on${eventName}`;
        Object.defineProperty(this, name, {
          get() {
            return this.eventsMap.get(eventName);
          },
          set(value) {
            this.removeEventListener(eventName, this.eventsMap.get(eventName));
            this.eventsMap.delete(eventName);

            if (typeof value === "function") {
              this.eventsMap.set(eventName, value);
              this.addEventListener(eventName, value);
            }
          },
        });
      }
    }

    getRoot() {
      return this.attachShadow({ mode: "open" });
    }

    updateView() {
      this.resetRendered();
      const children = this.render();
      setChildren(this.shadow, children);
      this.cleanEls();
    }

    connectedCallback() {
      this.updateView();
    }

    attributeChangedCallback() {
      this.updateView();
    }
  }

  return BaseClass;
}

class EHTMLElement extends createEasyElementClass(HTMLElement) {}

export { EHTMLElement, createEasyElementClass };
