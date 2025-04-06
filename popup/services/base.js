function createBaseService({ storageKey }) {
  if (!storageKey) {
    throw new Error("storageKey is required");
  }

  let onChangeListeners = [];

  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (const [key] of Object.entries(changes)) {
      if (namespace === "local" && key === storageKey) {
        for (const listener of onChangeListeners) {
          listener?.();
        }
      }
    }
  });

  function addOnChangeListener(fn) {
    onChangeListeners.push(fn);
  }

  function removeOnChangeListener(fn) {
    onChangeListeners = onChangeListeners.filter((item) => item !== fn);
  }

  async function getData() {
    const result = await chrome?.storage?.local?.get([storageKey]);
    const data = result?.[storageKey];
    return data;
  }

  async function setData(data) {
    await chrome?.storage?.local?.set({
      [storageKey]: data,
    });
  }

  return {
    addOnChangeListener,
    removeOnChangeListener,
    getData,
    setData,
  };
}

function createBaseListService({ storageKey }) {
  const baseService = createBaseService({
    storageKey,
  });

  async function getList() {
    const result = await baseService.getData();
    const list = result || [];
    return list;
  }

  async function setList(list) {
    await baseService.setData(list || []);
  }

  async function getById(id) {
    const list = await getList();
    return list.find((item) => item.id === id);
  }

  async function update(newItem, id) {
    const list = await getList();
    const newList = list.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          ...newItem,
        };
      }
      return item;
    });

    await setList(newList);
  }

  async function insert(item) {
    const list = await getList();
    list.push(item);

    await setList(list);
  }

  async function deleteItem(id) {
    const list = await getList();
    const newList = list.filter((item) => item.id !== id);

    await setList(newList);
  }

  async function moveUp(id) {
    const list = await getList();
    const index = list.findIndex((item) => item.id === id);
    if (index === 0) {
      return;
    }
    const item = list[index];
    list.splice(index, 1);
    list.splice(index - 1, 0, item);
    await setList(list);
  }

  async function moveDown(id) {
    const list = await getList();
    const index = list.findIndex((item) => item.id === id);
    if (index === list.length - 1) {
      return;
    }
    const item = list[index];
    list.splice(index, 1);
    list.splice(index + 1, 0, item);
    await setList(list);
  }



  return {
    ...baseService,
    getList,
    setList,
    getById,
    update,
    insert,
    deleteItem,
    moveUp,
    moveDown,
  };
}

export { createBaseService, createBaseListService };
