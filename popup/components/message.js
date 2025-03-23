import { BaseHtmlElement } from "../common/BaseElement.js";

const messageContentName = "message-content";

window.customElements.define(
  messageContentName,
  class MessageContent extends BaseHtmlElement {
    static get observedAttributes() {
      return ["type", "content"];
    }

    constructor() {
      super();

      this.attributesProps(MessageContent.observedAttributes);
    }

    render() {
      const container = this.el(
        "div",
        {
          key: "container",
          className: ["container", this.type].join(" "),
        },
        this.el("i", {
          key: "icon",
          className: `fa-solid ${typeIconMap[this.type]}`,
        }),
        this.el("span", {
          key: "text",
          className: "content",
          innerText: this.content,
        }),
      );

      return [
        container,
        this.el("style", {
          key: "style",
          textContent: `
              ${this.baseStyle}
              .container {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                padding: 1rem;
                border-radius: 0.5rem;
                border: 1px solid;
                .content {
                  font-weight: 500;
                }
              }

              .success {
                border-color: var(--green-400);
                background-color: var(--green-50);

                i {
                  color: var(--green-400);
                }
              }

              .error {
                border-color: var(--red-400);
                background-color: var(--red-50);
                i {
                  color: var(--red-400);
                }
              }

              .info {
                border-color: var(--blue-400);
                background-color: var(--blue-50);
                i {
                  color: var(--blue-400);
                }
              }

              .warning {
                border-color: var(--yellow-400);
                background-color: var(--yellow-50);
                i {
                  color: var(--yellow-400);
                }
              }
            `,
        }),
      ];
    }
  },
);

const TYPE = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};

const typeIconMap = {
  [TYPE.SUCCESS]: "fa-circle-check",
  [TYPE.ERROR]: "fa-circle-xmark",
  [TYPE.INFO]: "fa-circle-info",
  [TYPE.WARNING]: "fa-circle-exclamation",
};

function showMessage({ type, content, timeout }) {
  const messageContent = document.createElement(messageContentName);
  messageContent.type = type;
  messageContent.content = content;

  const message = document.createElement("div");
  message.className = "message-popover";
  message.popover = "";
  message.appendChild(messageContent);
  document.body.appendChild(message);

  // TODO: should setTimeout, but why?
  setTimeout(() => {
    message.showPopover();
  }, 0);

  setTimeout(() => {
    message.remove();
  }, timeout || 1500);
}

function showSuccessMessage(content, timeout) {
  showMessage({
    type: TYPE.SUCCESS,
    content,
    timeout,
  });
}

function showWarningMessage(content, timeout) {
  showMessage({
    type: TYPE.WARNING,
    content,
    timeout,
  });
}

function showErrorMessage(content, timeout) {
  showMessage({
    type: TYPE.ERROR,
    content,
    timeout,
  });
}

export {
  messageContentName,
  showSuccessMessage,
  showWarningMessage,
  showErrorMessage,
};
