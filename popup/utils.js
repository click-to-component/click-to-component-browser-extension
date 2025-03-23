export function genId() {
  return Math.random().toString(36).substring(2);
}

export async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };

  const tabs = await chrome?.tabs?.query(queryOptions);

  const tab = tabs?.[0];

  return tab;
}

export async function checkHasPermission() {
  try {
    const currentTab = await getCurrentTab();

    if (!currentTab) {
      return;
    }

    const currentUrl = currentTab.url;

    const result = await chrome.permissions.contains({
      origins: [`${new URL(currentUrl).origin}/*`],
    });

    return result;
  } catch {
    return false;
  }
}
