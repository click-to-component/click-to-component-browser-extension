import { createBaseService } from "./base.js";
import { configListService } from "./configList.js";

function createCurrentConfigService() {
  const storageKey = "currentConfig";

  const baseService = createBaseService({
    storageKey,
  });

  function addOnChangeListener(fn) {
    configListService.addOnChangeListener(fn);
    baseService.addOnChangeListener(fn);
  }

  async function getCurrent() {
    const list = await configListService.getListWithBuiltin();
    const currentConfig = await baseService.getData();
    const item = list.find((d) => d?.id === currentConfig?.id);
    return item;
  }

  return {
    ...baseService,
    getCurrent,
    addOnChangeListener,
  };
}

const currentConfigService = createCurrentConfigService();

export { currentConfigService };
