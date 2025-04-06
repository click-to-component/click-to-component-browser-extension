import { createBaseService } from "./base.js";

function createEditingReplacementService() {
  const storageKey = "editingReplacement";

  const baseService = createBaseService({
    storageKey,
  });

  async function getData() {
    const data = (await baseService.getData()) || {};

    return data;
  }

  async function get(id) {
    const data = await baseService.getData();

    return data[id];
  }

  async function set(id, config) {
    const data = await getData();

    if (!config) {
      delete data[id];
    } else {
      data[id] = config;
    }
    await baseService.setData(data);
  }

  return {
    ...baseService,
    set,
    get,
  };
}

const editingReplacementService = createEditingReplacementService();

export { editingReplacementService };
