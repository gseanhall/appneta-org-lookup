export function getCache(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

export function setCache(key, value) {
  return new Promise((resolve) => {
    const data = {};
    data[key] = value;
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}
