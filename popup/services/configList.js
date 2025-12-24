import { genId } from "../utils.js";
import { createBaseListService } from "./base.js";

// copy to background/index.js
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

const initialConfigs = [
  {
    id: "github",
    name: "GitHub",
    replacements: [
      {
        id: "github-replacement-path",
        isRegExp: false,
        pattern: "[your-build-base-path]",
        replacement: "",
      },
      {
        id: "github-replacement-url",
        isRegExp: true,
        pattern: "^(.*):(.*):(.*)$",
        replacement:
          "https://github.com/[your-github-name]/[your-github-repo]/blob$1#L$2",
      },
    ],
  },
];

function createNewItem(itemData) {
  const id = genId();
  const name = itemData?.name;

  const newItem = {
    id,
    name,
  };

  return newItem;
}

function createConfigListService() {
  const storageKey = "configList";

  const baseListService = createBaseListService({
    storageKey,
  });

  async function getListWithBuiltin() {
    const list = await baseListService.getList();
    return [...builtinConfigs, ...list];
  }

  async function setInitialConfigs() {
    const result = await baseListService.setList(initialConfigs);
    return result;
  }

  async function addReplacement({ id, isRegExp, pattern, replacement, isNew }) {
    const item = await baseListService.getById(id);

    if (!item) {
      throw new Error(`Config ${id} not found`);
    }

    const replacements = item.replacements || [];

    const newReplacement = {
      id: genId(),
      isRegExp: Boolean(isRegExp),
      pattern: pattern || "",
      replacement: replacement || "",
      isNew: Boolean(isNew),
    };

    const newItem = {
      ...item,
      replacements: [...replacements, newReplacement],
    };

    await baseListService.update(newItem, id);

    return newReplacement;
  }

  async function deleteReplacement({ id, replacementId }) {
    const item = await baseListService.getById(id);

    if (!item) {
      throw new Error(`Config ${id} not found`);
    }

    const newItem = {
      ...item,
      replacements: item.replacements.filter((d) => d.id !== replacementId),
    };

    await baseListService.update(newItem, id);
  }

  async function updateReplacement({
    id,
    replacementId,
    isRegExp,
    pattern,
    replacement,
    isNew,
  }) {
    const item = await baseListService.getById(id);

    if (!item) {
      throw new Error(`Config ${id} not found`);
    }

    const newItem = {
      ...item,
      replacements: item.replacements.map((d) => {
        if (d.id === replacementId) {
          return {
            ...d,
            isRegExp: Boolean(isRegExp),
            pattern: pattern || "",
            replacement: replacement || "",
            isNew: Boolean(isNew),
          };
        }

        return d;
      }),
    };

    await baseListService.update(newItem, id);
  }

  return {
    ...baseListService,
    getListWithBuiltin,
    setInitialConfigs,
    createNewItem,
    addReplacement,
    deleteReplacement,
    updateReplacement,
  };
}

const configListService = createConfigListService();

export { configListService };
