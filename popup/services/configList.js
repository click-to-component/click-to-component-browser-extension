import { genId } from "../utils.js";
import { createBaseListService } from "./base.js";

const builtinConfigs = [
  {
    id: "vscode",
    name: "VS Code",
    replacements: [
      {
        id: "vscode-replacement",
        isRegExp: true,
        pattern: "^(.*):(.*):(.*)$",
        replacement: "vscode://file/$1:$2:$3",
      },
    ],
  },
  {
    id: "webstorm",
    name: "WebStorm",
    replacements: [
      {
        id: "webstorm-replacement",
        isRegExp: true,
        pattern: "^(.*):(.*):(.*)$",
        replacement: "webstorm://open?file=$1&line=$2&column=$3",
      },
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    replacements: [
      {
        id: "cursor-replacement",
        isRegExp: true,
        pattern: "^(.*):(.*):(.*)$",
        replacement: "cursor://file/$1:$2:$3",
      },
    ],
  },
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

  async function setCurrent(id) {
    const list = await baseListService.getList();

    const newList = list.map((item) => {
      return {
        ...item,
        isCurrent: item.id === id,
      };
    });

    const result = await baseListService.setList(newList);

    return result;
  }

  async function getCurrent() {
    const list = await baseListService.getList();

    const item = list.find((d) => d.isCurrent);

    return item;
  }

  async function setBuiltinConfigs() {
    const result = await baseListService.setList(builtinConfigs);
    return result;
  }

  async function addReplacement({ id, isRegExp, pattern, replacement, isNew }) {
    const item = await baseListService.getById(id);

    if (!item) {
      throw new Error(`Config ${id} not found`);
    }

    const replacements = item.replacements || [];

    const newItem = {
      ...item,
      replacements: [
        ...replacements,
        {
          id: genId(),
          isRegExp: Boolean(isRegExp),
          pattern: pattern || "",
          replacement: replacement || "",
          isNew: Boolean(isNew),
        },
      ],
    };

    await baseListService.update(newItem, id);
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
    setCurrent,
    getCurrent,
    setBuiltinConfigs,
    createNewItem,
    addReplacement,
    deleteReplacement,
    updateReplacement,
  };
}

const configListService = createConfigListService();

export { configListService };
